import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const { width: W, height: H } = Dimensions.get('window');

const LeafIllustration: React.FC = () => (
  <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
    <Path
      d="M60 15C60 15 25 30 25 58C25 78 40 95 60 95C80 95 95 78 95 58C95 30 60 15 60 15Z"
      fill="rgba(111,148,62,0.12)"
      stroke="rgba(111,148,62,0.25)"
      strokeWidth={1.5}
    />
    <Path
      d="M60 15L60 95"
      stroke="rgba(111,148,62,0.20)"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M60 45C50 50 38 50 30 54M60 58C70 63 80 61 88 64"
      stroke="rgba(111,148,62,0.18)"
      strokeWidth={1.2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M60 15C60 15 80 22 88 35"
      stroke="rgba(111,148,62,0.15)"
      strokeWidth={1}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const DOTS = [
  { top: H * 0.12, left: W * 0.08,  size: 6 },
  { top: H * 0.20, right: W * 0.10, size: 4 },
  { top: H * 0.30, left: W * 0.72,  size: 5 },
  { top: H * 0.08, right: W * 0.28, size: 5 },
];

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';

  return (
    <View style={styles.root}>
      <View style={styles.blobGreen} />
      <View style={styles.blobOrange} />
      {DOTS.map((d, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { top: d.top, left: (d as any).left, right: (d as any).right, width: d.size, height: d.size, borderRadius: d.size / 2 },
          ]}
        />
      ))}

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.hero}>
          <View style={styles.illustrationWrap}>
            <LeafIllustration />
          </View>

          <Text style={styles.eyebrow}>WELCOME TO LAWNUP</Text>
          <Text style={styles.headline}>
            Hello,{'\n'}
            <Text style={styles.headlineName}>{firstName}.</Text>
          </Text>

          <View style={styles.dotSep} />

          <Text style={styles.body}>
            Let's personalize your garden experience.{'\n'}
            Just a few quick questions and you're{'\n'}
            ready to grow.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.ctaWrap}>
          <Pressable
            style={styles.cta}
            onPress={() => navigation.navigate('Location')}
          >
            <Text style={styles.ctaText}>Get started  →</Text>
          </Pressable>
          <Text style={styles.hint}>Takes less than a minute</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    overflow: 'hidden',
  },
  blobGreen: {
    position: 'absolute',
    width: W * 0.80,
    height: W * 0.80,
    borderRadius: W * 0.4,
    backgroundColor: 'rgba(160,195,120,0.28)',
    top: -W * 0.32,
    left: -W * 0.18,
  },
  blobOrange: {
    position: 'absolute',
    width: W * 0.60,
    height: W * 0.60,
    borderRadius: W * 0.30,
    backgroundColor: 'rgba(140,180,100,0.10)',
    bottom: -W * 0.2,
    right: -W * 0.12,
  },
  dot: {
    position: 'absolute',
    backgroundColor: 'rgba(111,148,62,0.13)',
  },

  safe: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  illustrationWrap: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#8A8575',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  headline: {
    fontSize: 48,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 54,
    marginBottom: 20,
  },
  headlineName: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#6F943E',
  },
  dotSep: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6F943E',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
    lineHeight: 26,
  },

  ctaWrap: {
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
});
