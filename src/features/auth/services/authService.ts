import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  User as FirebaseUser,
} from '@firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase/firebaseConfig';
import { config } from '../../../constants/config';
import type { UserDoc } from '../../../types/firestore.types';
import type { SignupFormData, LoginFormData } from '../types';
import type { ClimateZone } from '../../../constants/plants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Returns the user's Firestore doc, creating it (and the usage doc) if missing.
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

  // Ensure usage doc exists too
  const usageRef  = doc(db, `usage/${firebaseUser.uid}`);
  const usageSnap = await getDoc(usageRef);
  if (!usageSnap.exists()) {
    await setDoc(usageRef, {
      uid:          firebaseUser.uid,
      month:        getCurrentMonth(),
      scansUsed:    0,
      scanLimit:    config.FREE_SCAN_LIMIT,
      aiChatsUsed:  0,
      aiChatLimit:  config.FREE_CHAT_LIMIT,
      lastResetAt:  serverTimestamp(),
    });
  }

  // Re-fetch so serverTimestamp fields are resolved
  const created = await getDoc(userRef);
  return created.data() as UserDoc;
};

// ─── Auth actions ─────────────────────────────────────────────────────────────

export const signUpWithEmail = async (data: SignupFormData): Promise<UserDoc> => {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(credential.user, { displayName: data.name });
  return ensureUserDoc(credential.user);
};

export const signInWithEmail = async (data: LoginFormData): Promise<UserDoc> => {
  const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
  return ensureUserDoc(credential.user);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
