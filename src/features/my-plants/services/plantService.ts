// Firestore persistence for My Plants — users/{uid}/plants/{plantId}.
// Owner-scoped reads/writes are allowed by firestore.rules (match /plants).
// The Zustand plantsStore stays the in-memory cache; the onSnapshot
// subscription started at login keeps it in sync with the server.

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../services/firebase/firebaseConfig';
import { logger } from '../../../shared/utils/logger';
import type { UserPlantDoc } from '../../../types/firestore.types';

const plantsCol = (uid: string) => collection(db, `users/${uid}/plants`);
const plantRef = (uid: string, plantId: string) => doc(db, `users/${uid}/plants/${plantId}`);

/** Firestore rejects `undefined` values — drop them before writing. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// ── Live subscription ───────────────────────────────────────────────────────

export function subscribeToUserPlants(
  uid: string,
  onData: (plants: UserPlantDoc[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(plantsCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as UserPlantDoc)),
    (err) => {
      logger.app.error('Plants subscription failed', err);
      onError?.(err);
    },
  );
}

// ── Writes ──────────────────────────────────────────────────────────────────

/**
 * Persists a new plant. Writes immediately with the local image URI so the
 * UI is never blocked, then uploads the image to Storage in the background
 * and patches imageUrl with the durable download URL (survives reinstall).
 */
export async function savePlantToCloud(uid: string, plant: UserPlantDoc): Promise<void> {
  await setDoc(plantRef(uid, plant.plantId), stripUndefined({ ...plant }));

  // Best-effort background upload — local URI remains the fallback
  if (plant.imageUrl && !plant.imageUrl.startsWith('http')) {
    void uploadPlantImage(uid, plant.plantId, plant.imageUrl)
      .then((url) => {
        if (url) return updateDoc(plantRef(uid, plant.plantId), { imageUrl: url });
        return undefined;
      })
      .catch((err) => logger.app.error('Plant image upload failed', err));
  }
}

export async function updatePlantInCloud(
  uid: string,
  plantId: string,
  updates: Partial<UserPlantDoc>,
): Promise<void> {
  await updateDoc(plantRef(uid, plantId), {
    ...stripUndefined(updates),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlantFromCloud(uid: string, plantId: string): Promise<void> {
  await deleteDoc(plantRef(uid, plantId));
}

// ── Image upload ────────────────────────────────────────────────────────────

/**
 * Uploads a local image file to plants/{uid}/{plantId}/photo.jpg.
 * storage.rules allow owner writes < 5 MB with image/* content type.
 * Returns the download URL, or null when the upload fails (caller keeps
 * the local URI — display still works on this device).
 */
export async function uploadPlantImage(
  uid: string,
  plantId: string,
  localUri: string,
): Promise<string | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `plants/${uid}/${plantId}/photo.jpg`);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return await getDownloadURL(storageRef);
  } catch (err) {
    logger.app.error('uploadPlantImage failed', err);
    return null;
  }
}
