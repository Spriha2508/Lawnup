# Preview Build Readiness — Verification Result

> Checked 2026-06-16. Verify-only; nothing changed.

## ⛔ Blocked on 1 item — projectId not present in this repo

| # | Task | Result | Evidence |
|---|---|---|---|
| 1 | **Verify generated `projectId` stored** | ❌ **FAIL** | `app.json:70` is still `"eas": { "projectId": "YOUR_EAS_PROJECT_ID" }`. `expo config` resolves `projectId: 'YOUR_EAS_PROJECT_ID'`. No `owner` field. `.expo/settings.json` has no projectId. Last commit touching `app.json` = the theme fix, not an `eas init`. |
| 2 | **Revalidate `app.json` / `eas.json`** | ✅ PASS (except #1) | `app.json`: name `LawnUp`, slug `lawnup`, version `1.0.0`, `android.package com.lawnup.app`, `ios.bundleIdentifier com.lawnup.app`, `userInterfaceStyle light`. `eas.json`: valid JSON, `appVersionSource remote`. |
| 3 | **Android preview build profile** | ✅ PASS | `build.preview = { distribution: "internal", android: { buildType: "apk" }, env: { APP_ENV: "preview" } }`. |
| 4 | **Remaining build blockers** | ❌ 1 critical | **projectId placeholder** (above). Non-blocking for a preview: no `google-services.json` (remote push only), `OPENAI_API_KEY` empty (Dr. Banyan local), Android keystore (EAS auto-generates on first build). |
| 5 | **Exact build command** | ⏸ gated | `eas build --profile preview --platform android` — will **fail/prompt** until the real projectId is in `app.json`. |
| 6 | **This report** | ✅ | — |

## Why this happened (most likely)
`eas init` writes the real `projectId` into the **`app.json` of the repo where it runs** (and links the project on Expo's servers). If it was run on a different machine/clone — or in a shell whose file changes didn't land in this working tree — then **this** `app.json` never received the value. The server-side project may well exist; the local file just isn't pointing at it here.

## Two ways to resolve (either works)
**Option A — re-run `eas init` in *this* repo** (recommended if you're working here):
```
eas init        # detects the existing project, writes the real projectId into app.json
```
Then commit the `app.json` change.

**Option B — paste me the Project ID** (a UUID like `a1b2c3d4-…`), from:
- the `eas init` output, or
- expo.dev → your account → Projects → **lawnup** → "Project ID".

I'll write it into `app.json:70` (and add `owner` if you give the account slug), commit, and re-run verification — no other changes.

## What is already green (everything except the ID)
- ✅ Native projects regenerated, on-brand icons (`#ECE7E0` cream + textured L), name `LawnUp`.
- ✅ Theme: `userInterfaceStyle light` enforced (iOS + expo-system-ui), no warnings.
- ✅ `eas.json` preview profile + `appVersionSource: remote`.
- ✅ SDK 54 / RN 0.81.5 / targetSdk 35. `tsc` clean.

## Verdict
**NOT YET READY for the preview build — single gate: the real `projectId` must be in this `app.json`.** The moment that's set, the project is green and the command below produces the APK.

### Build command (run only after the projectId is set)
```
eas build --profile preview --platform android
```
**Expected artifacts:** an **Android APK** (internal distribution), downloadable from the EAS build page / `eas build:list`, installable directly on a device (no Play track needed). First run will prompt to **generate an Android keystore** — accept (EAS manages it).
