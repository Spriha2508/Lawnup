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

const webOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

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
  const [isFocused,    setIsFocused]    = useState(false);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocusProp?.(e);
  }, [onFocusProp]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlurProp?.(e);
  }, [onBlurProp]);

  const togglePassword = useCallback(() => setShowPassword(v => !v), []);

  // Derive border color — only this property changes on focus/error.
  // Background, elevation, shadow are NEVER mutated by focus state.
  const borderColor = error
    ? '#DC2626'
    : isFocused
      ? '#6F943E'
      : '#DDD4C7';

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.row, { borderColor }]}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

        <TextInput
          style={[styles.input, webOutline as object]}
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
          rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#6B6763',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Static background — never changes, no Android repaint on focus
    backgroundColor: '#EDE6D8',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 54,
    borderWidth: 1.5,
    // elevation and shadow deliberately absent — no GPU layer events
  },
  input: {
    flex: 1,
    color: '#111111',
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    paddingVertical: 0,
  },
  iconLeft:  { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  showBtn: {
    marginLeft: 8,
    paddingVertical: 4,
  },
  showBtnText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#DC2626',
    marginTop: 5,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    marginTop: 5,
  },
});

Input.displayName = 'Input';
