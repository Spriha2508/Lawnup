# LawnUp — Branding & App Icon Audit

> Audit + recommendations only. **No artwork generated** (per instruction). Approval required before producing assets. ₹0 task.

---

# PHASE 1 — Current Asset Audit

### Verified file state (`assets/images/`)

| # | Asset | File (declared in `app.json`) | Dimensions | Bytes | Format | Status |
|---|---|---|---|---|---|---|
| 1 | App Icon (iOS/base) | `icon.png` (`app.json:7`) | **1×1** | **70 B** | PNG | ❌ placeholder |
| 2 | Android Adaptive — foreground | `adaptive-icon.png` (`:28`) | **1×1** | **70 B** | PNG | ❌ placeholder |
| 2b | Android Adaptive — background | colour `#0A0D0B` (`:29`) | n/a | — | solid colour | ⚠️ dark fill only |
| 3 | Splash Icon | `splash.png` (`:12`) | **1×1** | **70 B** | PNG | ❌ placeholder |
| 4 | Notification Icon | `notification-icon.png` (`:56`) | **1×1** | **70 B** | PNG | ❌ placeholder |
| 5 | Play Store Icon (512²) | — not in repo — | — | — | — | ❌ missing |
| 6 | Feature Graphic (1024×500) | — not in repo — | — | — | — | ❌ missing |
| 7 | Splash Animation branding | `AnimatedSplash.tsx` | vector (code) | — | SVG/Reanimated | ✅ **built & polished** |

### Current dimensions & export formats
- All five raster assets are **1×1-pixel, 70-byte PNGs** — empty placeholders, not real art.
- Web `favicon.png` is also 1×1.
- No `@2x/@3x` or density variants exist; Expo would normally generate Android densities from a real source, but the source is empty.
- No 512² Play icon, no 1024×500 feature graphic.

### Current Android adaptive-icon configuration (`app.json`)
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/images/adaptive-icon.png",   // 1×1 empty
  "backgroundColor": "#0A0D0B"                              // near-black dark green
}
```
- Notification plugin: `icon: notification-icon.png` (1×1), `color: "#C8A24E"` (gold tint).
- Splash: `image: splash.png` (1×1), `resizeMode: "contain"`, `backgroundColor: "#0A0D0B"`.

### ⛳ Why the launcher icon appears as a green square
Android builds the adaptive icon by compositing **foreground over background**, then applies the launcher's mask (circle/squircle/rounded-square).
1. The **foreground** (`adaptive-icon.png`) is a 1×1 effectively-empty image → it contributes **no visible art**.
2. The **background** is the solid colour **`#0A0D0B`** — a very dark, slightly-green near-black.
3. Result: the mask is filled with the flat dark-green background and nothing else → a **dark green rounded square**.
4. On launchers/older devices that fall back to the legacy `icon.png` (also 1×1), the same empty-image problem yields a solid fill.

**It is not a rendering bug — there is simply no icon art, so only the dark background colour shows.** Fixing it requires (a) real foreground art and (b) changing the background off the dark `#0A0D0B` to a light Botanical-Daylight tone.

### Note on the splash (the one good asset)
`AnimatedSplash.tsx` is a real, polished "Scan to Bloom" sequence: opens on `VOID #0A0D0B` → a plant identifies → **foliage thickens and soft blossoms open** (`ROSE #CE7E9A`, gold centre `#E0A93F`) → dawns to `IVORY` → **"LawnUp" + "Grow something beautiful."** It already uses **cherry-blossom accents** and the warm dawn — but it depicts a **generic canopy, not a bonsai**. The static `splash.png` is only the first-frame fallback (empty).

---

# PHASE 2 — Branding Recommendation

Approved identity: **Bonsai tree · cherry-blossom accents · Botanical Daylight · premium lifestyle · India-first · nature + technology.**

Shared palette (from `designSystem.ts` / splash): ivory `#F6F1EA`, sage `#5E7F61`/`#46603F`, brass-gold `#C8A24E`, blossom-rose `#CE7E9A`, gold-centre `#E0A93F`, warm charcoal `#2A2E27`.

## Option A — Minimal Bonsai
**Description:** A single, confident **bonsai silhouette** (trunk + rounded canopy in sage) centred on a warm ivory/cream background. No blossom, no detail noise. Calm, editorial, Headspace/Calm-grade simplicity.
- **Strengths:** Timeless; flawless legibility down to 48 px; reads instantly as "plant/care"; effortless to render monochrome (notification icon = same silhouette).
- **Weaknesses:** A bonsai-as-silhouette can read as a generic "tree"; least distinctive in a grid of green plant apps; no India-specific or "technology" cue; can feel plain without an accent.
- **App Store suitability:** High — minimal icons photograph cleanly in listings and feel premium.
- **Android launcher suitability:** Excellent — one bold shape survives masking and tiny sizes perfectly.

