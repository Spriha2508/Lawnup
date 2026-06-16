import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  Welcome: undefined;
  Location: undefined;
  PlaceType: undefined;
  SkillLevel: undefined;
};

// Scan Stack
export type ScanStackParamList = {
  ScanLanding: undefined;
  Camera: undefined;
  Processing: { imageUri: string; extraUris?: string[] };
  ScanResult: { scanId: string };
  Nickname: { scanId: string; speciesName: string };
};

// My Plants Stack
export type PlantsStackParamList = {
  MyPlants: undefined;
  PlantDetail: { plantId: string };
  AddPlant: { fromScanId?: string; speciesName?: string; nickname?: string };
  EditPlant: { plantId: string };
  SoilAdvisor: { plantId?: string; speciesName?: string };
  LightAssessment: { plantId?: string; speciesName?: string };
  Tasks: undefined;
};

// AI Doctor Stack
export type ChatStackParamList = {
  ChatHome: { plantId?: string };
};

// Reminders Stack
export type RemindersStackParamList = {
  Reminders: undefined;
  AddReminder: { plantId?: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ScanHistory: undefined;
  HelpSupport: undefined;
  Reminders: undefined;
  AddReminder: { plantId?: string };
};

// Main Tab Navigator (5 tabs — Home · Plants · Scan · Chat · Profile)
export type MainTabParamList = {
  Home: undefined;
  Scan: NavigatorScreenParams<ScanStackParamList>;
  Plants: NavigatorScreenParams<PlantsStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Root-level modal so any tab can present it as an overlay (QA M3).
  Paywall: undefined;
};
