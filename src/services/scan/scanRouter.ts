import type { ScanProvider, ProviderImages, RawIdentification } from './providers/types';
import { isDefinitiveError } from './providers/types';
import { plantIdClientProvider } from './providers/plantIdClientProvider';
import { plantIdServerProvider } from './providers/plantIdServerProvider';
import { plantNetProvider } from './providers/plantNetProvider';

// Ordered identification pipeline with failover.
//
// Providers are attempted top-to-bottom; the first ENABLED one that succeeds
// wins. A definitive result (not-a-plant, quota exceeded) stops the pipeline
// immediately — we don't fail over those. Transport/parse errors fall through
// to the next provider, so a Plant.id outage can later be covered by PlantNet.
//
// INTERNAL-TESTING MODE order: client-direct Plant.id first (server route is
// disabled until Blaze + deploy). At production hardening, reorder to put
// plantIdServerProvider first and disable the client provider.
const PROVIDER_ORDER: ScanProvider[] = [
  plantIdClientProvider,
  plantIdServerProvider,
  plantNetProvider,
];

/**
 * Runs the provider pipeline. Returns the first successful RawIdentification.
 * Rethrows a definitive error immediately; otherwise rethrows the last
 * transient error after all enabled providers are exhausted.
 */
export async function runScanProviders(images: ProviderImages): Promise<RawIdentification> {
  const enabled = PROVIDER_ORDER.filter(p => p.isEnabled());

  if (enabled.length === 0) {
    throw new Error('No scan provider is enabled — set PLANT_ID_KEY for client scanning');
  }

  let lastError: Error = new Error('All scan providers failed');

  for (const provider of enabled) {
    try {
      const result = await provider.identify(images);
      if (__DEV__) console.log('[ScanRouter] served by:', provider.name);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (isDefinitiveError(lastError)) {
        if (__DEV__) console.log(`[ScanRouter] ${provider.name} definitive:`, lastError.message);
        throw lastError; // not-a-plant / quota — do not fail over
      }
      if (__DEV__) console.warn(`[ScanRouter] ${provider.name} failed, trying next:`, lastError.message);
    }
  }

  throw lastError;
}
