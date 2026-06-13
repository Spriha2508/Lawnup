import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NICKNAME_SUGGESTIONS } from '../../../constants/plants';
import { theme } from '@constants/designSystem';

const C = theme.color;

interface NicknameInputCardProps {
  speciesName: string;
  onConfirm: (nickname: string) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export const NicknameInputCard: React.FC<NicknameInputCardProps> = ({
  speciesName,
  onConfirm,
  onSkip,
  isLoading = false,
}) => {
  const suggestions = NICKNAME_SUGGESTIONS[speciesName] ?? NICKNAME_SUGGESTIONS.default;
  const [value, setValue] = useState('');

  const finalName = value.trim() || suggestions[0];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Give it a name</Text>
          <Text style={styles.subtitle}>
            Plants with names get better care.
          </Text>
        </View>

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder={suggestions[0]}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={setValue}
          maxLength={24}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => onConfirm(finalName)}
        />

        {/* Chip suggestions */}
        <Text style={styles.suggestLabel}>Suggestions for {speciesName}:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setValue(s)}
              style={[styles.chip, value === s && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, value === s && styles.chipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.confirmBtn, isLoading && { opacity: 0.7 }]}
            onPress={() => onConfirm(finalName)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>
              {isLoading ? 'Saving...' : `Save as "${finalName}"`}
            </Text>
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip — use species name</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    gap: 5,
  },
  title: {
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 26,
    color: C.textPrimary,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.input,
    paddingHorizontal: 18,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
  suggestLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chips: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.input,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: C.textSecondary,
  },
  chipTextActive: {
    color: C.onPrimary,
  },
  actions: {
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: C.onPrimary,
    letterSpacing: 0.2,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: C.textMuted,
  },
});
