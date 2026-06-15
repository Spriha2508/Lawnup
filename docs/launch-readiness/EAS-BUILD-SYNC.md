# EAS Build Workstream — Native Asset Sync & Readiness

> Executed 2026-06-15. Clean prebuild + EAS config. No UI/branding/logic changes.

## A. Clean native regeneration — DONE
`npx expo prebuild --clean --no-install` → cleared and regenerated **both** `android/` and `ios/` from the current `app.json` + assets. `✔ Finished prebuild`.

## C. Before / After comparison

### App display name
| | Reference | Value |
|---|---|---|
| Before | `app.json:name` | `LawnUp AI` |
| After | `app.json:name` → `android/.../strings.xml app_name`, `ios/LawnUp/Info.plist CFBundleDisplayName` | **`LawnUp`** |

### Launcher / icon assets
| Asset | Before (stale, green square) | After (regenerated, on-brand) |
|---|---|---|
| **Adaptive background** | `colors.xml iconBackground = #0A0D0B` (dark green) | **`#ECE7E0`** (cream) ✅ |
| **Adaptive foreground** | `mipmap-*/ic_launcher_foreground.webp` 156–2559 B (from 1×1 placeholder) | real textured **L**, **108²→432²**, 3.7–44 KB ✅ |
| **iOS app icon** | 1×1 placeholder | `AppIcon.appiconset/App-Icon-1024x1024@1x.png` **1024², 406 KB** (textured L) ✅ |
| **Notification icon** | 1×1 placeholder | `drawable-*/notification_icon.png` white **L** silhouette, all densities ✅ |
| **Splash** | 1×1 on `#0A0D0B` | mark on dark `#0A0D0B` (kept per decision) ✅ |

### Source → native asset paths
- **Source (app.json):** `./assets/images/{icon,adaptive-icon,splash,notification-icon,favicon}.png`
- **Android native:** `app/src/main/res/mipmap-*/ic_launcher_foreground.webp` · `values/colors.xml` (`iconBackground #ECE7E0`) · `drawable-*/notification_icon.png` · `mipmap-anydpi-v26/ic_launcher.xml` (bg=`@color/iconBackground`, fg=`@mipmap/ic_launcher_foreground`)
- **iOS native:** `ios/LawnUp/Images.xcassets/AppIcon.appiconset/…` · `SplashScreen` imageset

### Final expected launcher icon
**Textured green "L" monogram (with leaf accents) centred on a cream `#ECE7E0` adaptive background**, masked per launcher (circle/squircle/rounded). **The green square is gone** at the native level — verified in `colors.xml` and the regenerated mipmaps.

## B. EAS configuration
| Item | Status | Detail |
|---|---|---|
| `eas.json` valid | ✅ | Parses; profiles: development, **preview** (added), staging, production |
| Duplicate `production` | ✅ **non-issue** | *Correction to Phase-2:* line 20 = `build.production`, line 30 = `submit.production` — **different sections, not a duplicate key.** Nothing to remove. |
| Versioning | ✅ FIXED | Added `cli.appVersionSource: "remote"` (EAS auto-manages versionCode/buildNumber) |
| Build profiles | ✅ | `preview` (internal APK) added for the Android preview build |
| `targetSdk`/`compileSdk` | ✅ | 35 / 35 (Play-compliant) |
| **EAS `projectId`** | ❌ **GATE** | `app.json:extra.eas.projectId = "YOUR_EAS_PROJECT_ID"` — placeholder. Requires **`eas init`** (interactive, your Expo account) — cannot be set from this environment. |
| `google-services.json` | ⚠️ | Absent — only needed for **FCM remote push**; preview build & local reminders work without it. |
| `expo-system-ui` | ⚠️ | Prebuild warned `userInterfaceStyle` needs `expo-system-ui` to enforce light-only natively. Non-blocking (app renders its own light theme); install to lock it. |

## D. Android preview build readiness

**Verdict: READY — pending one command (`eas init`).**

Everything required for an on-brand Android preview APK is in place: the native project is regenerated with the correct icons + cream background, the app name is `LawnUp`, `eas.json` has a `preview` profile + version source, and SDK 35 is set. The **only** remaining gate is the real **EAS `projectId`**, which needs your Expo account:

```
eas init                 # sets the real projectId in app.json
eas build --profile preview --platform android
```

That produces an internal-distribution APK with the new launcher icon, splash, and notification icon. Install it and run the **Phase-3 device QA checklist** (section A "Branding assets" first — confirm the L icon, not a square).

### Remaining (non-blocking for a preview build)
- `eas init` projectId *(blocks the build command itself)*.
- `google-services.json` *(only if testing remote push)*.
- `expo-system-ui` *(to enforce light-only)*.
- `OPENAI_API_KEY` empty *(Dr. Banyan stays local — known)*.
