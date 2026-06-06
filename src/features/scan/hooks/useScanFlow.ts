import { useCallback, useState } from 'react';
import { compressImage } from '../../../shared/utils/imageCompressor';
import { getMockScanResult, simulateScanDelay } from '../mocks/scanMocks';
import { useScanStore } from '../store/scanStore';
import { logger } from '../../../shared/utils/logger';

interface UseScanFlowResult {
  runScan: (imageUri: string) => Promise<string | null>;
  isRunning: boolean;
  error: string | null;
  clearError: () => void;
}

export const useScanFlow = (): UseScanFlowResult => {
  const { setScanResult, setScanning } = useScanStore();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async (imageUri: string): Promise<string | null> => {
    setIsRunning(true);
    setScanning(true);
    setError(null);
    logger.scan.started();

    try {
      // Compress image before sending (800px, 75% quality → ~100-200kb)
      logger.scan.uploading(0);
      const compressed = await compressImage(imageUri, 800, 0.75);

      // Simulate API processing delay
      await simulateScanDelay();

      // Use mock result (swap for real API call in Phase 3)
      const mockResult = getMockScanResult();
      const scanResult = {
        ...mockResult,
        imageUri: compressed.uri,
      };

      setScanResult(scanResult);
      logger.scan.completed(scanResult.commonName, scanResult.confidence);

      if (!scanResult.isHealthy && scanResult.diseases.length > 0) {
        logger.scan.diseaseDetected(scanResult.commonName, scanResult.diseases[0].name);
      }

      return scanResult.scanId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed. Please try again.';
      setError(message);
      logger.scan.failed(message, err);
      return null;
    } finally {
      setIsRunning(false);
      setScanning(false);
    }
  }, [setScanResult, setScanning]);

  return {
    runScan,
    isRunning,
    error,
    clearError: () => setError(null),
  };
};
