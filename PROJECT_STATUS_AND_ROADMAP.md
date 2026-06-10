# LawnUp — Project Status & Deploy Roadmap

> Audit date: 2026-06-10 · Audit only — no code was changed.
> Verification run: `npx tsc --noEmit` (app code clean, functions fail — see Bugs), `npm run lint` (broken), functions build (blocked — empty node_modules).
> **Updated 2026-06-10 with owner decisions** — see §4 "Resolved Decisions". Roadmap tasks 1.6, 2.1–2.3 and Phase 4 revised accordingly.

---

## ✅ Phase 1 — DONE (2026-06-10)

All Phase-1 tasks implemented. Verification now: **app `tsc` clean · `lint` 0 errors (161 pre-existing warnings) · functions `tsc` build clean**.

| Task | Status | Notes |
|---|---|---|
| 1.1 Toolchain | ✅ | Root `tsconfig` excludes `functions/`; `eslint@9` + flat `eslint.config.js` (Expo config); `functions/` deps installed; all three checks green |
| 1.2 Functions → v6 + secrets | ✅ | firebase-functions `^6`, admin `^13`; every `functions.config()` replaced with `defineSecret`/params (`PLANT_ID_KEY`, `OPENAI_KEY`, `OPENWEATHER_KEY`, `CASHFREE_*`); v2 `onCall`/`onRequest`/`onSchedule`; global region `asia-south1`; **Cashfree functions removed from `index.ts` exports** (parked, still compile); webhook HMAC now uses `req.rawBody` |
| 1.3 Signup vs rules | ✅ | Client no longer writes `usage/{uid}` (rules block it); doc created lazily server-side in `checkUsageLimit` + `rateLimiter` |
| 1.4 Persist plants | ✅ | New `plantService.ts` (CRUD + background image upload to Storage); live `onSnapshot` sub started/torn-down in `RootNavigator`; ScanResult/AddPlant/EditPlant/PlantDetail write through; real `Timestamp.fromDate` replaces `mockTs` |
| 1.5 Server-side scans | ✅ | `processPlantScan` rewritten (quota gate → Plant.id → Storage upload → `plant_scans` log → quota consume); client `plantIdentification.ts` now calls the function and only does presentation transforms; **`apiKeys.ts` deleted, `plantIdKey` removed from `app.config.ts`**; `.env` key renamed off the `EXPO_PUBLIC_` prefix so it no longer ships in the bundle |
| 1.6 Quotas + pricing | ✅ | 3 scans/week (Monday reset) everywhere; premium unlimited; ₹199/₹1990; store migrated day→week keys (persist v2); paywall copy + "SAVE 17%/₹166" fixed; AI Doctor row → "Coming soon" |
| 1.7 SDK 35 | ✅ (partial) | `targetSdkVersion`/`compileSdkVersion` → 35 in `app.json` + `gradle.properties`. **`eas.projectId` still `YOUR_EAS_PROJECT_ID`** — needs you to run `eas init` (your Expo login) |

### Phase 1 status under the strategy pivot
Phase 1's work is **kept in full** — it's the long-term foundation. But the action items it created (Blaze upgrade, Secret Manager, function deploy, `eas init`) are **paused** per the 2026-06-10 strategy pivot below. The only Phase-1 item still active now is re-enabling a *working* scan path for internal QA (the server route is undeployable on Spark) — see §0.

---

## 0. ⏸️ STRATEGY PIVOT — MVP / Internal-Testing Mode (2026-06-10)

**LawnUp is staying in MVP iteration, UX refinement, and internal testing. No production deployment, no Blaze upgrade, no monetization yet.** Rationale: avoid infra cost, billing, and ops overhead until the core experience stabilizes and internal QA is complete.

**Now (active):** internal testing only · no public release · no prod deploy · no monetization · **product quality first.**

| Area | Decision |
|---|---|
| Firebase plan | **Stay on Spark.** No Blaze upgrade, no production function deploy, no Secret Manager rollout, no backend hardening yet. |
| Frontend / UX | **Continue aggressively** — HomeScreen, camera/scan, ProcessingScreen, ScanResult hero, onboarding, spacing/typography, retention UX, loading/empty/error states, animation timing, real-device responsiveness. |
| Backend | **Local-only** development allowed: architecture cleanup, modularization, provider abstraction, tests, local scan-routing experiments. **No** prod-deploy dependencies; nothing billing-dependent may block frontend work. |
| Monetization | **Postponed.** Do NOT start Play Billing, RevenueCat, App Store IAP, entitlement sync, production webhooks, or subscription deploy until UX + scan flow stabilize, real-device QA completes, and MVP nears beta quality. |
| Multi-provider AI | **Start now.** Build the provider abstraction (PlantNet + Plant.id + OpenAI) for resilient scans, failover, quota protection, scalable/cost-optimized architecture. |
| Plant.id key | A **new key** is available for **internal QA / scan testing / provider-routing validation only**. Read from a **non-public** env var (`PLANT_ID_KEY`, not `EXPO_PUBLIC_*`) surfaced via `app.config.ts` → `extra`. Do not hardcode into public/prod configs; do not reintroduce the `EXPO_PUBLIC_PLANT_ID_KEY` auto-inline pattern; no prod-deploy dependency. |
| Scan strategy | **Client-side scanning is temporarily acceptable** (no public APK / not publicly distributed; priority is rapid iteration + UX). The server-side route (Phase 1.5) is retained in code and becomes the default again at production hardening. |

