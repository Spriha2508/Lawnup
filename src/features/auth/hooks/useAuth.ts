import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { signUpWithEmail, signInWithEmail, sendPasswordReset } from '../services/authService';
import { identifyUser, track } from '../../../services/analytics/posthog';
import { getErrorMessage } from '../../../shared/utils/errorHandler';
import type { SignupFormData, LoginFormData } from '../types';

export const useAuth = () => {
  const { setUser, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signUpWithEmail(data);
      setUser(user);
      identifyUser(user.uid, { name: user.name, subscription: 'free' });
      track('app_opened', { source: 'signup' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithEmail(data);
      setUser(user);
      identifyUser(user.uid, { name: user.name, subscription: user.subscription });
      track('app_opened', { source: 'login' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    clearError: () => setError(null),
    signUp: handleSignUp,
    signIn: handleSignIn,
    resetPassword: handlePasswordReset,
    signOut,
  };
};
