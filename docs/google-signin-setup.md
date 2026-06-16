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
- **Local debug keystore** (for `expo run:android` dev builds):
  ```
  keytool -list -v -alias androiddebugkey \
    -keystore ~/.android/debug.keystore -storepass android -keypass android
  ```
- **Play App Signing** (after first upload, for production installs from Play):
  Play Console → your app → Setup → App signing → copy the SHA-1 + SHA-256.

> Note: this machine has no local debug keystore and the EAS keystore is managed
> remotely, so the exact values must be pulled with the commands above — they
> can't be read from the repo.

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
- ✅ Button visible with honest "coming soon" until wired.
- ✅ `app.json` `googleServicesFile` set.
- ⬜ Package install + plugin + configure + rebuild (the Google Auth task).
