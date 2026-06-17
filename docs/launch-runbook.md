# LawnUp — Launch Runbook (native-setup stage)

Payments (RevenueCat) are **code-complete and env-gated** — no TODOs or flags to
flip; they activate when the real key is set (see `PLAY_STORE_SETUP.md`). Google
Sign-In and Sentry are scaffolded in code (seams + flags + auth wiring). The steps
below are the remaining on-machine work: configure external services, set keys,
flip the remaining READY flags where noted, and rebuild. Do these in order — each
ends with the app still building.

Identity: package `com.lawnup.app`, Firebase owner `spriha007`.
Detailed guides: **payments → [`../PLAY_STORE_SETUP.md`](../PLAY_STORE_SETUP.md)** (single source of truth; `revenuecat-setup.md` covers only how the code behaves), `google-signin-setup.md`, `sentry-setup.md`.

---

## 0. Prereqs (no code)
- [ ] Firebase: enable **Google** sign-in provider + support email.
- [ ] Firebase: add Android app SHA-1 + SHA-256 (`eas credentials -p android` and the debug keystore) → **re-download `google-services.json`** → place at repo root (gitignored; `app.json.android.googleServicesFile` already points to it).
- [ ] RevenueCat + Play Console (account, app, subscription products, key): follow [`../PLAY_STORE_SETUP.md`](../PLAY_STORE_SETUP.md) — the single source of truth for all payments setup.
- [ ] Sentry: project (React Native) → DSN.
- [ ] `.env`: set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_SENTRY_DSN` (+ Firebase + PostHog + OpenWeather + ImageKit).

## 1. Google Sign-In  (Task #19)
- [ ] `npx expo install @react-native-google-signin/google-signin` + add its config plugin to `app.json`.
- [ ] `GoogleSignin.configure({ webClientId })` at startup.
- [ ] LandingScreen `handleGoogle`: `hasPlayServices()` → `signIn()` → `signInWithGoogle(idToken)` (already in authService).
- [ ] Flip `GOOGLE_AUTH_READY = true` (LandingScreen).

## 2. RevenueCat / Payments  (Task #20)
Code is **complete and dormant** — no scaffold or flag to flip. It activates when a
real `goog_` key is set in `.env` (and the app is rebuilt). All account, product,
key, testing, and rollout steps live in **[`../PLAY_STORE_SETUP.md`](../PLAY_STORE_SETUP.md)** —
do not duplicate them here.
- [ ] Complete `PLAY_STORE_SETUP.md` (set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…`, rebuild).
- [ ] Verify purchase, restore, entitlement persistence, and that premium unlocks the scan + chat quotas.

## 3. Sentry  (Task #21)
- [ ] `npx expo install @sentry/react-native` + config plugin.
- [ ] Fill `TODO(sentry)` blocks in `crashReporting.ts`.
- [ ] Flip `CRASH_REPORTING_READY = true`. Boot init, `setCrashUser` (auth listener) and logger error forwarding (all wired) go live.

## 4. Analytics  (P0)
- [ ] Set real `EXPO_PUBLIC_POSTHOG_KEY`; confirm events fire in a release build (PostHog is disabled in `__DEV__`).

## 5. Internal testing build  (Task #23)
- [ ] Rebuild dev/EAS client (native modules added above can't hot-reload).
- [ ] Upload to Play internal track → unblocks IAP product testing.

## 6. Device QA  (P0)
- [ ] Auth: email signup/login/forgot + **Google sign-in**; email verification arrives.
- [ ] Scan: tap Scan → Camera (permission once) → capture → result → save → **first-plant reward**.
- [ ] Soil advice from result (no save). Reminders fire (locked/background/closed).
- [ ] Paywall purchase → premium unlocks higher scan + unlimited chat; Restore works.
- [ ] Crash test → appears in Sentry. Quota: weekly reset, no false "limit after one scan".

---

## App Store readiness (parallel, mostly no-code)
- [ ] Privacy Policy URL + wire the Landing "Terms & Privacy" link (currently inert text).
- [ ] Play Data Safety form + Content Rating.
- [ ] Store listing assets (screenshots, description; icon/feature graphic done).

## Premium gating note
Per Task #22, premium = **more scans + unlimited Doc. Sage** only. All paywall/
prompt copy now matches; do **not** re-introduce premium-only claims for disease
detection, reminders, weather tips, or unlimited plants (those are free).
