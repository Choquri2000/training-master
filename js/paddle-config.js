// Paddle (merchant of record) settings. All values here are public by design.
// Leave `token` empty to keep payments switched off (the whole app stays free, as before).
export const PADDLE = {
  env: 'sandbox',          // 'sandbox' for test purchases, 'production' when live
  token: '',               // client-side token from Paddle > Developer tools > Authentication ("test_..." or "live_...")
  monthly: '',             // price id "pri_..." for $4.99 / month with 7-day trial
  yearly: '',              // price id "pri_..." for $29.99 / year with 7-day trial
  api: '',                 // payment-check server URL, e.g. https://combat-coach-pay.<you>.workers.dev
};
