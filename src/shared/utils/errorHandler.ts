import { FirebaseError } from 'firebase/app';

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'functions/resource-exhausted': 'You have reached your monthly limit. Upgrade to continue.',
  'functions/unauthenticated': 'Please log in to continue.',
  'functions/permission-denied': 'You do not have permission to perform this action.',
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    return FIREBASE_AUTH_MESSAGES[error.code] ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
};

export const isQuotaExceeded = (error: unknown): boolean => {
  if (error instanceof FirebaseError) {
    return error.code === 'functions/resource-exhausted';
  }
  return false;
};
