import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from '@firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase/firebaseConfig';
import type { UserDoc } from '../../../types/firestore.types';
import type { SignupFormData, LoginFormData } from '../types';
import type { ClimateZone } from '../../../constants/plants';

/**
 * Returns the user's Firestore doc, creating it if missing.
 * Safe to call after both signup and login.
 */
export const ensureUserDoc = async (firebaseUser: FirebaseUser): Promise<UserDoc> => {
  const userRef = doc(db, `users/${firebaseUser.uid}`);
  const snap    = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserDoc;
  }

  const newDoc = {
    uid:                firebaseUser.uid,
    name:               firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
    email:              firebaseUser.email ?? '',
    city:               '',
    climateZone:        'north' as ClimateZone,
    subscription:       'free' as const,
    fcmToken:           '',
    onboardingComplete: false,
    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  };

  await setDoc(userRef, newDoc);

  // NOTE: the usage/{uid} quota doc is created lazily server-side
  // (checkUsageLimit / rateLimiter upsert it with free-tier defaults).
  // Firestore rules block client writes to /usage — do not write it here.

  // Re-fetch so serverTimestamp fields are resolved
  const created = await getDoc(userRef);
  return created.data() as UserDoc;
};

// ─── Auth actions ─────────────────────────────────────────────────────────────

export const signUpWithEmail = async (data: SignupFormData): Promise<UserDoc> => {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(credential.user, { displayName: data.name });
  // Fire a verification email (best-effort — never block signup on it).
  sendEmailVerification(credential.user).catch((e: any) =>
    console.warn('[Auth] sendEmailVerification failed:', e?.message),
  );
  return ensureUserDoc(credential.user);
};

/** Re-send the verification email to the currently signed-in user. */
export const resendEmailVerification = async (): Promise<void> => {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
};

export const signInWithEmail = async (data: LoginFormData): Promise<UserDoc> => {
  const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
  return ensureUserDoc(credential.user);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Sign in with a Google ID token and ensure the Firestore user doc exists.
 *
 * This is the Firebase-JS-SDK half of Google Sign-In and is ready to use — it
 * just needs the `idToken` produced by the native picker. Wire it up like:
 *
 *   import { GoogleSignin } from '@react-native-google-signin/google-signin';
 *   // once, at startup:
 *   GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
 *   // on button press:
 *   await GoogleSignin.hasPlayServices();
 *   const { idToken } = await GoogleSignin.signIn();
 *   const userDoc = await signInWithGoogle(idToken);
 *
 * The `webClientId` MUST be the OAuth **Web** client ID (oauth_client type 3 in
 * google-services.json) — not the Android client — or Firebase rejects the
 * credential. See docs/google-signin-setup.md and the Google Auth task.
 */
export const signInWithGoogle = async (idToken: string): Promise<UserDoc> => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return ensureUserDoc(result.user);
};
