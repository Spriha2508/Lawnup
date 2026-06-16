# Sentry — Setup & Implementation Guide

Crash/error monitoring goes through one seam:
`src/services/monitoring/crashReporting.ts` (scaffolded, no-op until wired). The
logger already forwards every error-level log to `reportError`, and app boot
calls `initCrashReporting()` — so once the SDK is wired, handled errors and
crashes flow automatically.

> Do **not** install until the native setup stage — `@sentry/react-native` is a
> native module and requires a rebuild.

## Steps (native setup stage)
1. Create a Sentry project (platform: React Native) → copy the **DSN**.
2. `npx expo install @sentry/react-native`
3. Add the Sentry Expo config plugin to `app.json` `plugins` (handles native).
4. Set `EXPO_PUBLIC_SENTRY_DSN` in `.env`.
5. Fill the `TODO(sentry)` blocks in `crashReporting.ts`:
   - `initCrashReporting` → `Sentry.init({ dsn, tracesSampleRate, … })`
   - `setCrashUser` → `Sentry.setUser(...)` (call from auth listener on login / null on sign-out)
   - `reportError` → `captureException` / `captureMessage`
   - `wrapWithCrashReporting` → `Sentry.wrap(App)` (optional; wrap the root export)
6. Set `CRASH_REPORTING_READY = true`.
7. Wire `setCrashUser` in the auth state listener (RootNavigator) so events are attributed.
8. **Rebuild** the dev/EAS client.
9. (CI) add the Sentry auth token for source-map upload — not required to capture errors.

## Already wired (this scaffold)
- ✅ Seam: `initCrashReporting / setCrashUser / reportError / wrapWithCrashReporting`.
- ✅ `logger` error-level → `reportError` (all `logger.*.error` calls flow through).
- ✅ `initCrashReporting()` called at app boot.
- ⬜ Install + DSN + fill TODOs + flip `CRASH_REPORTING_READY` + rebuild (the Sentry task).

## Alternative: Firebase Crashlytics
If you prefer Crashlytics (you already use Firebase): it needs
`@react-native-firebase/app` + `/crashlytics` (the app currently uses the
Firebase **JS** SDK, so this adds the RN-Firebase native layer). Sentry is the
lighter add given the current stack — recommended.
