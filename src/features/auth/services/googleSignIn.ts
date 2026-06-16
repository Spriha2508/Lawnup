/**
 * Google Sign-In — native picker → Firebase credential exchange.
 *
 * Activates once EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set AND a native build
 * includes @react-native-google-signin (rebuild required). Until then the
 * Landing button shows a "coming soon" notice. Setup: docs/google-signin-setup.md.
 */
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from './authService';
import type { UserDoc } from '../../../types/firestore.types';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const GOOGLE_AUTH_READY = WEB_CLIENT_ID.length > 0;

let configured = false;

/** Configure once at app start (no-op until the Web client ID is set). */
export function configureGoogleSignIn(): void {
  if (!GOOGLE_AUTH_READY || configured) return;
  try {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  } catch {
    // Native module not linked (running JS without a rebuild) — stay off.
  }
}

export type GoogleSignInOutcome =
  | { status: 'success'; user: UserDoc }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * Run the native Google picker and exchange the ID token with Firebase. On
 * success the auth state listener (RootNavigator) picks up the session and
 * navigates into the app automatically.
 */
export async function signInWithGooglePrompt(): Promise<GoogleSignInOutcome> {
  if (!GOOGLE_AUTH_READY) return { status: 'error', message: 'google_not_configured' };
  try {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (res.type === 'cancelled') return { status: 'cancelled' };
    const idToken = res.data?.idToken;
    if (!idToken) return { status: 'error', message: 'no_id_token' };
    const user = await signInWithGoogle(idToken);
    return { status: 'success', user };
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'google_sign_in_failed' };
  }
}
