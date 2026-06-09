import * as FileSystem from 'expo-file-system';

export interface PlantValidationResult {
  isPlant: boolean;
  confidence: number;
  /** true when no API key is configured — scan is allowed but validation was bypassed */
  devBypass?: boolean;
}

// 60% confidence required to proceed. Below this we show the retry screen.
const IS_PLANT_THRESHOLD = 0.6;

const API_KEY = process.env.EXPO_PUBLIC_PLANT_ID_KEY ?? '';

/**
 * Validates whether an image contains a recognisable plant using the
 * Plant.id v3 API. Returns isPlant=false for monitors, desks, rooms, etc.
 *
 * - Requires EXPO_PUBLIC_PLANT_ID_KEY in .env
 * - Fails open (allows scan) if key is missing or network fails — logged clearly
 * - Never increments scan quota; only called before the real scan
 */
export async function validatePlantImage(
  imageUri: string,
): Promise<PlantValidationResult> {
  if (!API_KEY) {
    console.warn(
      '[PlantValidation] EXPO_PUBLIC_PLANT_ID_KEY not set — ' +
        'validation bypassed. Add key to .env to enable.',
    );
    return { isPlant: true, confidence: 1, devBypass: true };
  }

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
  } catch (err) {
    console.error('[PlantValidation] Could not read image file:', err);
    return { isPlant: true, confidence: 0.5 };
  }

  try {
    const response = await fetch('https://plant.id/api/v3/identification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY,
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64}`],
        health: 'auto',
        similar_images: false,
      }),
    });

    if (!response.ok) {
      // API error (bad key, rate limit, etc.) — fail open with warning
      console.error('[PlantValidation] Plant.id returned', response.status);
      return { isPlant: true, confidence: 0.5 };
    }

    const data = await response.json();
    const probability: number =
      (data?.result?.is_plant?.probability as number) ?? 0;

    return {
      isPlant: probability >= IS_PLANT_THRESHOLD,
      confidence: probability,
    };
  } catch (err) {
    // Network error — fail open
    console.error('[PlantValidation] Network error:', err);
    return { isPlant: true, confidence: 0.5 };
  }
}
