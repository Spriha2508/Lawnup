import type { ScanProvider, ProviderImages, RawIdentification } from './types';
import { NOT_PLANT_ERROR } from './types';
import { processPlantScan } from '../../firebase/functions';

// Plant.id via the processPlantScan Cloud Function.
//
// RETAINED from Phase 1.5 and becomes the default route at production hardening
// (key in a server secret, server-side quota, scan-history logging). Disabled
// during internal-testing mode because functions aren't deployed on Spark.
// Flip SERVER_SCAN_ENABLED (or the scanRouter config) once on Blaze + deployed.

const SERVER_SCAN_ENABLED = false;

export const plantIdServerProvider: ScanProvider = {
  name: 'plantId-server',

  isEnabled() {
    return SERVER_SCAN_ENABLED;
  },

  async identify({ primaryBase64, extraBase64 }: ProviderImages): Promise<RawIdentification> {
    try {
      const res = await processPlantScan({
        imageBase64: primaryBase64,
        extraImagesBase64: extraBase64.length ? extraBase64 : undefined,
      });
      return {
        scanId: res.scanId,
        isPlantProbability: res.isPlantProbability,
        isHealthyBinary: res.isHealthyBinary,
        suggestions: res.suggestions,
        diseases: res.diseases,
        provider: 'plantId-server',
      };
    } catch (err) {
      // Normalize the function's not-a-plant error so the router treats it as definitive
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('not_plant_detected') || msg.includes('failed-precondition')) {
        throw new Error(NOT_PLANT_ERROR);
      }
      throw err;
    }
  },
};
