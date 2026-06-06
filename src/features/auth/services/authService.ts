import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase/firebaseConfig';
import { config } from '../../../constants/config';
import type { UserDoc } from '../../../types/firestore.types';
import type { SignupFormData, LoginFormData } from '../types';

export const signUpWithEmail = async (data: SignupFormData): Promise<UserDoc> => {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(credential.user, { displayName: data.name });

  const userDoc: Omit<UserDoc, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: credential.user.uid,
    name: data.name,
    email: data.email,
    city: '',
    climateZone: 'north',
    subscription: 'free',
    fcmToken: '',
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, `users/${credential.user.uid}`), userDoc);

  // Initialize usage doc
  await setDoc(doc(db, `usage/${credential.user.uid}`), {
    uid: credential.user.uid,
    month: getCurrentMonth(),
    scansUsed: 0,
    scanLimit: config.FREE_SCAN_LIMIT,
    aiChatsUsed: 0,
    aiChatLimit: config.FREE_CHAT_LIMIT,
    lastResetAt: serverTimestamp(),
  });

  const snap = await getDoc(doc(db, `users/${credential.user.uid}`));
  return snap.data() as UserDoc;
};

export const signInWithEmail = async (data: LoginFormData): Promise<UserDoc> => {
  const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
  const snap = await getDoc(doc(db, `users/${credential.user.uid}`));
  if (!snap.exists()) throw new Error('User profile not found.');
  return snap.data() as UserDoc;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
