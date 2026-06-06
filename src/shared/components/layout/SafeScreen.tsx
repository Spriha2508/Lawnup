import React from 'react';
import { View, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../constants/colors';

interface SafeScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  scrollable = false,
  backgroundColor = colors.background,
  style,
  contentStyle,
}) => {
  const inner = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ flexGrow: 1 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]}>
      {inner}
    </SafeAreaView>
  );
};
