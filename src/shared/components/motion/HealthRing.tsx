/**
 * HealthRing — a ring that draws itself on mount (stroke sweeps from 0 → value).
 * react-native-svg + Reanimated (no Skia needed → runs in any binary).
 *
 * Used on plant cards / detail to visualise health score. Optional center child.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  delay?: number;
  children?: React.ReactNode;
}

export const HealthRing: React.FC<Props> = ({
  progress,
  size = 40,
  stroke = 4,
  color = theme.color.primary,
  trackColor = 'rgba(0,0,0,0.08)',
  delay = 0,
  children,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withTiming(Math.max(0, Math.min(1, progress)), {
        duration: theme.motion.duration.cinematic,
        easing: theme.motion.ease.smooth,
      }),
    );
  }, [progress, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - p.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animatedProps={animatedProps}
          // start at 12 o'clock
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ? <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
