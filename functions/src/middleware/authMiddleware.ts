import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

export const requireAuth = (request: CallableRequest): string => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  return request.auth.uid;
};

export const requireAppCheck = (request: CallableRequest): void => {
  if (!request.app) {
    throw new HttpsError('unauthenticated', 'App Check verification required.');
  }
};
