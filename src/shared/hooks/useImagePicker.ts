import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { compressImage } from '../utils/imageCompressor';

interface UseImagePickerResult {
  imageUri: string | null;
  imageBase64: string | null;
  pickFromGallery: () => Promise<void>;
  takePhoto: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export const useImagePicker = (): UseImagePickerResult => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    setIsLoading(true);
    setError(null);
    try {
      const asset = result.assets[0];
      const compressed = await compressImage(asset.uri);
      setImageUri(compressed.uri);
      setImageBase64(compressed.base64 ?? null);
    } catch {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    await handleResult(result);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    await handleResult(result);
  };

  return {
    imageUri,
    imageBase64,
    pickFromGallery,
    takePhoto,
    isLoading,
    error,
    reset: () => { setImageUri(null); setImageBase64(null); setError(null); },
  };
};
