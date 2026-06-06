import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebaseConfig';

export const uploadImage = async (
  uid: string,
  folder: 'scans' | 'plants',
  fileId: string,
  blob: Blob
): Promise<string> => {
  const path = `${folder}/${uid}/${fileId}/${Date.now()}.webp`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
  return getDownloadURL(storageRef);
};

export const deleteImage = async (path: string): Promise<void> => {
  await deleteObject(ref(storage, path));
};
