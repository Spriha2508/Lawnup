# Google Sign-In — Setup & Implementation Guide

LawnUp uses the **Firebase JS SDK** (`firebase` v10), so Google Sign-In is done
with `@react-native-google-signin/google-signin` (native picker) → exchange the
returned `idToken` with Firebase via `signInWithGoogle(idToken)` in
`src/features/auth/services/authService.ts` (already scaffolded).

App identity: **package `com.lawnup.app`**, Firebase owner `spriha007`, slug `lawnup`.

---

## 1. google-services.json placement

- Put the downloaded file at the **repo root**: `./google-services.json`.
- `app.json` already references it: `android.googleServicesFile: "./google-services.json"` (added).
- On `expo prebuild` / EAS build it is copied to `android/app/google-services.json`.
- **Gitignore it** (contains your OAuth client config). Add to `.gitignore`:
  ```
  google-services.json
  ```
- ⚠️ Because `app.json` now points at it, a build will **fail if the file is missing** — make sure it's present locally / provided to EAS (e.g. via an EAS secret/file) before building.

## 2. Web Client ID (required by the library)

The native lib needs the **Web** OAuth client ID (NOT the Android client) — it's
the audience for the ID token Firebase accepts.

Find it either way:
- **From `google-services.json`:** the entry under `client[].oauth_client[]` whose
  `"client_type": 3`. Its `"client_id"` (ends in `.apps.googleusercontent.com`) is the Web client ID.
- **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 Client IDs →
  **"Web client (auto created by Google Service)"**.

Store it as an env var (do not hardcode):
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
```

## 3. SHA-1 / SHA-256 fingerprints to add in Firebase

Add under Firebase Console → Project Settings → Android app (`com.lawnup.app`).
Add **all** that apply, then **re-download google-services.json**.

- **EAS build keystore** (preview + production) — authoritative for installed builds:
  ```
  eas credentials -p android
  # → select build profile → Keystore → shows SHA-1 and SHA-256
  ```
- **Local debug keystore** — the project signs **both** debug *and* release with
  `android/app/debug.keystore` (see `android/app/build.gradle` → `signingConfigs`),
  so this is the fingerprint for every locally-built APK right now:
  ```
  keytool -list -v -alias androiddebugkey \
    -keystore android/app/debug.keystore -storepass android -keypass android
  ```
  **Current value of the committed `android/app/debug.keystore` (must be registered in Firebase):**
  ```
  SHA-1:   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
  SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
  ```
- **Play App Signing** (after first upload, for production installs from Play):
  Play Console → your app → Setup → App signing → copy the SHA-1 + SHA-256.

> ⚠️ **LB-029 root cause (QA Round 2):** `google-services.json` currently registers
> the Android OAuth client against `certificate_hash 5fbc5bc4…`, which is **not**
> the `android/app/debug.keystore` SHA-1 above (`5e8f1606…`). Google's OAuth backend
> therefore rejects sign-in with `DEVELOPER_ERROR` (code 10). **Fix:** add the
> `5E:8F:16:…` SHA-1 (+ SHA-256) under Firebase → Project Settings → Android app →
> SHA fingerprints, **re-download `google-services.json`**, and rebuild. If you also
> distribute an **EAS** build, register that keystore's SHA too (`eas credentials -p android`).
> This is a Firebase-console action — no repo edit can satisfy the server-side check.

## 4. Remaining Firebase config

1. Firebase Console → Authentication → Sign-in method → enable **Google** + set support email.
2. Add SHA-1 + SHA-256 (above) → **re-download** `google-services.json` → place at repo root.
3. Confirm the **Web client ID** exists (step 2) and set the env var.

## 5. App implementation steps (the Google Auth task)

1. `npx expo install @react-native-google-signin/google-signin`
2. Add its config plugin to `app.json` `plugins`.
3. Configure once at startup:
   ```ts
   import { GoogleSignin } from '@react-native-google-signin/google-signin';
   GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
   ```
4. Wire the Landing button's `handleGoogle` (currently shows "coming soon"):
   ```ts
   await GoogleSignin.hasPlayServices();
   const { idToken } = await GoogleSignin.signIn();
   await signInWithGoogle(idToken); // already implemented in authService
   ```
5. Flip `GOOGLE_AUTH_READY = true` in `LandingScreen.tsx`.
6. **Rebuild the dev/EAS client** (native module — Metro/OTA reload is not enough).

## Status
- ✅ `signInWithGoogle(idToken)` scaffolded (authService).
- ✅ `@react-native-google-signin/google-signin` installed, plugin in `app.json`, configured at boot (`App.tsx` → `configureGoogleSignIn()`).
- ✅ `app.json` `googleServicesFile` set; `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set → `GOOGLE_AUTH_READY = true` (the Landing button now *attempts* real sign-in, not "coming soon").
- ✅ `DEVELOPER_ERROR` (code 10) mapped to a friendly message + dev diagnostic in `googleSignIn.ts`.
- ⛔ **BLOCKED (owner-side, BLK-1):** SHA fingerprint not registered in Firebase — see below.

### Round 3 re-confirmation (2026-06-20, LB-048)
Re-verified end-to-end on the OnePlus 7 Pro debug build:
- The installed APK is signed by `android/app/debug.keystore`, SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` (lowercase, no colons: `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`).
- `android/app/google-services.json` registers the Android OAuth client (type 1) against `certificate_hash 5fbc5bc44b40310e3e66d39fe2627b1c7f0d3648` — **a different key**.
- ⇒ Google's OAuth backend returns `DEVELOPER_ERROR` (code 10); sign-in fails. Everything else verified correct (Web client type 3 `…ed1sm4l95sba…`, `package_name`/`applicationId` = `com.lawnup.app`, boot config, JS flow).

**Owner action to unblock (no repo edit can substitute — server-side check):**
1. Firebase Console → Project Settings → Android app (`com.lawnup.app`) → **Add fingerprint** → register SHA-1 `5E:8F:16:…F6:25` **and** SHA-256 `FA:C6:17:…3B:9C`.
2. **Re-download `google-services.json`** → place at repo root (and it copies to `android/app/` on build).
3. **Rebuild** the app (native — Metro reload is not enough). For EAS distribution also register that keystore's SHA via `eas credentials -p android`.
4. Firebase Console → Authentication → Sign-in method → ensure **Google** provider is enabled with a support email.