## Option B — Bonsai + Blossom  ⭐ recommended
**Description:** The bonsai silhouette in sage, with **2–3 cherry-blossom accents** (rose `#CE7E9A` petals + gold `#E0A93F` centre) on the canopy, over a soft **ivory → pale-sage** background. Directly echoes the existing splash bloom and "Grow something beautiful."
- **Strengths:** Distinctive **and** premium; the pink-gold blossom **pops against sage/ivory** → strong memorability and high contrast (the exact opposite of the current low-contrast square); bonsai + blossom = craft + nature, a natural **India-first / nature+technology** story; perfectly consistent with the splash animation already shipped.
- **Weaknesses:** More detail to control — blossoms must be simplified to a few bold dots (not fine petals) so they hold at 48 px; risks looking "cute" if over-styled; demands disciplined execution and a small-size proof.
- **App Store suitability:** Very high — the warm accent makes it stand out in a sea of flat-green plant icons.
- **Android launcher suitability:** High — works well if blossoms are kept to a few bold accents inside the safe zone; **must be verified at small size**.

## Option C — Abstract Premium Botanical
**Description:** An **abstract brand mark** rather than a literal tree — e.g. a bonsai canopy implied through negative space inside a soft squircle, resolving to a single blossom/leaf-bud dot. Notion/Linear-style geometric restraint.
- **Strengths:** Most "tech + premium" and ownable; scales and masks beautifully; trivial monochrome version; differentiates hardest from plant clipart.
- **Weaknesses:** Risks losing the warm, emotional, instantly-botanical read the brief asks for; abstract marks need brand equity to "mean" plant care; can drift into generic-startup-logo territory.
- **App Store suitability:** High for perceived tech polish; lower for instant "this app is about plants."
- **Android launcher suitability:** Excellent — abstract marks shrink and mask without loss.

### Recommended direction → **Option B (Bonsai + Blossom)**, with Option A as the small-size/monochrome fallback
Option B is the only direction that satisfies **all** of the approved identity points and reuses equity you've already built (the splash's dawn-to-bloom). Execution rule: design B at 1024², then **simplify to A (bonsai-only)** for the notification icon and verify the blossoms still read at 48 px — if not, reduce to a single accent.

---

# PHASE 3 — Icon System (exact specifications)

> Brand background = **light ivory** (Botanical Daylight). This is the fix for the green square — the adaptive background must change from `#0A0D0B`.

### 1. Main App Icon (iOS + base)
- **1024×1024**, PNG, sRGB, **fully opaque — NO alpha/transparency** (iOS rejects transparency).
- Full-bleed background: ivory `#F6F1EA` (flat, or a subtle ivory→pale-sage radial).
- Bonsai+blossom centred; **no rounded corners** baked in (OS applies the mask).
- Keep the mark within ~80% of the canvas (visual breathing room).

### 2. Android Adaptive Icon
**Foreground layer**
- **1024×1024**, transparent PNG (vector source preferred).
- All meaningful art inside the **centred 66% "safe zone" (~672×672)**; the outer ~16% on every side **will be cropped** by masks — keep it empty padding.
- Bonsai + blossom; no background baked into this layer.

**Background layer**
- Either a **solid colour** `#F6F1EA` (ivory) **or** a 1024×1024 image (subtle ivory→pale-sage radial). **Change `app.json` `adaptiveIcon.backgroundColor` from `#0A0D0B` → `#F6F1EA`.**
- Must look correct under circle, squircle, rounded-square and full-square masks.

### 3. Notification Icon
- **Bonsai silhouette only — no blossom, no colour.** Pure **white on transparent** (Android renders it as a flat alpha mask and tints it; tint already `#C8A24E`).
- Sizes: 24 (mdpi), 36 (hdpi), 48 (xhdpi), 72 (xxhdpi), **96 (xxxhdpi)** px. Provide the 96² master; Expo/EAS generates densities.
- Any colour or fine detail will render as a white blob — keep it a clean solid silhouette.

