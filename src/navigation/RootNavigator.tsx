import React, { memo, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from '@firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import { useAuthStore } from '../features/auth/store/authStore';
import { ensureUserDoc } from '../features/auth/services/authService';
import { usePlantsStore } from '../features/my-plants/store/plantsStore';
import { subscribeToUserPlants } from '../features/my-plants/services/plantService';
import { identifyUser } from '../services/analytics/posthog';
import { checkUsageLimit } from '../services/firebase/functions';
import { useSubscriptionStore } from '../features/subscription/store/subscriptionStore';
import { config } from '../constants/config';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { PaywallScreen } from '../features/subscription/screens/PaywallScreen';
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
  const plantsUnsubRef = useRef<(() => void) | null>(null);

  // ── Boot diagnostic: confirm the Plant.id key reached the runtime ───────────
  // Logs length + prefix only (never the full key). If length is 0 here, the
  // device is running a stale bundle or .env wasn't picked up — reload the app.
  useEffect(() => {
    const key = (Constants.expoConfig?.extra?.plantIdKey as string | undefined) ?? '';
    if (key.length > 0) {
      console.log(`[ApiKeys] plantIdKey resolved — length: ${key.length}, prefix: ${key.slice(0, 6)}`);
    } else {
      console.warn('[ApiKeys] plantIdKey EMPTY at runtime — client scanning will fail. Reload the app after `expo start --clear`.');
    }
  }, []);

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
        // Stop the plants subscription and clear cached garden on sign-out
        plantsUnsubRef.current?.();
        plantsUnsubRef.current = null;
        usePlantsStore.getState().setPlants([]);
        // Ensure stale persisted counts don't affect the next sign-in
        useSubscriptionStore.getState().setUsageHydrated(false);
        return;
      }

      try {
        const userDoc = await fetchUserWithRetry(firebaseUser);
        setUser(userDoc);

        // Live-sync the user's garden from Firestore into the plants store
        plantsUnsubRef.current?.();
        plantsUnsubRef.current = subscribeToUserPlants(firebaseUser.uid, (plants) => {
          usePlantsStore.getState().setPlants(plants);
        });

        // Sync subscription plan so limits reflect the user's plan
        useSubscriptionStore.getState().setPlan(userDoc.subscription);

        if (config.BACKEND_ENABLED) {
          // Server is authoritative — clear any stale AsyncStorage counts before
          // the Function tells us the truth. Cameras gate renders behind
          // isUsageHydrated so users see a spinner, never a false "limit reached".
          useSubscriptionStore.getState().resetUsage();
          console.log('[UsageHydration] resetUsage — uid:', firebaseUser.uid, '— awaiting server sync');

          checkUsageLimit()
            .then((usage) => {
              console.log('[UsageHydration] resolved —', {
                uid: firebaseUser.uid,
                scansUsed: usage.scansUsed,
                scanLimit: usage.scanLimit,
                aiChatsUsed: usage.aiChatsUsed,
                plan: usage.plan,
              });
              useSubscriptionStore.getState().setUsage(usage.scansUsed, usage.aiChatsUsed);
              useSubscriptionStore.getState().setLimits(usage.scanLimit, usage.aiChatLimit);
              useSubscriptionStore.getState().setUsageHydrated(true);
            })
            .catch((err) => {
              console.warn('[UsageHydration] checkUsageLimit failed — failing open:', err?.message);
              // Fail open: let the user scan; server will re-validate on next call
              useSubscriptionStore.getState().setUsageHydrated(true);
            });
        } else {
          // Client-side internal-testing mode: no usage Function deployed.
          // Enforcement is the LOCAL period counters (canScanThisWeek /
          // canSendMessageToday), which persist across sessions — so we keep
          // them intact (no resetUsage) and just mark hydration done so gated
          // screens render immediately, with NO doomed network round-trip.
          useSubscriptionStore.getState().setUsageHydrated(true);
        }

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
      plantsUnsubRef.current?.();
      plantsUnsubRef.current = null;
    };
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5E7F61" />
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
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          {/* Root-level modal: any tab opens it as an overlay, no tab switch (QA M3). */}
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', gestureEnabled: true, animationEnabled: true }}
          />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
});

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F7F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color:      '#5E7F61',
    fontSize:   16,
    fontFamily: 'Nunito-Regular',
    marginTop:  16,
  },
});
