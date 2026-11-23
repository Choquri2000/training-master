// Combat Coach Pro, sold on the website through Paddle (merchant of record).
// Who is Pro is decided only by the payment-check server (worker/), which writes the read-only
// Firestore record entitlements/{uid} from Paddle's signed webhooks. The app just reads it.
// The Android app never shows a way to buy (Google Play rule); Pro unlocks there by signing in.
import { PADDLE } from './paddle-config.js';

const native = () => !!window.Capacitor?.isNativePlatform?.();
export const proAvailable = () => !!PADDLE.token;        // payments switched on at all
export const canBuy = () => proAvailable() && !native(); // only on the website

// Last known answer, so a paying user is never locked out offline or while the app starts.
const CACHE = 'cc-pro';
let ent = (() => { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch { return null; } })();
const subs = new Set();
export const isPro = () => !!ent?.pro;
export const entitlement = () => ent;
export const locked = () => proAvailable() && !isPro();
export const PRO_ROUTES = ['spar', 'career', 'combos', 'tests', 'targets', 'iq'];
export const onPro = f => { subs.add(f); f(isPro()); return () => subs.delete(f); };

// Called by sync.js with the live Firestore record (null when signed out or never subscribed).
export function setEntitlement(e) {
  const was = isPro();
  ent = e ? { pro: !!e.pro, status: e.status || '', endsAt: e.endsAt || '', cancelAt: e.cancelAt || '' } : null;
  try { ent ? localStorage.setItem(CACHE, JSON.stringify(ent)) : localStorage.removeItem(CACHE); } catch { /* private mode */ }
  if (was !== isPro()) subs.forEach(f => f(isPro()));
}

let paddle = null;
function loadPaddle(onDone) {
  if (paddle) return paddle;
  paddle = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.onload = () => {
      if (PADDLE.env === 'sandbox') window.Paddle.Environment.set('sandbox');
      window.Paddle.Initialize({ token: PADDLE.token, eventCallback: e => onDone?.(e) });
      res(window.Paddle);
    };
    s.onerror = () => { paddle = null; rej(new Error('offline')); };
    document.head.append(s);
  });
  return paddle;
}

// Local prices with tax for the visitor's country, e.g. "$4.99" or "€4.99".
export async function plans() {
  if (!canBuy()) return [];
  const P = await loadPaddle();
  const ids = [['monthly', PADDLE.monthly], ['yearly', PADDLE.yearly]].filter(x => x[1]);
  try {
    const r = await P.PricePreview({ items: ids.map(([, priceId]) => ({ priceId, quantity: 1 })) });
    return ids.map(([type, id], i) => ({ type, id, price: r.data.details.lineItems[i].formattedTotals.total }));
  } catch { return ids.map(([type, id]) => ({ type, id, price: type === 'yearly' ? '$29.99' : '$4.99' })); }
}

// Opens Paddle's checkout. The account id travels with the order so the server can unlock Pro.
let onCheckoutDone = null;
export async function buy(plan, user) {
  const P = await loadPaddle(e => { if (e.name === 'checkout.completed') onCheckoutDone?.(); });
  return new Promise(res => {
    onCheckoutDone = res;
    P.Checkout.open({
      items: [{ priceId: plan.id, quantity: 1 }],
      customer: user.email ? { email: user.email } : undefined,
      customData: { uid: user.uid },
      settings: { displayMode: 'overlay', theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', allowLogout: false },
    });
  });
}

// Calls to the payment-check server, signed with the user's Firebase sign-in token.
export async function api(path, token) {
  const r = await fetch(PADDLE.api.replace(/\/$/, '') + path, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error((await r.text()) || 'server');
  return r.json();
}
