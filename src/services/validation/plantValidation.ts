// Plant validation is now handled inside identifyPlant() via Plant.id's is_plant check.
// A separate pre-flight API call here consumed an extra credit per scan and added
// a full network round-trip with no user-visible benefit. identifyPlant throws
// 'not_plant_detected' when is_plant.probability < 0.5, which useScanFlow catches
// and returns as error: 'not_plant', triggering the retry UI in ProcessingScreen.

export interface PlantValidationResult {
  isPlant: boolean;
  confidence: number;
  devBypass?: boolean;
}

export async function validatePlantImage(
  _imageUri: string,
): Promise<PlantValidationResult> {
  return { isPlant: true, confidence: 1, devBypass: true };
}
