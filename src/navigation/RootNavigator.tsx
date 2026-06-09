import React, { memo, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from '@firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import { useAuthStore } from '../features/auth/store/authStore';
import { ensureUserDoc } from '../features/auth/services/authService';
import { identifyUser } from '../services/analytics/posthog';
import { checkUsageLimit } from '../services/firebase/functions';
import { useSubscriptionStore } from '../features/subscription/store/subscriptionStore';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const AUTH_TIMEOUT_MS = 10000;
const FETCH_RETRIES   = 3;

const ROOT_STACK_OPTIONS = {
  headerShown:      false,
  animationEnabled: false,
} as const;

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const fetchUserWithRetry = async (firebaseUser: import('@firebase/auth').User, retries = FETCH_RETRIES) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await ensureUserDoc(firebaseUser);
    } catch (e: any) {
      console.warn(`[Auth] Firestore attempt ${attempt + 1} failed:`, e?.message);
      if (attempt < retries - 1) await delay(1000 * (attempt + 1));
    }
  }
  throw new Error('Firestore unreachable after retries');
};

export const RootNavigator = memo(function RootNavigator() {
  // Selector-based subscriptions: each only triggers a re-render when its own value changes
  const user            = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading       = useAuthStore(state => state.isLoading);
  const setUser         = useAuthStore(state => state.setUser);
  const setLoading      = useAuthStore(state => state.setLoading);

  const resolvedRef = useRef(false);

  // ── Firebase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn('[Auth] Timeout — forcing isLoading=false');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      resolvedRef.current = true;
      clearTimeout(timeout);

      if (!firebaseUser) {
        setUser(null);
        return;
      }

      try {
        const userDoc = await fetchUserWithRetry(firebaseUser);
        setUser(userDoc);

        // Sync subscription plan so scan limits reflect the user's plan
        useSubscriptionStore.getState().setPlan(userDoc.subscription);

        // Sync usage counts from server (non-blocking — local counts still work if this fails)
        checkUsageLimit()
          .then((usage) => {
            useSubscriptionStore.getState().setUsage(usage.scansUsed, usage.aiChatsUsed);
            useSubscriptionStore.getState().setLimits(usage.scanLimit, usage.aiChatLimit);
          })
          .catch(() => {});

        identifyUser(userDoc.uid, {
          name:         userDoc.name,
          subscription: userDoc.subscription,
          city:         userDoc.city,
        });
      } catch (e: any) {
        console.error('[Auth] Could not load user doc after retries:', e?.message);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6F943E" />
        <Text style={styles.loadingText}>Starting LawnUp...</Text>
      </View>
    );
  }

  // Auth screens rendered directly — no Stack.Navigator wrapper so no Animated.View
  // around auth screens, which eliminates the keyboard-open layout flicker on Android.
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={ROOT_STACK_OPTIONS}>
      {user?.onboardingComplete ? (
        <Stack.Screen name="Main"       component={MainTabNavigator}    />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
});

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color:      '#6F943E',
    fontSize:   16,
    fontFamily: 'Nunito-Regular',
    marginTop:  16,
  },
});
