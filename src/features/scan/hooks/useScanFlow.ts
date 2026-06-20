import { useCallback, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { compressImage } from '../../../shared/utils/imageCompressor';
import { useScanStore } from '../store/scanStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { identifyPlant } from '../../../services/api/plantIdentification';
import { logger } from '../../../shared/utils/logger';

export interface ScanFlowOutcome {
  scanId: string | null;
  error: string | null;
}

interface UseScanFlowResult {
  runScan: (imageUri: string, extraUris?: string[]) => Promise<ScanFlowOutcome>;
  cancelScan: () => void;
  isRunning: boolean;
}

// 2 MB base64 threshold — recompress if first pass still exceeds this
const MAX_UPLOAD_KB = 2048;
// Minimum file size guard — anything below is likely blank or corrupt
const MIN_FILE_BYTES = 5_000;

function mapToUserError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();

  let userMessage: string;

  if (
    msg.includes('offline') ||
    msg.includes('network request failed') ||
    msg.includes('network connection')
  ) {
    userMessage = 'No internet — check your connection and try again';
  } else if (msg.includes('timed out')) {
    userMessage = 'Request timed out — please try again';
  } else if (msg.includes('http 5')) {
    userMessage = 'Server is busy — please try again in a moment';
  } else if (
    // Plant.id provider auth/config failure (inactive or invalid API key):
    // HTTP 401/403, or the literal "api key ... not active" body. This is a
    // service-side configuration issue, NOT the user's fault and NOT their plan
    // limit — never route it to the upgrade flow.
    msg.includes('http 401') ||
    msg.includes('http 403') ||
    msg.includes('api key') ||
    msg.includes('not active') ||
    msg.includes('unauthorized')
  ) {
    userMessage = 'Plant identification is temporarily unavailable. Please try again later.';
  } else if (
    // Plant.id service usage cap hit: credits exhausted (HTTP 402) or rate
    // limited (HTTP 429). Distinct from the user's own weekly scan limit below.
    msg.includes('http 402') ||
    msg.includes('http 429') ||
    msg.includes('payment required') ||
    msg.includes('too many requests')
  ) {
    userMessage = 'Plant identification is busy right now — please try again in a few minutes.';
  } else if (msg.includes('cancelled') || msg.includes('aborted')) {
    userMessage = 'Scan was cancelled';
  } else if (msg.includes('not_plant_detected')) {
    return 'not_plant';
  } else if (msg.includes('quota_exceeded') || msg.includes('resource-exhausted')) {
    // Server-side weekly limit (authoritative) — surface the upgrade flow
    return 'scan_limit_reached';
  } else if (msg.includes('image too small') || msg.includes('too blurry') || msg.includes('too dark')) {
    userMessage = raw;
  } else if (
    msg.includes('no species match') ||
    msg.includes('suggestions is missing') ||
    msg.includes('suggestions is empty')
  ) {
    userMessage = 'Photo unclear — try a closer shot with good lighting';
  } else if (msg.includes('confidence') && msg.includes('threshold')) {
    userMessage = 'Plant not detected clearly — try a different angle';
  } else {
    userMessage = 'Something went wrong — please try again';
  }

  if (__DEV__) {
    return `${userMessage} | RAW: ${raw}`;
  }
  return userMessage;
}

