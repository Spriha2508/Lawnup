import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { BackHandler } from 'react-native';
import { AuthNavigationContext, type AuthRouteName } from './AuthNavigationContext';
import { setAtmosphereForRoute } from '../shared/components/motion/RootAtmosphere';
import { setVineForRoute } from '../shared/components/motion/JourneyVine';
import { LandingScreen }       from '../features/auth/screens/LandingScreen';
import { LoginScreen }         from '../features/auth/screens/LoginScreen';
import { SignupScreen }        from '../features/auth/screens/SignupScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';

export const AuthNavigator = memo(function AuthNavigator() {
  const [stack, setStack] = useState<AuthRouteName[]>(['Landing']);

  const navigate = useCallback((route: AuthRouteName) => {
    setStack(prev => [...prev, route]);
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  // Custom stack (not react-navigation) → drive the world layers manually.
  useEffect(() => {
    setAtmosphereForRoute(current);
    setVineForRoute(current);
  }, [current]);

  // Stable context value — only changes when navigate/goBack references change (never, due to useCallback [])
  const contextValue = useMemo(() => ({ navigate, goBack }), [navigate, goBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) { goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, goBack]);

  return (
    <AuthNavigationContext.Provider value={contextValue}>
      {current === 'Landing'        && <LandingScreen />}
      {current === 'Login'          && <LoginScreen />}
      {current === 'Signup'         && <SignupScreen />}
      {current === 'ForgotPassword' && <ForgotPasswordScreen />}
    </AuthNavigationContext.Provider>
  );
});
