# Razorpay Integration — What's There & How to Test

## Status

Your backend already had a complete, secure Razorpay integration wired up
(`backend/routes/payment.js`, `backend/routes/subscription.js`,
`backend/config/plans.js`, `backend/models/Payment.js` /
`Subscription.js`), and your `.env` already has the test keys you posted
above. The frontend `SubscriptionScreen` + `PaymentStatusOverlay` were also
already built to call it correctly.

**I found and fixed one real bug** while verifying: `frontend/api/index.ts`
(the central API barrel file) wasn't re-exporting the `Plan` and
`SubscriptionStatus` TypeScript types that `SubscriptionScreen.tsx` imports
from it — that would have broken the app bundle. Fixed.

Everything else below is a description of what's already implemented, plus
how to test it, since building it all fresh wasn't necessary.

## How the flow works

1. **Plans are server-defined** in `backend/config/plans.js` (Starter/Growth/
   Professional/Unlimited, priced by client count, +18% GST computed
   server-side). The client only ever sends a `planId` — never a price — so
   a tampered client can't negotiate its own subscription cost.
2. `POST /api/payment/create-order` looks up the plan, computes the total,
   creates a Razorpay order, and stores a `Payment` record with
   `status: 'created'`. Returns `orderId`, `amount`, and the **public**
   `keyId` (never the secret).
3. Frontend opens `RazorpayCheckout.open(...)` with that order.
4. On success, `POST /api/payment/verify` recomputes the HMAC‑SHA256
   signature server-side and compares it — this is the actual security
   boundary; the frontend result is never trusted directly. Duplicate
   `razorpay_payment_id`s are rejected (anti-replay), and re-verifying an
   already-`paid` order is idempotent.
5. `POST /api/subscriptions/activate` activates the subscription **only**
   from a `Payment` record this server already verified as paid — never
   from client-supplied plan/amount.
6. `PaymentStatusOverlay` shows the four states you asked for: creating →
   processing → success (with a Done button) → failed (with Retry).
7. Cancelled/failed attempts are logged via `POST /api/payment/failure` for
   audit purposes.
8. Client creation (`POST /api/customers`) enforces the active
   subscription's `maxClients` server-side, so the limit is real, not just
   cosmetic.

## Environment variables

`backend/.env` (already present, gitignored):
```
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<your JWT secret>
RAZORPAY_KEY_ID=rzp_test_T5MVYWwd2bS92E
RAZORPAY_KEY_SECRET=eH0k6bWjkKHqE6ukeik4qMUc
```
**To go live:** replace these two Razorpay values with your `rzp_live_`
keys. No code changes needed anywhere — every code path reads keys from
`process.env` only.

## Running it locally

```bash
cd backend
npm install
npm start          # starts on PORT (default 5000)
```

```bash
cd frontend
npm install
npx expo start --dev-client   # see note below on why --dev-client
```

⚠️ **`react-native-razorpay` is a native module — it will not work inside
Expo Go.** You need either:
- `npx expo run:android` (builds a dev client locally), or
- an EAS development build (`eas build --profile development`)

Also update `frontend/api/config.ts`'s `getBaseUrl()` with your machine's
LAN IP (already has a placeholder `192.168.1.31` for Android) so a physical
device can reach your backend.

## Test payment credentials (Razorpay test mode)

- **Test card:** `4111 1111 1111 1111`, any future expiry, any CVV, any name
- **Test UPI:** `success@razorpay` (always succeeds) or `failure@razorpay`
  (always fails, useful for testing your Retry flow)
- **OTP:** any value works in test mode (usually `1111` or similar prompt)

## Manual test checklist

- [ ] Open Subscription screen → plans load from `/api/subscriptions/plans`
      with correct pricing + GST
- [ ] Select a plan → Payment Summary shows subtotal/GST/total
- [ ] Tap Buy Now → "Setting up your order…" appears → Razorpay Checkout opens
- [ ] Pay with the test card above → "Verifying your payment…" → success
      screen → subscription is now active (check Profile screen)
- [ ] Try again, but dismiss/cancel Razorpay Checkout → failure screen with
      Retry appears, no charge, no subscription activated
- [ ] Try the `failure@razorpay` UPI id → same failure/Retry behavior
- [ ] Add customers until you hit the free-plan limit (30) → server returns
      403 until you upgrade
- [ ] Restart the app after a successful payment → subscription status
      persists (it's server-side, not local state)

## APK / production build notes

- Since `react-native-razorpay` needs native linking, build with
  `eas build --profile production` (or `expo run:android --variant release`)
  rather than expecting it to work in Expo Go.
- After install, confirm: Checkout opens fully, completing a payment returns
  you to the app (not stuck on a blank WebView), and the subscription shows
  active immediately without needing to force-quit the app.
- If you later enable Proguard/R8 minification for a release build and see
  a crash specifically when opening Checkout, add a keep-rule for
  `com.razorpay.**` in `android/app/proguard-rules.pro` — this is a known
  gotcha with the library, not something specific to this app.
