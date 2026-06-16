# RevenueCat — Setup & Implementation Guide

Payments go through **RevenueCat** wrapping Google Play Billing. The app talks to
RC only via `src/features/subscription/services/purchasesService.ts` (scaffolded).
Pricing source of truth: `src/features/subscription/constants/plans.ts`
(₹199/mo, ₹1990/yr). Entitlement → `subscriptionStore.setPlan('premium', …, tier)`.

## Prerequisites (external — can't be done in code)
1. **Play Console**: create the app, upload a signed build to an internal track
   (products require an uploaded build with the billing permission).
2. Create **subscription products** in Play Console with IDs that match
   `PRODUCT_TIER` in purchasesService:
   - `lawnup_premium_monthly` → ₹199 / month
   - `lawnup_premium_annual` → ₹1990 / year
3. **RevenueCat dashboard**: create project, add the Android app
   (`com.lawnup.app`), connect Play (service-account JSON), create:
   - Entitlement **`premium`** (matches `ENTITLEMENT_ID`)
   - Offering with both packages mapped to the Play products
4. Copy the **RevenueCat Android public SDK key** →
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in `.env`.

## Code steps
1. `npx expo install react-native-purchases`
2. Fill the `TODO(revenuecat)` blocks in `purchasesService.ts` (configure,
   getOfferings, purchasePackage, restorePurchases, getCustomerInfo).
3. Call `initPurchases(uid)` at app boot (after auth resolves) and
   `syncEntitlement()` on launch / resume.
4. Add a **Restore purchases** button to the Paywall → `restore()`.
5. Set `PAYMENTS_READY = true` in `purchasesService.ts`.
6. Remove the DEV mock path in `PaywallScreen.handleUpgrade` (or keep behind
   `__DEV__` for QA).
7. **Rebuild** the dev/EAS client (native module).

## Already wired (this scaffold)
- ✅ `purchasesService` seam: `initPurchases / purchase / restore / syncEntitlement / applyEntitlement`.
- ✅ `PaywallScreen.handleUpgrade` routes through `purchase(tier)` when `PAYMENTS_READY`; CTA enables automatically.
- ✅ `applyEntitlement` → `setPlan` already unlocks the scan + chat quotas (the
  real gates). **NOTE:** other "premium" perks on the Paywall table
  (disease detection, reminders, advanced weather) are **not currently gated** —
  see the Premium Feature Gate task before launch.

## Webhooks / server validation (P2)
RevenueCat manages entitlement state; for tamper-resistant server checks, add an
RC → Firebase webhook later. Not required for launch with RC client SDK.
