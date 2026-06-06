import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as firebaseSignOut } from 'firebase/auth';
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
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setLoading: (loading) => set({ isLoading: loading }),

      signOut: async () => {
        await firebaseSignOut(auth);
        resetAnalytics();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive fields
      partialize: (state) => ({
        user: state.user
          ? { uid: state.user.uid, name: state.user.name, subscription: state.user.subscription }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