**Re-prioritized sprint order:** 1) UX/UI polish → 2) scan experience quality → 3) real-device QA → 4) persistence/stability testing → 5) performance → 6) error handling → 7) multi-provider architecture planning → 8) production backend hardening *(later)* → 9) monetization *(later)*.

**Immediate tasks:** finish visual polish pass · raise the "premium feel" · refine animation timing/transitions · reduce clutter · clearer onboarding · better camera-confidence UX · more immersive result screen · better loading states · thorough persistence testing · navigation edge cases · loading/error flows · real-device responsiveness · **begin the provider abstraction layer (PlantNet + Plant.id + OpenAI).**

**Explicitly NOT reverted (long-term foundation):** persistence architecture, server-side scan architecture, quota unification, functions modernization, security cleanup, structural improvements.

---

## 1. Project Overview

**LawnUp AI** (product doc: "Bageecha AI", `lawnup.md`) is an India-first, AI-powered gardening assistant. Android-first MVP built with **Expo SDK 54 / React Native 0.81 / TypeScript (strict)**, Zustand state, React Navigation, NativeWind/StyleSheet UI, and a **Firebase** backend (Auth, Firestore, Storage, Cloud Functions in `asia-south1`). Third-party APIs: **Plant.id v3** (identification + disease), **OpenWeather** (weather-aware care), **OpenAI GPT-4.1-mini** (AI Plant Doctor), **Cashfree** (payments), **PostHog** (analytics).

**Current state in one paragraph:** The client app is polished and demo-complete — auth, onboarding, direct-to-camera scanning with a robust Plant.id pipeline, confidence/disease UI, weather advice, local reminders, and a paywall. The Cloud Functions backend (scan processing, AI chat, payments, push reminders, quotas) is fully *written* but largely **disconnected from the client**: the app calls Plant.id directly with a bundled API key, plants/scans are never persisted to Firestore, the AI Doctor screen is an unreachable "Coming soon" stub, the paywall upgrade only works in dev mode, and the functions workspace has never been installed or built. Closing the client↔backend gap is the core of the path to production.

---

## 2. Audit Findings

### 2.1 WORKING (complete end-to-end)

| Feature | Evidence |
|---|---|
| Email/password auth (signup, login, forgot password, session persistence) | `src/features/auth/services/authService.ts`, `src/services/firebase/firebaseConfig.ts:14-46` (RN bundle workaround), `src/navigation/RootNavigator.tsx:55-121` (listener + retry + timeout) |
| Onboarding flow (6 screens → user doc) | `src/features/onboarding/`, gate at `RootNavigator.tsx:140-144` |
| Plant scan UX pipeline (camera → compress → Plant.id v3 → result) | `src/features/scan/hooks/useScanFlow.ts`, `src/services/api/plantIdentification.ts` — retries (`:206-231`), timeout/abort (`:153-188`), HEIC/PNG→JPEG (`:246-257`), is_plant gate (`:332-337`), confidence labels, top-3 alternatives, disease parsing |
| Scan result UI (hero, confidence badge, disease cards, care actions, alternatives, weather advice) | `src/features/scan/screens/ScanResultScreen.tsx`, `components/` |
| Local daily scan limit (5/day free) with midnight reset | `src/features/subscription/store/subscriptionStore.ts:80-122`, gated in `useScanFlow.ts:93-95` |
| Weather fetch + advice (client-side, 30-min cache) | `src/services/weather/weatherService.ts`, `src/services/weather/weatherAdvice.ts` |
| Local watering reminders (schedule/cancel/query via expo-notifications) | `src/services/reminders/notificationScheduler.ts`, message generation in `reminderService.ts` |
| Home dashboard ("Today in garden", water alerts) | `src/features/home/screens/HomeScreen.tsx` |
| Paywall + feature-gate UI | `src/features/subscription/screens/PaywallScreen.tsx`, `hooks/useFeatureGate.ts`, `components/UpgradePrompt.tsx` |
| Error/crash infrastructure | `src/shared/components/feedback/ErrorBoundary.tsx`, `src/shared/utils/logger.ts` (global handlers, App.tsx:34), dev-only `DevOverlay` (properly `__DEV__`-gated) |
| Firestore security rules & indexes (well-designed, owner-scoped) | `firestore.rules`, `storage.rules`, `firestore.indexes.json` |

