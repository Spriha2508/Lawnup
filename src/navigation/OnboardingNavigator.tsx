import React from 'react';
import {
  createStackNavigator,
  type StackCardInterpolationProps,
  TransitionSpecs,
} from '@react-navigation/stack';
import { WelcomeScreen }    from '../features/onboarding/screens/WelcomeScreen';
import { LocationScreen }   from '../features/onboarding/screens/LocationScreen';
import { PlaceTypeScreen }  from '../features/onboarding/screens/PlaceTypeScreen';
import { SkillLevelScreen } from '../features/onboarding/screens/SkillLevelScreen';
import { PlantsTypeScreen } from '../features/onboarding/screens/PlantsTypeScreen';
import { GoalScreen }       from '../features/onboarding/screens/GoalScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

// Calm slide + fade — the incoming screen drifts gently in from the right and
// the outgoing one eases back, for a premium, continuous onboarding feel.
const slideFade = ({ current, next, layouts }: StackCardInterpolationProps) => {
  const w = layouts.screen.width;
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [w * 0.18, 0],
  });
  const outX = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -w * 0.06] })
    : 0;
  return {
    cardStyle: {
      opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
      transform: [{ translateX }, { translateX: outX as any }],
    },
  };
};

export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      cardStyle: { backgroundColor: '#F5F1E8' },
      cardStyleInterpolator: slideFade,
      transitionSpec: {
        open: TransitionSpecs.TransitionIOSSpec,
        close: TransitionSpecs.TransitionIOSSpec,
      },
    }}
  >
    <Stack.Screen name="Welcome"    component={WelcomeScreen}    />
    <Stack.Screen name="Location"   component={LocationScreen}   />
    <Stack.Screen name="PlaceType"  component={PlaceTypeScreen}  />
    <Stack.Screen name="SkillLevel" component={SkillLevelScreen} />
    <Stack.Screen name="PlantsType" component={PlantsTypeScreen} />
    <Stack.Screen name="Goal"       component={GoalScreen}       />
  </Stack.Navigator>
);
