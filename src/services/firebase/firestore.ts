import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Generic helpers — keeps feature services thin

export const getDocument = async <T>(path: string): Promise<T | null> => {
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? (snap.data() as T) : null;
};

export const setDocument = async (path: string, data: DocumentData): Promise<void> => {
  await setDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const updateDocument = async (path: string, data: Partial<DocumentData>): Promise<void> => {
  await updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
};

export const deleteDocument = async (path: string): Promise<void> => {
  await deleteDoc(doc(db, path));
};

export const queryCollection = async <T>(
  collectionPath: string,
  constraints: QueryConstraint[]
): Promise<T[]> => {
  const q = query(collection(db, collectionPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
};

export const subscribeToCollection = <T>(
  collectionPath: string,
  constraints: QueryConstraint[],
  onData: (data: T[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const q = query(collection(db, collectionPath), ...constraints);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))),
    onError
  );
};

export const subscribeToDocument = <T>(
  path: string,
  onData: (data: T | null) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  return onSnapshot(
    doc(db, path),
    (snap) => onData(snap.exists() ? (snap.data() as T) : null),
    onError
  );
};

// Re-export query helpers so feature services don't import from firebase/firestore directly
export { where, orderBy, limit, serverTimestamp };
