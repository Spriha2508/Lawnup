import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const TOTAL_DURATION = 2600;

// ─── App icon: green rounded square with white leaf ───────────────────────────
const AppIcon: React.FC = () => (
  <View style={styles.iconBox}>
    <Svg width={38} height={38} viewBox="0 0 38 38" fill="none">
      <Path
        d="M19 5C19 5 8 10 8 20.5C8 26.8513 13.1487 32 19 32C24.8513 32 30 26.8513 30 20.5C30 10 19 5 19 5Z"
        fill="rgba(255,255,255,0.92)"
      />
      <Path
        d="M19 5L19 32"
        stroke="rgba(111,148,62,0.35)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M19 16C15.5 18 11.5 18 9 20M19 21C22.5 23 26 22 28 23"
        stroke="rgba(111,148,62,0.25)"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  </View>
);

// ─── Scattered botanical dots ─────────────────────────────────────────────────
const DOTS = [
  { top: H * 0.28, left: W * 0.10, size: 7 },
  { top: H * 0.32, right: W * 0.15, size: 5 },
  { top: H * 0.20, left: W * 0.65, size: 4 },
  { top: H * 0.42, left: W * 0.22, size: 6 },
  { top: H * 0.60, right: W * 0.12, size: 4 },
  { top: H * 0.68, left: W * 0.08, size: 5 },
  { top: H * 0.14, right: W * 0.30, size: 5 },
];

interface Props {
  onDone: () => void;
}

export const AnimatedSplash: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);

  const logoScale        = useSharedValue(0.6);
  const logoOpacity      = useSharedValue(0);
  const titleOpacity     = useSharedValue(0);
  const titleY           = useSharedValue(18);
  const tagOpacity       = useSharedValue(0);
  const tagY             = useSharedValue(12);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoScale.value    = withSpring(1, { damping: 14, stiffness: 90 });
    logoOpacity.value  = withTiming(1, { duration: 500 });
    titleOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    titleY.value       = withDelay(350, withSpring(0, { damping: 18, stiffness: 80 }));
    tagOpacity.value   = withDelay(600, withTiming(1, { duration: 450 }));
    tagY.value         = withDelay(600, withSpring(0, { damping: 18, stiffness: 80 }));

    containerOpacity.value = withDelay(
      2050,
      withTiming(0, { duration: 450, easing: Easing.out(Easing.ease) }),
    );

    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onDone();
      }
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer);
      if (!calledRef.current) {
        calledRef.current = true;
        onDone();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      {/* Background blobs */}
      <View style={styles.blobGreen} />
      <View style={styles.blobOrange} />

      {/* Scattered dots */}
      {DOTS.map((d, i) => (
        <View
          key={i}
          style={[
            styles.floatingDot,
            {
              top: d.top,
              left: (d as any).left,
              right: (d as any).right,
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
            },
          ]}
        />
      ))}

      {/* Center content */}
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <AppIcon />
        </Animated.View>

        <Animated.Text style={[styles.brand, titleStyle]}>
          Lawnup
        </Animated.Text>

        <Animated.Text style={[styles.tagline, tagStyle]}>
          YOUR AI PLANT COMPANION
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    overflow: 'hidden',
  },
  blobGreen: {
    position: 'absolute',
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: W * 0.425,
    backgroundColor: 'rgba(160,195,120,0.22)',
    top: -W * 0.35,
    left: -W * 0.2,
  },
  blobOrange: {
    position: 'absolute',
    width: W * 0.65,
    height: W * 0.65,
    borderRadius: W * 0.325,
    backgroundColor: 'rgba(140,180,100,0.12)',
    bottom: -W * 0.25,
    right: -W * 0.15,
  },
  floatingDot: {
    position: 'absolute',
    backgroundColor: 'rgba(111,148,62,0.12)',
  },
  center: {
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#6F943E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#6F943E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  brand: {
    fontSize: 44,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#111111',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#8A8575',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
