import Constants from 'expo-constants';
import type { ScanProvider, ProviderImages, RawIdentification } from './types';
import { NOT_PLANT_ERROR } from './types';

// Client-direct Plant.id v3 provider.
//
// ACTIVE during internal-testing mode (Spark, no function deploy). The key is
// read from the NON-PUBLIC `plantIdKey` baked via app.config.ts → extra
// (process.env.PLANT_ID_KEY). This still bundles the key — accepted only
// because there is no public APK. The server provider replaces this at prod.

const PLANT_ID_URL = 'https://plant.id/api/v3/identification';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_000;
const IS_PLANT_THRESHOLD = 0.40;

// ⚠️ TEMPORARY DIAGNOSTIC — hardcoded key to isolate runtime-config caching from
// the request implementation. REMOVE after this test and restore the config read.
const HARDCODED_KEY_TEST = 'uNLaxAsG2D9KfCrw1HXQu8Ir5pmWM4JzSqf8g786J8bMH8cZ0Y';

function resolveKey(): string {
  if (__DEV__) {
    console.log('[PlantId] hardcoded mode active');
    console.log('[PlantId] key length:', HARDCODED_KEY_TEST.length);
    console.log('[PlantId] first6:', HARDCODED_KEY_TEST.slice(0, 6));
    console.log('[PlantId] last4:', HARDCODED_KEY_TEST.slice(-4));
  }
  return HARDCODED_KEY_TEST;

  // ── Original config read (restore after the diagnostic) ───────────────────
  // const raw = (Constants.expoConfig?.extra?.plantIdKey as string | undefined) ?? '';
  // return raw.replace(/\s+/g, '').replace(/^["']+|["']+$/g, '');
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

  const payload = { images: base64s, health: 'all' };

  if (__DEV__) {
    console.log('[PlantId] endpoint:', PLANT_ID_URL);
    console.log('[PlantId] method:', 'POST');
    console.log('[PlantId] auth header name:', 'Api-Key');
    console.log('[PlantId] auth key length:', apiKey.length, '| first6:', apiKey.slice(0, 6), '| last4:', apiKey.slice(-4));
    console.log('[PlantId] content-type:', 'application/json');
    console.log('[PlantId] body shape: { images:', base64s.length, 'item(s), health: "all" }');
  }

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
  if (__DEV__) {
    console.log('[PlantId] status:', response.status);
    console.log('[PlantId] raw response:', rawText.slice(0, 400));
  }
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
