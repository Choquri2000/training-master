// Combat Coach Pro: subscriptions through Google Play / App Store billing, managed by RevenueCat.
// Only active inside the store app with a RevenueCat key set; the web version is unaffected.
// Uses the native plugin through the Capacitor bridge, so no bundler is needed.
export const REVENUECAT_ANDROID_KEY = ''; // public SDK key "goog_..." from RevenueCat > Project > API keys
const ENTITLEMENT = 'pro';

const P = () => window.Capacitor?.isNativePlatform?.() && REVENUECAT_ANDROID_KEY ? window.Capacitor.Plugins.Purchases : null;
// Last known status, so a paying user is never locked out offline or during start-up.
// RevenueCat checks every purchase with Google on its servers; this is only a local copy of that answer.
const CACHE = 'cc-pro';
let pro = (() => { try { return localStorage.getItem(CACHE) === '1'; } catch { return false; } })();
let chain = Promise.resolve(), configured = false;
const subs = new Set();
const set = info => {
  if (!info) return pro;
  pro = !!info.entitlements?.active?.[ENTITLEMENT];
  try { localStorage.setItem(CACHE, pro ? '1' : '0'); } catch { /* private mode */ }
  subs.forEach(f => f(pro));
  return pro;
};

export const proAvailable = () => !!P();
export const isPro = () => pro;
// Free plan: Stage 1, phase 1 only. Everything else needs Pro (store app only).
export const locked = () => proAvailable() && !pro;
export const PRO_ROUTES = ['spar', 'career', 'combos', 'tests', 'targets', 'iq'];
export const onPro = f => { subs.add(f); f(pro); return () => subs.delete(f); };

// Call once at start, and again with the Firebase uid after sign-in so Pro follows the account
// to every phone. Calls run one after another, so sign-in never races the first set-up.
export function initPro(uid) {
  const p = P(); if (!p) return Promise.resolve(false);
  chain = chain.then(async () => {
    if (!configured) {
      await p.configure({ apiKey: REVENUECAT_ANDROID_KEY, appUserID: uid || null });
      configured = true;
      // Renewals, expiries and refunds arrive here while the app is open.
      p.addCustomerInfoUpdateListener(info => set(info));
    } else if (uid) set((await p.logIn({ appUserID: uid })).customerInfo);
    return set((await p.getCustomerInfo()).customerInfo);
  }).catch(() => pro);
  return chain;
}
export const proLogOut = () => { const p = P(); if (p && configured) chain = chain.then(() => p.logOut()).then(r => set(r?.customerInfo)).catch(() => pro); };

// Monthly and yearly packages of the current offering, with store-formatted prices.
export async function plans() {
  const p = P(); if (!p) return [];
  await chain;
  const o = (await p.getOfferings())?.current;
  return (o?.availablePackages || []).map(pk => ({
    id: pk.identifier, type: pk.packageType, price: pk.product.priceString,
    trial: pk.product.introPrice?.price === 0 ? pk.product.introPrice.periodNumberOfUnits + ' ' + pk.product.introPrice.periodUnit.toLowerCase() : '',
    pkg: pk,
  }));
}
export async function buy(plan) {
  const { customerInfo } = await P().purchasePackage({ aPackage: plan.pkg });
  return set(customerInfo);
}
export async function restore() {
  const { customerInfo } = await P().restorePurchases();
  return set(customerInfo);
}