### 2.2 PARTIAL (exists but incomplete / disconnected)

1. **My Plants persistence — in-memory only (data loss).** `src/features/my-plants/store/plantsStore.ts:17` is a plain Zustand store: no `persist` middleware, no Firestore writes. `ScanResultScreen.tsx:132-188` and `AddPlantScreen.tsx:65-110` call `addPlant()` only. **All saved plants vanish on app restart.** Firestore `users/{uid}/plants` (rules ready at `firestore.rules:25-27`) is never written; server AI chat reads it (`functions/src/ai/generateAIResponse.ts:50-64`) and would always see an empty garden.
2. **Subscriptions — client and backend never meet.** Paywall CTA activates **mock premium only in `__DEV__`** (`PaywallScreen.tsx:74-82`); in a production build the button does nothing. Backend order/verify/webhook functions exist (`functions/src/subscription/*`) and typed client wrappers exist (`src/services/firebase/functions.ts:41-60`) but are **never called**. No Cashfree checkout SDK in `package.json`.
3. **AI Plant Doctor — server done, client stub, unreachable.** Full server impl (moderation, memory, prompt builder, history) in `functions/src/ai/`. Client screen is a "Coming soon" placeholder (`src/features/ai-doctor/screens/ChatScreen.tsx:5-15`) **not registered in any navigator** (`MainTabNavigator.tsx:161-172`, `ProfileNavigator.tsx:9-18`) — there is no way to open it.
4. **Push reminders — server scheduled job has no data and wrong tokens.** `functions/src/reminders/sendReminder.ts:19-24` queries `users/*/reminders` with `nextReminderAt`/`isActive`, but the client never writes reminder docs to Firestore (local notifications only). Also `src/services/firebase/messaging.ts:35-38` stores an **Expo push token** into `users.fcmToken`, while the server sends via `admin.messaging().send({token})` (`sendReminder.ts:60`, `verifyPayment.ts:85`) which requires a **native FCM token** — push would fail even with data present.
5. **Server scan pipeline unused.** `functions/src/plant/processPlantScan.ts` (quota-checked, stores scan + image) is bypassed — client calls Plant.id directly (`plantIdentification.ts:10,167-175`). Consequences: **no scan history**, quota not server-enforced, API key in app bundle (see Security). Note the two implementations even use different hosts (`plant.id/api/v3` client vs `api.plant.id/v3` server) and the server's parser expects fields (`scientific_name`) Plant.id puts elsewhere.
6. **Quota systems disagree.** Local daily: 5/day (`plans.ts:12`). Server monthly default: 5 free / 20 premium (`checkUsageLimit.ts:35`). Client legacy monthly: **2 free** (`src/constants/config.ts:8`) — written into the usage doc at signup (`authService.ts:59`). Paywall promises "Unlimited" premium scans (`PaywallScreen.tsx:22`), backend grants **20/month** (`verifyPayment.ts:70`).
7. **Pricing mismatch.** Client: ₹149/mo, ₹999/yr (`plans.ts:61,70`; `PaywallScreen.tsx:184,208`). Backend: ₹99/mo, ₹799/yr (`createCashfreeOrder.ts:8-11`). A paying user would be charged differently than the screen shows.
8. **Google Sign-In** — listed in MVP (`lawnup.md` §7), `GoogleAuthProvider`/`signInWithCredential` imported (`authService.ts:5-6`) but no flow implemented (no `expo-auth-session`/Google lib in `package.json`).
9. **Profile screen dead controls.** Settings button has no `onPress` (`ProfileScreen.tsx:~136`); nav types declare `Reminders`, `AddReminder`, `SubscriptionSuccess` (`src/navigation/types.ts:52-58`) that are registered nowhere — navigating to them would throw.
10. **Plant validation service is a pass-through.** `src/services/validation/plantValidation.ts:13-17` always returns `isPlant: true` (intentional — logic moved into `identifyPlant`), but the file remains as misleading dead code.

### 2.3 MISSING (intended but not built)

- **Scan history** — `plant_scans` collection, rules (`firestore.rules:62-65`) and index exist; nothing writes it; no history UI (Profile shows a History icon only).
- **AI chat client UI** — no message list/input/send wiring to `generateAIResponse`; `chatStore.ts` exists unused.
- **Cashfree checkout in-app** — no SDK, no deep-link handling for `lawnup://subscription/success` (`createCashfreeOrder.ts:44`), no `SubscriptionSuccess` screen.
- **Reminder management UI** — `RemindersStackParamList` declared (`types.ts:44-48`), no screens.
- **Indian Knowledge Base** — `lawnup.md` §11 collections (`plant_knowledge`, `seasonal_guides`, …) don't exist anywhere; only the static `plantCareGuide.ts` heuristics.
- **Monthly usage reset job** — reset happens lazily inside `rateLimiter.ts:28-36`, but only if the (unused) server path is called; nothing resets `usage` docs otherwise.
- **Account deletion + privacy policy/ToS links** — required by Google Play (User Data policy) for an app with auth; nothing in Profile.
- **Subscription expiry handling** — nothing downgrades a user when `endDate` passes (no scheduled job; client `isPremiumActive()` checks expiry only locally).
- **Tests** — zero test files, no test runner configured.

