import type { ScanProvider, ProviderImages, RawIdentification } from './types';

// PlantNet provider — SCAFFOLD (Phase B.4, not yet implemented).
//
// PlantNet (https://my.plantnet.org/) is intended as a failover / cost-
// optimization identification source behind the same abstraction. To finish:
//   1. Add a PLANT_NET_KEY server secret (or non-public env for internal test).
//   2. POST images to the PlantNet v2 /identify endpoint (organ + image multipart).
//   3. Map PlantNet's `results[].species` + `score` into RawSuggestion[]
//      (PlantNet returns scientificNameWithoutAuthor + commonNames + score 0–1).
//   4. PlantNet has no disease detection → return diseases: [] and let the
//      router/UI fall back to Plant.id for health when needed.
//
// Left disabled so the router skips it until the integration lands.

export const plantNetProvider: ScanProvider = {
  name: 'plantNet',

  isEnabled() {
    return false; // TODO(B.4): enable once PlantNet integration + key are wired
  },

  async identify(_images: ProviderImages): Promise<RawIdentification> {
    throw new Error('plantNet provider not implemented yet');
  },
};
