import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { colors } from '../../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-text-secondary text-sm font-nunito-semibold mb-1.5">{label}</Text>
      )}

      <View
        className={[
          'flex-row items-center bg-surface rounded-xl px-4 border',
          isFocused ? 'border-primary' : error ? 'border-error' : 'border-border',
        ].join(' ')}
        style={{ minHeight: 52 }}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}

        <TextInput
          className="flex-1 text-text-primary text-base font-nunito-regular"
          style={{ paddingVertical: 12 }}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword((p) => !p)} className="ml-2">
            <Text className="text-text-secondary text-sm">{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="ml-2">{rightIcon}</View>
        )}
      </View>

      {error && <Text className="text-error text-xs mt-1 font-nunito-regular">{error}</Text>}
      {hint && !error && (
        <Text className="text-text-secondary text-xs mt-1 font-nunito-regular">{hint}</Text>
      )}
    </View>
  );
};
