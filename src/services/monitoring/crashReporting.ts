/**
 * crashReporting — error-monitoring seam (Sentry).
 *
 * Written WITHOUT importing `@sentry/react-native` yet, so the bundle stays
 * green until the native package is installed (see docs/sentry-setup.md and the
 * Sentry task). Every function is a safe no-op until `CRASH_REPORTING_READY` and
 * the TODO blocks are filled in. `logger` already forwards error-level logs here
 * via `reportError`, so once wired, handled errors flow to Sentry automatically.
 */

// Flip true once @sentry/react-native is installed + configured.
export const CRASH_REPORTING_READY = false;

/** Initialise the SDK once at app boot. */
export function initCrashReporting(): void {
  if (!CRASH_REPORTING_READY) return;
  // TODO(sentry):
  // import * as Sentry from '@sentry/react-native';
  // Sentry.init({
  //   dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  //   enableInExpoDevelopment: false,
  //   debug: false,
  //   tracesSampleRate: 0.2,
  // });
}

/** Associate subsequent events with a user (call after auth resolves / on sign-out with null). */
export function setCrashUser(user: { id: string; email?: string } | null): void {
  if (!CRASH_REPORTING_READY) return;
  // TODO(sentry): Sentry.setUser(user ? { id: user.id, email: user.email } : null);
}

/** Report a handled error. Wired into logger error-level output. */
export function reportError(message: string, err?: unknown): void {
  if (!CRASH_REPORTING_READY) return;
  // TODO(sentry):
  // if (err instanceof Error) Sentry.captureException(err, { extra: { message } });
  // else Sentry.captureMessage(message, 'error');
}

/** Wrap the root component for automatic crash capture (optional). */
export function wrapWithCrashReporting<T>(RootComponent: T): T {
  if (!CRASH_REPORTING_READY) return RootComponent;
  // TODO(sentry): return Sentry.wrap(RootComponent as any) as T;
  return RootComponent;
}