export const useScanFlow = (): UseScanFlowResult => {
  const { setScanResult, setScanning } = useScanStore();
  const [isRunning, setIsRunning] = useState(false);

  const isRunningRef = useRef(false);
  const abortRef     = useRef<AbortController | null>(null);

  const cancelScan = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const runScan = useCallback(async (imageUri: string, extraUris?: string[]): Promise<ScanFlowOutcome> => {
    if (isRunningRef.current) {
      return { scanId: null, error: 'Scan already in progress' };
    }

    const controller = new AbortController();
    abortRef.current  = controller;
    isRunningRef.current = true;
    setIsRunning(true);
    setScanning(true);
    logger.scan.started();
    const scanStart = Date.now();

    try {
      // ── Weekly limit gate (free: 3/week; premium bypasses) ───────────────
      if (!useSubscriptionStore.getState().canScanThisWeek()) {
        return { scanId: null, error: 'scan_limit_reached' };
      }

      // ── Offline pre-flight ────────────────────────────────────────────────
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return { scanId: null, error: 'No internet — check your connection and try again' };
      }

      // ── Phase 4: Basic quality gate (file size) ──────────────────────────
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.exists && 'size' in fileInfo && fileInfo.size < MIN_FILE_BYTES) {
        return {
          scanId: null,
          error: 'Image too small or dark — try in better lighting or move closer',
        };
      }

      // ── Compress to JPEG (handles HEIC/WEBP, reduces upload size) ────────
      // 1200px on the long side preserves enough detail for accurate classification
      // while keeping the payload well under the 4 MB Plant.id limit.
      logger.scan.uploading(0);
      let compressed = await compressImage(imageUri, 1200, 0.82);

      // Safeguard: re-compress if first pass still exceeds budget
      const firstPassKB = Math.round((compressed.base64?.length ?? 0) * 0.75 / 1024);
      if (__DEV__) console.log('[SCAN_INPUT] first-pass size:', firstPassKB, 'KB');
      if (firstPassKB > MAX_UPLOAD_KB) {
        if (__DEV__) console.warn(`[ScanFlow] First pass ${firstPassKB} KB > limit — recompressing at 900px`);
        compressed = await compressImage(imageUri, 900, 0.72);
      }

      // Extract base64 then dereference to allow GC
      const base64ToSend = compressed.base64;
      const compressedUri = compressed.uri;
      compressed = { ...compressed, base64: undefined };

      // ── Identify plant ────────────────────────────────────────────────────
      const identified = await identifyPlant(compressedUri, base64ToSend, controller.signal, extraUris);

      if (__DEV__) {
        console.log('[ScanFlow] identified:', identified?.commonName, identified?.confidence);
      }

      if (!identified) {
        const msg = 'Plant not detected clearly — try a different angle';
        logger.scan.failed(msg);
        return { scanId: null, error: msg };
      }

      // Attach city from onboarding store for weather-aware history
      const city = useOnboardingStore.getState().city;
      const scanResult = { ...identified, imageUri: compressedUri, city: city || undefined };
      setScanResult(scanResult);
      logger.scan.completed(scanResult.commonName, scanResult.confidence);

      if (__DEV__) {
        console.log('[ScanFlow] total time:', Date.now() - scanStart, 'ms');
      }

      // ── Increment scan counts (only on success) ───────────────────────────
      // Weekly count is local-only and is the actual gate — increment immediately.
      // Server count is authoritative; never patch it optimistically here
      // because a background checkUsageLimit() would race and un-increment it.
      const subStore = useSubscriptionStore.getState();
      const countBefore = subStore.scansThisWeek;
      subStore.incrementScan();
      const countAfter = useSubscriptionStore.getState().scansThisWeek;

      if (__DEV__) {
        console.log('[SCAN_COUNT_BEFORE]', countBefore);
        console.log('[SCAN_COUNT_AFTER]', countAfter);
        console.log('[SCAN_INCREMENT_REASON] successful plant identification');
      }

      return { scanId: scanResult.scanId, error: null };

    } catch (err) {
      if (__DEV__) console.error('[ScanFlow] error:', err);
      const rawMessage  = err instanceof Error ? err.message : String(err);
      const userMessage = mapToUserError(err);
      logger.scan.failed(rawMessage, err);
      return { scanId: null, error: userMessage };

    } finally {
      isRunningRef.current = false;
      setIsRunning(false);
      setScanning(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [setScanResult, setScanning]);

  return { runScan, cancelScan, isRunning };
};
