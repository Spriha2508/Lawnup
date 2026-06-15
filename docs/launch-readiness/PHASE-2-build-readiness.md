# Phase 2 — EAS Build Readiness Report

> Verification only. No assets, screens, or logic changed. Expo SDK **54** · React Native **0.81.5**.

## Verification matrix

| # | Check | Result | Detail |
|---|---|---|---|
| 1 | Branding assets referenced correctly | ✅ PASS | `expo config --type public` resolves every path; all 5 files exist. |
| 2 | App icon config | ✅ PASS | `icon: ./assets/images/icon.png` — **1024×1024, opaque** (iOS-compliant). |
| 3 | Adaptive icon config (app.json) | ✅ PASS | `foregroundImage` 1024² transparent; `backgroundColor #ECE7E0`. |
| 4 | Splash config | ✅ PASS | `image: splash.png` 1024², `resizeMode: contain`, `backgroundColor #0A0D0B`. |
| 5 | Notification icon config | ✅ PASS | `notification-icon.png` **96×96** white/transparent; tint `#C8A24E`. |
| 6 | Favicon config | ✅ PASS | `favicon.png` **48×48**. |
| 7 | Android / iOS asset paths | ⚠️ PARTIAL | app.json paths resolve. `ios/` not generated yet (created on prebuild). `android/` exists but is **stale** — see #8. |
| 8 | **Cached / legacy branding assets** | ❌ **BLOCKER** | The committed `android/` native project still contains the **old placeholder launcher icons** (`ic_launcher_foreground.webp` etc., 156–2.5 KB, dated Jun 7) and `colors.xml` `iconBackground = #0A0D0B` (the old dark green). `android/` is **git-tracked, not gitignored** → an EAS build uses it **as-is** and would ship the **green-square icon + dark icon background**, ignoring every new asset and the `#ECE7E0` fix. |
| 9 | app.json / app.config validation | ✅ PASS | `expo config` parses cleanly, no errors; `app.config.ts` only injects `extra` keys, no icon refs. |
| 10 | Clean Expo prebuild validation | ⛔ REQUIRED (not run) | A **`npx expo prebuild --clean`** must regenerate `android/` from the new assets/config and generate `ios/`. Not executed here (per "no release builds until approved"). This is the gating action that resolves #8. |
| 11 | Other build blockers | ❌ see below | EAS projectId placeholder; duplicate `production` key in `eas.json`; missing `google-services.json`; version code source. |
| 12 | This report | ✅ | — |

## Blockers found (must fix before a successful, on-brand build)

| Severity | Blocker | Where | Fix |
|---|---|---|---|
| 🔴 Critical | **Stale `android/` native icons + dark icon background** | `android/app/src/main/res/**` (`mipmap-*`, `values/colors.xml`) | `npx expo prebuild --clean` (regenerates from new assets + `#ECE7E0`). Then commit the regenerated `android/`. |
| 🔴 Critical | **EAS `projectId` is a placeholder** `"YOUR_EAS_PROJECT_ID"` | `app.json:70` | `eas init` (or `eas build:configure`) to set the real projectId — otherwise `eas build` fails. |
| 🟠 High | **Duplicate `"production"` key in `eas.json`** | `eas.json:20` & `:30` | Remove/merge the duplicate profile (JSON "last-wins" silently overrides — fragile). |
| 🟠 High | **No `google-services.json`** | `android/app/` | Required for **FCM/remote push** in a release build. (Local watering reminders work without it. Push is a separate deferred workstream — fine for an internal/no-push build, blocks remote push.) |
| 🟡 Medium | **No explicit version source / Android `versionCode` / iOS `buildNumber`** | `app.json` (`version 1.0.0`) | Set `cli.appVersionSource` in `eas.json` (e.g. `remote`) so EAS auto-increments; otherwise duplicate-version upload rejections. |

## What is already correct (no action)
- `targetSdkVersion` **35** + `compileSdkVersion` **35** (Play-compliant) — set in both `app.json` and `android/gradle.properties`. ✅
- `version 1.0.0`, `orientation: portrait`, `slug: lawnup`. ✅
- All icon/splash/notification/favicon **configuration values** are correct in `app.json` — they will produce the right output **once a clean prebuild regenerates `android/`**.

## Recommended build sequence (when approved)
1. Resolve copy first if desired (Phase 1).
2. `eas init` → set real `projectId`; fix the duplicate `eas.json` profile; set `appVersionSource`.
3. **`npx expo prebuild --clean`** → regenerates `android/` (new icons + `#ECE7E0`) and creates `ios/`.
4. Verify the regenerated `android/.../colors.xml` shows `iconBackground #ECE7E0` and the mipmap foreground is the new L.
5. (If remote push needed) add `google-services.json`.
6. `eas build --profile preview` → install on device → run the Phase-3 QA.

> **Bottom line:** the *configuration* is build-ready, but the **committed `android/` folder is stale and would override it** — a clean prebuild + a real EAS projectId are the two hard gates.
