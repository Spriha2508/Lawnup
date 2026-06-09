import { createContext, useContext } from 'react';

export type AuthRouteName = 'Landing' | 'Login' | 'Signup' | 'ForgotPassword';

export interface AuthNav {
  navigate: (route: AuthRouteName) => void;
  goBack:   () => void;
}

export const AuthNavigationContext = createContext<AuthNav>({
  navigate: () => {},
  goBack:   () => {},
});

export const useAuthNavigation = () => useContext(AuthNavigationContext);
