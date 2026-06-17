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
| `OPENAI_API_KEY` | ⚠️ EMPTY | set it — client-side Doc. Sage reads `extra.openaiKey` (from `app.config.ts`); empty ⇒ **AI chat replies disabled**. Non-`EXPO_PUBLIC` (baked via extra). |
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

## 3. Play Console + RevenueCat configuration
- ⬜ Follow **[`../PLAY_STORE_SETUP.md`](../PLAY_STORE_SETUP.md)** — the single source of truth
  for the Play account, app, subscription products, Play↔RevenueCat connection,
  entitlement/offering, the `goog_` Android SDK key, sandbox testing, and rollout.
  (Steps are intentionally not duplicated here to avoid drift.)

## 4. Sentry configuration
- ⬜ Create a **React Native** project → copy **DSN** → `EXPO_PUBLIC_SENTRY_DSN`.
- ⬜ (CI, optional) Sentry auth token for source-map upload — not needed to capture errors.

## 5. Secrets audit (Firebase Functions — server side)
`functions/` exists (Cashfree payment code is **parked** — RevenueCat replaces it; no action unless you keep web checkout).
- Required only if `EXPO_PUBLIC_BACKEND_ENABLED=true` (currently client-side):
  - ⬜ `firebase functions:secrets:set PLANT_ID_KEY`
  - ⬜ `firebase functions:secrets:set OPENAI_KEY` (AI chat) — `.env OPENAI_API_KEY` is EMPTY
  - ⬜ `firebase functions:secrets:set OPENWEATHER_KEY`
  - Parked: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`
- No secret belongs in the app bundle — keep these out of `.env`'s `EXPO_PUBLIC_*`.

## 6. Build configuration (`app.json` / `eas.json`)
- ✅ `package: com.lawnup.app`, `version: 1.0.0`, `googleServicesFile` set.
- ✅ Plugins present: `expo-camera`, `expo-notifications`, `expo-build-properties`.
- ⬜ Add config plugins when installing: **`@react-native-google-signin/google-signin`** and **`@sentry/react-native`** (RevenueCat needs no plugin).
- ✅ `eas.json`: production `app-bundle` + store distribution; `appVersionSource: remote` (versionCode auto-incremented by EAS — no manual versionCode).
- ⬜ Ensure `google-services.json` is available to EAS builds (committed is gitignored, so provide via an EAS file secret or local presence).

---

## Install & wire — CODE DONE ✅ (env-gated; activates on key + rebuild)

The three SDKs are installed and fully wired against real types (tsc clean).
Each is gated on its env key, so it stays **off** until the key is set AND a
native rebuild includes the module. **No code changes remain** — only the env
keys, dashboards, and a prebuild+build.

| Integration | Installed | Wired | Activates when |
|---|---|---|---|
| Google Sign-In (Task #19) | `@react-native-google-signin/google-signin@16` | `googleSignIn` service · Landing `handleGoogle` · boot `configureGoogleSignIn` · plugin in app.json | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set |
| RevenueCat (Task #20) | `react-native-purchases@10` | `purchasesService` (real API) · Paywall + Restore · boot init/sync | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` set |
| Sentry (Task #21) | `@sentry/react-native@7` | `crashReporting` (init/setUser/capture) · logger forwarding · boot init · plugin in app.json | `EXPO_PUBLIC_SENTRY_DSN` set |

### D. Analytics
1. Set `EXPO_PUBLIC_POSTHOG_KEY`; verify events fire in a **release** build (disabled in `__DEV__`).

### E. Build & verify (Task #23)
> ⚠️ **CRITICAL — native folders are committed (`android/`, `ios/` tracked).**
> EAS Build does **not** sync `plugins` or `android.googleServicesFile` from
> app.json when native folders exist. The config plugins added for Google
> Sign-In and Sentry (and the google-services copy) only take effect after a
> **prebuild regen** (the project's normal workflow — see commit `5d2baf6`).
1. Place `google-services.json` at repo root (required — prebuild fails without it).
2. Set the three integration keys + `POSTHOG_KEY` (+ `OPENAI_API_KEY`) in `.env`.
3. **`npx expo prebuild --clean -p android`** — regenerates `android/` with the
   new plugins + google-services + on-brand assets (reproduced from app.json).
4. EAS/local Android build → upload to Play internal track.
5. Device QA (see `docs/launch-runbook.md` §6) — verify Google sign-in, a real
   purchase + restore, a forced crash reaching Sentry.

---

## Blockers summary (must clear before launch)
- ⚠️ `google-services.json` not placed (also blocks prebuild).
- ⚠️ **Must `expo prebuild --clean` after placing google-services.json** — else the build ships without the Google/Sentry plugins.
- ⚠️ `EXPO_PUBLIC_POSTHOG_KEY` empty (analytics).
- ⚠️ `OPENAI_API_KEY` empty → Doc. Sage AI chat replies disabled.
- ⬜ RevenueCat + Play products (no real payment path until done).
- ⬜ Google OAuth (Web client id + SHA) and Sentry DSN.
- ⬜ Privacy Policy URL + Play Data Safety / Content Rating.
- ✅ Code complete: all three SDKs installed + wired + tsc-clean (env-gated).
- ✅ Not a blocker: `PLANT_ID_KEY` (client scans) — wired via `app.config.ts` extra.
