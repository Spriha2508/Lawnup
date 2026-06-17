# Google Play + RevenueCat — Launch Setup Checklist

**Status: NOT STARTED. RevenueCat is intentionally dormant.**

LawnUp ships today **without** in-app subscriptions. The RevenueCat code is fully
implemented but stays a no-op until the Android public SDK key is set. Nothing in
this checklist needs to happen until we are close to launch and the app is stable —
specifically, **do not pay the $25 Google Play Developer fee until then.**

- Code seam: `src/features/subscription/services/purchasesService.ts`
- Activation switch: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in `.env`
  (BLANK = payments off, `goog_…` = payments on)
- Pricing source of truth: `src/features/subscription/constants/plans.ts`
  (Monthly ₹199, Annual ₹1990)
- Companion guide (code details): `docs/revenuecat-setup.md`

> Every step below is **external** (dashboards/consoles) — none can be done in code.
> The app is already wired; this is purely account + product configuration.

---

## When to do this

| Phase | Action |
|---|---|
| **Now → beta** | Leave key blank. Ship & test with the free tier. DEV builds test Premium via the mock path. |
| **App stable, ~2–3 weeks before launch** | Steps 1–6 below (create account → connect Play↔RevenueCat → set key). A signed build on an internal track is a prerequisite for creating products, so this can't be rushed. |
| **Final pre-launch QA** | Step 7 (sandbox purchase testing) on the internal/closed track. |
| **Production release** | Step 8. |

Allow real calendar time: Google Play Console identity verification can take a few
days, and a build must propagate to an internal track before subscriptions are testable.

---

## 1. Create the Google Play Developer account
- [ ] Go to <https://play.google.com/console> and sign up.
- [ ] Pay the **one-time $25** registration fee.
- [ ] Complete identity / address verification (can take 1–3 days).
- [ ] (Recommended) Use an **organization** account if this will be a business listing.

## 2. Create the LawnUp app in Play Console
- [ ] **Create app** → name **LawnUp**, language, app (not game), free.
- [ ] Confirm the package name is **`com.lawnup.app`** (must match `app.json` / `app.config.ts`).
- [ ] Complete the required onboarding: privacy policy URL, data safety form,
      content rating, target audience, ads declaration.
- [ ] Build a signed AAB (`eas build -p android`) and upload it to the
      **Internal testing** track — this is required before subscriptions can be created.
- [ ] Note the **Play app signing** is enabled (RevenueCat needs Google Play licensing).

## 3. Create the subscription products
Create **two** subscriptions under *Monetize → Products → Subscriptions*. The
product IDs **must match** `PRODUCT_TIER` in `purchasesService.ts`:

- [ ] **Monthly** — product ID `lawnup_premium_monthly`
  - Base plan: auto-renewing, billing period **1 month**, price **₹199**.
- [ ] **Annual** — product ID `lawnup_premium_annual`
  - Base plan: auto-renewing, billing period **1 year**, price **₹1990**.
- [ ] Set each base plan to **Active**.
- [ ] (Optional) Add free-trial / intro offers later — not required for launch.

> If you choose different product IDs, update `PRODUCT_TIER` in
> `purchasesService.ts` to match — search for `TODO(play-store)`.

## 4. Connect Google Play ↔ RevenueCat
- [ ] In Google Cloud, create a **service account** with Play access and download
      its JSON key (Play Console → *Setup → API access*, grant
      "View financial data" + "Manage orders & subscriptions").
- [ ] In the **RevenueCat dashboard** → your project → add an **Android app**
      with package name `com.lawnup.app`.
- [ ] Upload the Play **service-account JSON** to the RevenueCat Android app config.
- [ ] Wait for RevenueCat to show the Play connection as **valid/green**.

## 5. Configure products, entitlement & offering in RevenueCat
- [ ] Import / add the two Play products (`lawnup_premium_monthly`, `lawnup_premium_annual`).
- [ ] Create an **Entitlement** with identifier **`premium`**
      (must match `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` / `ENTITLEMENT_ID`).
- [ ] Attach both products to the `premium` entitlement.
- [ ] Create an **Offering** (e.g. `default`) with two **Packages**:
  - [ ] Annual package → `lawnup_premium_annual` (package type **Annual**)
  - [ ] Monthly package → `lawnup_premium_monthly` (package type **Monthly**)
- [ ] (Optional) Design a **hosted Paywall** for the `default` offering — the app
      calls `presentPaywall()` and uses it automatically; if none is configured it
      cleanly falls back to the in-app `PaywallScreen` (see `openPaywall.ts`).

## 6. Set the Android Public SDK key in the app
- [ ] RevenueCat dashboard → *Project settings → API keys* → copy the
      **Android public app-specific key** (starts with `goog_`).
- [ ] In `.env`, set:
      `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxx`
- [ ] Mirror it into the EAS build profile / EAS secrets so production builds get it.
- [ ] **Rebuild the native app** (`eas build` — `react-native-purchases` is a native
      module; a JS-only reload will NOT pick up the key).
- [ ] Verify in-app: `PAYMENTS_READY` is now `true`, the Paywall CTA reads
      **"Start Premium →"** (not "coming soon"), and Settings shows **Manage subscription**.

> ⚠️ Use only the real `goog_` key. A `test_`/placeholder value flips payments "on"
> with no real offerings and breaks the upgrade flow.

## 7. Test sandbox / license purchases
- [ ] Add tester Google accounts as **License testers** (Play Console → *Setup →
      License testing*) so purchases are free and refundable.
- [ ] Add the same accounts to the **Internal testing** track and install via the
      opt-in link.
- [ ] Test on a **real Android device** (Play Billing is unavailable on emulators
      without Play Services):
  - [ ] Open the paywall → buy **Monthly** → entitlement unlocks (scan + chat
        quotas lift), `subscriptionStore` shows `premium`.
  - [ ] Buy **Annual** → same.
  - [ ] **Restore purchases** on a reinstall returns Premium.
  - [ ] Cancel via **Manage subscription** (Customer Center) → entitlement expires,
        store reconciles back to `free` via the `CustomerInfoUpdate` listener.
  - [ ] Kill & relaunch → `syncEntitlement()` keeps state correct.

## 8. Prepare for production release
- [ ] Move the AAB through **Closed → Open / Production** tracks.
- [ ] Submit subscriptions for review (they're reviewed with the app).
- [ ] Complete the **Data safety** form (declare purchase/financial data via Play Billing).
- [ ] Confirm production build carries the `goog_` key (EAS secret, not just local `.env`).
- [ ] Final smoke test on the production track with a license tester before public rollout.
- [ ] (P2, post-launch) Add a **RevenueCat → Firebase webhook** for tamper-resistant
      server-side entitlement checks (see `docs/revenuecat-setup.md`).

---

## Quick rollback / "turn it off"
Set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=` (blank) and rebuild. The app instantly
reverts to the free-only experience with the paywall showing **"Premium — coming
soon"** — no crashes, no dead taps.
