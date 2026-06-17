/**
 * Google Sign-In — native picker → Firebase credential exchange.
 *
 * Activates once EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set AND a native build
 * includes @react-native-google-signin (rebuild required). Until then the
 * Landing button shows a "coming soon" notice. Setup: docs/google-signin-setup.md.
 */
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from './authService';
import type { UserDoc } from '../../../types/firestore.types';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const GOOGLE_AUTH_READY = WEB_CLIENT_ID.length > 0;

let configured = false;

/** Configure once at app start (no-op until the Web client ID is set). */
export function configureGoogleSignIn(): void {
  if (!GOOGLE_AUTH_READY || configured) return;
  try {
    // webClientId MUST be the OAuth **Web** client (type 3 in google-services.json)
    // or Firebase rejects the credential. The native picker is shown by signIn();
    // we clear the Google session on logout (signOutGoogle) so account-switching
    // and re-login always re-prompt the account chooser.
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  } catch {
    // Native module not linked (running JS without a rebuild) — stay off.
  }
}

export type GoogleSignInOutcome =
  | { status: 'success'; user: UserDoc }
  | { status: 'cancelled' }
  | { status: 'error'; code: string; message: string };

/** Map any failure to a stable code + a user-facing message. */
function toError(e: any): Extract<GoogleSignInOutcome, { status: 'error' }> {
  // Firebase: the email already exists via a different provider (e.g. email/password).
  if (e?.code === 'auth/account-exists-with-different-credential') {
    return {
      status: 'error',
      code: 'duplicate_account',
      message:
        'An account with this email already exists. Sign in with your email and password instead.',
    };
  }
  if (e?.code === 'auth/network-request-failed') {
    return { status: 'error', code: 'network', message: 'No internet connection. Check your network and try again.' };
  }

  if (isErrorWithCode(e)) {
    switch (e.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        // A thrown cancellation (older paths) — treat as a soft cancel.
        return { status: 'error', code: 'cancelled', message: '' };
      case statusCodes.IN_PROGRESS:
        return { status: 'error', code: 'in_progress', message: 'A sign-in is already in progress.' };
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return {
          status: 'error',
          code: 'play_services',
          message: 'Google Play services are unavailable or out of date on this device.',
        };
      default:
        break;
    }
  }

  // Network-ish messages that don't carry a code.
  if (/network|timeout|offline|connection/i.test(e?.message ?? '')) {
    return { status: 'error', code: 'network', message: 'No internet connection. Check your network and try again.' };
  }

  return {
    status: 'error',
    code: 'unknown',
    message: 'Couldn’t sign in with Google. Please try again, or continue with email.',
  };
}

/**
 * Run the native Google picker and exchange the ID token with Firebase. On
 * success the auth state listener (RootNavigator) picks up the session and
 * navigates into the app automatically.
 *
 * New users get a Firestore doc created (ensureUserDoc); returning users get
 * their existing doc. Cancellation, in-progress, Play-services, network and
 * duplicate-account failures are all surfaced distinctly via the outcome.
 */
export async function signInWithGooglePrompt(): Promise<GoogleSignInOutcome> {
  if (!GOOGLE_AUTH_READY) return { status: 'error', code: 'not_configured', message: 'google_not_configured' };
  try {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) return { status: 'cancelled' };
    if (!isSuccessResponse(response)) {
      return { status: 'error', code: 'no_id_token', message: 'Couldn’t complete sign-in. Please try again.' };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return { status: 'error', code: 'no_id_token', message: 'Couldn’t complete sign-in. Please try again.' };
    }

    const user = await signInWithGoogle(idToken);
    return { status: 'success', user };
  } catch (e: any) {
    const mapped = toError(e);
    // A thrown cancellation is not an error to the user.
    if (mapped.code === 'cancelled') return { status: 'cancelled' };
    return mapped;
  }
}

/**
 * Clear the native Google session. Call on logout / account deletion so the next
 * Google sign-in re-shows the account picker (enables account switching). Safe to
 * call when Google was never used or the module isn't linked — fully swallowed.
 */
export async function signOutGoogle(): Promise<void> {
  if (!GOOGLE_AUTH_READY) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // Never block app logout on the Google session teardown.
  }
}
