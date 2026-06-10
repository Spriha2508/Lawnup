// Provider abstraction for plant identification.
//
// Each provider (Plant.id client-direct, Plant.id via Cloud Function, PlantNet,
// OpenAI fallback) implements the same interface and returns a normalized
// RawIdentification. Presentation transforms (name normalization, care guide,
// confidence labels) happen ONCE downstream in plantIdentification.ts, so
// providers never deal with UI concerns. The scanRouter tries providers in
// order with failover, giving resilient scans + future cost optimization.

export interface RawSuggestion {
  name: string;            // latin/scientific name
  probability: number;     // 0–1
  commonNames: string[];
  watering?: { min?: number; max?: number };
}

export interface RawDisease {
  name: string;
  probability: number;     // 0–1
  description?: string;
  treatment?: {
    prevention?: string[];
    chemical?: string[];
    biological?: string[];
  };
}

/** Normalized, provider-agnostic identification result. */
export interface RawIdentification {
  scanId: string;
  isPlantProbability: number;   // 0–1
  isHealthyBinary: boolean;
  suggestions: RawSuggestion[]; // ordered best-first
  diseases: RawDisease[];
  provider: string;             // which provider produced this (telemetry)
}

/** Resolved image bytes passed to every provider. */
export interface ProviderImages {
  primaryBase64: string;        // clean JPEG base64 (no data: prefix)
  extraBase64: string[];        // additional views, may be empty
  signal?: AbortSignal;
}

export interface ScanProvider {
  /** Stable id for logging/telemetry, e.g. 'plantId-client'. */
  readonly name: string;
  /** Whether this provider should be attempted (config / key presence). */
  isEnabled(): boolean;
  /**
   * Identify the plant. Resolve to a RawIdentification on success.
   * Throw Error('not_plant_detected') for a definitive not-a-plant result
   * (the router treats this as final and does NOT fail over).
   * Throw any other Error for transport/quota failures (router may fail over).
   */
  identify(images: ProviderImages): Promise<RawIdentification>;
}

/** Thrown by providers for a definitive "this isn't a plant" outcome. */
export const NOT_PLANT_ERROR = 'not_plant_detected';

/** Errors that represent a definitive result, not a transient failure. */
export function isDefinitiveError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('not_plant_detected') || msg.includes('quota_exceeded') || msg.includes('resource-exhausted');
}
