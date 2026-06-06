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
import { colors } from '../../../constants/colors';
import { NICKNAME_SUGGESTIONS } from '../../../constants/plants';

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
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.title}>Give it a name</Text>
          <Text style={styles.subtitle}>
            Plants with nicknames get 3× more care — proven by our users!
          </Text>
        </View>

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder={suggestions[0]}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={setValue}
          maxLength={24}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => onConfirm(finalName)}
        />

        {/* Chip suggestions */}
        <Text style={styles.suggestLabel}>Quick picks for {speciesName}:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setValue(s)}
              style={[
                styles.chip,
                value === s && styles.chipActive,
              ]}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 6,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#F8FAF5',
    paddingHorizontal: 18,
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  suggestLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: '#fff',
  },
  actions: {
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.2,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