### 4. Splash Icon
- The **bonsai+blossom mark**, transparent PNG, ~**1024–2048 px** square, centred on the splash `backgroundColor` (`resizeMode: contain`).
- **Decision needed:** the live `AnimatedSplash` intentionally opens dark (`#0A0D0B`) and dawns to ivory. Keep the static `splash.png` background **dark to match the animation's first frame**, *or* switch to ivory for a fully-light brand. Recommend: **keep dark first-frame** (the animation is the real experience; the static is a sub-second fallback). Document whichever is chosen.

### 5. Play Store Icon
- **512×512**, 32-bit PNG, ≤1 MB. Same art as the main app icon (full-bleed; Play applies its own rounded mask). Upload-only (not bundled).

### (Bonus) Feature Graphic — see Phase 4
- **1024×500**, PNG/JPEG, no alpha.

---

# PHASE 4 — Store Branding

**Target perceived quality:** Headspace (bold simple mark, warm ground) · Calm (serene gradient) · Planta (clean botanical icon) · Notion (disciplined minimal mark).

### Final app name styling
- Wordmark **"LawnUp"** (capital L, capital U — the casing the QA checklist guards). **Not** all-caps.
- Typeface: the in-app **Plus Jakarta Sans** (SemiBold/Bold) for brand consistency; warm charcoal `#2A2E27` on ivory.
- Tagline lockup: **"Grow something beautiful."** Optional single blossom accent above/beside the wordmark — used sparingly, never on the launcher icon.

### Icon treatment
- Light **ivory background**, **sage bonsai**, **one rose-gold blossom accent**; high contrast; identical art across every size (icon ↔ Play 512 ↔ feature graphic).

### Store screenshot visual direction (6 phone shots)
- 1080×1920, real app screens in a clean device frame, on a soft ivory/botanical background, each with **one bold benefit headline** in Jakarta. Calm/Planta-grade restraint — generous whitespace, warm palette, no clutter. (Sequence per `PHASE-B-play-store-listing.md`: Scan result → Dr. Banyan → Diagnosis → Home/weather → My Garden → Soil/Light.)

### Feature graphic direction (1024×500)
- Ivory ground; **wordmark + tagline on the left**, **bonsai+blossom hero on the right**; sage/rose/gold palette; minimal text; no screenshots-in-graphic.

### Explicitly avoid (from brief)
- ❌ Green/dark square backgrounds (← the current bug; switch adaptive bg to ivory).
- ❌ Generic leaf clipart (use a crafted bonsai mark).
- ❌ Cartoon gardening icons.
- ❌ Low-contrast icons (ensure sage + rose-gold read strongly on ivory).

---

# DELIVERABLES SUMMARY

### 1. Branding audit
All 5 bundled icon assets are **1×1, 70-byte placeholders**; Play 512² and feature graphic **missing**; adaptive **background is dark `#0A0D0B`** → the launcher shows a **dark-green square** (no foreground art + dark fill). The only real, on-brand asset is the **AnimatedSplash** (already blooms blossoms over a dawn — but shows a generic canopy, not a bonsai).

### 2. Recommended direction
**Option B — Bonsai + Blossom** (sage bonsai + rose-gold cherry-blossom accents on ivory), with **Option A (bonsai-only)** as the simplified monochrome/small-size fallback. Aligns with the full approved identity and the existing splash equity; delivers the high contrast the brief demands.

### 3. Icon architecture
```
Master vector (bonsai + blossom, sage/rose/gold)
├─ App icon 1024²            opaque, ivory bg            → assets/images/icon.png
├─ Adaptive foreground 1024² transparent, 66% safe zone → assets/images/adaptive-icon.png
├─ Adaptive background        ivory #F6F1EA (colour/img) → app.json backgroundColor
├─ Notification 96²           white silhouette / transp  → assets/images/notification-icon.png
├─ Splash mark ~2048²         transparent (dark frame)   → assets/images/splash.png
├─ Favicon 48²                                           → assets/images/favicon.png
├─ Play Store icon 512²       opaque (upload only)
└─ Feature graphic 1024×500   (upload only)
```

