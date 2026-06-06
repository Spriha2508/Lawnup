import { useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { logger } from '../../../shared/utils/logger';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface UseCameraPermissionResult {
  status: PermissionStatus;
  isGranted: boolean;
  isDenied: boolean;
  isUndetermined: boolean;
  request: () => Promise<boolean>;
}

export const useCameraPermission = (): UseCameraPermissionResult => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission?.status === 'denied') {
      logger.scan.failed('Camera permission denied');
    }
  }, [permission?.status]);

  const request = async (): Promise<boolean> => {
    const result = await requestPermission();
    if (!result.granted) {
      logger.scan.failed('Camera permission not granted after request');
    }
    return result.granted;
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
    request,
  };
};
