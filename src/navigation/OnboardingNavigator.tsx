import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen }    from '../features/onboarding/screens/WelcomeScreen';
import { LocationScreen }   from '../features/onboarding/screens/LocationScreen';
import { PlaceTypeScreen }  from '../features/onboarding/screens/PlaceTypeScreen';
import { SkillLevelScreen } from '../features/onboarding/screens/SkillLevelScreen';
import { PlantsTypeScreen } from '../features/onboarding/screens/PlantsTypeScreen';
import { GoalScreen }       from '../features/onboarding/screens/GoalScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown:      false,
      animationEnabled: true,
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
