# 🌿 LawnUp — Launch Bug Tracker

> **Single source of truth** for all bugs, launch blockers, QA findings, regressions, and release readiness.
> See also: `QA_AUDIT_REPORT.md` (code audit), `DEVICE_QA_CHECKLIST.md` (manual test cases), `PLAY_STORE_SETUP.md` (payments setup).

---

## 1. Project Information

| Field | Value |
|---|---|
| **App Version** | 1.0.0 |
| **Branch** | `redesign/phase1-design-system-auth` |
| **Current Commit** | `8598ced` (Auth: complete Google Sign-In — logout session teardown + error mapping) |
| **Owner** | Spriha Choudhary |
| **Last Updated** | 2026-06-17 |
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
| 🟡 | **In Progress** | Actively being fixed |
| 🟢 | **Fixed** | Code fixed & committed, not yet device-verified |
| ✅ | **Verified** | Confirmed fixed on a real device |
| ⚪ | **Won't Fix** | Intentionally not addressed (with reason) |

---

## 4. Launch Bug Table

> Pre-populated from Git history + `QA_AUDIT_REPORT.md`. Severity reflects documented impact. "🟢 Fixed" means the fix is committed but **not yet re-verified on a real device** — promote to ✅ only after device QA (see Maintenance Rule #3).

| Bug ID | Sev | Status | Screen | Platform | Device | Steps to Reproduce | Expected Result | Actual Result | Root Cause | Fixed In Commit | Verified By | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LB-001 | 🔴 P0 | 🟢 Fixed | Onboarding (final step) | Both | Any (flaky/offline) | Complete onboarding → tap final CTA while offline or on a rejected write | Enters the app immediately | Button stuck on "Setting up your garden…"; user locked out, bounced back to onboarding every relaunch | Final `updateDoc` was awaited to gate entry with no try/catch; offline promise stayed pending | `57c33a6` | — | QA C1. Now enters on local state; write runs in background (offline-queued) |
| LB-002 | 🔴 P0 | 🟢 Fixed | App boot / Splash | Both | Non–dev-build clients | Launch app without Skia native module present | App boots to splash | App failed to boot (Skia dependency) | Skia imported unconditionally | `2cfbbbf` | — | Skia made optional via `skiaSafe`; fallback splash |
| LB-003 | 🔴 P0 | 🟢 Fixed | Paywall / Settings | Android | Any | Set a `test_…` placeholder RevenueCat key, tap "Start Premium" | Upgrade works or paywall shows "coming soon" | Upgrade silently failed (`package_not_found`); DEV mock path bypassed; dead "Manage subscription" row | Invalid `test_` key flipped `PAYMENTS_READY=true` with no real offerings | `eededbb` | — | Removed key (→ `PAYMENTS_READY=false`); added `TODO(play-store)`; see `PLAY_STORE_SETUP.md` |
| LB-004 | 🟠 P1 | 🟢 Fixed | Paywall (release) | Both | Any | Release build → open Paywall → tap "Start Premium" | CTA reflects real state | CTA did nothing in release (only worked in `__DEV__`) — looked broken | Upgrade handler gated entirely behind `__DEV__` | `1e46d6f` | — | QA H1. Release CTA now disabled, reads "Premium — coming soon"; DEV keeps mock |
| LB-005 | 🟠 P1 | 🟢 Fixed | Paywall (plan picker) | Both | Any | Open Paywall → view Annual plan | Annual = ₹1990 / SAVE 17% / ₹166-mo (matches PRD) | Annual price mismatched PRD/Paywall | Stale pricing constants | `68e889f` | — | Reconciled to ₹1990 · SAVE 17% · ₹166/mo |
| LB-006 | 🟠 P1 | 🟢 Fixed | Paywall / Home / UpgradePrompt | Both | Any | Read premium comparison table & hero copy | Only true premium differences claimed | Advertised premium-only perks that free users already get (disease detection, reminders, weather) | Copy not aligned with actual gating | `7df338e` | — | Honest messaging: premium differs only on scan + chat quotas; no new gates added |
| LB-007 | 🟡 P2 | 🟢 Fixed | Splash | Both | Short / small-height devices | Watch splash "IDENTIFIED" HUD | HUD sits above the foliage | HUD overlapped the canopy on short screens | HUD not anchored relative to foliage | `68e889f` | — | Anchored "IDENTIFIED" HUD above foliage |
| LB-008 | 🟡 P2 | 🟢 Fixed | Home | Both | Any | Open Home with plants saved | One clear way to scan | Duplicate scan entry points (Featured Scan card + Scan quick-action + FAB) | Redundant CTAs accumulated | `68e889f` | — | Collapsed to the single center Scan tab |
| LB-009 | 🟡 P2 | 🟢 Fixed | Scan flow | Both | Any | Tap Scan tab | Goes straight to Camera | Extra ScanLanding interstitial before camera | Unnecessary interstitial screen | `1aa3835` | — | ScanLandingScreen deleted; Camera is the stack entry; back/retry routes fixed |
| LB-010 | 🟡 P2 | 🟢 Fixed | Scan Result → Soil | Both | Any | Identify a plant; want soil advice without saving | Soil advice available right after ID | Soil recommendation required saving the plant first | SoilAdvisor only read first saved plant | `68e889f` | — | Added Soil & potting CTA on result CARE tab; SoilAdvisor honours passed speciesName |
| LB-011 | 🟡 P2 | 🟢 Fixed | Onboarding / City | Both | Any | Select a city during onboarding → view it later | City persists & displays | City showed "Not set" | `authStore.user.city` not synced at selection | `68e889f` | — | City synced into authStore at selection |
| LB-012 | 🟡 P2 | 🟢 Fixed | Settings → Notifications | Both | Any | Open notification settings | Per-category prefs persist & reflect OS permission | Toggles non-persistent / fake working settings | No persisted prefs; no OS-permission gating | `68e889f`, `1aa3835` | — | Persisted per-category prefs (water/fertilizer/care/updates/marketing); non-delivering ones marked "Soon" |
| LB-013 | 🟡 P2 | 🟢 Fixed | Reminders / Notifications | Both | Any | Configure watering reminder; send a test | Watering pref gates delivery; test fires | No master gate; no way to test delivery | Watering pref not wired into scheduler | `68e889f`, `1aa3835` | — | Watering pref is the real master gate; "send a test" added |
| LB-014 | 🟡 P2 | 🟢 Fixed | Home dashboard | Both | Any (gardens < 3 plants) | Open Home with 1–2 plants | No redundant health widgets | 4-tier Plant Health grid shown redundantly with Garden Overview ring | Grid not gated by plant count | `1aa3835`, `faf1427` | — | Health grid hidden for gardens < 3 plants; dashboard rebuilt to approved 10 sections |
| LB-015 | 🟡 P2 | 🟢 Fixed | Doc. Sage chat | Both | Any | Send a chat message that fails (network/API) | Daily quota not charged on failure | A failed reply still consumed a free-tier message credit (20/day) | `incrementMessage()` called before `askBanyan()` | `bb29a13` | — | QA M1. Increment moved after successful reply |
| LB-016 | 🟡 P2 | 🟢 Fixed | Paywall (modal) | Both | Any | Open Paywall from a nested screen | Paywall overlays current tab | Jumped to Profile tab to show Paywall | Paywall not registered as root-level modal | `0da812e` | — | QA M3. Root-level Paywall modal + `openPaywall` helper |
| LB-017 | 🟡 P2 | 🟢 Fixed | Auth (Landing) | Both | Any | Tap "Continue with Google" (pre-OAuth) | No misleading control | Button routed to email signup (looked like Google login) | Fake Google button shipped before OAuth wired | `1aa3835`, `26c96f6` | — | Hidden behind flag, then real Google Sign-In scaffolded (impl still pending — see Blockers) |
| LB-018 | 🟡 P2 | 🟢 Fixed (partial) | Usage limits | Both | Any | Sign in (client-side mode) | No doomed usage round-trip | `checkUsageLimit()` called undeployed Function every sign-in; failed open | Server enforcement assumed but backend deferred | `a4b7032` | — | QA H2. Gated behind `BACKEND_ENABLED`. **Still open:** tamper-proof server enforcement needs backend (deferred) |
| LB-019 | 🟢 P3 | 🟢 Fixed | Tab nav / Home / AddPlant | Both | Any | View "My Plants" labels | Consistent "My Garden" naming | Mixed "Plants" / "My Plants" naming | Legacy naming | `910e947`, `68e889f` | — | Renamed to "My Garden" across nav, headers, CTAs |
| LB-020 | 🟢 P3 | 🟢 Fixed | Onboarding | Both | Any | Run onboarding | Short, focused flow | Extra steps ("What plants do you love?", "What's your goal?") | Over-long onboarding | `68e889f` | — | Removed PlantsType + Goal steps; SkillLevel is now final (2-step flow) |
| LB-021 | 🟢 P3 | 🟢 Fixed | Doc. Sage (all surfaces) | Both | Any | Read assistant name across the app | Consistent "🌿 Doc. Sage" mentor identity | Assistant was "Dr. Banyan"; clinical tone | Rebrand | `35c8b7b`, `e58cb79` | — | User-facing copy only; warmer mentor voice; internal identifiers unchanged |
| LB-022 | 🟢 P3 | 🟢 Fixed | Profile | Both | Any | Open Profile (first run / general) | Clean, no dead UI | First-run welcome card + dead styles; unclear garden-level | Leftover scaffold UI | `910e947`, `68e889f`, `17d366e` | — | Removed welcome card & dead styles; added garden-level explainer |
| LB-023 | 🟢 P3 | 🟢 Fixed | Auth (Login/Signup) | Both | Any | Submit malformed email | Inline validation blocks submit | No email-format validation | Missing validation | `1aa3835` | — | Email-format validation added to Login & Signup CTAs |
| LB-024 | 🟢 P3 | 🟢 Fixed | Help & Support | Both | Any | Read "how to scan" help copy | Matches current UI | Said "Tap the Scan tab (or the + button)" after FAB removed | Stale copy | `e58cb79` | — | Updated to "Tap the Scan tab in the bottom bar" |
| LB-025 | 🟡 P2 | 🔵 Open | App icon / launch screen | Android | Any | Cold launch | LawnUp launch screen, no Expo blue default | Blue launch screen (Expo default `colorPrimary`) | Default Android theme color | — | — | Fix applied in `colors.xml` / `styles.xml` / `app.json`; **requires native rebuild + device re-verify** (DEVICE_QA TC-1.2). Re-open until verified on device |
| LB-026 | 🟠 P1 | 🟢 Fixed | Auth (logout) | Android | Any | Sign in with Google → log out → tap "Continue with Google" again | Account picker re-appears; can switch accounts | Native Google session persisted; next sign-in silently reused the last account, no picker | `signOut` only cleared the Firebase session, not the native Google session | `8598ced` | — | Found during Phase 1 impl. `signOutGoogle()` now called in `authStore.signOut` + `deleteAccount`. **Verify on device** |
| LB-027 | 🟡 P2 | 🟢 Fixed | Auth (Google) | Android | Any | Trigger cancel / no-network / duplicate-email / no-Play-services during Google sign-in | Each shows a distinct, accurate message; cancel is silent | All failures collapsed into one generic "try again" alert; raw error codes leaked | `signInWithGooglePrompt` caught errors generically | `8598ced` | — | Found during Phase 1 impl. Mapped cancellation / in-progress / Play-services / network / `auth/account-exists-with-different-credential` to friendly messages. **Verify on device** |
| LB-028 | 🔴 P0 | 🟢 Fixed | Onboarding (vine) | Android | Any | Sign up → walk through onboarding screens, watch the left-edge JourneyVine | Vine grows proportionally; full height only on the last onboarding screen; leaves/flowers unfurl only on the grown portion | Vine jumped to full height with several screens remaining; all leaves/flowers appeared at once | `setVineForRoute` `else` branch fired for the transient `"Onboarding"` parent route (reported before the nested screen hydrates) + every deep route → grew to 1.0 and latched `bloomed` | `f6bb239` | — | Bloom now restricted to completion routes (`Main`/`Home`); unmapped routes leave the vine in place; onboarding steps remapped to grow evenly (Welcome .30 → Location .52 → PlaceType .74 → SkillLevel 1.0). **Verify on device** |
| LB-029 | 🔴 P0 | 🟢 Fixed (code) | Auth (Google) | Android | Any | Tap "Continue with Google" on a real device | Native account picker launches; sign-in completes | Tapping did nothing / failed silently | (a) boot config lived only in the **dead** `src/app/App.tsx`, never the real entry `App.tsx`; (b) the usual on-device cause — `DEVELOPER_ERROR` (code 10) from a missing/incorrect SHA-1/256 in Firebase — was mapped to a generic "try again" with no log | `3e1bc27` | — | `configureGoogleSignIn()` now called at boot in real `App.tsx`; `DEVELOPER_ERROR` mapped to a clear message + dev log of raw `{code,message}`. **⚠️ Still requires (BLK-1): env var inlined into a fresh native build, and SHA-1/256 of the build's signing key registered in Firebase. Code can't substitute for these — verify on device after rebuild.** |
| LB-030 | 🔴 P0 | 🟢 Fixed | My Garden (empty) | Both | Fresh account | Open My Garden tab with zero saved plants | Attractive empty state, not an empty garden UI | Empty state existed but copy/CTA didn't match the requested spec | Empty-state copy predated the spec | `cbb93c8` | — | Home (first-run hero) and My Garden already gate the standard garden UI behind `plants.length`. Aligned the My Garden empty state to spec: "Your garden is waiting 🌱" / "Scan your first plant to start growing your digital garden." / CTA **Scan Your First Plant** → Scan tab. **Verify on device** |
| LB-031 | 🔴 P0 | 🟢 Fixed | Paywall / all upgrade CTAs | Both | Internal/preview build | Open Paywall → tap "Start Premium" on a non-DEV internal build | A working upgrade flow | CTA was disabled ("Premium — coming soon") on every non-DEV build | All entry points (Home/Chat/Camera/Processing/ScanResult/PlantDetail/Profile → `openPaywall`) and the paywall (₹1990 annual / ₹199 monthly cards, comparison, restore) were intact; only the final CTA was gated behind `PAYMENTS_READY \|\| __DEV__`, so release/internal QA builds saw it disabled (deliberate LB-004 behaviour) | `c1b57d0` | — | Per owner decision: added `MOCK_PREMIUM_ENABLED` (= `!PAYMENTS_READY && APP_ENV !== 'production'`). CTA is now active on dev/preview/staging via the LOCAL mock so QA can test the full flow; **HARD-GATED off in production** (keeps "coming soon" until real RevenueCat). Real purchases still need BLK-4/5. **Verify on device (internal build)** |
| LB-032 | 🟠 P1 | 🟢 Fixed | Scan / Camera permission | Android | Any | Open Scan → decline camera once → tap "Allow Camera Access" again | A single decline re-prompts the OS; only permanent denial routes to Settings; granted launches camera | After the first decline the CTA jumped straight to a Settings alert even though the OS could still re-prompt | `handleAllowCamera` showed `openCameraSettings()` for **any** non-grant, ignoring `canAskAgain` | `e8f50e4` | — | CAMERA is correctly declared in `app.json` + `AndroidManifest.xml`. Now: granted → live camera; `!granted && canAskAgain` → stay on rationale (re-prompts on next tap); `!canAskAgain` → Settings. No dead-ends. **Verify on device** |
| LB-033 | 🟠 P1 | 🟢 Fixed | Scan / Camera state | Both | Any | Take photo → Analyse → Back | Back returns to a fresh live camera preview | Previously captured image still showed; CameraScreen kept `capturedUri` while it sat below Processing in the stack | Local capture state was never cleared on re-focus | `e8f50e4` | — | Added a `navigation` `focus` listener that clears `capturedUri`, quality state, capture lock, and the scan store on every focus → Back **and** a new Scan always land on the live preview. Retake already reset locally. **Verify on device** |
| LB-034 | 🟠 P1 | 🟢 Fixed | Scan / Camera (recognition) | Both | Any | Photograph a whole plant / medium / potted shot | Good identification, or clear guidance toward a better shot | Whole-plant shots often failed; only close-up leaves analysed reliably; no pre-capture steer | Plant.id is most accurate on a clear, well-lit subject; the camera didn't lead with that, so users framed poorly and got silent low-confidence results | `0be7845` | — | Recognition itself is Plant.id's model (can't change). Added a **persistent best-results hint** ("capture one healthy leaf clearly in good lighting") + best-practice-led rotating tips. Result screen already guides re-capture on low confidence (confidence note, rescan tips, "try a closer photo"). **Verify on device** |
| LB-035 | 🟠 P1 | 🟢 Fixed | Splash (branding) | Android | Multiple sizes | Watch the splash → wordmark + tagline resolve | "LawnUp" + "DON'T LET IT DIE!" clear the plant and stay aligned on all screen sizes | Reported overlap of branding text/logo during splash | Wordmark (`H*0.66`) and tagline (`H*0.72`) used **independent** fractional-H positions → crowd together / risk overlap on short devices | `372caf8` | — | ⚠️ Could NOT reproduce on the captured QA device (1440×3120 — geometry clears comfortably). Made it robust regardless: brand lockup now anchored RELATIVE to the plant — `WORD_TOP = max(0.62H, POT_BOT+72)`, `TAG_TOP = WORD_TOP+62` (fixed gap). Splash duration unchanged (`TOTAL=3700`). **Re-verify on a short Android device** |
| LB-036 | 🟡 P2 | 🟢 Fixed | Scan / Processing | Both | Any | Tap Analyse → watch the loading screen | Progressive analysis states make the AI feel responsive | Loading cycled only 3 looping messages — felt static | Messages looped via modulo; no forward progression | `de775f6` | — | 5 forward-advancing states: Identifying plant… → Detecting disease… → Checking plant health… → Preparing treatment… → Finalising recommendations… Steps every ~1.05s, holds on the last until the API resolves (no loop-back). Backend unchanged. **Verify on device** |
| LB-037 | 🟡 P2 | 🟢 Fixed | Scan Result (hero) | Both | Any | View a scan result hero | Diagnosis reads: name → health badge → confidence → description | Health badge floated top-left, disconnected from the name; confidence was a tiny pill on the scientific row | No deliberate diagnosis hierarchy in the hero | `601e2ac` | — | Hero overlay restructured: **1** plant name → **2** Healthy/Needs-attention badge → **3** "{n}% confidence" pill (grouped on one diagnosis row under the name) → **4** supporting English/scientific names. Conversational description follows in AICompanionSummary. **Verify on device** |
| LB-038 | 🟡 P2 | 🟢 Fixed | Scan Result (CARE tab) | Both | Any | Read the "Your next steps" care list | Each step has a relevant icon | Steps were plain numbered rows — text-heavy | No category icons | `601e2ac` | — | `SuggestedActionCard` now infers a care-category icon from the action text: 💧 Water · ☀️ Sunlight · 🌱 Soil · 🪴 Fertilizer · 🌡 Temperature (🌿 fallback). Layout/design language unchanged. **Verify on device** |
| LB-039 | 🟡 P2 | 🟢 Fixed | Scan Result (INFO tab) | Both | Any | Open INFO tab → Identification details | Confidence is explained, not just a bare % | Showed only "84%" with no meaning | No explanation copy | `601e2ac` | — | Added under the Confidence row: "AI confidence is based on image clarity and the visible characteristics of the plant — a clearer, closer photo usually raises it." Hero pill now also reads "{n}% confidence". **Verify on device** |
| LB-040 | 🟡 P2 | 🟢 Fixed | Home (weather card) | Both | Any | Scroll Home to the Weather + AQI card | Weather card feels part of the dashboard | Felt visually disconnected | It was the ONLY dashboard section with its eyebrow INSIDE the card and no `SectionHeader` above it — every sibling section has one | `61198a0` | — | Gave it a `SectionHeader` ("WEATHER & CARE · {city}") like its siblings; removed the redundant in-card eyebrow. Now matches the dashboard's section rhythm/typography. **Verify on device** |
| LB-041 | 🟡 P2 | 🟢 Fixed | Bottom navigation | Both | Any | Switch tabs | Selected tab is clearly obvious | Active state relied only on a colour swap + a tiny sprout | Weak active emphasis | `8a06ac9` | — | Added an animated primary highlight pill behind the active icon; lifted inactive icon/label tone 0.45→0.55 for visibility; active label stays bold primary. Design language unchanged. **Verify on device** |
| LB-042 | 🟡 P2 | 🟢 Fixed | Doc. Sage chat | Both | Any | Read a multi-point Doc. Sage reply | Easy to scan — paragraphs/bullets, comfortable spacing | Replies rendered as one flat text block | Assistant content shown via a single `<Text>` with no structure | _(this round — see commit below)_ | — | Added a formatter for assistant messages: paragraph spacing, bullet rows (`- * •`), line-height 23, wider bubble (94%). Tone/wording untouched; user bubbles unchanged. **Verify on device** |

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
3. **A bug is only marked ✅ Verified after testing on a real device.**
4. **Never delete resolved bugs** — keep them as release history.
5. **Update this tracker after every QA session and after every bug-fix commit.**
6. **This file is the authoritative launch tracker for the project.**
