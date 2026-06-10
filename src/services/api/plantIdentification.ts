import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { runScanProviders } from '../scan/scanRouter';
import type { RawIdentification, RawDisease } from '../scan/providers/types';
import type { ScanResult } from '../../features/scan/mocks/scanMocks';
import type { DiseaseResult } from '../../types/firestore.types';
import { normalizePlantName } from '../../shared/utils/normalizePlantName';
import { buildSpeciesActions } from '../../shared/utils/plantCareGuide';

// Thin transform layer over the scan provider pipeline (src/services/scan/).
// It resolves image bytes, delegates identification to the provider router
// (client-direct Plant.id now; server route / PlantNet later — see scanRouter),
// then maps the normalized RawIdentification into the ScanResult the UI expects.
// The is_plant gate and quota live inside the providers/server.

// Confidence thresholds for presentation only — the is_plant gate lives server-side.
const LOW_CONFIDENCE_THRESHOLD = 0.15; // below this → return null (truly unidentifiable)
const MIN_DISEASE_PROBABILITY = 0.30;

export interface AlternativeSuggestion {
  commonName: string;
  scientificName: string;
  confidence: number;
}

export type PlantIdentificationResult = Omit<ScanResult, 'imageUri'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidenceLabel(v: number): string {
  if (v >= 0.80) return 'Highly likely';
  if (v >= 0.60) return 'Likely';
  if (v >= 0.40) return 'Possible match';
  return 'Uncertain';
}

function parseDisease(d: RawDisease): DiseaseResult {
  const prevention =
    d.treatment?.prevention?.slice(0, 2).join(' ') ||
    'Ensure good air circulation and avoid overwatering. Inspect plants regularly.';

  const chemical = d.treatment?.chemical?.[0] ?? undefined;
  const biological = d.treatment?.biological?.[0] ?? undefined;

  const description =
    d.description ||
    `Possible ${d.name.toLowerCase()} detected. Monitor the plant closely for spreading symptoms.`;

  return {
    name: d.name,
    probability: d.probability,
    description,
    treatment: { prevention, chemical, biological },
  };
}

// Converts HEIC/HEIF/PNG to JPEG so base64 always has a /9j/ signature.
async function resolveBase64(uri: string): Promise<string> {
  const extension = uri.split('.').pop()?.toLowerCase() ?? '';
  let uriToRead = uri;
  if (extension === 'heic' || extension === 'heif' || extension === 'png') {
    if (__DEV__) console.log('[PlantId] converting', extension, '→ JPEG');
    const converted = await ImageManipulator.manipulateAsync(
      uri, [], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: false },
    );
    uriToRead = converted.uri;
  }
  return FileSystem.readAsStringAsync(uriToRead, { encoding: FileSystem.EncodingType.Base64 });
}

function cleanBase64(raw: string): string {
  return raw.replace(/^data:image\/\w+;base64,/, '').replace(/[\r\n]/g, '').trim();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Identifies the plant in the given image via the scan provider pipeline.
 *
 * The active provider handles the is_plant gate (throws 'not_plant_detected')
 * and, on the server route, quota + scan-history. This function maps the
 * normalized result into a ScanResult, applying name normalization, care-guide
 * generation, and confidence labels.
 *
 * Returns null when no usable species match comes back; throws on transport,
 * quota, or not-a-plant errors, which useScanFlow maps to user-facing copy.
 */
export async function identifyPlant(
  imageUri: string,
  precomputedBase64?: string,
  signal?: AbortSignal,
  extraUris?: string[],
): Promise<PlantIdentificationResult | null> {
  // ── 1. Resolve primary base64 ─────────────────────────────────────────────
  const primaryRaw = precomputedBase64 ?? await resolveBase64(imageUri);
  const base64 = cleanBase64(primaryRaw);

  if (!base64 || base64.length < 100) {
    throw new Error(`base64 is too short (${base64?.length ?? 0} chars) — image read likely failed`);
  }

  const rawSig = base64.slice(0, 12);
  if (!rawSig.startsWith('/9j/')) {
    throw new Error(`Image is not valid JPEG base64 — signature: "${rawSig}" (expected /9j/)`);
  }

  // ── 2. Resolve extra views (best-effort; skip any that fail) ──────────────
  const extraImagesBase64: string[] = [];
  if (extraUris?.length) {
    for (const uri of extraUris.slice(0, 4)) {
      try {
        const b = cleanBase64(await resolveBase64(uri));
        if (b && b.length > 100) extraImagesBase64.push(b);
      } catch {
        // skip unreadable extra view — don't fail the whole scan
      }
    }
  }

  if (__DEV__) {
    const sizeKB = Math.round(base64.length * 0.75 / 1024);
    console.log('[SCAN_INPUT] primary:', sizeKB, 'KB | extras:', extraImagesBase64.length);
  }

  // ── 3. Run the provider pipeline (client-direct now; server/PlantNet later) ─
  const res: RawIdentification = await runScanProviders({
    primaryBase64: base64,
    extraBase64: extraImagesBase64,
    signal,
  });

  // ── 4. Extract top classification ─────────────────────────────────────────
  const suggestions = res.suggestions ?? [];
  if (suggestions.length === 0) {
    if (__DEV__) console.warn('[PlantId] no classification suggestions');
    return null;
  }

  const top = suggestions[0];
  if (top.probability < LOW_CONFIDENCE_THRESHOLD) {
    if (__DEV__) console.warn('[PlantId] top suggestion below threshold:', top.probability);
    return null;
  }

  // ── 5. Normalize primary name ─────────────────────────────────────────────
  const { commonName, scientificName: displayScientific, indianNames } =
    normalizePlantName(top.name, top.commonNames ?? []);
  const indianAlternate = indianNames && indianNames.length > 0 ? indianNames[0] : undefined;

  // ── 6. Build alternatives (top 2–3 after primary) ─────────────────────────
  const alternatives: AlternativeSuggestion[] = suggestions
    .slice(1, 4)
    .filter(s => s.probability >= 0.10)
    .map(s => {
      const { commonName: altName } = normalizePlantName(s.name, s.commonNames ?? []);
      return { commonName: altName, scientificName: s.name, confidence: s.probability };
    });

  // ── 7. Parse disease results ──────────────────────────────────────────────
  const diseases: DiseaseResult[] = (res.diseases ?? [])
    .filter(d => d.probability >= MIN_DISEASE_PROBABILITY)
    .slice(0, 3)
    .map(parseDisease);

  // Only mark unhealthy when the server says so AND we have actual disease data
  const isHealthy = res.isHealthyBinary || diseases.length === 0;

  // ── 8. Build species-specific care guide ──────────────────────────────────
  const suggestedActions = buildSpeciesActions(commonName, top.watering);

  if (__DEV__) {
    console.log(
      '[CONFIDENCE_RESULT]', commonName, (top.probability * 100).toFixed(0) + '%',
      '|', confidenceLabel(top.probability),
      '| diseases:', diseases.length, '| alternatives:', alternatives.length,
    );
  }

  return {
    scanId: res.scanId,
    commonName,
    scientificName: displayScientific,
    indianAlternate,
    confidence: top.probability,
    isHealthy,
    diseases,
    suggestedActions,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    scanDate: new Date().toISOString(),
  };
}
