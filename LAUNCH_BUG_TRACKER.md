# 🌿 LawnUp — Launch Bug Tracker

> **Single source of truth** for all bugs, launch blockers, QA findings, regressions, and release readiness.
> See also: `QA_AUDIT_REPORT.md` (code audit), `DEVICE_QA_CHECKLIST.md` (manual test cases), `PLAY_STORE_SETUP.md` (payments setup).

---

## 1. Project Information

| Field | Value |
|---|---|
| **App Version** | 1.0.0 |
| **Branch** | `redesign/phase1-design-system-auth` |
| **Current Commit** | `d94499c` (QA Round 2 — LB-029…LB-046 all Implemented; last code commit LB-046, see §4.2) |
| **Owner** | Spriha Choudhary |
| **Last Updated** | 2026-06-18 — **QA Round 2 implementation COMPLETE (18/18 🟡 Implemented); codebase frozen for Device Regression QA** (see §4.2.1) |
| **Release Target** | TBD — internal testing first; Play Store launch gated on `PLAY_STORE_SETUP.md` |

---

## 2. Severity Definitions

| Badge | Level | Meaning |
|---|---|---|
| 🔴 | **P0** | App crash, data loss, login failure, payment failure, scan unusable |
| 🟠 | **P1** | Core functionality broken |
| 🟡 | **P2** | UX issue, inconsistency, performance issue |
| 🟢 | **P3** | Cosmetic or enhancement |

---

## 3. Bug Status

| Badge | Status | Meaning |
|---|---|---|
| 🔵 | **Open** | Logged, not yet started |
| 🟡 | **Implemented** | Code changes completed & committed — **NOT** yet verified on a real device |
| 🟢 | **Verified** | Confirmed working on a physical Android device **after regression testing** |
| ⚪ | **Won't Fix** | Intentionally not addressed (with reason) |
| 🔴 | **Pending** | Logged from a QA round, fix not yet started (intake status — equivalent to 🔵 Open; used for the Round 2 batch in §4.2) |

> **Status policy:** Never mark an issue 🟢 **Verified** unless it has been tested
> on a real Android device in a regression pass. Code-complete work stays
> 🟡 **Implemented** until then.

---

## 4. Launch Bug Table

