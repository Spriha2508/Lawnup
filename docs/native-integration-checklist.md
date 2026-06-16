# Native Integration Checklist

Single, step-by-step list to wire RevenueCat, Google Sign-In, and Sentry and
reach an internal testing build. Audited state as of this commit is shown so no
extra investigation is needed. Identity: package **`com.lawnup.app`**, Firebase
owner `spriha007`, version `1.0.0` (versionCode managed by EAS — `eas.json`
`appVersionSource: "remote"`).

Legend: ✅ done · ⚠️ action needed · ⬜ to do at this stage.

---

## 1. Environment variables (`.env`)
Audited current state:

| Key | State | Action |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` … `_APP_ID` | ✅ SET | none |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | ⚠️ EMPTY | optional (GA4 only) — leave or fill |
| `EXPO_PUBLIC_POSTHOG_KEY` | ⚠️ EMPTY | **set real PostHog project key (P0 — analytics dead without it)** |
| `EXPO_PUBLIC_POSTHOG_HOST` | ✅ SET | none |
| `EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT` | ✅ SET | none |
| `EXPO_PUBLIC_OPENWEATHER_KEY` | ✅ SET | none |
| `PLANT_ID_KEY` | ✅ SET | OK — intentionally non-`EXPO_PUBLIC`; `app.config.ts` bakes it into `extra.plantIdKey` (client provider reads `Constants.expoConfig.extra.plantIdKey`). No change. |
| `OPENAI_API_KEY` | ⚠️ EMPTY | set it — client-side Dr. Banyan reads `extra.openaiKey` (from `app.config.ts`); empty ⇒ **AI chat replies disabled**. Non-`EXPO_PUBLIC` (baked via extra). |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | ⬜ not in `.env` | add (RevenueCat → Project → API keys → Android public key) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | ⬜ not in `.env` | add (OAuth **Web** client id, ends `.apps.googleusercontent.com`) |
| `EXPO_PUBLIC_SENTRY_DSN` | ⬜ not in `.env` | add (Sentry project DSN) |

> All three new keys are already in `.env.example` — copy into `.env` and fill.
> `EXPO_PUBLIC_*` is inlined into the app bundle (client-safe IDs only). Never
> prefix paid/secret keys with `EXPO_PUBLIC_`.

## 2. Firebase configuration
- ⬜ Authentication → Sign-in method → enable **Email/Password** (verify on) and **Google** (set support email).
- ⬜ Project Settings → Android app (`com.lawnup.app`) → add **SHA-1 + SHA-256**:
  - EAS keystore: `eas credentials -p android` → Keystore.
  - Debug keystore: `keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android`.
  - (Later) Play App Signing SHA from Play Console.
- ⬜ **Re-download `google-services.json`** (now contains `oauth_client`) → place at **repo root** (`./google-services.json`). It is **MISSING** today; `app.json.android.googleServicesFile` ✅ already points to it (build fails without it).
- ✅ Firebase JS config present in `.env`.

## 3. Play Console configuration
- ⬜ App created under `com.lawnup.app`.
- ⬜ Upload one **signed build to the internal track** (required before products are purchasable).
- ⬜ Create **subscriptions** with IDs matching `purchasesService.PRODUCT_TIER`:
  - `lawnup_premium_monthly` → ₹199 / month
  - `lawnup_premium_annual` → ₹1990 / year
- ⬜ Link a **service account** (for RevenueCat) with Play Developer API access.
- ⬜ Complete **Data Safety** + **Content Rating** + **Privacy Policy URL** (store gate).

## 4. RevenueCat configuration
- ⬜ Create project → add Android app (`com.lawnup.app`) → connect Play (service-account JSON).
- ⬜ Create entitlement **`premium`** (matches `purchasesService.ENTITLEMENT_ID`).
- ⬜ Create an **offering** with two packages mapped to the Play product IDs above.
- ⬜ Copy **Android public SDK key** → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.

## 5. Sentry configuration
- ⬜ Create a **React Native** project → copy **DSN** → `EXPO_PUBLIC_SENTRY_DSN`.
- ⬜ (CI, optional) Sentry auth token for source-map upload — not needed to capture errors.

## 6. Secrets audit (Firebase Functions — server side)
`functions/` exists (Cashfree payment code is **parked** — RevenueCat replaces it; no action unless you keep web checkout).
- Required only if `EXPO_PUBLIC_BACKEND_ENABLED=true` (currently client-side):
  - ⬜ `firebase functions:secrets:set PLANT_ID_KEY`
  - ⬜ `firebase functions:secrets:set OPENAI_KEY` (AI chat) — `.env OPENAI_API_KEY` is EMPTY
  - ⬜ `firebase functions:secrets:set OPENWEATHER_KEY`
  - Parked: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`
- No secret belongs in the app bundle — keep these out of `.env`'s `EXPO_PUBLIC_*`.

## 7. Build configuration (`app.json` / `eas.json`)
- ✅ `package: com.lawnup.app`, `version: 1.0.0`, `googleServicesFile` set.
- ✅ Plugins present: `expo-camera`, `expo-notifications`, `expo-build-properties`.
- ⬜ Add config plugins when installing: **`@react-native-google-signin/google-signin`** and **`@sentry/react-native`** (RevenueCat needs no plugin).
- ✅ `eas.json`: production `app-bundle` + store distribution; `appVersionSource: remote` (versionCode auto-incremented by EAS — no manual versionCode).
- ⬜ Ensure `google-services.json` is available to EAS builds (committed is gitignored, so provide via an EAS file secret or local presence).

---

## Install & wire (run in order — each ends building)

### A. Google Sign-In (Task #19)
1. `npx expo install @react-native-google-signin/google-signin`
2. Add its config plugin to `app.json` `plugins`.
3. `GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID })` at startup.
4. LandingScreen `handleGoogle`: `hasPlayServices()` → `signIn()` → `signInWithGoogle(idToken)` (already in `authService`).
5. Set `GOOGLE_AUTH_READY = true` (LandingScreen).

### B. RevenueCat (Task #20)
1. `npx expo install react-native-purchases`
2. Fill `TODO(revenuecat)` blocks in `purchasesService.ts`.
3. Set `PAYMENTS_READY = true`. (Paywall CTA + Restore + boot `initPurchases/syncEntitlement` already wired.)

### C. Sentry (Task #21)
1. `npx expo install @sentry/react-native` + add config plugin.
2. Fill `TODO(sentry)` blocks in `crashReporting.ts`.
3. Set `CRASH_REPORTING_READY = true`. (Boot init + `setCrashUser` + logger forwarding already wired.)

### D. Analytics
1. Set `EXPO_PUBLIC_POSTHOG_KEY`; verify events fire in a **release** build (disabled in `__DEV__`).

### E. Build & verify (Task #23)
1. Rebuild dev/EAS client (native modules can't hot-reload).
2. Upload to Play internal track.
3. Device QA (see `docs/launch-runbook.md` §6).

---

## Blockers summary (must clear before launch)
- ⚠️ `google-services.json` not placed.
- ⚠️ `EXPO_PUBLIC_POSTHOG_KEY` empty (analytics).
- ⚠️ `OPENAI_API_KEY` empty → Dr. Banyan AI chat replies disabled.
- ⬜ RevenueCat + Play products (no real payment path until done).
- ⬜ Google OAuth (Web client id + SHA) and Sentry DSN.
- ⬜ Privacy Policy URL + Play Data Safety / Content Rating.
- ✅ Not a blocker: `PLANT_ID_KEY` (client scans) — wired via `app.config.ts` extra.
