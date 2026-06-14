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

### H2 — Scan/message limits are enforced client-side only (bypassable)
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

### M2 — No Settings screen
**Where:** (none — no `*setting*` file exists)
**Issue:** There is no Settings journey. Profile exposes Edit profile / Reminders / Scan history / Help, and "Appearance (dark mode)" is a "SOON" placeholder (`ProfileScreen.tsx:162`). Missing: notification preferences, account deletion, theme toggle, privacy/data controls.
**Impact:** Common app-store / user expectations (notification control, account deletion) are absent. Account deletion in particular is often a store-review requirement.
**Fix:** Add a Settings screen with at least notification toggle and account deletion before public launch.

### M3 — Quota-exhausted chat jumps across tabs to the Paywall
**Where:** `src/features/ai-doctor/screens/ChatScreen.tsx:96`
**Issue:** When the daily message limit is hit, the app does `navigation.navigate('Profile', { screen: 'Paywall' })` — jumping from the Chat tab into the Profile tab's stack. Functional, but disorienting (the user "loses" the Chat tab context).
**Fix:** Present the Paywall as a modal over the current tab, or show an inline upgrade prompt in Chat.

### M4 — Dr. Banyan AI replies disabled (no OpenAI key) — silent local fallback
**Where:** `src/services/ai/openaiClient.ts`, `app.config.ts:21`, `.env:34` (`OPENAI_API_KEY=` empty)
**Issue:** With no key, `isOpenAIConfigured()` is false and Chat silently uses the local responder. Replies are canned/limited and the user isn't told they're not getting the full AI. (Wiring is complete; just needs the key — currently in progress.)
**Fix:** Set `OPENAI_API_KEY` in `.env` + restart. Optionally surface a subtle "limited mode" indicator when unconfigured.

---

## 🟢 Low

### L1 — 14 ESLint errors in unused dead-code files
`src/shared/components/motion/AnimatedSplash.skia.tsx` (13) and `LeafBurst.skia.tsx` (1) — "Cannot call impure function during render" / inline-function rules. These `.skia` alternates are **not imported** anywhere (the app uses `AnimatedSplash.tsx`), so no runtime impact. Delete the dead files or fix to clear the error count.

### L2 — Declared-but-unimplemented routes
`ChatHistory` and `SubscriptionSuccess` are declared in `navigation/types.ts` but have no screen and aren't registered. **Verified nothing navigates to them**, so harmless today — but they'll crash if a future caller uses them. Either implement or remove from types.

### L3 — 148 ESLint warnings (code hygiene)
Reanimated "ref access / impure during render" warnings (e.g. `PlantCard.tsx`), unused imports, `require()`-style imports, a duplicate-import warning. Non-blocking; worth a cleanup pass. 4 are auto-fixable via `eslint --fix`.

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
