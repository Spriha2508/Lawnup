/**
 * PlantEmblem — a soft, slowly "breathing" botanical emblem with a luminous
 * halo. The signature hero motif for Welcome + auth. Reanimated + svg, calm.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { color: C, palette: P } = theme;

export const PlantEmblem: React.FC<{ size?: number }> = ({ size = 96 }) => {
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.12 }],
    opacity: 0.5 + breath.value * 0.3,
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.025 }],
  }));

  const halo = size * 1.9;
  const leaf = size * 0.58;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* breathing halo */}
      <Animated.View style={[styles.halo, { width: halo, height: halo, left: (size - halo) / 2, top: (size - halo) / 2 }, haloStyle]}>
        <Svg width={halo} height={halo}>
          <Defs>
            <RadialGradient id="emblem-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={P.green[400]} stopOpacity={0.55} />
              <Stop offset="55%" stopColor={P.mint[400]} stopOpacity={0.22} />
              <Stop offset="100%" stopColor={P.mint[400]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={halo / 2} cy={halo / 2} r={halo / 2} fill="url(#emblem-halo)" />
        </Svg>
      </Animated.View>

      {/* badge */}
      <Animated.View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.32 }, badgeStyle]}>
        <Svg width={leaf} height={leaf} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={C.primary} opacity={0.95} />
          <Path d="M12 3V21" stroke={C.canvas} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M12 12.5C9.7 14.4 6.8 14.4 5.2 16M12 15.5C14.3 17.3 17.2 16.6 18.8 18" stroke={C.canvas} strokeWidth={0.9} strokeLinecap="round" opacity={0.7} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  halo: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    ...theme.shadows.card,
  },
});
