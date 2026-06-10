/**
 * AuthField — premium auth input with a calm focus transition.
 * Local to the auth flow so its refined focus states don't ripple into the
 * shared Input used elsewhere. Reanimated border/fill interpolation (no jump).
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, TextInputProps, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
const webOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

interface Props extends TextInputProps {
  label: string;
  isPassword?: boolean;
}

export const AuthField: React.FC<Props> = ({ label, isPassword = false, onFocus, onBlur, ...props }) => {
  const [show, setShow] = useState(false);
  const focus = useSharedValue(0);

  const handleFocus = useCallback((e: any) => { focus.value = withTiming(1, { duration: M.duration.standard, easing: M.ease.smooth }); onFocus?.(e); }, [onFocus]); // eslint-disable-line
  const handleBlur  = useCallback((e: any) => { focus.value = withTiming(0, { duration: M.duration.standard, easing: M.ease.smooth }); onBlur?.(e); }, [onBlur]); // eslint-disable-line

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [C.border, C.primary]),
    backgroundColor: interpolateColor(focus.value, [0, 1], ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.92)']),
  }));
  const labelStyle = useAnimatedStyle(() => ({ color: interpolateColor(focus.value, [0, 1], [C.textMuted, C.primary]) }));

  return (
    <View style={styles.wrap}>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <Animated.View style={[styles.field, fieldStyle]}>
        <TextInput
          style={[styles.input, webOutline as object]}
          placeholderTextColor={C.textFaint}
          secureTextEntry={isPassword && !show}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {isPassword ? (
          <Pressable onPress={() => setShow(v => !v)} hitSlop={8} style={styles.toggle}>
            <Text style={styles.toggleText}>{show ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: S.lg },
  label: { ...T.eyebrow, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: S.sm },
  field: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: R.lg, borderWidth: 1.5, paddingHorizontal: S.lg, height: 56,
  },
  input: { flex: 1, ...T.body, color: C.textPrimary, paddingVertical: 0 },
  toggle: { paddingVertical: S.xs, paddingLeft: S.sm },
  toggleText: { ...T.label, fontSize: 13, color: C.primary },
});
