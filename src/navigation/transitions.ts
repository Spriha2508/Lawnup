/**
 * Shared screen transitions — a calm 250ms opacity cross-fade.
 *
 * Per the redesign: screens don't slide as separate pages; the content layer
 * cross-fades while the ambient world persists underneath. One fade spec for
 * every stack so navigation feels like moving through one continuous space.
 */

import { Easing } from 'react-native';
import type { StackCardInterpolationProps } from '@react-navigation/stack';
import { theme } from '@constants/designSystem';

const DURATION = theme.motion.duration.transition;

// Content cross-fade (no translate — the world doesn't slide).
export const fadeCard = ({ current }: StackCardInterpolationProps) => ({
  cardStyle: { opacity: current.progress },
});

export const fadeSpec = {
  open:  { animation: 'timing' as const, config: { duration: DURATION, easing: Easing.out(Easing.ease) } },
  close: { animation: 'timing' as const, config: { duration: DURATION, easing: Easing.in(Easing.ease) } },
};

// Convenience bundle for a stack's screenOptions.
export const fadeTransition = {
  cardStyleInterpolator: fadeCard,
  transitionSpec: fadeSpec,
} as const;
