import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Bypass Metro exports resolution — load RN bundle directly so that
// registerAuth("ReactNative") is called and initializeAuth / getReactNativePersistence
// are available. The firebase/* wrapper has no react-native exports condition.
type AuthType = import('@firebase/auth').Auth;
type PersistenceType = import('@firebase/auth').Persistence;

const rnAuthBundle = require('@firebase/auth/dist/rn/index') as {
  initializeAuth: (app: FirebaseApp, deps?: { persistence: PersistenceType }) => AuthType;
  getAuth:        (app: FirebaseApp) => AuthType;
  getReactNativePersistence: (storage: typeof AsyncStorage) => PersistenceType;
};
const { initializeAuth, getAuth, getReactNativePersistence } = rnAuthBundle;

// ─── App ──────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ─── Auth init ────────────────────────────────────────────────────────────────
let auth: AuthType;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  if (e?.code === 'auth/already-initialized' || /already.initialized/i.test(e?.message ?? '')) {
    auth = getAuth(app);
  } else {
    throw e;
  }
}

// ─── Firestore ────────────────────────────────────────────────────────────────
// experimentalForceLongPolling avoids WebChannel transport errors in React Native.
let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false,
  });
} catch (e: any) {
  // Already initialized on hot reload
  db = getFirestore(app);
}

// ─── Other services ───────────────────────────────────────────────────────────
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions     = getFunctions(app, 'asia-south1');

export { auth, db };
export type { AuthType as Auth };
export default app;
