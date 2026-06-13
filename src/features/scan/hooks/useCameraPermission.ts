import { useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { logger } from '../../../shared/utils/logger';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface PermissionRequestResult {
  granted: boolean;
  canAskAgain: boolean;
}

interface UseCameraPermissionResult {
  status: PermissionStatus;
  isGranted: boolean;
  isDenied: boolean;
  isUndetermined: boolean;
  canAskAgain: boolean;
  request: () => Promise<PermissionRequestResult>;
}

export const useCameraPermission = (): UseCameraPermissionResult => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission?.status === 'denied') {
      logger.scan.failed('Camera permission denied');
    }
  }, [permission?.status]);

  const request = async (): Promise<PermissionRequestResult> => {
    const result = await requestPermission();
    if (!result.granted) {
      logger.scan.failed(
        `Camera permission not granted after request (canAskAgain=${result.canAskAgain})`,
      );
    }
    return { granted: result.granted, canAskAgain: result.canAskAgain };
  };

  const status: PermissionStatus = !permission
    ? 'undetermined'
    : permission.granted
    ? 'granted'
    : permission.canAskAgain
    ? 'undetermined'
    : 'denied';

  return {
    status,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isUndetermined: status === 'undetermined',
    canAskAgain: permission?.canAskAgain ?? true,
    request,
  };
};
