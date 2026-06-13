import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MyPlantsScreen } from '../features/my-plants/screens/MyPlantsScreen';
import { PlantDetailScreen } from '../features/my-plants/screens/PlantDetailScreen';
import { AddPlantScreen } from '../features/my-plants/screens/AddPlantScreen';
import { EditPlantScreen } from '../features/my-plants/screens/EditPlantScreen';
import { SoilAdvisorScreen } from '../features/my-plants/screens/SoilAdvisorScreen';
import { LightAssessmentScreen } from '../features/my-plants/screens/LightAssessmentScreen';
import { colors } from '../constants/colors';
import { fadeTransition } from './transitions';
import type { PlantsStackParamList } from './types';

const Stack = createStackNavigator<PlantsStackParamList>();

export const PlantsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
      headerTitleStyle: { fontFamily: 'Nunito-Bold' },
      headerShown: false,
      ...fadeTransition,
    }}
  >
    <Stack.Screen name="MyPlants" component={MyPlantsScreen} />
    <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
    <Stack.Screen name="AddPlant" component={AddPlantScreen} />
    <Stack.Screen name="EditPlant" component={EditPlantScreen} />
    <Stack.Screen name="SoilAdvisor" component={SoilAdvisorScreen} />
    <Stack.Screen name="LightAssessment" component={LightAssessmentScreen} />
  </Stack.Navigator>
);
