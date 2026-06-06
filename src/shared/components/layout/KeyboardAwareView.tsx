import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ViewStyle } from 'react-native';

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const KeyboardAwareView: React.FC<KeyboardAwareViewProps> = ({ children, style }) => (
  <KeyboardAvoidingView
    style={[{ flex: 1 }, style]}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);