> Pre-populated from Git history + `QA_AUDIT_REPORT.md`. Severity reflects documented impact. "🟡 Implemented" means the fix is committed but **not yet verified on a real device** — promote to 🟢 Verified only after a device regression pass (see Maintenance Rule #3).

| Bug ID | Sev | Status | Screen | Platform | Device | Steps to Reproduce | Expected Result | Actual Result | Root Cause | Fixed In Commit | Verified By | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LB-001 | 🔴 P0 | 🟡 Implemented | Onboarding (final step) | Both | Any (flaky/offline) | Complete onboarding → tap final CTA while offline or on a rejected write | Enters the app immediately | Button stuck on "Setting up your garden…"; user locked out, bounced back to onboarding every relaunch | Final `updateDoc` was awaited to gate entry with no try/catch; offline promise stayed pending | `57c33a6` | — | QA C1. Now enters on local state; write runs in background (offline-queued) |
| LB-002 | 🔴 P0 | 🟡 Implemented | App boot / Splash | Both | Non–dev-build clients | Launch app without Skia native module present | App boots to splash | App failed to boot (Skia dependency) | Skia imported unconditionally | `2cfbbbf` | — | Skia made optional via `skiaSafe`; fallback splash |
| LB-003 | 🔴 P0 | 🟡 Implemented | Paywall / Settings | Android | Any | Set a `test_…` placeholder RevenueCat key, tap "Start Premium" | Upgrade works or paywall shows "coming soon" | Upgrade silently failed (`package_not_found`); DEV mock path bypassed; dead "Manage subscription" row | Invalid `test_` key flipped `PAYMENTS_READY=true` with no real offerings | `eededbb` | — | Removed key (→ `PAYMENTS_READY=false`); added `TODO(play-store)`; see `PLAY_STORE_SETUP.md` |
| LB-004 | 🟠 P1 | 🟡 Implemented | Paywall (release) | Both | Any | Release build → open Paywall → tap "Start Premium" | CTA reflects real state | CTA did nothing in release (only worked in `__DEV__`) — looked broken | Upgrade handler gated entirely behind `__DEV__` | `1e46d6f` | — | QA H1. Release CTA now disabled, reads "Premium — coming soon"; DEV keeps mock |
| LB-005 | 🟠 P1 | 🟡 Implemented | Paywall (plan picker) | Both | Any | Open Paywall → view Annual plan | Annual = ₹1990 / SAVE 17% / ₹166-mo (matches PRD) | Annual price mismatched PRD/Paywall | Stale pricing constants | `68e889f` | — | Reconciled to ₹1990 · SAVE 17% · ₹166/mo |
| LB-006 | 🟠 P1 | 🟡 Implemented | Paywall / Home / UpgradePrompt | Both | Any | Read premium comparison table & hero copy | Only true premium differences claimed | Advertised premium-only perks that free users already get (disease detection, reminders, weather) | Copy not aligned with actual gating | `7df338e` | — | Honest messaging: premium differs only on scan + chat quotas; no new gates added |
| LB-007 | 🟡 P2 | 🟡 Implemented | Splash | Both | Short / small-height devices | Watch splash "IDENTIFIED" HUD | HUD sits above the foliage | HUD overlapped the canopy on short screens | HUD not anchored relative to foliage | `68e889f` | — | Anchored "IDENTIFIED" HUD above foliage |
| LB-008 | 🟡 P2 | 🟡 Implemented | Home | Both | Any | Open Home with plants saved | One clear way to scan | Duplicate scan entry points (Featured Scan card + Scan quick-action + FAB) | Redundant CTAs accumulated | `68e889f` | — | Collapsed to the single center Scan tab |
| LB-009 | 🟡 P2 | 🟡 Implemented | Scan flow | Both | Any | Tap Scan tab | Goes straight to Camera | Extra ScanLanding interstitial before camera | Unnecessary interstitial screen | `1aa3835` | — | ScanLandingScreen deleted; Camera is the stack entry; back/retry routes fixed |
| LB-010 | 🟡 P2 | 🟡 Implemented | Scan Result → Soil | Both | Any | Identify a plant; want soil advice without saving | Soil advice available right after ID | Soil recommendation required saving the plant first | SoilAdvisor only read first saved plant | `68e889f` | — | Added Soil & potting CTA on result CARE tab; SoilAdvisor honours passed speciesName |
| LB-011 | 🟡 P2 | 🟡 Implemented | Onboarding / City | Both | Any | Select a city during onboarding → view it later | City persists & displays | City showed "Not set" | `authStore.user.city` not synced at selection | `68e889f` | — | City synced into authStore at selection |
| LB-012 | 🟡 P2 | 🟡 Implemented | Settings → Notifications | Both | Any | Open notification settings | Per-category prefs persist & reflect OS permission | Toggles non-persistent / fake working settings | No persisted prefs; no OS-permission gating | `68e889f`, `1aa3835` | — | Persisted per-category prefs (water/fertilizer/care/updates/marketing); non-delivering ones marked "Soon" |
| LB-013 | 🟡 P2 | 🟡 Implemented | Reminders / Notifications | Both | Any | Configure watering reminder; send a test | Watering pref gates delivery; test fires | No master gate; no way to test delivery | Watering pref not wired into scheduler | `68e889f`, `1aa3835` | — | Watering pref is the real master gate; "send a test" added |
| LB-014 | 🟡 P2 | 🟡 Implemented | Home dashboard | Both | Any (gardens < 3 plants) | Open Home with 1–2 plants | No redundant health widgets | 4-tier Plant Health grid shown redundantly with Garden Overview ring | Grid not gated by plant count | `1aa3835`, `faf1427` | — | Health grid hidden for gardens < 3 plants; dashboard rebuilt to approved 10 sections |
| LB-015 | 🟡 P2 | 🟡 Implemented | Doc. Sage chat | Both | Any | Send a chat message that fails (network/API) | Daily quota not charged on failure | A failed reply still consumed a free-tier message credit (20/day) | `incrementMessage()` called before `askBanyan()` | `bb29a13` | — | QA M1. Increment moved after successful reply |
| LB-016 | 🟡 P2 | 🟡 Implemented | Paywall (modal) | Both | Any | Open Paywall from a nested screen | Paywall overlays current tab | Jumped to Profile tab to show Paywall | Paywall not registered as root-level modal | `0da812e` | — | QA M3. Root-level Paywall modal + `openPaywall` helper |
| LB-017 | 🟡 P2 | 🟡 Implemented | Auth (Landing) | Both | Any | Tap "Continue with Google" (pre-OAuth) | No misleading control | Button routed to email signup (looked like Google login) | Fake Google button shipped before OAuth wired | `1aa3835`, `26c96f6` | — | Hidden behind flag, then real Google Sign-In scaffolded (impl still pending — see Blockers) |
| LB-018 | 🟡 P2 | 🟡 Implemented (partial) | Usage limits | Both | Any | Sign in (client-side mode) | No doomed usage round-trip | `checkUsageLimit()` called undeployed Function every sign-in; failed open | Server enforcement assumed but backend deferred | `a4b7032` | — | QA H2. Gated behind `BACKEND_ENABLED`. **Still open:** tamper-proof server enforcement needs backend (deferred) |
| LB-019 | 🟢 P3 | 🟡 Implemented | Tab nav / Home / AddPlant | Both | Any | View "My Plants" labels | Consistent "My Garden" naming | Mixed "Plants" / "My Plants" naming | Legacy naming | `910e947`, `68e889f` | — | Renamed to "My Garden" across nav, headers, CTAs |
| LB-020 | 🟢 P3 | 🟡 Implemented | Onboarding | Both | Any | Run onboarding | Short, focused flow | Extra steps ("What plants do you love?", "What's your goal?") | Over-long onboarding | `68e889f` | — | Removed PlantsType + Goal steps; SkillLevel is now final (2-step flow) |
| LB-021 | 🟢 P3 | 🟡 Implemented | Doc. Sage (all surfaces) | Both | Any | Read assistant name across the app | Consistent "🌿 Doc. Sage" mentor identity | Assistant was "Dr. Banyan"; clinical tone | Rebrand | `35c8b7b`, `e58cb79` | — | User-facing copy only; warmer mentor voice; internal identifiers unchanged |
| LB-022 | 🟢 P3 | 🟡 Implemented | Profile | Both | Any | Open Profile (first run / general) | Clean, no dead UI | First-run welcome card + dead styles; unclear garden-level | Leftover scaffold UI | `910e947`, `68e889f`, `17d366e` | — | Removed welcome card & dead styles; added garden-level explainer |
| LB-023 | 🟢 P3 | 🟡 Implemented | Auth (Login/Signup) | Both | Any | Submit malformed email | Inline validation blocks submit | No email-format validation | Missing validation | `1aa3835` | — | Email-format validation added to Login & Signup CTAs |
| LB-024 | 🟢 P3 | 🟡 Implemented | Help & Support | Both | Any | Read "how to scan" help copy | Matches current UI | Said "Tap the Scan tab (or the + button)" after FAB removed | Stale copy | `e58cb79` | — | Updated to "Tap the Scan tab in the bottom bar" |
| LB-025 | 🟡 P2 | 🔵 Open | App icon / launch screen | Android | Any | Cold launch | LawnUp launch screen, no Expo blue default | Blue launch screen (Expo default `colorPrimary`) | Default Android theme color | — | — | Fix applied in `colors.xml` / `styles.xml` / `app.json`; **requires native rebuild + device re-verify** (DEVICE_QA TC-1.2). Re-open until verified on device |
| LB-026 | 🟠 P1 | 🟡 Implemented | Auth (logout) | Android | Any | Sign in with Google → log out → tap "Continue with Google" again | Account picker re-appears; can switch accounts | Native Google session persisted; next sign-in silently reused the last account, no picker | `signOut` only cleared the Firebase session, not the native Google session | `8598ced` | — | Found during Phase 1 impl. `signOutGoogle()` now called in `authStore.signOut` + `deleteAccount`. **Verify on device** |
| LB-027 | 🟡 P2 | 🟡 Implemented | Auth (Google) | Android | Any | Trigger cancel / no-network / duplicate-email / no-Play-services during Google sign-in | Each shows a distinct, accurate message; cancel is silent | All failures collapsed into one generic "try again" alert; raw error codes leaked | `signInWithGooglePrompt` caught errors generically | `8598ced` | — | Found during Phase 1 impl. Mapped cancellation / in-progress / Play-services / network / `auth/account-exists-with-different-credential` to friendly messages. **Verify on device** |
| LB-028 | 🔴 P0 | 🟡 Implemented | Onboarding (vine) | Android | Any | Sign up → walk through onboarding screens, watch the left-edge JourneyVine | Vine grows proportionally; full height only on the last onboarding screen; leaves/flowers unfurl only on the grown portion | Vine jumped to full height with several screens remaining; all leaves/flowers appeared at once | `setVineForRoute` `else` branch fired for the transient `"Onboarding"` parent route (reported before the nested screen hydrates) + every deep route → grew to 1.0 and latched `bloomed` | `f6bb239` | — | Bloom now restricted to completion routes (`Main`/`Home`); unmapped routes leave the vine in place; onboarding steps remapped to grow evenly (Welcome .30 → Location .52 → PlaceType .74 → SkillLevel 1.0). **Verify on device** |
| LB-029 | 🔴 P0 | 🟡 Implemented (code) | Auth (Google) | Android | Any | Tap "Continue with Google" on a real device | Native account picker launches; sign-in completes | Tapping did nothing / failed silently | (a) boot config lived only in the **dead** `src/app/App.tsx`, never the real entry `App.tsx`; (b) the usual on-device cause — `DEVELOPER_ERROR` (code 10) from a missing/incorrect SHA-1/256 in Firebase — was mapped to a generic "try again" with no log | `3e1bc27` | — | `configureGoogleSignIn()` now called at boot in real `App.tsx`; `DEVELOPER_ERROR` mapped to a clear message + dev log of raw `{code,message}`. **⚠️ Still requires (BLK-1): env var inlined into a fresh native build, and SHA-1/256 of the build's signing key registered in Firebase. Code can't substitute for these — verify on device after rebuild.** |
| LB-030 | 🔴 P0 | 🟡 Implemented | My Garden (empty) | Both | Fresh account | Open My Garden tab with zero saved plants | Attractive empty state, not an empty garden UI | Empty state existed but copy/CTA didn't match the requested spec | Empty-state copy predated the spec | `cbb93c8` | — | Home (first-run hero) and My Garden already gate the standard garden UI behind `plants.length`. Aligned the My Garden empty state to spec: "Your garden is waiting 🌱" / "Scan your first plant to start growing your digital garden." / CTA **Scan Your First Plant** → Scan tab. **Verify on device** |
| LB-031 | 🔴 P0 | 🟡 Implemented | Paywall / all upgrade CTAs | Both | Internal/preview build | Open Paywall → tap "Start Premium" on a non-DEV internal build | A working upgrade flow | CTA was disabled ("Premium — coming soon") on every non-DEV build | All entry points (Home/Chat/Camera/Processing/ScanResult/PlantDetail/Profile → `openPaywall`) and the paywall (₹1990 annual / ₹199 monthly cards, comparison, restore) were intact; only the final CTA was gated behind `PAYMENTS_READY \|\| __DEV__`, so release/internal QA builds saw it disabled (deliberate LB-004 behaviour) | `c1b57d0` | — | Per owner decision: added `MOCK_PREMIUM_ENABLED` (= `!PAYMENTS_READY && APP_ENV !== 'production'`). CTA is now active on dev/preview/staging via the LOCAL mock so QA can test the full flow; **HARD-GATED off in production** (keeps "coming soon" until real RevenueCat). Real purchases still need BLK-4/5. **Verify on device (internal build)** |
| LB-032 | 🟠 P1 | 🟡 Implemented | Scan / Camera permission | Android | Any | Open Scan → decline camera once → tap "Allow Camera Access" again | A single decline re-prompts the OS; only permanent denial routes to Settings; granted launches camera | After the first decline the CTA jumped straight to a Settings alert even though the OS could still re-prompt | `handleAllowCamera` showed `openCameraSettings()` for **any** non-grant, ignoring `canAskAgain` | `e8f50e4` | — | CAMERA is correctly declared in `app.json` + `AndroidManifest.xml`. Now: granted → live camera; `!granted && canAskAgain` → stay on rationale (re-prompts on next tap); `!canAskAgain` → Settings. No dead-ends. **Verify on device** |
| LB-033 | 🟠 P1 | 🟡 Implemented | Scan / Camera state | Both | Any | Take photo → Analyse → Back | Back returns to a fresh live camera preview | Previously captured image still showed; CameraScreen kept `capturedUri` while it sat below Processing in the stack | Local capture state was never cleared on re-focus | `e8f50e4` | — | Added a `navigation` `focus` listener that clears `capturedUri`, quality state, capture lock, and the scan store on every focus → Back **and** a new Scan always land on the live preview. Retake already reset locally. **Verify on device** |
| LB-034 | 🟠 P1 | 🟡 Implemented | Scan / Camera (recognition) | Both | Any | Photograph a whole plant / medium / potted shot | Good identification, or clear guidance toward a better shot | Whole-plant shots often failed; only close-up leaves analysed reliably; no pre-capture steer | Plant.id is most accurate on a clear, well-lit subject; the camera didn't lead with that, so users framed poorly and got silent low-confidence results | `0be7845` | — | Recognition itself is Plant.id's model (can't change). Added a **persistent best-results hint** ("capture one healthy leaf clearly in good lighting") + best-practice-led rotating tips. Result screen already guides re-capture on low confidence (confidence note, rescan tips, "try a closer photo"). **Verify on device** |
| LB-035 | 🟠 P1 | 🟡 Implemented | Splash (branding) | Android | Multiple sizes | Watch the splash → wordmark + tagline resolve | "LawnUp" + "DON'T LET IT DIE!" clear the plant and stay aligned on all screen sizes | Reported overlap of branding text/logo during splash | Wordmark (`H*0.66`) and tagline (`H*0.72`) used **independent** fractional-H positions → crowd together / risk overlap on short devices | `372caf8` | — | ⚠️ Could NOT reproduce on the captured QA device (1440×3120 — geometry clears comfortably). Made it robust regardless: brand lockup now anchored RELATIVE to the plant — `WORD_TOP = max(0.62H, POT_BOT+72)`, `TAG_TOP = WORD_TOP+62` (fixed gap). Splash duration unchanged (`TOTAL=3700`). **Re-verify on a short Android device** |
| LB-036 | 🟡 P2 | 🟡 Implemented | Scan / Processing | Both | Any | Tap Analyse → watch the loading screen | Progressive analysis states make the AI feel responsive | Loading cycled only 3 looping messages — felt static | Messages looped via modulo; no forward progression | `de775f6` | — | 5 forward-advancing states: Identifying plant… → Detecting disease… → Checking plant health… → Preparing treatment… → Finalising recommendations… Steps every ~1.05s, holds on the last until the API resolves (no loop-back). Backend unchanged. **Verify on device** |
| LB-037 | 🟡 P2 | 🟡 Implemented | Scan Result (hero) | Both | Any | View a scan result hero | Diagnosis reads: name → health badge → confidence → description | Health badge floated top-left, disconnected from the name; confidence was a tiny pill on the scientific row | No deliberate diagnosis hierarchy in the hero | `601e2ac` | — | Hero overlay restructured: **1** plant name → **2** Healthy/Needs-attention badge → **3** "{n}% confidence" pill (grouped on one diagnosis row under the name) → **4** supporting English/scientific names. Conversational description follows in AICompanionSummary. **Verify on device** |
| LB-038 | 🟡 P2 | 🟡 Implemented | Scan Result (CARE tab) | Both | Any | Read the "Your next steps" care list | Each step has a relevant icon | Steps were plain numbered rows — text-heavy | No category icons | `601e2ac` | — | `SuggestedActionCard` now infers a care-category icon from the action text: 💧 Water · ☀️ Sunlight · 🌱 Soil · 🪴 Fertilizer · 🌡 Temperature (🌿 fallback). Layout/design language unchanged. **Verify on device** |
| LB-039 | 🟡 P2 | 🟡 Implemented | Scan Result (INFO tab) | Both | Any | Open INFO tab → Identification details | Confidence is explained, not just a bare % | Showed only "84%" with no meaning | No explanation copy | `601e2ac` | — | Added under the Confidence row: "AI confidence is based on image clarity and the visible characteristics of the plant — a clearer, closer photo usually raises it." Hero pill now also reads "{n}% confidence". **Verify on device** |
| LB-040 | 🟡 P2 | 🟡 Implemented | Home (weather card) | Both | Any | Scroll Home to the Weather + AQI card | Weather card feels part of the dashboard | Felt visually disconnected | It was the ONLY dashboard section with its eyebrow INSIDE the card and no `SectionHeader` above it — every sibling section has one | `61198a0` | — | Gave it a `SectionHeader` ("WEATHER & CARE · {city}") like its siblings; removed the redundant in-card eyebrow. Now matches the dashboard's section rhythm/typography. **Verify on device** |
| LB-041 | 🟡 P2 | 🟡 Implemented | Bottom navigation | Both | Any | Switch tabs | Selected tab is clearly obvious | Active state relied only on a colour swap + a tiny sprout | Weak active emphasis | `8a06ac9` | — | Added an animated primary highlight pill behind the active icon; lifted inactive icon/label tone 0.45→0.55 for visibility; active label stays bold primary. Design language unchanged. **Verify on device** |
| LB-042 | 🟡 P2 | 🟡 Implemented | Doc. Sage chat | Both | Any | Read a multi-point Doc. Sage reply | Easy to scan — paragraphs/bullets, comfortable spacing | Replies rendered as one flat text block | Assistant content shown via a single `<Text>` with no structure | `afb5f92` | — | Added a formatter for assistant messages: paragraph spacing, bullet rows (`- * •`), line-height 23, wider bubble (94%). Tone/wording untouched; user bubbles unchanged. **Verify on device** |
| LB-043 | 🟡 P2 | 🟡 Audited | App-wide (UI consistency) | Both | Any | Compare radii / typography / spacing / icons / shadows across screens | One consistent standard | Two conventions coexist | Newer screens use the central design system (`designSystem.ts` — radii/spacing/typography/shadows tokens); several **pre-existing** screens (Paywall, ScanResult, ProcessingScreen, PlantDetail, scan components, Button/Input) still use raw font strings (`'Nunito-*'`) and raw `borderRadius` numbers | — (audit, see §10) | — | **Standard = `designSystem.ts`.** All changes made THIS round use the tokens/convention of their file. Most legacy raw values (e.g. `borderRadius: 20`, `fontSize: 14`) do **not** map 1:1 to tokens — swapping them would shift pixels (= a redesign), which the round's rules forbid. So a blanket token migration is **deliberately deferred** to a design-signed-off pass (logged in §10). No risky sweeping refactor done. |

---

## 4.2 Launch Bug Table — QA Round 2 (2026-06-18)

> Logged from the owner's QA Round 2 device pass. **These IDs are an independent Round 2 batch** and are *not* the same rows as the same-numbered Round 1 entries in §4 (the owner re-used the LB-029+ range). Where a Round 2 issue is a re-open of a Round 1 fix that did not survive device QA, the related Round 1 row is named in **Notes**. Status starts at 🔴 Pending and moves to 🟡 Implemented (per round rules — never 🟢 Verified without a real-device regression pass). Root Cause entries marked *(to confirm)* are working hypotheses pending the investigation each fix requires.

| Bug ID | Priority | Screen | Issue | Root Cause | Proposed Fix | Status | Notes |
|---|---|---|---|---|---|---|---|
| LB-029 | 🔴 P0 | Auth (Google) | Google Sign-In still fails during onboarding | **CONFIRMED (full-flow trace): SHA-1 mismatch.** The app signs **both debug *and* release** with `android/app/debug.keystore` (SHA-1 `5E:8F:16:…F6:25`), but `google-services.json` registers the Android OAuth client against `certificate_hash 5fbc5bc4…` — a *different* key. Google's OAuth backend therefore returns `DEVELOPER_ERROR` (code 10). Verified the rest of the flow is **correct**: Web client ID matches `client_type:3`, `configureGoogleSignIn()` runs at boot in the real `App.tsx`, `applicationId`=`com.lawnup.app`=`package_name`, gms plugin applied, dependency present, JS flow sound. So it is a SHA issue — but only after ruling everything else out. | **Owner/Firebase action (cannot be done in-repo — server-side check):** register the `android/app/debug.keystore` SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` (+ SHA-256 `FA:C6:17:…3B:9C`) under Firebase → Project Settings → Android app (`com.lawnup.app`) → SHA fingerprints, **re-download `google-services.json`**, rebuild. If distributing via EAS, also register that keystore's SHA (`eas credentials -p android`). | 🟡 Implemented (code+docs) | Re-open of Round 1 LB-029; **BLK-1**. In-repo this round (`1f62c25`): actionable `DEVELOPER_ERROR` dev diagnostic in `googleSignIn.ts` + `docs/google-signin-setup.md` §3 now records the exact SHA to register and the mismatch. **Enablement + device verification are owner-side (Firebase console + rebuild).** |
| LB-030 | 🔴 P0 | Home / My Garden | Garden visuals render before the user has any plants | Home (`isNewUser`) and My Garden already gate garden UI behind `plants.length === 0`, and plants are cleared on sign-out (`RootNavigator`). The real gap: `plants` starts `[]` **before** the Firestore snapshot resolves, so the app couldn't tell "new user" from "not loaded yet" — a returning user could flash the first-run hero / empty state before their garden arrived. No hydration guard existed. | Added a `hydrated` flag to `plantsStore` (set on first snapshot; `beginSync()` resets it when re-subscribing in `RootNavigator`). Home shows `showFirstRun` only when `hydrated && !hasPlants`, the dashboard only when `hasPlants`, and a "Loading your garden…" state while unhydrated. My Garden shows a loader until hydrated, then the empty state (now reads "No plants yet — scan your first plant…"). No garden renders until the count is known and ≥1 plant exists. | 🟡 Implemented | Re-open of Round 1 LB-030. Screens were already gated; this kills the pre-hydration flash. Commit `b1d8b4b`. **Verify on device** (fresh account + returning account with plants). |
| LB-031 | 🔴 P0 | Paywall / Premium | Premium page lacks clear purchase actions | The Paywall already had both plan cards (₹1990 annual / ₹199 monthly, selectable), a CTA, and Restore. Gaps: the CTA ("Start Premium →") didn't read as a per-plan purchase action and there was no explicit "Continue"; and the disabled production state was a silent dead-end. **Latent (not fixed here):** `eas.json` sets `APP_ENV` but code reads `EXPO_PUBLIC_APP_ENV` — only `EXPO_PUBLIC_*` is inlined, so `MOCK_PREMIUM_ENABLED`'s production gate may not behave as intended in EAS builds (see Risks). | `PaywallScreen.tsx`: CTA is now plan-aware and labeled **"Continue · Annual ₹1990/yr"** / **"Continue · Monthly ₹199/mo"** for the selected plan; Restore unchanged; when the CTA is disabled (production pre-RevenueCat) it now shows an explainer Alert instead of being inert → **never a silent dead end**. No change to payment gating logic. | 🟡 Implemented | Re-open of Round 1 LB-031; real purchases still gated by BLK-4/5. **Follow-up:** reconcile `APP_ENV`↔`EXPO_PUBLIC_APP_ENV` (logged in Risks). Commit `c13eee6`. **Verify on internal build.** |
| LB-032 | 🔴 P0 | Scan / Camera (recognition) | Recognition only reliable for leaf close-ups; whole plants often fail | Whole-plant framing yields low-confidence/failed results; capture UX did not steer users to optimal framing strongly enough before upload (Plant.id model unchanged). The camera already had a persistent best-results hint + rotating tips + `analyzeImageQuality` blocking poor captures, but no upfront framing primer. | New `ScanGuidanceSheet` shown on the **first scan** (persisted `scan.guidanceSeen.v1`) and re-openable via a top-bar **"?"** button — a ✔/✖ framing primer (whole plant · leaf close-up · flower · good light vs blurry · dark · too far). Pre-upload validation (`analyzeImageQuality`) already blocks blurry/dark shots and guides retake. AI provider unchanged. | 🟡 Implemented | Related to Round 1 LB-034. Shares the fix with **LB-038**. Commit `ae03c38`. **Verify on device.** |
| LB-033 | 🔴 P0 | Scan / Camera permission | First-time permission redirects to Settings instead of OS dialog | `handleAllowCamera` was already spec-correct (granted→camera; soft-deny→stay; only `!canAskAgain`→Settings) and CAMERA is declared in `AndroidManifest.xml` + `app.json`. The "first tap → Settings" symptom occurs only when the OS reports the permission **permanently denied** (`isDenied`) — most likely residual device state from Round-1 testing — but nothing proactively surfaced the OS popup on a genuinely undetermined first run. | `CameraScreen.tsx`: auto-request the OS permission once on entry when `isUndetermined && canAskAgain`, so a fresh install shows **Android's permission dialog** directly. Settings reachable only on permanent denial. `useCameraPermission`: memoized `request` so the prompt effect doesn't re-fire each render. | 🟡 Implemented | Related to Round 1 LB-032. Verify on a **fresh install** (clear app data) — a device that permanently denied in Round 1 will still show the Settings screen by OS design. Commit `735a517`. |
| LB-034 | 🔴 P0 | Scan / Camera state | Previous captured image persists after Back → reopen Scan | Round 1 (`e8f50e4`) reset capture state on `focus` only. Re-tapping the **already-active** Scan tab fires no focus event, so a held `capturedUri` lingered and the preview (Retake/Analyse) reappeared; there was also no hardware-Back handling in preview mode. | `CameraScreen.tsx`: extracted `clearCaptureState`, reset on **both** `focus` and `blur` (clears on the way out → any re-entry is fresh), and added an Android `hardwareBackPress` handler active only in preview mode that drops the capture and returns to the live camera. | 🟡 Implemented | Related to Round 1 LB-033. **Verify on device** (tab re-tap + hardware Back). Commit `735a517`. |
| LB-035 | 🟠 P1 | Onboarding (vine) | Vine animation still reaches full growth too early | Round 1 (`f6bb239`) mapped the **last** onboarding screen (SkillLevel) to `1.0`, so the vine was fully grown a screen before the user finished — reading as "done too early." | `JourneyVine.tsx`: remapped to even steps reserving full height for the **completion bloom** (app entry): Signup 0.10 → Welcome 0.22 → Location 0.42 → PlaceType 0.64 → SkillLevel 0.86, then BLOOM_ROUTES complete it to 1.0. Top blossom now opens during the bloom, not on SkillLevel. Animation-timing only. | 🟡 Implemented | Re-open of Round 1 LB-028. Commit `d892c23`. **Verify on device** (walk all onboarding steps). |
| LB-036 | 🟠 P1 | Reminders / Notifications | Reminder notification reads like a developer test | The placeholder copy was only on the **test** reminder (`🌿 LawnUp reminder test`), fired from Settings → "Send a test reminder". Real watering reminders already used personalized `generateWateringMessage` bodies — but their **title** was just the bare nickname, so they also read flat. | `notificationScheduler.ts`: test reminder now uses `buildTestReminderCopy()` — personalized to the user's first plant + city (e.g. "🌿 Time to water Monstera" / "…tuned to today's weather"), with a polished fallback when no plant/city. Real watering reminders now use an action-led title `💧 Time to water {nickname}` + the existing weather-aware body. | 🟡 Implemented | Commit `69d786b`. **Verify on device** (Send a test reminder + a real due-water reminder). |
| LB-037 | 🟠 P1 | Notifications (icon) | Notification icon not polished / off-brand | The status-bar notification icon (white L+leaf silhouette — correct colour-wise) filled the canvas **edge-to-edge** (bbox 5–90 of 96px), violating Material notification-icon padding → looked cramped/blobby. No monochrome adaptive layer existed, so Android 13+ themed launcher icons fell back to a generic render. | Regenerated `notification-icon.png` + all density drawables (mdpi→xxxhdpi) with the brand mark re-padded to ~62% of the canvas, centred, white-on-transparent (derived from the high-res adaptive foreground). Added a **monochrome** adaptive layer (`adaptive-icon-monochrome.png`, white silhouette with safe-zone padding) and wired `android.adaptiveIcon.monochromeImage` in `app.json` for Android 13+ themed icons. | 🟡 Implemented | Notification drawables apply to the next build directly; the monochrome themed launcher icon needs a **native rebuild** (regenerated from `app.json`). Commit `b3f4f35`. **Verify on device** (status-bar icon + themed-icon launcher). |
| LB-038 | 🟠 P1 | Scan (pre-capture guidance) | Pre-scan guidance unclear | No clear do/don't visual checklist before scanning, hurting capture success. | New `ScanGuidanceSheet` shows a visual ✔/✖ checklist (✔ entire plant · ✔ leaf close-up · ✔ flower · ✔ good lighting · ✖ blurry · ✖ dark · ✖ too far) on first scan and via the camera "?" button. No AI change. | 🟡 Implemented | Same fix as **LB-032**. Commit `ae03c38`. **Verify on device.** |
| LB-039 | 🟠 P1 | Scan / Processing | Analysis screen feels static | The 5 forward states (Round 1 `de775f6`) didn't reflect the real pipeline or the USP — no weather/personalized step, and only a single static sub-line. | `ProcessingScreen.tsx`: remapped to the pipeline phases — Identifying your plant → Checking for disease → Assessing plant health → **Matching your local weather** → **Preparing personalized care** — each with a contextual sub-line that now cross-fades per step (no longer a fixed string). Still advances forward and holds on the last step until the API resolves (no fake delays). Reinforces USP (ties into LB-046). | 🟡 Implemented | Re-open of Round 1 LB-036. Commit `7dced11`. **Verify on device.** |
| LB-040 | 🟡 P2 | Bottom navigation | Active tab state not obvious enough | The Round 1 highlight pill (`rgba …0.16`, no border) read too faintly on the dark bar to register at a glance. | `MainTabNavigator.tsx`: added a primary **top-edge indicator bar** on the active tab (the clearest "you are here" cue) and strengthened the highlight pill (opacity 0.16→0.22 + a 1px primary border). Active icon/label already primary + bold; sprout retained. | 🟡 Implemented | Re-open of Round 1 LB-041. Commit `3fe4559`. **Verify on device.** |
| LB-041 | 🟡 P2 | App-wide (empty states) | Empty states inconsistent | The shared `EmptyState` existed but **no screen used it** — each rolled its own, so several (Tasks, ScanHistory) had no illustration and no CTA; Reminders had a CTA but no illustration. Tasks also stacked **two** empties when the garden was empty. | Rewrote shared `EmptyState.tsx` to the `designSystem.ts` token convention (washed icon badge + serif title + body + pill CTA, matching the My Garden gold standard) and adopted it everywhere: **Tasks** (leaf icon + "Add Your First Plant"; fixed the double-empty), **ScanHistory** (scan-frame icon + "Scan a Plant"), **Reminders** (bell icon added). Audited all empty screens — **Chat (Doc. Sage)** and **My Garden** already met the standard. | 🟡 Implemented | Code commit `eeab1d8`. Relates to LB-030 empty-garden state. **Verify on device.** |
| LB-042 | 🟡 P2 | Home (first-run) | New user doesn't immediately understand the app | First-run Home surfaced only the Scan hero + a "what one scan gives you" grid. Add Plant, Ask Doc. Sage, Weather and today's care all lived in the **populated dashboard** path (`showDashboard`) and so were hidden from a brand-new user. | `HomeScreen.tsx`: added an **"OR START WITH"** row on first-run (Add Plant · Ask Doc. Sage) and surfaced the **Weather & Care** card (location-based — useful before the first plant; its care recommendation covers "today's care" for a plantless user). Extracted the weather card into one shared `weatherCareSection` so first-run and dashboard render identically. New-user priority order: Scan (hero) → Add Plant / Ask Doc. Sage → Weather & today's care → scan value. | 🟡 Implemented | Code commit `1f02b61`. Supports LB-046. **Verify on device.** |
| LB-043 | 🟡 P2 | Home (weather card) | Weather card not contextual | The card already showed temp/humidity/AQI stats + a recommendation, but `getWeatherInsight` bodies didn't consistently lead with the temp + city in the requested "It's 34°C in Delhi today…" form. | `homeInsights.ts`: every insight body now leads with temp/condition + city, e.g. "It's 34° in Delhi today — water early morning and move balcony and tender plants out of the harsh afternoon sun." Stats row unchanged. Reinforces the USP. | 🟡 Implemented | Supports LB-046. Commit `5b4f3ac`. **Verify on device.** |
| LB-044 | 🟡 P2 | Paywall / Premium | Premium value proposition is generic | Hero copy was a single flat sentence. **Constraint:** Round 1 LB-006 forbids advertising as premium-only anything free users already get (disease checks, reminders, weather) — so the requested bullets (Weather-aware watering, Disease history) can't be gated. | `PaywallScreen.tsx`: sharper hero subtitle leading with the USP ("care personalized to your plant, your city and today's weather"); added an honest value strip listing **only** the two genuine premium differentiators (Unlimited Doc. Sage · many more scans/month) + an explicit "Every plan includes plant ID, disease checks, watering reminders and weather-aware care" line. Preserves LB-006 honesty. | 🟡 Implemented | Adapted the requested bullets to avoid false gating (LB-006). Commit `dcd2f3b`. **Verify on device.** |
| LB-045 | 🟡 P2 | Scan Result | No delight on successful identification | The result appeared with no moment of success feedback. | `ScanResultScreen.tsx`: added a lightweight auto-dismissing toast — "🎉 Plant identified" on a confident result load (≥0.60) and "🌿 {nickname} added to your garden" after saving. Spring-in / fade-out, ~2.2s, `pointerEvents="none"` (non-blocking). | 🟡 Implemented | Commit `f38bb74`. **Verify on device.** |
| LB-046 | 🟡 P2 | App-wide (USP) | Personalized-care positioning not surfaced consistently | The positioning ("Generic plant advice doesn't grow healthy plants. Personalized care does." / "Care that's tailored to your plant, your city and today's weather.") is not surfaced naturally across surfaces. | Audited every surface and filled the gaps with **varied** phrasing (no single sentence pasted everywhere): **Landing** body now leads with the USP + the "generic advice doesn't grow healthy plants" line; **Welcome** (onboarding) = "care that adapts to each plant, your city and today's weather"; **Reminders** subline = "tuned to each plant and today's weather in {city} — not a fixed schedule"; **Home first-run** scan hero = care plan "made for your plant and your local conditions" (varied to avoid echoing the weather card right below it). Already covered, left as-is: weather cards (LB-043), Premium (LB-044), Scan Result (weather context + "personalised care advice"), Doc. Sage (knows your specific plant). | 🟡 Implemented | Code commit `d94499c`. Overlaps LB-036/043/044. **Verify on device.** |

### 4.2.1 — QA Round 2 Completion Summary

> **Status: Round 2 implementation COMPLETE — codebase frozen for Device Regression QA (2026-06-18).**
> No further feature work, refactors, optimizations, or dead-code removal until the device regression report lands. Bug fixes only.

| Metric | Count |
|---|---|
| **Round 2 tickets (LB-029…LB-046)** | 18 |
| **Round 2 — 🟡 Implemented** | 18 / 18 (100%) |
| **Round 2 — still 🔴 Pending** | 0 |
| **Round 2 — 🟢 Verified on device** | 0 (device regression pass not yet run) |
| Round 1 tickets (LB-001…LB-028), §4 | 28 — all 🟡 Implemented / Audited |
| **Total tickets implemented, both rounds** | **46** |

**Every Round 2 ticket is 🟡 Implemented and awaits on-device verification** — none may be promoted to 🟢 Verified until tested on a physical Android device (Status policy, §3 / Maintenance Rule #3).

**Items needing device verification (Round 2):** all 18 (LB-029…LB-046). Of these, several have an extra precondition beyond a normal device pass:

| Ticket | Extra precondition before it can be verified |
|---|---|
| LB-029 | **Owner/Firebase, server-side:** register the `debug.keystore` SHA-1/256 in Firebase, re-download `google-services.json`, **rebuild** (BLK-1). |
| LB-031 | Requires an **internal/preview build** (mock-premium path; real purchases gated by BLK-4/5). |
| LB-033 | Verify on a **fresh install / cleared app data** (a device that permanently denied camera in Round 1 will still route to Settings by OS design). |
| LB-037 | Monochrome themed launcher icon needs a **native rebuild**; status-bar drawable applies to the next build directly. |
| LB-025 (§4) | Android launch-screen colour fix needs a **native rebuild + device re-verify**. |

**Open blockers (unchanged, owner-side):** BLK-1 (Google SHA), BLK-2 (Sentry DSN), BLK-3 (full Android device QA — *this round*), BLK-4 (Play Console), BLK-5 (RevenueCat), BLK-6 (internal build), BLK-7 (closed beta). See §5.

**Next:** Device Regression QA Round → collect regressions/UX/crash/polish into a new QA batch → Round 3 fixes → final regression → **then** a dedicated Code Cleanup & Optimization phase (dead code, unused components/hooks/assets, obsolete files, duplicate logic, state simplification, bundle/LOC reduction — strictly no functional changes). Cleanup is deferred until the app is functionally stable.

---

## 4.3 Launch Bug Table — QA Round 3 / Device Regression (2026-06-20)

> Logged from the owner's device regression pass on a debug build (OnePlus 7 Pro, GM1917, Android 12). Independent Round 3 batch (LB-047+). Status starts 🔴 Pending → 🟡 Implemented per round rules (never 🟢 Verified without a real-device regression pass). Each fix was preceded by an explicit root-cause investigation (measurement / config trace / live API probe), recorded below.

| Bug ID | Priority | Screen | Issue | Root Cause (investigated) | Fix | Status | Notes |
|---|---|---|---|---|---|---|---|
| LB-047 | 🔴 P0 | App boot / Splash | Loading screen shows ~15–20s before the app is usable | **Measured cold start (`am start`→first frame = +14.5s).** Dominant cost is the **debug build streaming its JS bundle over Metro** — absent in a release/standalone build. Controllable JS-path costs found: (a) `App.tsx` hard-blocked the whole tree behind font loading with a **5000ms** fallback; (b) `AnimatedSplash` had a fixed **3700ms** floor on the path to Home. Non-critical init (purchases/usage/analytics/notifications) is already deferred/lazy — verified, left as-is. | `App.tsx`: font-load fallback 5000→**2000ms** (bundled fonts resolve <1s; cap stops a slow decode holding a blank spinner). `AnimatedSplash.tsx`: added a single `SPEED=0.7` knob scaling every keyframe via `at()` → splash floor **3700→~2590ms**, same choreography, faster. | 🟡 Implemented | `5c4cb5e`. **Build-type caveat:** the ~14.5s in the measurement is debug-only Metro bundle transfer — **a release/standalone build is required to realise and verify true startup** and is recommended for all device testing. Splash duration past this point is a product call. **Verify on device (ideally a release build).** |
| LB-048 | 🔴 P0 | Auth (Google) | Google Sign-In still fails | **CONFIRMED owner-side — SHA mismatch (live config trace on the OnePlus debug build).** APK is signed by `debug.keystore` SHA-1 `5E:8F:16:…F6:25` (`5e8f1606…f625`); `google-services.json` registers the Android OAuth client against `certificate_hash 5fbc5bc4…` — a different key ⇒ Google returns `DEVELOPER_ERROR` (code 10). Verified everything else correct: package + plugin installed, `configureGoogleSignIn()` at boot, Web client type 3, `applicationId`=`package_name`=`com.lawnup.app`, env var set so the button really attempts sign-in. | **No code-only fix exists (server-side check).** Code already maps code 10 → friendly message + dev diagnostic. Documented the exact owner action in `docs/google-signin-setup.md` (Round 3 re-confirmation): register the `debug.keystore` SHA-1/256 in Firebase → re-download `google-services.json` → rebuild; enable Google provider. | 🟡 Implemented (docs) | `84c61ba`. Re-open of LB-029; **BLK-1**. Owner-side: Firebase console + rebuild. **Verify on device after the SHA is registered and the app rebuilt.** |
| LB-049 | 🔴 P0 | Scan / Plant.id | Scanner cannot be tested — identification fails | **Not credits, not an app bug — the Plant.id API key is inactive.** Probed the live endpoint (`GET /api/v3/usage_info`) → **HTTP 401 "The specified api key is not active"** (consistent with the documented key-leak/rotation). Secondary code bug: `mapToUserError` (useScanFlow) had no HTTP-4xx branch, so 401/402/429 fell through to a misleading "Something went wrong — please try again." Scanner UI / camera / gallery code is intact (LB-032/033). | `useScanFlow.ts`: added explicit branches — 401/403/"api key"/"not active" → "Plant identification is temporarily unavailable. Please try again later."; 402/429 (credits/rate-limit) → "…busy right now — please try again in a few minutes." Kept distinct from the user's own weekly scan limit (no false upgrade prompt). | 🟡 Implemented | `<HASH-049>`. **Owner action:** set an **active** `PLANT_ID_KEY` (rotate per the leak) and rebuild. **Verify on device** (UI/camera/gallery + a real scan once a live key is set). |

---

## 5. Current Launch Blockers

> Work that must be cleared before a paid public launch. None of these are app crashes today — they are activation/QA gates.

| ID | Blocker | Owner | Priority | Dependencies | Status |
|---|---|---|---|---|---|
| BLK-1 | **Google Sign-In implementation** (real OAuth end-to-end) | Spriha | 🟠 P1 | Firebase Google provider enabled + SHA-1/256 in Firebase + **`google-services.json` at repo root** + `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (OAuth Web client) in `.env` + native rebuild (`eas build`) | 🟡 Code complete (logout session + error handling done, LB-026/027); **blocked on Firebase config artifacts + real-device QA** — see deliverable notes |
| BLK-2 | **Sentry installation / activation** | Spriha | 🟡 P2 | `EXPO_PUBLIC_SENTRY_DSN` + native rebuild | 🟡 In Progress — seam wired & env-gated (`7df338e`, `50898b7`); DSN not set |
| BLK-3 | **Full Android device QA** | Spriha | 🔴 P0 | A signed dev/internal build on real devices | 🔵 Open — code audit done (`QA_AUDIT_REPORT.md`); on-device run pending |
| BLK-4 | **Google Play Console setup** (account, app, products) | Spriha | 🟠 P1 | $25 dev account; signed AAB on internal track | 🔵 Open — intentionally deferred until app stable (`PLAY_STORE_SETUP.md`) |
| BLK-5 | **RevenueCat production activation** | Spriha | 🟠 P1 | BLK-4; Play↔RevenueCat connection; `goog_` Android SDK key; rebuild | 🔵 Open — code complete & dormant; see `PLAY_STORE_SETUP.md` steps 4–6 |
| BLK-6 | **Internal testing build** | Spriha | 🟠 P1 | EAS build; Play internal track | 🔵 Open |
| BLK-7 | **Closed beta testing** | Spriha | 🟡 P2 | BLK-6; tester cohort | 🔵 Open |

---

## 6. Device QA Matrix

> Template — fill a row per real device per test pass. Status: ⬜ Not started · 🟡 In progress · ✅ Pass · ❌ Fail. Do not mark a bug "Verified" off anything but a real device (Rule #3).

| Device | Android Version | Tester | Build Version | Status | Notes |
|---|---|---|---|---|---|
| _(e.g. Pixel — low-RAM)_ | Android 12 | _unassigned_ | 1.0.0 (___) | ⬜ Not started | Cover splash + offline onboarding (LB-001) |
| _(e.g. Samsung mid-range)_ | Android 13 | _unassigned_ | 1.0.0 (___) | ⬜ Not started | Check blue launch screen regression (LB-025) |
| _(e.g. Short-height device)_ | Android 11 | _unassigned_ | 1.0.0 (___) | ⬜ Not started | Splash HUD overlap (LB-007) |
| _(iOS device)_ | n/a (iOS) | _unassigned_ | 1.0.0 (___) | ⬜ Not started | Parity check |

---

## 7. Regression Checklist

> Run before every internal/closed/production build. Mark PASS / FAIL / N/A per flow.

**Authentication**
- [ ] Email Signup
- [ ] Google Sign-In _(blocked on BLK-1)_
- [ ] Forgot Password
- [ ] Logout

**Onboarding**
- [ ] 2-step flow completes; no hang offline (LB-001)
- [ ] City selected → persists (LB-011)

**Home**
- [ ] Single scan entry point (LB-008)
- [ ] Dashboard sections render; health grid gating (LB-014)

**Scan**
- [ ] Scan tab → Camera directly (LB-009)
- [ ] Identify → result; Soil CTA without save (LB-010)
- [ ] Camera permission denied → recoverable

**My Garden**
- [ ] Save first plant (activation reward)
- [ ] Garden list / detail render; consistent naming (LB-019)

**Doc. Sage**
- [ ] Send message; failed reply doesn't charge quota (LB-015)
- [ ] Branding reads "Doc. Sage" everywhere (LB-021)

**Notifications**
- [ ] Per-category prefs persist & respect OS permission (LB-012)

**Reminder Delivery**
- [ ] Watering reminder fires; "send a test" works (LB-013)

**Weather**
- [ ] Weather + AQI render for selected city

**Profile**
- [ ] No dead welcome card; garden-level explainer (LB-022)

**Settings**
- [ ] Notification toggles; appearance; account rows
- [ ] "Manage subscription" only shown when payments live

**Paywall**
- [ ] Correct pricing (LB-005); honest comparison (LB-006)
- [ ] Release CTA state correct (LB-004); opens as modal (LB-016)

**Restore Purchases**
- [ ] Graceful "available at launch" pre-payments; real restore once live

**Offline Mode**
- [ ] Onboarding, garden, and reminders behave offline (no hang)

**Performance**
- [ ] Cold start, splash < ~5s, scrolling smooth, no jank on low-RAM device

---

## 8. Release Checklist

### Internal Testing Ready
- [ ] `tsc --noEmit` clean
- [ ] BLK-3 full Android device QA pass
- [ ] Regression checklist (§7) green on ≥1 real device
- [ ] No open 🔴 P0 bugs
- [ ] Signed AAB builds via EAS
- [ ] LB-025 blue launch screen verified fixed on device

### Closed Testing Ready
- [ ] All Internal gates met
- [ ] BLK-1 Google Sign-In verified live
- [ ] BLK-2 Sentry capturing errors in release build
- [ ] BLK-6 internal build distributed to testers
- [ ] No open 🟠 P1 bugs
- [ ] Privacy policy URL + Data Safety form drafted

### Production Ready
- [ ] All Closed Testing gates met
- [ ] BLK-4 Play Console app + subscription products live
- [ ] BLK-5 RevenueCat production key set + sandbox purchase tested (`PLAY_STORE_SETUP.md` §7)
- [ ] BLK-7 closed beta feedback addressed
- [ ] Store listing, screenshots, content rating complete
- [ ] No open 🔴 P0 / 🟠 P1 bugs
- [ ] Production build carries `goog_` key + Sentry DSN via EAS secrets

---

## 9. Maintenance Rules

1. **Every bug discovered during QA must be added immediately.**
2. **Every fix must include the commit hash** in "Fixed In Commit".
3. **A bug is only marked 🟢 Verified after testing on a real Android device (regression pass).**
4. **Never delete resolved bugs** — keep them as release history.
5. **Update this tracker after every QA session and after every bug-fix commit.**
6. **This file is the authoritative launch tracker for the project.**

---

## 10. UI Consistency Audit (LB-043 · QA Round 1)

**Standard:** `src/constants/designSystem.ts` is the single source of truth —
`radii` (xs 6 · sm 8 · md 12 · lg 16 · card 18 · xl 24 · sheet 28 · pill 100),
`spacing`, `typography` (Plus Jakarta serif + Nunito body, body ≥ 14sp),
`fonts`, and `shadows`.

**Findings**

| Area | State | Notes |
|---|---|---|
| Corner radius | Mixed | Newer screens use `R.*`; legacy screens use raw numbers (`16/18/20/24/999`). Many raw values **don't equal** a token. |
| Typography | Mixed | Newer screens use `T.*`/`F.*`; ~20 files still use raw `'Nunito-*'`/`'Jakarta-*'` strings + raw sizes. |
| Card spacing / padding | Consistent enough | Cards use `C.card` + border + `theme.shadows.card`; section gap via `SECTION_GAP`. Weather card brought in line this round (LB-040). |
| Icon weights | Consistent | SVG stroke icons at `strokeWidth ≈ 1.7–1.8` across nav + screens. |
| Elevation / shadows | Consistent | `theme.shadows.{sm,card,cta,lg}` used widely. |
| Bottom-nav active state | Fixed | LB-041. |
| Diagnosis hierarchy / care icons / confidence | Fixed | LB-037/038/039. |

**Decision (rule-compliant):** all changes in this QA round use the tokens /
convention of the file they touch. A **blanket raw-value → token migration is
deliberately deferred** — most legacy raw values do not map 1:1 to tokens, so
swapping them would change pixels (a redesign), which this round's rules forbid
("Do NOT redesign", "Do NOT refactor unrelated code"). 

**Recommended follow-up (separate, design-signed-off task):** migrate the raw
font strings + radii in `PaywallScreen`, `ScanResultScreen`, `ProcessingScreen`,
`PlantDetailScreen`, the `scan/components/*`, and `Button`/`Input` to
`designSystem` tokens, snapping each raw value to the nearest token **with design
sign-off** on the small visual deltas. Not a launch blocker.

---

## 11. Release Workflow (round-based — authoritative)

Going forward we ship in **rounds**, not one-off fixes:

1. **Build** — produce a fresh Android build (EAS).
2. **QA** — owner performs a complete screen-by-screen pass of the whole app.
3. **Log** — every issue found is added to §4 of this tracker (status 🔵 Open).
4. **Fix** — all logged issues are fixed together in **one** development round
   (each → 🟡 Implemented with its commit hash).
5. **Build** — produce another Android build with the round's fixes.
6. **Regress** — owner runs one full regression pass on a real device; issues
   that pass become 🟢 Verified, anything still broken is re-logged.
7. **Repeat** until there are no launch-blocking (🔴 P0 / 🟠 P1) issues left.

Rules: no piecemeal one-by-one fixing between rounds; status stays 🟡 Implemented
until a real-device regression pass promotes it to 🟢 Verified.
