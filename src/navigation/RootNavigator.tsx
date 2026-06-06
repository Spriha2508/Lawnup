import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../features/auth/store/authStore';
import { identifyUser } from '../services/analytics/posthog';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';
import type { UserDoc } from '../types/firestore.types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full user doc from Firestore
        const snap = await getDoc(doc(db, `users/${firebaseUser.uid}`));
        if (snap.exists()) {
          const userDoc = snap.data() as UserDoc;
          setUser(userDoc);
          identifyUser(userDoc.uid, {
            name: userDoc.name,
            subscription: userDoc.subscription,
            city: userDoc.city,
          });
        } else {
          // User exists in Auth but no Firestore doc yet (mid-signup)
          setLoading(false);
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !user?.onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
