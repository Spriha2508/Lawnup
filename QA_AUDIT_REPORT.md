# LawnUp — End-to-End QA Audit

**Date:** 2026-06-14
**Branch:** `redesign/phase1-design-system-auth`
**Build state:** TypeScript `tsc --noEmit` **clean (0 errors)**. ESLint: **14 errors, 148 warnings** (all 14 errors in unused dead-code files — see L1).

**Methodology:** Static code-path audit of every user journey (splash → auth → onboarding → scan → plant detail → chat → profile → premium → settings), plus project-wide typecheck and lint. This is a code-level trace of the actual flows, not live on-device interaction — items marked *needs device verification* should be confirmed on a device.

**Scope checked:** RootNavigator gating, AuthNavigator, OnboardingNavigator, ScanNavigator (Camera/Processing/Result/Save), PlantsNavigator (MyPlants/PlantDetail/Add/Edit/Tasks/Soil/Light), ChatNavigator (Dr. Banyan), ProfileNavigator (Profile/EditProfile/ScanHistory/Help/Paywall), Reminders, subscription store + gating.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 2 |
| 🟡 Medium | 4 |
| 🟢 Low | 5 |

---

## 🔴 Critical

### C1 — Onboarding can hang permanently on the final step (no error handling) — ✅ FIXED (2026-06-14)
**Resolution:** `handleFinish` no longer awaits the server write to gate entry. It sets `onboardingComplete` locally and enters the app immediately; the Firestore write runs in the background (offline-queued, retried on reconnect) with a `catch` that logs hard failures. The hang is now impossible regardless of network state. Commit below.

**Where:** `src/features/onboarding/screens/GoalScreen.tsx:32-40` (`handleFinish`)
**Issue:** The final onboarding write has no `try/catch`:
```ts
setIsLoading(true);
await updateDoc(doc(db, `users/${user.uid}`), { onboardingComplete: true });
setUser({ ...user, onboardingComplete: true });
setIsLoading(false);
```
If `updateDoc` **rejects** (permission error, etc.), the function throws → `setIsLoading(false)` never runs → the button is stuck on "Setting up your garden…" and `onboardingComplete` is never set. If the device is **offline**, the Firestore write promise stays *pending* (it only resolves once it reaches the server), so the button hangs the same way until reconnect. Either way there is **no error message and no retry**, and because `onboardingComplete` stays false the user is bounced back into onboarding on every relaunch.
**Impact:** A new user on flaky/no connectivity can be permanently locked out of the app — this gates first-run for every new account.
**Fix:** Wrap in `try/catch/finally`; always reset `isLoading` in `finally`; show a retry/error on failure. Consider not blocking entry on the server write (optimistically set local `onboardingComplete` and let the write sync).

---

## 🟠 High

### H1 — Premium purchase is a no-op outside dev builds
**Where:** `src/features/subscription/screens/PaywallScreen.tsx:82-90` (`handleUpgrade`)
**Issue:** The "Start Premium" CTA only does anything `if (__DEV__)` (mock activate + go back). In a production build the button does **nothing** — no payment, no confirmation, no navigation. The declared `SubscriptionSuccess` route (`navigation/types.ts:62`) has no screen and is never used.
**Impact:** The entire monetization journey is non-functional in a release build. (Known/intended for internal-testing — RevenueCat/Cashfree deferred — but must be tracked before any paid launch.)
**Fix:** Integrate the payment provider and build/ wire `SubscriptionSuccess`, or disable/relabel the CTA in non-dev builds so it doesn't look broken.

### H2 — Scan/message limits are enforced client-side only (bypassable) — ⚙️ PARTIALLY ADDRESSED (2026-06-14)
**Done now (in-bounds for client-side mode):** Added a `config.BACKEND_ENABLED` flag (env `EXPO_PUBLIC_BACKEND_ENABLED`, default **false**). `RootNavigator` now **skips the `checkUsageLimit()` call entirely** when the backend is disabled — no more doomed per-login network round-trip or fail-open warning (also resolves L4). The local-only enforcement is now the explicit, intentional path (counters are preserved across sessions, hydration marked done immediately so gated screens render). When the backend ships, set the flag to `true` and the original server-authoritative hydration runs unchanged.
**Still open (requires the deferred backend — NOT done, would violate the locked client-side decision / needs approval):** local quotas remain resettable by clearing app storage / reinstalling. Tamper-proof enforcement needs the `checkUsageLimit` Function deployed + server-side write rules. Tracked for the backend-hardening phase.

