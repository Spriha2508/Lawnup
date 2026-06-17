# RevenueCat — How the Code Works

> **Setup steps live in one place: [`PLAY_STORE_SETUP.md`](../PLAY_STORE_SETUP.md).**
> That is the single authoritative guide for creating the Google Play account,
> subscription products, the RevenueCat dashboard, the Android SDK key, sandbox
> testing, and production rollout. This file only documents how the *implemented*
> code behaves — it does **not** repeat setup instructions.

Payments go through **RevenueCat** (SDK 10 + RevenueCatUI) wrapping Google Play
Billing. The app talks to RevenueCat only via
`src/features/subscription/services/purchasesService.ts`.

- **Pricing source of truth:** `src/features/subscription/constants/plans.ts`
  (Monthly ₹199, Annual ₹1990).
- **Activation switch:** `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in `.env`.
  Blank → `PAYMENTS_READY = false` and the whole layer is a no-op. A real
  `goog_…` key → live. (Setting the key is step 6 of `PLAY_STORE_SETUP.md`.)
- **Entitlement:** `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` (default `premium`), must
  match the RevenueCat dashboard.

## Current state (implemented)

The integration is **code-complete and dormant** — no scaffolding or TODO code
blocks remain. It activates automatically when the `goog_` key is present in a
native build; until then every call is a guarded no-op.

- ✅ `initPurchases` configures RevenueCat and registers a single
  `CustomerInfoUpdate` listener — the real-time source of truth that reconciles
  the local store on purchase, renewal, expiry, restore, and refund.
- ✅ `syncEntitlement` re-reads entitlement on launch / resume.
- ✅ `purchase(tier)` powers the in-app `PaywallScreen`; `presentPaywall()` shows
  the hosted (dashboard-designed) Paywall and falls back to `PaywallScreen` if no
  hosted paywall is configured (see `src/navigation/openPaywall.ts`).
- ✅ `restore()` and `presentCustomerCenter()` (manage / cancel / restore / refund).
- ✅ Entitlement → `subscriptionStore.setPlan('premium', …, tier)`, which unlocks
  the scan + chat quotas (the real gates).
- ✅ Without the key: `PaywallScreen` CTA shows "Premium — coming soon"; DEV builds
  still test Premium end-to-end via the `activateMockPremium` mock path.

## Things to confirm before launch

- **Product IDs must match** the Play + RevenueCat products. The planned IDs are
  `lawnup_premium_monthly` / `lawnup_premium_annual` (see `PRODUCT_TIER` in
  `purchasesService.ts`, marked `TODO(play-store)`). If you create different IDs in
  Play, update that map.
- **Premium feature gating:** `setPlan` unlocks scan + chat quotas, but other perks
  shown on the Paywall table (e.g. disease detection, reminders, advanced weather)
  are **not** separately gated — decide intended behavior before launch.
- **Rebuild required:** `react-native-purchases` is a native module; the key only
  takes effect in a fresh `eas build`, not a JS reload.

## Server validation (P2, post-launch)

RevenueCat manages entitlement state. For tamper-resistant server-side checks, add
a RevenueCat → Firebase webhook later. Not required for launch with the RC client SDK.