### 4. Asset checklist
- [ ] Lock **Option A/B/C** (recommend B) + confirm ivory vs sage launcher background.
- [ ] Master vector of the bonsai+blossom mark.
- [ ] App icon 1024² (opaque).
- [ ] Adaptive foreground 1024² (transparent, safe-zone art).
- [ ] Adaptive background → ivory (update `app.json:29`).
- [ ] Notification icon 96² (white-on-transparent, bonsai-only).
- [ ] Splash mark (transparent) + decide splash bg (dark vs ivory).
- [ ] Favicon 48².
- [ ] Play Store icon 512².
- [ ] Feature graphic 1024×500.
- [ ] Small-size proof at 48 px (launcher) before sign-off.
- [ ] Rebuild dev/native client (icons are native — needs a rebuild; that's the EAS workstream).

### 5. Files that must be replaced
| File | Action | Config change |
|---|---|---|
| `assets/images/icon.png` | replace 1×1 → 1024² opaque | none |
| `assets/images/adaptive-icon.png` | replace 1×1 → 1024² foreground | none |
| `assets/images/splash.png` | replace 1×1 → centred mark | optional bg decision |
| `assets/images/notification-icon.png` | replace 1×1 → 96² white silhouette | none |
| `assets/images/favicon.png` | replace 1×1 → 48² | none |
| `app.json:29` (`adaptiveIcon.backgroundColor`) | **`#0A0D0B` → `#F6F1EA`** (kills the green square) | **yes** |
| *(new)* Play Store icon 512² | add (upload-only) | n/a |
| *(new)* feature graphic 1024×500 | add (upload-only) | n/a |

> Overwriting the five PNGs **in place** keeps all other `app.json` paths unchanged — only the one `backgroundColor` line changes. Lowest-risk path.

---

# DECISION LOCKED (approved)
- **Direction: Option A — Minimal Bonsai** (sage bonsai silhouette on ivory; no blossom on the icon). Blossom equity stays in the animated splash.
- **Static splash background: keep dark first-frame** (`splash.png` stays on `#0A0D0B`, matching the `AnimatedSplash` opening; do **not** change the splash backgroundColor).
- **Launcher/icon background: ivory `#F6F1EA`** (the green-square fix) — applied to `adaptiveIcon.backgroundColor` **only when the real foreground art lands** (changing it alone would just turn the green square into a blank ivory square).

## Option A — production spec (for a designer or image tool)
**Concept:** one confident, slightly-asymmetric **bonsai**: a short curved trunk rising from a low oval pot/base, with 2–3 rounded sage canopy "clouds." Flat, single-weight, no gradients on the mark, no outline noise. Calm and editorial (Calm/Headspace register).

- **Palette:** canopy + trunk **sage `#5E7F61`** (optionally trunk a hair darker `#46603F`); background **ivory `#F6F1EA`**; pot may be sage or warm charcoal `#2A2E27`. No blossom on the icon (reserved for splash/wordmark).
- **Composition:** mark occupies ~70–78% of the canvas, optically centred (bonsai canopy is top-heavy — nudge it slightly down). Even ivory negative space all round.
- **Contrast:** sage-on-ivory must clear a comfortable contrast ratio; if it looks faint at 48 px, deepen the canopy toward `#46603F`.
- **Monochrome rule (notification):** the *same* bonsai as a solid **white silhouette** — must read with zero internal detail; simplify canopy to 2 clouds if needed.

### Exact outputs to produce
| Output | Size | Bg | Notes |
|---|---|---|---|
| `icon.png` | 1024² | ivory, opaque | no alpha, no baked corners |
| `adaptive-icon.png` (foreground) | 1024² | transparent | art inside centred 672² safe zone |
| adaptive **background** | colour | `#F6F1EA` | set in `app.json:29` with the art |
| `notification-icon.png` | 96² (+ densities) | transparent | white silhouette only |
| `splash.png` | ~2048² | transparent on dark | bonsai mark, dark `#0A0D0B` frame |
| `favicon.png` | 48² | ivory | — |
| Play Store icon | 512² | ivory, opaque | upload-only |
| Feature graphic | 1024×500 | ivory | wordmark left + bonsai right |

## ⚠️ Production capability note
This environment has **no SVG rasterizer** (`rsvg-convert`/`resvg`/ImageMagick/`inkscape`/`sharp` all absent; only `sips`, which resizes existing PNGs). It therefore **cannot generate launch-quality raster icon art by code**, and a code-drawn bonsai would not meet the Headspace/Calm/Planta quality bar this brief sets. Recommended production routes (any is ₹0–low cost):
1. **Designer** executes the spec above (best quality) → drops the 5 PNGs into `assets/images/` + the 512²/feature-graphic for upload.
2. **AI icon generator** (e.g. a vector/icon tool) run by you from the spec/prompt, then exported to the sizes.
3. **First-pass vector**: I can hand-author an Option-A **SVG** (editable source) for a designer to refine — but I can't visually verify it here, so treat it as a starting point, not a final.

Once real PNGs exist, the only code change is `app.json:29` `backgroundColor "#0A0D0B" → "#F6F1EA"`, then a native rebuild (EAS workstream).