---

**Original finding:**

**Where:** `src/navigation/RootNavigator.tsx:109-126`, `subscriptionStore.ts`
**Issue:** `checkUsageLimit()` calls a Cloud Function that isn't deployed in the current client-side mode, so it fails on every sign-in and the code **fails open** (`setUsageHydrated(true)`). All real enforcement is the local AsyncStorage counters in `subscriptionStore`. Those reset if the user clears app storage / reinstalls.
**Impact:** Free scan and message quotas can be reset by clearing local data; server limits aren't enforced. Also adds a failing network round-trip + warning log on every login.
**Fix:** Deploy/enable the usage Cloud Function before relying on quotas for monetization, or gate the call behind a "backend enabled" flag to avoid the dead request in client-side mode.

---

## 🟡 Medium

### M1 — Chat charges a daily message credit even when the AI reply fails — ✅ FIXED (2026-06-14)
**Resolution:** Moved `sub.incrementMessage()` out of the pre-call path and into the `try` block, immediately after the successful assistant reply is appended. Failed/aborted/timed-out replies no longer consume quota. The `canSendMessageToday()` gate still runs before sending, and the `isTyping` guard prevents concurrent double-spend. Commit below.

**Where:** `src/features/ai-doctor/screens/ChatScreen.tsx:95-125`
**Issue:** `sub.incrementMessage()` (L99) runs **before** `await askBanyan(...)` (L108). If the reply throws (network/timeout/HTTP error), the catch block shows an error but the credit is already consumed.
**Impact:** A free user (20/day) burns quota on failed requests with no successful answer. (Contrast: the scan flow correctly increments only on success — `useScanFlow.ts:162`.)
**Fix:** Move `incrementMessage()` to after a successful reply, or refund on failure.

### M2 — No Settings screen — ✅ FIXED (2026-06-14)
**Resolution:** Added `SettingsScreen` (`features/profile/screens/SettingsScreen.tsx`), registered in `ProfileNavigator`, reachable from Profile → Account → **Settings** (replaced the dead "Appearance (dark mode)" placeholder row; dark-mode now sits inside Settings as an honest "SOON"). Functional contents: **Notifications** (a watering-reminders toggle that reflects real OS permission, re-checked on focus, requests on enable, routes to system Settings when blocked/disable), **Appearance** (dark-mode "SOON" — light-only is locked this pass), and **Account** — **Sign out** + **Delete account**. Delete is the store-review-critical gap: added `authStore.deleteAccount()` (deletes the Firestore profile doc then the Firebase Auth user, with a typed `RECENT_LOGIN_REQUIRED` path that prompts re-auth), behind a destructive confirm dialog. **Known limitation (client-side mode):** the plants subcollection isn't recursively deleted — needs a Cloud Function; tracked for backend hardening. Verified: tsc clean, web bundle compiles. Commit below.
**Where:** (none — no `*setting*` file exists)
**Issue:** There is no Settings journey. Profile exposes Edit profile / Reminders / Scan history / Help, and "Appearance (dark mode)" is a "SOON" placeholder (`ProfileScreen.tsx:162`). Missing: notification preferences, account deletion, theme toggle, privacy/data controls.
**Impact:** Common app-store / user expectations (notification control, account deletion) are absent. Account deletion in particular is often a store-review requirement.
**Fix:** Add a Settings screen with at least notification toggle and account deletion before public launch.

### M3 — Quota-exhausted chat jumps across tabs to the Paywall — ✅ FIXED (2026-06-14)
**Resolution:** Root-caused as app-wide, not chat-only — **every** Paywall entry point (Home, ScanLanding, Processing, ScanResult×3, Camera, PlantDetail, Chat, Profile) did `navigate('Profile', {screen:'Paywall'})` because Paywall lived only in the Profile stack. Hoisted `Paywall` to a **root-level modal** (`RootNavigator`, `presentation:'modal'`), removed it from `ProfileNavigator`, and routed all 9 call sites through a new `openPaywall(navigation)` helper (`navigation/openPaywall.ts`) — `navigate('Paywall')` now bubbles up the tree and presents as an overlay over the current tab, no tab switch. Also removes the fragile `getParent()`/`getParent().getParent()` chains. Verified: tsc clean, web bundle compiles. Commit below.
**Where:** `src/features/ai-doctor/screens/ChatScreen.tsx:96`
**Issue:** When the daily message limit is hit, the app does `navigation.navigate('Profile', { screen: 'Paywall' })` — jumping from the Chat tab into the Profile tab's stack. Functional, but disorienting (the user "loses" the Chat tab context).
**Fix:** Present the Paywall as a modal over the current tab, or show an inline upgrade prompt in Chat.

