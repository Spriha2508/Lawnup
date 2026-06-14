import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Ellipse } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

interface ShapeConfig {
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  opacity: number;
  type: 'leaf' | 'circle' | 'petal';
}

const DARK_SHAPES: ShapeConfig[] = [
  { x: W * 0.06,  y: H * 0.07,  size: 72,  rotation: 20,  delay: 0,    opacity: 0.18, type: 'leaf'   },
  { x: W * 0.72,  y: H * 0.05,  size: 90,  rotation: -30, delay: 500,  opacity: 0.14, type: 'leaf'   },
  { x: W * 0.82,  y: H * 0.38,  size: 55,  rotation: 45,  delay: 200,  opacity: 0.12, type: 'petal'  },
  { x: W * 0.03,  y: H * 0.52,  size: 80,  rotation: -15, delay: 700,  opacity: 0.15, type: 'leaf'   },
  { x: W * 0.55,  y: H * 0.72,  size: 60,  rotation: 35,  delay: 300,  opacity: 0.1,  type: 'petal'  },
  { x: W * 0.20,  y: H * 0.82,  size: 48,  rotation: -25, delay: 600,  opacity: 0.12, type: 'circle' },
  { x: W * 0.78,  y: H * 0.80,  size: 65,  rotation: 10,  delay: 100,  opacity: 0.1,  type: 'leaf'   },
];

const LIGHT_SHAPES: ShapeConfig[] = [
  { x: W * 0.06,  y: H * 0.07,  size: 72,  rotation: 20,  delay: 0,    opacity: 0.07, type: 'leaf'   },
  { x: W * 0.72,  y: H * 0.05,  size: 90,  rotation: -30, delay: 500,  opacity: 0.06, type: 'leaf'   },
  { x: W * 0.82,  y: H * 0.38,  size: 55,  rotation: 45,  delay: 200,  opacity: 0.05, type: 'petal'  },
  { x: W * 0.03,  y: H * 0.52,  size: 80,  rotation: -15, delay: 700,  opacity: 0.06, type: 'leaf'   },
  { x: W * 0.55,  y: H * 0.72,  size: 60,  rotation: 35,  delay: 300,  opacity: 0.05, type: 'petal'  },
  { x: W * 0.78,  y: H * 0.80,  size: 65,  rotation: 10,  delay: 100,  opacity: 0.04, type: 'leaf'   },
];

const LeafSvg = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 10 C20 10, 5 40, 5 60 C5 80, 25 95, 50 95 C75 95, 95 80, 95 60 C95 40, 80 10, 50 10 Z"
      fill={color}
    />
    <Path
      d="M50 10 L50 95"
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M50 40 C35 45, 20 55, 12 65 M50 55 C65 60, 80 55, 88 65"
      stroke="rgba(0,0,0,0.08)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const PetalSvg = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 5 C65 5, 95 30, 95 50 C95 70, 65 95, 50 95 C35 95, 5 70, 5 50 C5 30, 35 5, 50 5 Z"
      fill={color}
    />
    <Path
      d="M50 15 C58 30, 58 70, 50 85"
      stroke="rgba(0,0,0,0.08)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const CircleSvg = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx="50" cy="50" rx="45" ry="45" fill={color} />
    <Ellipse cx="50" cy="50" rx="30" ry="30" fill="rgba(0,0,0,0.05)" />
  </Svg>
);

const FloatingShape: React.FC<{ shape: ShapeConfig; color: string }> = ({ shape, color }) => {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(shape.rotation);
  const scale = useSharedValue(1);

  useEffect(() => {
    const dur = 3000 + shape.delay * 0.5;
    translateY.value = withDelay(
      shape.delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(4,   { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    rotate.value = withDelay(
      shape.delay + 200,
      withRepeat(
        withSequence(
          withTiming(shape.rotation + 8,  { duration: dur * 1.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(shape.rotation - 5,  { duration: dur * 1.3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      shape.delay + 100,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: dur * 1.1, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: dur * 1.1, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.shape,
        { left: shape.x, top: shape.y, opacity: shape.opacity },
        animStyle,
      ]}
    >
      {shape.type === 'leaf'   && <LeafSvg   size={shape.size} color={color} />}
      {shape.type === 'petal'  && <PetalSvg  size={shape.size} color={color} />}
      {shape.type === 'circle' && <CircleSvg size={shape.size} color={color} />}
    </Animated.View>
  );
};

interface Props {
  variant?: 'dark' | 'light';
  color?: string;
}

export const FloatingBotanicals: React.FC<Props> = ({
  variant = 'dark',
  color,
}) => {
  const shapes = variant === 'dark' ? DARK_SHAPES : LIGHT_SHAPES;
  const shapeColor = color ?? '#6F943E';

  return (
    <View style={styles.container} pointerEvents="none">
      {shapes.map((s, i) => (
        <FloatingShape key={i} shape={s} color={shapeColor} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
  },
});
