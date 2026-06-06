import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../../constants/colors';

const { width: SW } = Dimensions.get('window');
export const FRAME_SIZE = SW * 0.72;
const CORNER = 28;
const BORDER = 3;
const CORNER_COLOR = colors.primaryLight;
const LINE_COLOR = 'rgba(82, 183, 136, 0.7)';

interface ScanFrameProps {
  active?: boolean;
}

export const ScanFrame: React.FC<ScanFrameProps> = ({ active = true }) => {
  const scanLine = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;

    // Scanning line — moves top to bottom, loops
    const lineAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle corner pulse
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    lineAnim.start();
    pulseAnim.start();

    return () => {
      lineAnim.stop();
      pulseAnim.stop();
    };
  }, [active, scanLine, pulse]);

  const lineTranslateY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 2],
  });

  return (
    <Animated.View
      style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE, transform: [{ scale: pulse }] }]}
    >
      {/* ── Corners ── */}
      {/* Top-left */}
      <View style={[styles.corner, styles.topLeft]}>
        <View style={[styles.cornerH, { backgroundColor: CORNER_COLOR }]} />
        <View style={[styles.cornerV, { backgroundColor: CORNER_COLOR }]} />
      </View>
      {/* Top-right */}
      <View style={[styles.corner, styles.topRight]}>
        <View style={[styles.cornerH, { backgroundColor: CORNER_COLOR }]} />
        <View style={[styles.cornerV, { backgroundColor: CORNER_COLOR }]} />
      </View>
      {/* Bottom-left */}
      <View style={[styles.corner, styles.bottomLeft]}>
        <View style={[styles.cornerH, { backgroundColor: CORNER_COLOR }]} />
        <View style={[styles.cornerV, { backgroundColor: CORNER_COLOR }]} />
      </View>
      {/* Bottom-right */}
      <View style={[styles.corner, styles.bottomRight]}>
        <View style={[styles.cornerH, { backgroundColor: CORNER_COLOR }]} />
        <View style={[styles.cornerV, { backgroundColor: CORNER_COLOR }]} />
      </View>

      {/* ── Scanning line ── */}
      {active && (
        <Animated.View
          style={[
            styles.scanLine,
            { transform: [{ translateY: lineTranslateY }] },
          ]}
        >
          <View style={styles.scanLineSolid} />
          <View style={[styles.scanLineGlow, { backgroundColor: LINE_COLOR }]} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0, transform: [{ scaleX: -1 }] },
  bottomLeft: { bottom: 0, left: 0, transform: [{ scaleY: -1 }] },
  bottomRight: {
    bottom: 0,
    right: 0,
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },
  cornerH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER,
    height: BORDER,
    borderRadius: BORDER / 2,
  },
  cornerV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BORDER,
    height: CORNER,
    borderRadius: BORDER / 2,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
  },
  scanLineSolid: {
    height: 2,
    backgroundColor: CORNER_COLOR,
    borderRadius: 1,
  },
  scanLineGlow: {
    height: 20,
    marginTop: -18,
    borderRadius: 10,
    opacity: 0.25,
  },
});