### 2.4 BUGS & ERRORS

1. **`npm run type-check` fails (41 errors).** Root `tsconfig.json` includes `**/*.ts`, which pulls in `functions/src/**` — those compile against `functions/node_modules`, which is **empty** (0 entries). Every functions file errors with TS2307. App-only code is clean. Fix: exclude `functions` from root tsconfig + `npm install` in `functions/`.
2. **`npm run lint` is broken.** `package.json:9` defines eslint, but eslint is not a devDependency and there is no eslint config file → npx fetches ESLint 10, which fails ("couldn't find eslint.config.js").
3. **New-user signup will be denied by Firestore rules.** `authService.ts:55-63` creates `usage/{uid}` **from the client**, but `firestore.rules:49-52` says `usage: allow write: if false`. Once these rules are deployed, every first sign-in throws permission-denied inside `ensureUserDoc` → caught by retry → user stuck at loading ("Firestore unreachable after retries", `RootNavigator.tsx:29-39`).
4. **Cashfree webhook signature verification will fail intermittently.** `cashfreeWebhook.ts:27` recomputes the HMAC over `JSON.stringify(req.body)` — a re-serialization of the parsed body, not the raw bytes Cashfree signed. Must use `req.rawBody`.
5. **`functions.config()` is past end-of-life.** All secrets are read via `functions.config()` (`generateAIResponse.ts:13`, `createCashfreeOrder.ts:29-30`, `verifyPayment.ts:18-19`, `cashfreeWebhook.ts:16`, `processPlantScan.ts:46`, `fetchWeather.ts`). The runtime-config API was shut down (March 2026) — these functions **cannot be deployed or run** until migrated to `defineSecret`/params (firebase-functions v5+/v6).
6. **`verifyPayment` can crash on missing usage doc.** `verifyPayment.ts:69-72` uses `batch.update(usageRef …)` — `update` throws if the doc doesn't exist (possible because client-side creation is rules-blocked, see #3).
7. **Premium copy vs enforcement contradictions** (see Partial #6/#7) — users who pay get less than advertised; daily local gate still applies to premium scans server-side never enforced.
8. **`processPlantScan.ts:75-100` parser bugs** (if ever used): `scientific_name` read from `details` (Plant.id v3 puts the latin name in `name`), `treatment.{chemical,biological,prevention}` cast to `string` though the API returns `string[]`, `isHealthy` computed from `health.is_healthy` at the wrong nesting level (`is_healthy` is under `result`, not `result.disease`).
9. **`getExpoPushTokenAsync()` without `projectId`** (`messaging.ts:35`) — in SDK 54 standalone builds this throws unless `extra.eas.projectId` is valid; it's currently the literal `"YOUR_EAS_PROJECT_ID"` (`app.json:69`).
10. **Splash hide race (minor).** `App.tsx:75-78` `setTimeout` callback marks fonts loaded after 5 s even if `Font.loadAsync` later resolves — benign but can flash unstyled text; also `Dimensions.get` at module scope (`App.tsx:6`) ignores rotation/foldables (app is portrait-locked, so low risk).
11. **`react-native-keyboard-aware-scroll-view@0.9.5`** is abandoned and known-glitchy on RN 0.81 — watch `KeyboardAwareView.tsx`.

### 2.5 SECURITY ISSUES

1. **CRITICAL — Plant.id API key ships in the app bundle.** `EXPO_PUBLIC_PLANT_ID_KEY` → `app.config.ts:10` → `extra.plantIdKey` → used in client fetch header (`plantIdentification.ts:171`). Anyone can extract it from the APK and drain your paid credits. Same pattern for OpenWeather (`weatherService.ts:7-10`; lower risk, but the project doc `lawnup.md` §16 explicitly says *never expose Plant.id keys*). Fix = route scans through `processPlantScan` (the function already exists).
2. **Client-enforced quotas only.** The actual scan gate is AsyncStorage state (`useScanFlow.ts:93-95`); clearing app data or patching the JS bundle gives unlimited scans against *your* paid Plant.id account. Server enforcement exists (`rateLimiter.ts`) but is on the unused path.
3. **Mock premium escape hatch.** `activateMockPremium` is exposed on the store (`subscriptionStore.ts:90`) and `setPlan('premium')` is callable client-side; `isPremiumActive()` trusts it (`:92-98`). Acceptable for dev, but ensure no production path can call them (currently gated by `__DEV__` only at the call site in PaywallScreen).
4. **No App Check.** `requireAppCheck` exists (`functions/src/middleware/authMiddleware.ts:10-14`) but is never used; callable functions accept any authenticated caller from any client.
5. **Firestore rules are good but drift from reality**: rules assume Cloud-Functions-written `usage`/`plant_scans`/`chat_history`; the client either writes them (usage — blocked, bug #3) or never does. Verify rules are actually **deployed** to the project (they exist only in repo).
6. **Hardcoded customer phone** `'9999999999'` sent to Cashfree (`createCashfreeOrder.ts:40`) — may violate Cashfree KYC/processing requirements; collect a real phone or omit per their API.
7. **Secrets hygiene is otherwise good**: `.env` is git-ignored (verified), `.env.example` documented, server keys live in functions config (must migrate, see bug #5), Firebase client config is public-safe.

### 2.6 DEPLOY BLOCKERS

| # | Blocker | Where |
|---|---|---|
| B1 | `extra.eas.projectId` placeholder `"YOUR_EAS_PROJECT_ID"` — EAS builds & push tokens fail | `app.json:69` |
| B2 | Functions can't build/deploy: empty `functions/node_modules`, `functions.config()` EOL, firebase-functions v4 (v1 API) | `functions/` |
| B3 | New-user signup permission-denied once rules deploy (usage doc, bug #3) | `authService.ts:55` vs `firestore.rules:49` |
| B4 | Production paywall is a no-op → app has monetization UI that does nothing (Play reviewers flag this) | `PaywallScreen.tsx:74-82` |
| B5 | Plants/scans not persisted — first restart looks like total data loss to users | `plantsStore.ts` |
| B6 | `targetSdkVersion 34` — Google Play requires **35** for new apps/updates since Aug 2025 | `app.json:63`, `android/gradle.properties:67-68` |
| B7 | No `google-services.json` in `android/` and no FCM credentials in EAS → remote push cannot work in release builds | `android/app/` |
| B8 | EAS env profiles reference `lawnup-dev`/`lawnup-staging`/`lawnup-prod` Firebase projects, but the app reads `EXPO_PUBLIC_FIREBASE_*` from `.env` only — env separation isn't actually wired | `eas.json:7-27`, `firebaseConfig.ts:22-30` |
| B9 | Exposed Plant.id key (Security #1) — shipping it is irreversible (any released APK leaks it) | `app.config.ts:10` |
| B10 | Play Store data-safety prerequisites missing: privacy policy URL, account deletion | Profile feature |

---

> **Pivot note (2026-06-10):** the phases below are the *original* deploy-oriented plan, retained for reference. Under the §0 strategy pivot the **active** work is the new **Phase A (MVP Polish)** and **Phase B (Provider Abstraction)** described just below. Phases 2 (monetization), 4 (pre-deploy), and the deploy-dependent parts of 3 are **PAUSED** until MVP stabilization.

### 🅰️ Phase A — MVP Polish & QA (ACTIVE NOW, Spark-compatible)

Pure frontend/UX + stability; no backend deploy dependency.

| # | Task | Area | Effort |
|---|---|---|---|
| A.0 | **Re-enable a working scan path for internal QA** — the app currently calls the undeployed `processPlantScan` function (broken on Spark). Route scans through the new provider abstraction (Phase B) with a **client-direct Plant.id provider** as the active runtime, keeping the server provider in code. Key read from non-public `PLANT_ID_KEY` via `app.config.ts` → `extra`. | scan | S–M |
| A.1 | HomeScreen polish; reduce clutter; premium feel | `home/` | M |
| A.2 | Camera + scan-confidence UX; ProcessingScreen polish; animation timing | `scan/` | M |
| A.3 | ScanResult hero immersion improvements | `scan/screens/ScanResultScreen.tsx` | M |
| A.4 | Onboarding clarity | `onboarding/` | M |
| A.5 | Spacing/typography refinement pass; responsiveness on real devices | theme + screens | M |
| A.6 | Loading states + empty states + error-state handling everywhere | shared `feedback/` | M |
| A.7 | Persistence + navigation edge-case + loading/error QA on real devices | cross-cutting | M |

### 🅱️ Phase B — Multi-Provider AI Architecture (ACTIVE NOW, local-only)

Resilient scan flow, failover, quota protection, future cost optimization. No prod deploy.

| # | Task | Files | Effort |
|---|---|---|---|
| B.1 | **Provider abstraction layer** — `PlantIdentificationProvider` interface (`identify(images) → normalized result`); a router that tries providers in order with failover + per-provider enable flags | new `src/services/scan/providers/` | M |
| B.2 | **Plant.id client provider** — wrap current client-direct logic behind the interface (active runtime for internal QA) | `providers/plantIdProvider.ts` | S |
| B.3 | **Plant.id server provider** — wrap the `processPlantScan` callable behind the same interface (retained; default at prod hardening) | `providers/plantIdServerProvider.ts` | S |
| B.4 | **PlantNet provider** — integrate PlantNet API + map its response to the normalized shape (needs PlantNet key) | `providers/plantNetProvider.ts` | M |
| B.5 | **OpenAI strategy** — define where OpenAI fits (disease explanation / care text / fallback identification) behind the abstraction; design doc + interface stub first | `providers/` + notes | M |
| B.6 | **Failover + quota policy** — order, retry/backoff, per-provider quota guards, telemetry on which provider served each scan | router | M |

---

## 3. Prioritized Roadmap to Deploy-Ready (original plan — partially PAUSED)

Ordering principle: **unblock the build system first → stop the data-loss/security bleed → connect the already-written backend → store compliance.** Effort: S ≤ ½ day, M = 1–2 days, L = 3+ days.

### Phase 1 — Critical fixes (must do; mostly independent, do in parallel)

| # | Task | Files | Effort | Depends on |
|---|---|---|---|---|
| 1.1 | Fix toolchain: exclude `functions` from root `tsconfig.json` `include`; add eslint (`eslint-config-expo`) + config; `cd functions && npm install`; make `tsc`, `lint`, `functions build` all pass | `tsconfig.json`, `package.json`, `functions/` | S | — |
| 1.2 | Upgrade functions to firebase-functions v6 (v2 API or v1+params) and migrate every `functions.config()` read to `defineSecret`/`defineString`; set secrets (`PLANT_ID_KEY`, `OPENAI_KEY`, `OPENWEATHER_KEY`, `CASHFREE_*`) via `firebase functions:secrets:set` | all `functions/src/**` | M | 1.1 |
| 1.3 | Fix signup vs rules conflict: move `usage/{uid}` creation server-side (auth `onCreate` trigger or inside `checkUsageLimit` upsert), or relax rules to allow one-time owner create | `authService.ts:52-64`, `firestore.rules:49-52`, new `functions/src/auth/onUserCreate.ts` | S | 1.2 |
| 1.4 | Persist My Plants to Firestore: write/read `users/{uid}/plants` (rules already allow), subscribe on login, keep Zustand as cache. Include `lastWateredAt`, `wateringFrequencyDays` schema already in `firestore.types.ts` | `plantsStore.ts`, new `src/features/my-plants/services/plantService.ts`, `ScanResultScreen.tsx:132-188`, `AddPlantScreen.tsx:65-110`, `EditPlantScreen.tsx`, `PlantDetailScreen.tsx` | M | — |
| 1.5 | Route scanning through `processPlantScan` Cloud Function (kills exposed key + enables server quota + scan history). Port the *client's* superior parsing/normalization into the function; return the same `ScanResult` shape; delete key from client bundle (`app.config.ts`, `apiKeys.ts`) | `functions/src/plant/processPlantScan.ts`, `src/services/api/plantIdentification.ts`, `useScanFlow.ts`, `app.config.ts` | L | 1.2, 1.3 |
| 1.6 | **Standardise quotas & pricing (DECIDED)**: free = **3 scans/week**, premium = **unlimited** (bypasses all scan limits). Pricing = **₹199/mo, ₹1990/yr**. Convert `subscriptionStore` daily-key logic (`scansToday`/`lastScanDateKey`/`todayKey()`) to week-key logic; delete conflicting `FREE_SCAN_LIMIT: 2` / `PREMIUM_SCAN_LIMIT: 20` monthly constants in `config.ts:8-10`; update `plans.ts:12-13,61,70`, `checkUsageLimit.ts:35` (weekly window), `verifyPayment.ts:70` (`scanLimit: -1`), paywall copy `PaywallScreen.tsx:22,184-187,208` — incl. badge math: annual saves **~17%** vs monthly (₹1990 vs ₹2388, ≈₹166/mo), not "SAVE 44%"/"₹83/mo" | listed | S | — |
| 1.7 | Set real EAS `projectId`; bump `targetSdkVersion`/`compileSdkVersion` to 35; verify `expo prebuild`/gradle build | `app.json`, `android/gradle.properties`, `eas.json` | S | — |

### Phase 2 — Complete partial features (dependency order) — ⏸️ PAUSED (monetization deferred)

| # | Task | Files | Effort | Depends on |
|---|---|---|---|---|
| 2.1 | **Payments end-to-end (DECIDED: RevenueCat + Play Billing, NOT Cashfree)**: add `react-native-purchases`; create Play Console subscription products (`lawnup_premium_monthly` ₹199, `lawnup_premium_annual` ₹1990) + RevenueCat "premium" entitlement; wire Paywall CTA → `Purchases.purchasePackage()` → `setPlan('premium')`; RevenueCat webhook → new Cloud Function syncing `subscriptions/{uid}` + `users.subscription` (renewals/cancellations/expiry handled by RC events); remove mock-premium path from production; **park Cashfree**: remove `createCashfreeOrder`/`verifyPayment`/`cashfreeWebhook` exports from `functions/src/index.ts:10-12` so they are never deployed (keep source for future web checkout) | `PaywallScreen.tsx`, `package.json`, new `functions/src/subscription/revenuecatWebhook.ts`, `functions/src/index.ts`, `ProfileNavigator.tsx`, `navigation/types.ts` | L | 1.2, 1.6 |
| 2.2 | **Subscription lifecycle**: handled by RevenueCat webhook events (EXPIRATION, CANCELLATION, RENEWAL) from 2.1 — no custom scheduled downgrade job needed; client refreshes entitlement via `Purchases.getCustomerInfo()` on app start | covered by 2.1 | S | 2.1 |
| 2.3 | **AI Plant Doctor client (DECIDED: v1.1 fast-follow — does NOT block launch)**: build ChatScreen UI (list, input, typing state) on existing `chatStore`, call `generateAIResponse` wrapper, load history from `users/{uid}/chat_history`; register screen; chat quota UX. Until then keep the screen unregistered (it already is) and remove the AI Doctor row from paywall copy or mark "coming soon" | `ChatScreen.tsx`, `chatStore.ts`, `MainTabNavigator.tsx`, `navigation/types.ts` | L (post-launch) | 1.2, 1.4 |
| 2.4 | **Scan history**: written server-side by 1.5; add history list UI (Profile → History) reading `plant_scans` | new screen, `ProfileNavigator.tsx` | M | 1.5 |
| 2.5 | **Push reminders**: store native FCM token via `getDevicePushTokenAsync` (or keep Expo tokens and send via Expo Push API from the function); mirror reminders to `users/{uid}/reminders` with `nextReminderAt`/`isActive` when plants are saved/watered; keep local notifications as offline fallback | `messaging.ts`, `notificationScheduler.ts`, `plantService.ts`, `functions/src/reminders/sendReminder.ts` | M | 1.4, B7 |
| 2.6 | Remove dead code & dead controls: `plantValidation.ts` pass-through, unused nav param lists or register the screens, Profile Settings button (implement or hide), unused ImageKit config | various | S | — |

### Phase 3 — Missing essentials — ◑ PARTIAL (UX-side OK now; deploy/billing items paused)

> Now-eligible (no deploy dependency): **3.4** (error/empty states — overlaps Phase A.6) and **3.6** (local tests). Paused until production hardening: 3.1 account deletion, 3.2 privacy/ToS hosting, 3.3 Google Sign-In (needs SHA-1/console), 3.5 App Check, 3.7 scheduled reset.

| # | Task | Files | Effort | Depends on |
|---|---|---|---|---|
| 3.1 | Account deletion (re-auth → delete Firestore subtree via callable → `user.delete()`) + sign-out-everywhere; required for Play | Profile, new function | M | 1.3 |
| 3.2 | Privacy policy + Terms links in Profile & Play listing (host static pages) | Profile screen | S | — |
| 3.3 | Google Sign-In (MVP-listed) via `@react-native-google-signin/google-signin` or expo-auth-session + `signInWithCredential` (import already present) | `authService.ts`, Login/Landing screens | M | 1.7 (SHA-1 in Firebase) |
| 3.4 | Error states & empty states pass: offline banners, Firestore listener error handling, paywall failure toasts | shared components | M | Phase 2 |
| 3.5 | App Check (Play Integrity) on callable functions — `requireAppCheck` already written | `firebaseConfig.ts`, `authMiddleware.ts`, each function | M | 1.2 |
| 3.6 | Minimal test safety net: unit tests for `subscriptionStore` reset logic, `reminderService.getWaterInfo`, Plant.id response parser; one Maestro/Detox smoke flow (login → scan mock → save) | new `__tests__/` | M | 1.1 |
| 3.7 | Monthly usage reset robustness: scheduled monthly reset function (don't rely on lazy reset in `rateLimiter.ts:28-36`) | new function | S | 1.2 |

### Phase 4 — Pre-deploy checklist — ⏸️ PAUSED (no production deploy yet)

1. **Environment (DECIDED: single Firebase project for MVP)** (S): confirm which project the current `.env` `EXPO_PUBLIC_FIREBASE_PROJECT_ID` points at and treat it as the one live env; remove the unused `lawnup-dev`/`lawnup-staging` profiles (or collapse to `development`+`production` pointing at the same project) in `eas.json:4-27`; generate its `google-services.json`. Multi-env split is post-MVP.
2. **Backend deploy** (S): `firebase deploy --only firestore:rules,firestore:indexes,storage,functions` to the live project; smoke-test each callable from a staging build; confirm `sendReminder` scheduler job is created; configure the RevenueCat webhook URL (from 2.1) in the RC dashboard.
3. **Push credentials** (S): upload FCM service-account key to EAS (`eas credentials`); add `google-services.json`; test a real device push.
4. **Build & optimize** (M): `eas build --profile production --platform android` (AAB); verify Hermes, ProGuard/shrinkResources; strip `console.*` in release (babel `transform-remove-console` keeping `error`); confirm `DevOverlay`/mock premium unreachable; app size sanity check.
5. **Store submission** (M): Play Console — create the two subscription products + base plans/offers (₹199/mo, ₹1990/yr) and link them in RevenueCat; data-safety form (camera images, location/city, email → declare), privacy policy URL, content rating, internal testing track via `eas submit` (service-account path already configured in `eas.json:29-36`), staged rollout. Note: IAP purchases can only be tested on a build distributed through a Play track (license testers) — plan the internal-testing cycle for 2.1 QA.
6. **Monitoring** (S/M): Sentry (`sentry-expo`) for client crashes (logger hooks at `logger.ts` make this a drop-in), Firebase Functions logs + alerting on error rate, PostHog dashboards for `scan_failed` / `quota_hit` / `subscription_converted`, billing budget alerts on Firebase + Plant.id + OpenAI.
7. **Domain/SSL**: not required for the mobile app itself; needed only for privacy-policy hosting (use Firebase Hosting on the same project — free SSL) and optionally a custom auth domain.

### Recommended deployment setup for this stack

You don't need Vercel/Railway/Render — **the backend is Firebase; keep it there.** The right "deployment" shape is:

- **App**: EAS Build (production profile, AAB) → Google Play internal testing → production. iOS later via the same `eas.json`.
- **Backend**: Firebase Cloud Functions (asia-south1, already chosen), Firestore + Storage with the repo's rules/indexes deployed. Use **Firebase projects per environment** (`lawnup-dev/-staging/-prod` as `eas.json` already anticipates) and the **Blaze plan** on prod (required for outbound calls to Plant.id/OpenAI/Cashfree).
- **Secrets**: client-safe values via EAS env vars; server secrets via `firebase functions:secrets:set` (after the 1.2 migration). Plant.id/OpenAI/Cashfree keys live **only** server-side.
- **Exact first-deploy sequence**: 1.1→1.2→1.3 → `firebase use lawnup-prod` → deploy rules/indexes → deploy functions → set Cashfree webhook → EAS credentials (FCM) → `eas build` → internal track → smoke test signup/scan/pay/push → promote.

---

## 4. Resolved Decisions (owner, 2026-06-10)

| # | Decision |
|---|---|
| 1 | **Free tier = 3 scans/week. Premium = unlimited scans.** Remove all conflicting limits (`config.ts` monthly 2/20, `plans.ts` 5/day, server 5/20 monthly) and standardise everywhere → task 1.6 |
| 2 | **Pricing = ₹199/month, ₹1990/year** — consistent across client, paywall, backend, functions → task 1.6 |
| 3 | **Payments = RevenueCat + Play Billing / App Store IAP.** No Cashfree for in-app digital subscriptions at launch (Play rejection risk). Cashfree source parked for future web checkout; its functions removed from deploy → task 2.1 |
| 4 | **AI Doctor does not block v1** — fast-follow in v1.1 after scan experience stabilises → task 2.3 (post-launch) |
| 5 | **Scans move server-side** (`processPlantScan`) — security, quota control, logging > 1–2 s latency. Client-direct Plant.id key removed from bundle → task 1.5 |
| 6 | **Single Firebase environment for MVP.** Confirm current `.env` project mapping; clean unused dev/staging references in `eas.json`. Multi-env after MVP stabilisation → Phase 4.1 |
| 7 | **Weather stays client-side** (OpenWeather free-tier key exposure = accepted risk for MVP) — no change to `weatherService.ts` |
| 8 | **Premium bypasses daily/weekly scan gates completely** (`subscriptionStore.ts:110-115` behaviour is intended). Server-side fair-use/abuse protection can come later |

### Decision impact summary
- `config.ts` `FREE_SCAN_LIMIT`/`PREMIUM_SCAN_LIMIT` (monthly) are **deleted**, replaced by a single weekly constant (e.g. `FREE_WEEKLY_SCAN_LIMIT = 3` in `plans.ts`); `FREE_DAILY_SCAN_LIMIT` is removed.
- `subscriptionStore` switches from day-key to **week-key** reset; `scansToday`/`canScanToday`/`scansRemainingToday` become weekly equivalents (persisted key migration: stale `lastScanDateKey` simply resets the counter — safe).
- Server `checkUsageLimit` + `rateLimiter` enforce the same 3/week (free) and unlimited (premium) — single source of truth lives server-side once 1.5 lands.
- `verifyPayment`/`createCashfreeOrder`/`cashfreeWebhook` are **not deployed** at launch; subscription state is written by the new RevenueCat webhook function instead.
- Paywall comparison table row "AI Doctor — Included" should be softened to "Coming soon" until v1.1 (avoid selling an absent feature in review).

---

*Audit complete; decisions locked. Implementation starts with Phase 1 (tasks 1.1–1.7). No application code has been changed yet.*
