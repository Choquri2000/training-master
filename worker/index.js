// Combat Coach payment-check server (Cloudflare Worker, free plan).
// - POST /paddle-webhook : Paddle's signed subscription events -> Firestore entitlements/{uid}
// - POST /portal         : signed-in user -> link to Paddle's page to cancel / change plan / update card
// - POST /delete         : signed-in user deleting their account -> cancel subscription now, remove record
// Secrets (wrangler secret put ...): PADDLE_WEBHOOK_SECRET, PADDLE_API_KEY, GCP_SA_EMAIL, GCP_SA_KEY
// Vars (wrangler.toml): FIREBASE_PROJECT_ID, PADDLE_ENV ('sandbox' | 'production'), ALLOWED_ORIGINS

const PRO_STATUSES = ['active', 'trialing', 'past_due']; // past_due: Paddle is retrying the card, keep access meanwhile
const enc = new TextEncoder();
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const cors = (env.ALLOWED_ORIGINS || '').split(',').includes(origin)
      ? { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization', 'access-control-allow-methods': 'POST' } : {};
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('not found', { status: 404 });
    try {
      if (url.pathname === '/paddle-webhook') return await webhook(req, env);
      if (url.pathname === '/portal') return json(await portal(await userId(req, env), env), 200, cors);
      if (url.pathname === '/delete') return json(await removeAccount(await userId(req, env), env), 200, cors);
      return new Response('not found', { status: 404 });
    } catch (e) {
      return new Response(e.message || 'error', { status: e.status || 500, headers: cors });
    }
  },
};

// ---------- Paddle webhook ----------
async function webhook(req, env) {
  const raw = await req.text();
  const sig = Object.fromEntries((req.headers.get('paddle-signature') || '').split(';').map(p => p.split('=')));
  if (!sig.ts || !sig.h1 || Math.abs(Date.now() / 1000 - +sig.ts) > 300) return new Response('bad signature', { status: 401 });
  const key = await crypto.subtle.importKey('raw', enc.encode(env.PADDLE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(sig.ts + ':' + raw)))].map(b => b.toString(16).padStart(2, '0')).join('');
  if (!timingSafeEqual(mac, sig.h1)) return new Response('bad signature', { status: 401 });

  const ev = JSON.parse(raw);
  if (!ev.event_type?.startsWith('subscription.')) return new Response('ignored');
  const s = ev.data;
  const uid = s.custom_data?.uid || await uidForSubscription(s.id, env);
  if (!uid) return new Response('no uid'); // nothing to unlock; acknowledged so Paddle doesn't retry forever

  const current = await fsGet(`entitlements/${uid}`, env);
  // Paddle can deliver events out of order: never let an older event overwrite a newer one.
  if (current?.updatedAt && current.updatedAt > s.updated_at) return new Response('stale');
  await fsSet(`entitlements/${uid}`, {
    pro: PRO_STATUSES.includes(s.status),
    status: s.status,
    endsAt: s.current_billing_period?.ends_at || '',
    cancelAt: s.scheduled_change?.action === 'cancel' ? s.scheduled_change.effective_at : '',
    subscriptionId: s.id,
    customerId: s.customer_id,
    updatedAt: s.updated_at,
  }, env);
  return new Response('ok');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// ---------- user actions ----------
async function portal(uid, env) {
  const e = await fsGet(`entitlements/${uid}`, env);
  if (!e?.customerId) throw Object.assign(new Error('no subscription'), { status: 404 });
  const r = await paddle(`/customers/${e.customerId}/portal-sessions`, { subscription_ids: e.subscriptionId ? [e.subscriptionId] : [] }, env);
  return { url: r.data.urls.general.overview };
}

async function removeAccount(uid, env) {
  const e = await fsGet(`entitlements/${uid}`, env);
  if (e?.subscriptionId && !['canceled'].includes(e.status)) {
    await paddle(`/subscriptions/${e.subscriptionId}/cancel`, { effective_from: 'immediately' }, env);
  }
  if (e) await fsDelete(`entitlements/${uid}`, env);
  return { ok: true };
}

async function paddle(path, body, env) {
  const base = env.PADDLE_ENV === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
  const r = await fetch(base + path, { method: 'POST', headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw Object.assign(new Error('paddle ' + r.status), { status: 502 });
  return r.json();
}

// ---------- Firebase sign-in check (ID token, RS256) ----------
let jwks = null, jwksAt = 0;
async function userId(req, env) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const [h, p, s] = tok.split('.');
  if (!s) throw Object.assign(new Error('sign in'), { status: 401 });
  const head = JSON.parse(new TextDecoder().decode(unb64url(h))), claims = JSON.parse(new TextDecoder().decode(unb64url(p)));
  if (!jwks || Date.now() - jwksAt > 3600e3) {
    jwks = (await (await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')).json()).keys;
    jwksAt = Date.now();
  }
  const jwk = jwks.find(k => k.kid === head.kid);
  const now = Date.now() / 1000, proj = env.FIREBASE_PROJECT_ID;
  const ok = jwk && head.alg === 'RS256' && await crypto.subtle.verify('RSASSA-PKCS1-v1_5',
    await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']),
    unb64url(s), enc.encode(h + '.' + p));
  if (!ok || claims.aud !== proj || claims.iss !== `https://securetoken.google.com/${proj}` || claims.exp < now || !claims.sub) {
    throw Object.assign(new Error('sign in'), { status: 401 });
  }
  return claims.sub;
}

// ---------- Firestore REST with the service account ----------
let gTok = null, gTokAt = 0;
async function googleToken(env) {
  if (gTok && Date.now() - gTokAt < 50 * 60e3) return gTok;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify({ iss: env.GCP_SA_EMAIL, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })));
  const pem = env.GCP_SA_KEY.replace(/\\n/g, '\n').replace(/-----[^-]+-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const jwt = `${head}.${body}.${b64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(head + '.' + body)))}`;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  gTok = (await r.json()).access_token; gTokAt = Date.now();
  return gTok;
}
const fsBase = env => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const toFs = o => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) }])) });
const fromFs = d => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, v.booleanValue ?? v.stringValue]));
async function fsGet(path, env) {
  const r = await fetch(`${fsBase(env)}/${path}`, { headers: { Authorization: 'Bearer ' + await googleToken(env) } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('firestore ' + r.status);
  return fromFs(await r.json());
}
async function fsSet(path, obj, env) {
  const r = await fetch(`${fsBase(env)}/${path}`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + await googleToken(env), 'content-type': 'application/json' }, body: JSON.stringify(toFs(obj)) });
  if (!r.ok) throw new Error('firestore ' + r.status);
}
async function fsDelete(path, env) {
  await fetch(`${fsBase(env)}/${path}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + await googleToken(env) } });
}
async function uidForSubscription(subId, env) {
  const r = await fetch(`${fsBase(env)}:runQuery`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + await googleToken(env), 'content-type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'entitlements' }], where: { fieldFilter: { field: { fieldPath: 'subscriptionId' }, op: 'EQUAL', value: { stringValue: subId } } }, limit: 1 } }),
  });
  const row = (await r.json())[0];
  return row?.document?.name.split('/').pop() || null;
}
