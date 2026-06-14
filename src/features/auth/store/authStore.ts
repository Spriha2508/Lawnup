import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as firebaseSignOut, deleteUser } from '@firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase/firebaseConfig';
import { resetAnalytics } from '../../../services/analytics/posthog';
import type { UserDoc } from '../../../types/firestore.types';

interface AuthState {
  user: UserDoc | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserDoc | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  /** Permanently delete the signed-in user's account + profile doc. */
  deleteAccount: () => Promise<void>;
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

      deleteAccount: async () => {
        const current = auth.currentUser;
        if (!current) throw new Error('No signed-in user');
        const uid = current.uid;

        // Remove the profile doc while still authenticated (rules need the user).
        // NOTE: client-side mode can't recursively delete the plants subcollection
        // — that requires a Cloud Function; tracked for backend hardening.
        try {
          await deleteDoc(doc(db, `users/${uid}`));
        } catch (e: any) {
          console.warn('[Auth] user doc delete failed (continuing to auth delete):', e?.message);
        }

        try {
          await deleteUser(current);
        } catch (e: any) {
          // Firebase requires a recent login to delete an account.
          if (e?.code === 'auth/requires-recent-login') {
            throw new Error('RECENT_LOGIN_REQUIRED');
          }
          throw e;
        }

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
