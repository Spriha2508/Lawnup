import * as functions from 'firebase-functions';

export const requireAuth = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  return context.auth.uid;
};

export const requireAppCheck = (context: functions.https.CallableContext): void => {
  if (!context.app) {
    throw new functions.https.HttpsError('unauthenticated', 'App Check verification required.');
  }
};
