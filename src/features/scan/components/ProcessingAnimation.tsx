import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { theme } from '@constants/designSystem';

const C = theme.color;

// Calm, ambient processing orb — purely visual. Messaging and progress live in
// ProcessingScreen so there is a single, uncluttered message area. Kept to a few
// gentle loops (one slow arc rotation + a soft core breathe) to read premium and
// intelligent without feeling busy or draining frames.
export const ProcessingAnimation: React.FC = () => {
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 3200, useNativeDriver: true }),
    );
    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    spinAnim.start();
    breatheAnim.start();
    return () => { spinAnim.stop(); breatheAnim.stop(); };
  }, [spin, breathe]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const coreScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] });
  const haloOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <View style={styles.container}>
      {/* Soft ambient halos */}
      <Animated.View style={[styles.halo, { opacity: haloOpacity }]} />
      <View style={styles.haloOuter} />

      {/* Single slow arc — open top/right edge reads as motion, not a busy spinner */}
      <Animated.View style={[styles.arc, { transform: [{ rotate }] }]} />

      {/* Breathing core */}
      <Animated.View style={[styles.core, { transform: [{ scale: coreScale }] }]}>
        <Text style={styles.icon}>✦</Text>
      </Animated.View>
    </View>
  );
};

const RING = 132;

const styles = StyleSheet.create({
  container: {
    width: RING + 56,
    height: RING + 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: RING + 30,
    height: RING + 30,
    borderRadius: (RING + 30) / 2,
    backgroundColor: 'rgba(200,162,78,0.12)',
  },
  haloOuter: {
    position: 'absolute',
    width: RING + 56,
    height: RING + 56,
    borderRadius: (RING + 56) / 2,
    backgroundColor: 'rgba(200,162,78,0.05)',
  },
  arc: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: 'rgba(214,180,104,0.7)',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  core: {
    width: RING - 64,
    height: RING - 64,
    borderRadius: (RING - 64) / 2,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  icon: {
    fontSize: 26,
    color: C.onPrimary,
  },
});
