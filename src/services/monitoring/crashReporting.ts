/**
 * crashReporting — error monitoring (Sentry).
 *
 * Activates once EXPO_PUBLIC_SENTRY_DSN is set AND a native build includes
 * @sentry/react-native (rebuild required). Until the DSN is present every call
 * is a safe no-op. The logger forwards error-level logs here via `reportError`,
 * so handled errors flow to Sentry automatically once live. Setup:
 * docs/sentry-setup.md.
 */
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export const CRASH_REPORTING_READY = DSN.length > 0;

let initialised = false;

/** Initialise the SDK once at app boot. */
export function initCrashReporting(): void {
  if (!CRASH_REPORTING_READY || initialised) return;
  try {
    Sentry.init({
      dsn: DSN,
      // Keep transaction sampling modest; errors are always captured.
      tracesSampleRate: 0.2,
      enabled: !__DEV__,
    });
    initialised = true;
  } catch {
    // Native module not linked (JS without a rebuild) — stay off.
  }
}

/** Associate events with a user (null on sign-out). */
export function setCrashUser(user: { id: string; email?: string } | null): void {
  if (!CRASH_REPORTING_READY) return;
  try {
    Sentry.setUser(user ? { id: user.id, email: user.email } : null);
  } catch {
    /* not linked */
  }
}

/** Report a handled error. Wired into logger error-level output. */
export function reportError(message: string, err?: unknown): void {
  if (!CRASH_REPORTING_READY) return;
  try {
    if (err instanceof Error) Sentry.captureException(err, { extra: { message } });
    else Sentry.captureMessage(message, 'error');
  } catch {
    /* not linked */
  }
}

/** Wrap the root component for automatic crash capture (optional). */
export function wrapWithCrashReporting<T>(RootComponent: T): T {
  if (!CRASH_REPORTING_READY) return RootComponent;
  try {
    return Sentry.wrap(RootComponent as any) as T;
  } catch {
    return RootComponent;
  }
}
