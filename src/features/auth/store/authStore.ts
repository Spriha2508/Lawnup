import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as firebaseSignOut } from '@firebase/auth';
import { auth } from '../../../services/firebase/firebaseConfig';
import { resetAnalytics } from '../../../services/analytics/posthog';
import type { UserDoc } from '../../../types/firestore.types';

interface AuthState {
  user: UserDoc | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserDoc | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => {
        const curr = get();
        // Early bailout: same reference and already not loading → no store update → no re-renders
        if (Object.is(curr.user, user) && !curr.isLoading) return;
        set({ user, isAuthenticated: !!user, isLoading: false });
      },

      setLoading: (loading) => {
        const curr = get();
        if (curr.isLoading === loading) return;
        set({ isLoading: loading });
      },

      signOut: async () => {
        await firebaseSignOut(auth);
        resetAnalytics();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user
          ? {
              uid: state.user.uid,
              name: state.user.name,
              subscription: state.user.subscription,
              onboardingComplete: state.user.onboardingComplete,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
        isLoading: false,
      }),
    }
  )
);
