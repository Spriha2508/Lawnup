/**
 * AnimatedSplash — picks the Skia growth sequence when the native module is
 * available, else a Reanimated-only fallback. The Skia impl is require()'d
 * lazily so its native import never evaluates in Expo Go.
 *
 * Public contract unchanged: <AnimatedSplash onDone={...} />.
 */

import React from 'react';
import { isSkiaAvailable } from './skiaSafe';

interface Props {
  onDone: () => void;
}

export const AnimatedSplash: React.FC<Props> = isSkiaAvailable
  ? require('./AnimatedSplash.skia').AnimatedSplashSkia
  : require('./AnimatedSplashFallback').AnimatedSplashFallback;
