// Combat Coach Pro: subscriptions through Google Play / App Store billing, managed by RevenueCat.
// Only active inside the store app with a RevenueCat key set; the web version is unaffected.
// Uses the native plugin through the Capacitor bridge, so no bundler is needed.
export const REVENUECAT_ANDROID_KEY = ''; // public SDK key "goog_..." from RevenueCat > Project > API keys
const ENTITLEMENT = 'pro';

const P = () => window.Capacitor?.isNativePlatform?.() && REVENUECAT_ANDROID_KEY ? window.Capacitor.Plugins.Purchases : null;
let pro = false, ready = null;
const subs = new Set();
const set = info => { pro = !!info?.entitlements?.active?.[ENTITLEMENT]; subs.forEach(f => f(pro)); return pro; };

export const proAvailable = () => !!P();
export const isPro = () => pro;
export const onPro = f => { subs.add(f); f(pro); return () => subs.delete(f); };

// Call once at start, and again with the Firebase uid after sign-in so Pro follows the account.
export function initPro(uid) {
  const p = P(); if (!p) return Promise.resolve(false);
  ready = (async () => {
    if (!ready) await p.configure({ apiKey: REVENUECAT_ANDROID_KEY, appUserID: uid || null });
    else if (uid) await p.logIn({ appUserID: uid });
    const { customerInfo } = await p.getCustomerInfo();
    return set(customerInfo);
  })().catch(() => pro);
  return ready;
}

// Monthly and yearly packages of the current offering, with store-formatted prices.
export async function plans() {
  const p = P(); if (!p) return [];
  await ready;
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
