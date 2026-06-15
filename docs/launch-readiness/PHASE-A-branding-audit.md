# Phase A — Branding Asset Audit

> Scope: audit only. **No artwork generated** (per instruction). ₹0 task.

## 1. Audit findings

### Root cause of the "green square" launcher icon
**Every branding asset in `assets/images/` is a 1×1-pixel, 70-byte placeholder.** There is no real icon art anywhere in the project. Android therefore renders the adaptive-icon **background colour only** (`#0A0D0B`, a near-black/dark green) with an invisible 1×1 foreground → the "green/dark square."

### Current asset inventory

| Asset | Path | Declared in | Actual file | Required | Status |
|---|---|---|---|---|---|
| App icon (iOS/base) | `assets/images/icon.png` | `app.json:7` | **1×1, 70 B** | 1024×1024 | ❌ placeholder |
| Android adaptive — foreground | `assets/images/adaptive-icon.png` | `app.json:28` | **1×1, 70 B** | 1024×1024 | ❌ placeholder |
| Android adaptive — background | (colour `#0A0D0B`) | `app.json:29` | n/a (solid colour) | — | ⚠️ colour only |
| Splash icon | `assets/images/splash.png` | `app.json:12` | **1×1, 70 B** | 1242×2436 (or 2048² icon) | ❌ placeholder |
| Notification icon | `assets/images/notification-icon.png` | `app.json:55` | **1×1, 70 B** | 96×96 white-on-transparent | ❌ placeholder |
| Web favicon | `assets/images/favicon.png` | `app.json:42` | **1×1, 70 B** | 48×48 | ❌ placeholder |
| Play Store icon | — | not in repo | — | 512×512 | ❌ missing |
| Play feature graphic | — | not in repo | — | 1024×500 | ❌ missing (see Phase B) |

### Brand inputs already in the codebase (reusable for art)
- **`src/shared/components/motion/PlantEmblem.tsx`** — an SVG brand mark; a designer can base the icon on this (the in-app "leaf/emblem" identity), keeping the launcher icon consistent with the splash animation.
- **Notification tint** already set to `#C8A24E` (gold) at `app.json:56`.
- **Brand colours in `designSystem.ts`:** light primary `#A07A28` (brass/gold), dark primary `#C8A24E` (gold), canvas cream `#F6F1EA`, dark canvas `#0A0D0B`.

### ⚠️ Brand-colour inconsistency to resolve *before* art is produced
The handoff direction ("Botanical Daylight") describes the brand as **soft sage `#5E7F61`**, but the active `designSystem.ts` light theme uses a **brass/gold `#A07A28`** primary. The icon must match whichever is the real brand. **This is a decision to lock before any artwork** — otherwise the icon will clash with the app.

## 2. Missing assets (to produce)
1. App icon — 1024×1024 (opaque, no alpha for iOS).
2. Android adaptive foreground — 1024×1024 transparent, **art within the centre 66% safe zone** (outer ~16% is cropped by masks).
3. Android adaptive background — solid colour **or** 1024×1024 image.
4. Splash icon — single centered mark on the brand background (`resizeMode: contain`).
5. Notification icon — 96×96, **pure white silhouette on transparent** (Android tints it; any colour/detail renders as a white blob).
6. Web favicon — 48×48.
7. Play Store hi-res icon — 512×512, 32-bit PNG.

## 3. Recommended asset structure
```
assets/
  branding/                 # NEW — source + exports kept together
    icon-source.svg         # master vector (from PlantEmblem)
    icon-1024.png           # → app.json "icon"
    adaptive-foreground.png # 1024², safe-zone art → "adaptiveIcon.foregroundImage"
    adaptive-background.png # 1024² OR keep solid colour
    splash-icon.png         # centered mark
    notification-icon.png   # 96² white-on-transparent
    favicon.png             # 48²
    play-store-icon.png     # 512²  (upload only, not bundled)
```
Keep the existing `app.json` keys; just repoint paths (or overwrite the current files in place to avoid config churn — see plan).

## 4. Required dimensions (summary)

| Asset | Size | Format notes |
|---|---|---|
| App icon | 1024×1024 | opaque, no transparency (iOS rejects alpha) |
| Adaptive foreground | 1024×1024 | transparent; art in centre 66% safe zone |
| Adaptive background | 1024×1024 or colour | full bleed |
| Splash icon | ~1024–2048 square mark | transparent; sits on `backgroundColor` |
| Notification icon | 96×96 (xxxhdpi) | white silhouette + transparent only |
| Favicon | 48×48 | — |
| Play Store icon | 512×512 | 32-bit PNG, ≤1 MB |

## 5. Replacement plan (₹0, no new dependencies)
1. **Lock the brand colour** (sage vs brass) — single decision, no code.
2. **Create one master vector** from `PlantEmblem.tsx` (export the SVG, or hand to a designer). ₹0 via Inkscape/Figma free tier.
3. **Export the seven raster sizes** above. (Optional ₹0 helper: `npx @expo/configure-splash-screen` / `sharp-cli` to batch-resize from the 1024 master — no paid tooling.)
4. **Overwrite the five existing files in place** (`icon.png`, `adaptive-icon.png`, `splash.png`, `notification-icon.png`, `favicon.png`) so `app.json` needs **no changes** → lowest risk. Add `play-store-icon.png` separately (upload-only).
5. **Verify** the notification icon is white-on-transparent (most common mistake → white box).
6. Rebuild is required for native icon changes (handled in the separate EAS workstream — not now).

## Deliverable summary
- **Audit findings:** all 5 bundled assets are 1×1 placeholders → green square; Play Store 512² missing; brand-colour ambiguity (sage vs brass) must be resolved first.
- **Proposed changes:** none to code yet (audit phase); plan is to overwrite 5 files in place + add 512² Play icon.
- **Files modified:** none (this phase). Future: 5 PNGs in `assets/images/`, no `app.json` change.
- **Risk level:** 🟢 **Low** (audit only). Execution risk later is Low — in-place asset swap, no config/logic change.
