import Constants from 'expo-constants';
import type { ScanProvider, ProviderImages, RawIdentification } from './types';
import { NOT_PLANT_ERROR } from './types';

// Client-direct Plant.id v3 provider.
//
// ACTIVE during internal-testing mode (Spark, no function deploy). The key is
// read from the NON-PUBLIC `plantIdKey` baked via app.config.ts → extra
// (process.env.PLANT_ID_KEY). This still bundles the key — accepted only
// because there is no public APK. The server provider replaces this at prod.

// Request `details` + `language` as query params so classification AND disease
// suggestions come back populated (common_names, watering, description,
// treatment). Without these, `suggestion.details` is empty and we lose every
// Indian/common name, watering range and disease treatment — the analysis looks
// thin for ALL image types. `classification_level=all` also returns genus-level
// matches, which is what lets a single-leaf or flower macro resolve when a
// species-only match is uncertain.
const PLANT_ID_DETAILS =
  'common_names,url,description,treatment,classification,watering';
const PLANT_ID_URL =
  `https://plant.id/api/v3/identification?details=${PLANT_ID_DETAILS}&language=en`;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_000;
// is_plant gate. Kept deliberately low: a tight close-up of a single leaf or a
// flower head often scores 0.3–0.5 on is_plant (less whole-plant context) even
// though it clearly IS a plant. A higher bar was rejecting those crops as
// "not a plant" while a full-plant shot of the same plant passed — the exact
// "one image type fails" symptom. 0.25 still rejects non-plant photos (which
// score ~0).
const IS_PLANT_THRESHOLD = 0.25;

// Key is read from the NON-PUBLIC `plantIdKey` baked via app.config.ts → extra
// (process.env.PLANT_ID_KEY). Never hardcode the key here — it ships in a public repo.
function resolveKey(): string {
  const raw = (Constants.expoConfig?.extra?.plantIdKey as string | undefined) ?? '';
  return raw.replace(/\s+/g, '').replace(/^["']+|["']+$/g, '');
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('network connection was lost') ||
    msg.includes('failed to fetch') ||
    msg.includes('the internet connection appears to be offline')
  );
}

async function callPlantId(base64s: string[], externalSignal?: AbortSignal): Promise<string> {
  const apiKey = resolveKey();
  if (!apiKey) {
    throw new Error('PLANT_ID_KEY is not set — cannot call Plant.id (internal-testing mode)');
  }

  // similar_images aids matching on partial crops (leaf/flower); classification_level
  // 'all' returns species + genus so an uncertain species still yields a usable match.
  const payload = {
    images: base64s,
    health: 'all',
    similar_images: true,
    classification_level: 'all',
  };

  const internalController = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => { timedOut = true; internalController.abort(); }, REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => internalController.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(PLANT_ID_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
      body: JSON.stringify(payload),
      signal: internalController.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      if (timedOut) throw new Error(`Plant.id request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
      throw new Error('Scan was cancelled');
    }
    if (isNetworkError(err)) {
      throw new Error('Device appears to be offline — check your connection and try again');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Plant.id HTTP ${response.status}: ${rawText.slice(0, 300)}`);
  }
  return rawText;
}

async function callWithRetry(base64s: string[], signal?: AbortSignal): Promise<string> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error('Scan was cancelled');
    try {
      return await callPlantId(base64s, signal);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const shouldNotRetry =
        lastError.message.includes('cancelled') || lastError.message.includes('HTTP 4');
      if (shouldNotRetry || attempt >= MAX_RETRIES) break;
      await new Promise<void>(r => setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

interface PlantIdResponse {
  result?: {
    is_plant?: { probability: number; binary: boolean };
    is_healthy?: { probability: number; binary: boolean };
    classification?: {
      suggestions: {
        name: string;
        probability: number;
        details?: { common_names?: string[]; watering?: { min?: number; max?: number } };
      }[];
    };
    disease?: {
      suggestions: {
        name: string;
        probability: number;
        details?: {
          description?: string;
          treatment?: { prevention?: string[]; chemical?: string[]; biological?: string[] };
        };
      }[];
    };
  };
}

export const plantIdClientProvider: ScanProvider = {
  name: 'plantId-client',

  isEnabled() {
    return resolveKey().length > 0;
  },

  async identify({ primaryBase64, extraBase64, signal }: ProviderImages): Promise<RawIdentification> {
    const rawText = await callWithRetry([primaryBase64, ...extraBase64], signal);

    let data: PlantIdResponse;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`JSON parse failed. Raw (first 200): ${rawText.slice(0, 200)}`);
    }

    const isPlantProbability = data.result?.is_plant?.probability ?? 1;
    if (isPlantProbability < IS_PLANT_THRESHOLD) {
      throw new Error(NOT_PLANT_ERROR);
    }

    const suggestions = (data.result?.classification?.suggestions ?? []).slice(0, 4).map(s => ({
      name: s.name,
      probability: s.probability,
      commonNames: s.details?.common_names ?? [],
      watering: s.details?.watering,
    }));

    const diseases = (data.result?.disease?.suggestions ?? []).slice(0, 5).map(d => ({
      name: d.name,
      probability: d.probability,
      description: d.details?.description,
      treatment: d.details?.treatment,
    }));

    return {
      scanId: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      isPlantProbability,
      isHealthyBinary: data.result?.is_healthy?.binary ?? true,
      suggestions,
      diseases,
      provider: 'plantId-client',
    };
  },
};
