import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

/**
 * Compress an image for Plant.id upload, preserving aspect ratio.
 *
 * When only `width` is passed to expo-image-manipulator's resize action it
 * scales the height proportionally. The old code passed `{ width, height }` with
 * equal values which squashed portrait/landscape photos into a square and
 * destroyed identification accuracy.
 */
export const compressImage = async (
  uri: string,
  maxDimension = 1024,
  quality = 0.82,
): Promise<CompressResult> => {
  // Probe the original dimensions without re-encoding
  const probe = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: false },
  );

  const { width: origW, height: origH } = probe;

  // Scale the longer side down to maxDimension; the other side follows proportionally.
  // expo-image-manipulator maintains aspect ratio when only one dimension is specified.
  const isLandscape = origW >= origH;
  const resize = isLandscape
    ? { width: Math.min(origW, maxDimension) }
    : { height: Math.min(origH, maxDimension) };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (__DEV__) {
    console.log('[IMAGE_DIMENSIONS] original:', origW, 'x', origH,
      '→ compressed:', result.width, 'x', result.height,
      `(${isLandscape ? 'landscape' : 'portrait'})`);
    console.log('[IMAGE_SIZE] base64 ~',
      Math.round((result.base64?.length ?? 0) * 0.75 / 1024), 'KB');
  }

  return result;
};
