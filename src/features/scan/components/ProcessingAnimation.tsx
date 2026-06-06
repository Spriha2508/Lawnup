import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { PROCESSING_STAGES } from '../mocks/scanMocks';

interface ProcessingAnimationProps {
  onComplete?: () => void;
}

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({ onComplete }) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const iconFade = useRef(new Animated.Value(1)).current;
  const [stageIndex, setStageIndex] = useState(0);
  const [stageFade] = useState(new Animated.Value(1));

  // Rotating rings
  useEffect(() => {
    const r1 = Animated.loop(
      Animated.timing(ring1, { toValue: 1, duration: 2200, useNativeDriver: true })
    );
    const r2 = Animated.loop(
      Animated.timing(ring2, { toValue: 1, duration: 1600, useNativeDriver: true })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 700, useNativeDriver: true }),
      ])
    );
    r1.start();
    r2.start();
    pulse.start();
    return () => { r1.stop(); r2.stop(); pulse.stop(); };
  }, [ring1, ring2, scale]);

  // Cycle through stage messages
  useEffect(() => {
    let idx = 0;
    let accumulatedMs = 0;

    const timers: ReturnType<typeof setTimeout>[] = PROCESSING_STAGES.map((stage) => {
      const t = setTimeout(() => {
        Animated.sequence([
          Animated.timing(stageFade, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(stageFade, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        setStageIndex(idx);
        idx++;
      }, accumulatedMs);
      accumulatedMs += stage.durationMs;
      return t;
    });

    return () => timers.forEach(clearTimeout);
  }, [stageFade]);

  const spin1 = ring1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = ring2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const currentStage = PROCESSING_STAGES[stageIndex] ?? PROCESSING_STAGES[PROCESSING_STAGES.length - 1];

  return (
    <View style={styles.container}>
      {/* Outer glow rings */}
      <View style={styles.glowRing} />
      <View style={[styles.glowRing, styles.glowRing2]} />

      {/* Rotating arc rings */}
      <Animated.View style={[styles.ring, styles.ring1, { transform: [{ rotate: spin1 }] }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ rotate: spin2 }] }]} />

      {/* Core circle */}
      <Animated.View style={[styles.core, { transform: [{ scale }] }]}>
        <Text style={styles.icon}>{currentStage.icon}</Text>
      </Animated.View>

      {/* Stage message */}
      <Animated.View style={[styles.messageBox, { opacity: stageFade }]}>
        <Text style={styles.message}>{currentStage.message}</Text>
      </Animated.View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {PROCESSING_STAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i <= stageIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const RING_SIZE = 140;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
    borderRadius: (RING_SIZE + 60) / 2,
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
  },
  glowRing2: {
    width: RING_SIZE + 100,
    height: RING_SIZE + 100,
    borderRadius: (RING_SIZE + 100) / 2,
    backgroundColor: 'rgba(45, 106, 79, 0.04)',
  },
  ring: {
    position: 'absolute',
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  ring1: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  ring2: {
    width: RING_SIZE - 24,
    height: RING_SIZE - 24,
    borderColor: colors.accent,
    opacity: 0.5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  core: {
    width: RING_SIZE - 56,
    height: RING_SIZE - 56,
    borderRadius: (RING_SIZE - 56) / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  icon: {
    fontSize: 32,
  },
  messageBox: {
    marginTop: RING_SIZE / 2 + 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dots: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.primaryLight,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
