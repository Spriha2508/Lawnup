/**
 * PressableScale — a Pressable that springs down on press-in and back on
 * release. The app-wide micro-press interaction. UI-thread (Reanimated).
 *
 * Drop-in for Pressable: forwards onPress, style, disabled, hitSlop, etc.
 */

import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. Default 0.95. */
  to?: number;
  /** Disables the press animation (still fires onPress). */
  noAnim?: boolean;
}

export const PressableScale: React.FC<Props> = ({
  children, style, to = 0.95, noAnim = false, onPressIn, onPressOut, disabled, hitSlop, ...rest
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleIn = useCallback((e: any) => {
    if (!noAnim && !disabled) scale.value = withSpring(to, theme.motion.spring.snappy);
    onPressIn?.(e);
  }, [noAnim, disabled, to, onPressIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOut = useCallback((e: any) => {
    if (!noAnim) scale.value = withSpring(1, theme.motion.spring.snappy);
    onPressOut?.(e);
  }, [noAnim, onPressOut]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatedPressable
      style={[style, animStyle]}
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={disabled}
      // Forgiving touch area app-wide — a scaled Pressable can otherwise drop edge taps.
      hitSlop={hitSlop ?? 8}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
