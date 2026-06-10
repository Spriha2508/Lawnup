import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
export const FRAME_SIZE = SW * 0.74;

const CORNER = 32;
const BORDER = 2.5;
const CORNER_COLOR = '#FFFFFF';        // neutral white guides read calmer/premium over a live feed
const SWEEP_COLOR = 'rgba(127,176,105,0.55)'; // soft brand-green sweep

interface ScanFrameProps {
  active?: boolean;
}

// Calm, premium framing guides: four rounded corner brackets that breathe
// gently in opacity, plus a single slow, soft light sweep that signals
// "intelligent scanning" without the noisy sci-fi scan-line look.
export const ScanFrame: React.FC<ScanFrameProps> = ({ active = true }) => {
  const breathe = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;

    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );

    // One slow, gentle pass — long pause at the ends keeps it unobtrusive
    const sweepAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );

    breatheAnim.start();
    sweepAnim.start();
    return () => { breatheAnim.stop(); sweepAnim.stop(); };
  }, [active, breathe, sweep]);

  const cornerOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] });
  const sweepTranslateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [6, FRAME_SIZE - 24] });
  const sweepOpacity = sweep.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 0.9, 0.9, 0] });

  return (
    <View style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: cornerOpacity }]}>
        <View style={[styles.corner, styles.topLeft]}>
          <View style={styles.cornerH} />
          <View style={styles.cornerV} />
        </View>
        <View style={[styles.corner, styles.topRight]}>
          <View style={styles.cornerH} />
          <View style={styles.cornerV} />
        </View>
        <View style={[styles.corner, styles.bottomLeft]}>
          <View style={styles.cornerH} />
          <View style={styles.cornerV} />
        </View>
        <View style={[styles.corner, styles.bottomRight]}>
          <View style={styles.cornerH} />
          <View style={styles.cornerV} />
        </View>
      </Animated.View>

      {active && (
        <Animated.View
          style={[styles.sweep, { opacity: sweepOpacity, transform: [{ translateY: sweepTranslateY }] }]}
        >
          <View style={styles.sweepLine} />
          <View style={styles.sweepGlow} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: { position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0, transform: [{ scaleX: -1 }] },
  bottomLeft: { bottom: 0, left: 0, transform: [{ scaleY: -1 }] },
  bottomRight: { bottom: 0, right: 0, transform: [{ scaleX: -1 }, { scaleY: -1 }] },
  cornerH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER,
    height: BORDER,
    borderRadius: BORDER,
    backgroundColor: CORNER_COLOR,
  },
  cornerV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BORDER,
    height: CORNER,
    borderRadius: BORDER,
    backgroundColor: CORNER_COLOR,
  },
  sweep: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
  },
  sweepLine: {
    height: 1.5,
    borderRadius: 1,
    backgroundColor: SWEEP_COLOR,
  },
  sweepGlow: {
    height: 16,
    marginTop: -15,
    borderRadius: 10,
    backgroundColor: SWEEP_COLOR,
    opacity: 0.18,
  },
});
