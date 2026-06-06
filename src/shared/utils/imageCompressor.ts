import * as ImageManipulator from 'expo-image-manipulator';

interface CompressResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

export const compressImage = async (
  uri: string,
  maxSize = 800,
  quality = 0.75
): Promise<CompressResult> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxSize, height: maxSize } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,
    }
  );
  return result;
};