### M4 — Dr. Banyan AI replies disabled (no OpenAI key) — silent local fallback
**Where:** `src/services/ai/openaiClient.ts`, `app.config.ts:21`, `.env:34` (`OPENAI_API_KEY=` empty)
**Issue:** With no key, `isOpenAIConfigured()` is false and Chat silently uses the local responder. Replies are canned/limited and the user isn't told they're not getting the full AI. (Wiring is complete; just needs the key — currently in progress.)
**Fix:** Set `OPENAI_API_KEY` in `.env` + restart. Optionally surface a subtle "limited mode" indicator when unconfigured.

---

## 🟢 Low

### L1 — 14 ESLint errors in unused dead-code files — ✅ FIXED (2026-06-14)
**Resolution:** `AnimatedSplash.skia.tsx` (13 errors) was genuinely unreferenced → **deleted**. `LeafBurst.skia.tsx` (1 error) is NOT dead — `LeafBurst.tsx:19` conditionally `require()`s it on the Skia path — so instead of deleting, fixed the lint error in place (`useMemo(makeSeeds, [])` → `useMemo(() => makeSeeds(), [])`, behavior-identical). **Project ESLint errors: 14 → 0.** Commit below.

### L2 — Declared-but-unimplemented routes — ✅ FIXED (2026-06-14)
**Resolution:** Removed the dead `ChatHistory` (from `ChatStackParamList`) and `SubscriptionSuccess` (from `ProfileStackParamList`) type declarations — neither had a screen or any navigator/caller. Commit below.

### L3 — ESLint warnings (code hygiene) — ⚙️ REDUCED 148 → 131 (2026-06-14)
**Done:** Ran `eslint --fix` (array-type, duplicate-import merges) and manually cleared the unambiguous ones — unused imports (`GoogleAuthProvider`, `signInWithCredential`, `ScrollView`, `Rect`, `G`, `View`), an unused `tick` binding (`const [, setTick]`), an unused catch binding (`catch {}`), a `type Orb`→`OrbSpec` redeclare clash, and two ternary-as-statement expressions → `if/else`. tsc clean, 0 errors, web bundle compiles.
**Intentionally left (131 remaining):** **92 `react-hooks/refs`** + **4 `react-hooks/immutability`** + **4 `set-state-in-effect`** + **2 `exhaustive-deps`** are Reanimated UI-thread patterns and intentional effects — "fixing" them blindly risks breaking animations/behavior; **27 `no-require-imports`** are legitimate RN asset/lazy `require()`s (fonts, images, `skiaSafe` conditional load) that *must* stay `require()`. Plus 1 unused `route` in ScanResult (removing cascades into `useRoute`/`Route`/`RouteProp` for one warning — not worth the risk) and 1 axios named-export advisory. These warrant a focused, per-component Reanimated review rather than a blanket sweep.

### L4 — `checkUsageLimit` dead network call every login
Covered functionally under H2 — in client-side mode this always fails and logs a warning on each sign-in. Cosmetic/log-noise until the backend is enabled.

### L5 — Camera permission recovery — needs device verification
`notificationScheduler.ts` and the camera hook handle permission request + `Linking.openSettings()` fallback in code, but the permanently-denied → re-enable flow and local notification delivery should be confirmed on a real device (not testable statically). Memory also notes CTA tap-reliability was never device-verified.

---

## Journeys that passed review (no defects found)

- **Splash → app handoff:** "Scan to Bloom" sequence; UI-thread, first-frame safe, `onDone` fires once.
- **Auth gating:** `RootNavigator` + `authStore.setUser` correctly clears `isLoading`; 10s safety timeout; sign-out tears down plant subscription + clears caches.
- **Scan flow:** correct weekly/monthly tier gate; offline pre-flight; quality gate; **charges quota only on success**; user-friendly error mapping.
- **Subscription logic:** tier-aware scan (week/month) + daily message quotas with correct period-key resets; persisted at store v3.
- **Profile:** stats, achievements, all nav rows wired; settings placeholders shown as "SOON" (no dead taps); sign-out works.
- **Reminders:** notification permission request + scheduling/cancellation implemented.
