import React, { memo, useCallback, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

const webOutlineNone = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

export const Input: React.FC<InputProps> = memo(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? '#DC2626' : isFocused ? '#6F943E' : '#DDD4C7';

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocusProp?.(e);
  }, [onFocusProp]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlurProp?.(e);
  }, [onBlurProp]);

  const togglePassword = useCallback(() => setShowPassword(p => !p), []);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputRow, { borderColor }, isFocused && styles.inputRowFocused]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={styles.textInput}
          placeholderTextColor="#B0ACA6"
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={togglePassword}
            style={styles.showBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: '#4A4640',
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE6D8',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
    elevation: 0, // always present so Android never creates/destroys hardware layer on focus
  },
  inputRowFocused: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#6F943E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    color: '#111111',
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    paddingVertical: 0,
    ...(webOutlineNone as object),
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
  showBtn: {
    marginLeft: 8,
    paddingVertical: 4,
  },
  showBtnText: {
    color: '#6F943E',
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: 5,
  },
  hintText: {
    color: '#9E9A94',
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: 5,
  },
});
