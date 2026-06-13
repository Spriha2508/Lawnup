/**
 * LightRays — soft volumetric light shafts pouring from a point (default: above
 * the screen, top-centre). Atmospheric "god-rays" for immersive, cinematic
 * moments — Welcome, Scan, Result. Pure Reanimated + react-native-svg, UI-thread,
 * decorative (pointerEvents none). Keep opacity low; this is atmosphere, not UI.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

type Props = {
  originX?: number;
  originY?: number;
  count?: number;
  spread?: number;   // total fan angle in radians
  length?: number;
  color?: string;
  opacity?: number;
};

export const LightRays: React.FC<Props> = ({
  originX = W * 0.5,
  originY = -H * 0.06,
  count = 7,
  spread = 1.15,
  length = H * 1.05,
  color = '#FBEFC8',
  opacity = 0.12,
}) => {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 6500, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({ opacity: opacity * (0.6 + shimmer.value * 0.7) }));

  const rays = useMemo(() => {
    const arr: { points: string; op: number }[] = [];
    const step = count > 1 ? spread / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const a = -spread / 2 + step * i;            // angle from straight-down
      const halfW = 18 + (i % 3) * 12;             // ray width at the far end
      const tipX = originX + Math.sin(a) * length;
      const tipY = originY + Math.cos(a) * length;
      const px = Math.cos(a) * halfW;              // perpendicular spread at tip
      const py = -Math.sin(a) * halfW;
      arr.push({
        points: `${originX - 2},${originY} ${tipX + px},${tipY + py} ${tipX - px},${tipY - py}`,
        op: i % 2 === 0 ? 1 : 0.6,
      });
    }
    return arr;
  }, [originX, originY, count, spread, length]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        <Defs>
          <LinearGradient id="lr-grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.95} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.16} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {rays.map((r, i) => (
          <Polygon key={i} points={r.points} fill="url(#lr-grad)" fillOpacity={r.op} />
        ))}
      </Svg>
    </Animated.View>
  );
};
