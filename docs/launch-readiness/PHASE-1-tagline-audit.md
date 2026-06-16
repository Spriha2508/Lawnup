# Phase 1 — Tagline / Messaging Reconciliation Audit

> **Audit only — nothing has been changed.** Branding system stays frozen. Approve the recommendations before any edits.

## Approved messaging structure
- **Brand Tagline (signature slogan):** `Don't Let It Die!` — used on the logo, feature graphic, splash brand moment, and the first marketing surface.
- **In-App Welcome Messaging (warm welcome headline):** `Grow Something Beautiful` — used on the welcome/landing surfaces that greet the user.

## Every copy location found (grep across `src/` + `app.json`)

| # | Screen / Surface | File:line | Current text | Recommended | Reason |
|---|---|---|---|---|---|
| 1 | **Splash — primary** (brand moment) | `AnimatedSplash.tsx:452` | `GROW SOMETHING BEAUTIFUL` | **`DON'T LET IT DIE!`** | The splash plays on every launch and is the brand signature → it should carry the **Brand Tagline**, matching the logo + feature graphic. Keep the existing all-caps, letter-spaced *treatment*; only the words change. |
| 2 | Splash — code doc comment | `AnimatedSplash.tsx:14` | `…"Grow something beautiful."` | Update comment to `Don't Let It Die!` | Keep code documentation accurate after #1. |
| 3 | **Splash — fallback** | `AnimatedSplashFallback.tsx:90` | `YOUR AI PLANT COMPANION` | **`DON'T LET IT DIE!`** | The fallback splash must match the primary splash line; this legacy positioning line is inconsistent with the brand tagline. |
| 4 | **Landing — eyebrow** | `LandingScreen.tsx:43` | `YOUR AI PLANT COMPANION` | **`DON'T LET IT DIE!`** | Surface the Brand Tagline on the first screen a new user sees. The generic "companion" line is redundant with the subtitle (#6). |
| 5 | **Landing — headline** | `LandingScreen.tsx:47` | `Grow something\nbeautiful.` | **`Grow Something Beautiful`** | This is the **In-App Welcome** message — keep it, but align to the approved Title Case and drop the trailing period for consistency. |
| 6 | Landing — subtitle | `LandingScreen.tsx:51` | `Identify, diagnose and care for every plant…` | **Keep** | Descriptive value copy, not a tagline; no conflict. |
| 7 | **Onboarding Welcome — headline** | `WelcomeScreen.tsx:38,57` | `WELCOME{, NAME}` + `An intelligent companion…` | Lead with **`Grow Something Beautiful`**; keep `Welcome, {name}` as the eyebrow and the companion line as the subtitle | This is *the* in-app welcome surface → align the headline with the approved In-App Welcome message. |
| 8 | Onboarding Welcome — CTA | `WelcomeScreen.tsx:64` | `Begin your garden` | **Keep** | Action label, not a tagline. |
| 9 | Onboarding final — CTA | `GoalScreen.tsx:57` | `Enter LawnUp` | **Keep** | Action label (regression-guarded for casing). |
| 10 | Paywall — hero | `PaywallScreen.tsx:118` | `Never lose a plant to a guess.` | **Keep** | Purpose-specific *conversion* headline; thematically consistent with "Don't Let It Die!"; it is not the brand tagline and shouldn't be replaced. |
| 11 | Doc. Sage — empty state | `ChatScreen.tsx:190–195` | `🌿 PLANT EXPERT` / `Meet Doc. Sage` / `I'm Doc. Sage, your plant expert…` | **Keep** | Feature-intro copy, not a brand tagline. |
| 12 | Doc. Sage — system prompt | `retrieval.ts:75` | `LawnUp's warm, expert plant companion…` | **Keep** | Internal LLM prompt; never shown as a tagline. |
| 13 | **App display name** | `app.json:3` | `LawnUp AI` | **Consider `LawnUp`** (decision) | The frozen brand is positioned as a *premium consumer lifestyle* brand, "not an AI utility". `LawnUp` matches the wordmark + feature graphic. ⚠️ Changing the launcher/store name is a decision with store-listing impact — flagged, not auto-recommended. |

## Notes
- **Casing:** the approved strings are Title Case — `Don't Let It Die!` and `Grow Something Beautiful`. Where copy uses an all-caps *style* (splash, landing eyebrow), the styling stays; the words are what must match.
- **No conflicts** beyond the above; paywall/Doc. Sage/feature copy is purpose-specific and correctly distinct from the brand tagline.
- **Net change set (on approval):** 5 user-facing strings (#1, #3, #4, #5, #7) + 1 comment (#2), plus the optional app-name decision (#13). All are pure copy — no layout, logic, or asset changes.

**Awaiting approval of this mapping before any edits are made.**
