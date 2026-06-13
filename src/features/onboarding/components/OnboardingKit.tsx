/**
 * OnboardingKit — shared premium building blocks for the onboarding flow.
 *
 *  · AmbientBackground (living gradient) baseline via OnboardingScaffold
 *  · StepProgress    — segmented bar, current segment fills in on mount
 *  · SelectCard      — option card with calm selection feedback (fill + check + press)
 *  · OnboardingScaffold — consistent header + body + CTA chrome
 *
 * Calm, typographic, slow motion. No bursts, no bounce.
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── StepProgress ────────────────────────────────────────────────────────────
export const StepProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(120, withTiming(1, { duration: M.duration.cinematic, easing: M.ease.smooth }));
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={progress.row}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} filledBefore={i < current - 1} isCurrent={i === current - 1} fill={fill} />
      ))}
    </View>
  );
};

const Segment: React.FC<{ filledBefore: boolean; isCurrent: boolean; fill: { value: number } }> = ({
  filledBefore, isCurrent, fill,
}) => {
  const style = useAnimatedStyle(() => ({
    width: isCurrent ? `${fill.value * 100}%` : filledBefore ? '100%' : '0%',
  }));
  return (
    <View style={progress.seg}>
      <Animated.View style={[progress.segFill, style]} />
    </View>
  );
};

const progress = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: S['2xl'] },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' },
  segFill: { height: '100%', borderRadius: 2, backgroundColor: C.primary },
});

// ─── SelectCard ──────────────────────────────────────────────────────────────
const Check: React.FC<{ progress: { value: number } }> = ({ progress: p }) => {
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.6 + p.value * 0.4 }] }));
  return (
    <Animated.View style={style}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M5 12.5L10 17.5L19 7" stroke={C.onPrimary} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
};

interface SelectCardProps {
  label: string;
  descriptor?: string;
  active: boolean;
  onPress: () => void;
  index?: number;
  /** taller cards for grid layouts */
  tall?: boolean;
  /** fixed width (for grids); defaults to flex:1 */
  width?: number;
}

export const SelectCard: React.FC<SelectCardProps> = ({ label, descriptor, active, onPress, index = 0, tall, width }) => {
  const sel = useSharedValue(active ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    sel.value = withTiming(active ? 1 : 0, { duration: M.duration.standard, easing: M.ease.smooth });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [C.card, C.primary]),
    borderColor: interpolateColor(sel.value, [0, 1], [C.border, C.primary]),
    transform: [{ scale: 1 - press.value * 0.03 }, { translateY: -sel.value * 3 }],
    shadowOpacity: 0.06 + sel.value * 0.12,
  }));
  const labelStyle = useAnimatedStyle(() => ({ color: interpolateColor(sel.value, [0, 1], [C.textPrimary, C.onPrimary]) }));
  const descStyle  = useAnimatedStyle(() => ({ color: interpolateColor(sel.value, [0, 1], [C.textMuted, 'rgba(255,255,255,0.82)']) }));
  const ringStyle  = useAnimatedStyle(() => ({
    borderColor: interpolateColor(sel.value, [0, 1], [C.border, 'rgba(255,255,255,0.9)']),
    backgroundColor: interpolateColor(sel.value, [0, 1], ['rgba(0,0,0,0)', 'rgba(255,255,255,0.18)']),
  }));

  const onIn  = useCallback(() => { press.value = withSpring(1, M.spring.snappy); }, []); // eslint-disable-line
  const onOut = useCallback(() => { press.value = withSpring(0, M.spring.gentle); }, []); // eslint-disable-line

  return (
    <Animated.View
      entering={FadeInDown.delay(140 + index * 70).duration(M.duration.expressive)}
      style={[selectStyles.wrap, width ? { flex: undefined, width } : null]}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        style={[selectStyles.card, tall && selectStyles.cardTall, cardStyle]}
      >
        <Animated.View style={[selectStyles.ring, ringStyle]}>
          <Check progress={sel} />
        </Animated.View>
        <View>
          <Animated.Text style={[selectStyles.label, labelStyle]}>{label}</Animated.Text>
          {descriptor ? <Animated.Text style={[selectStyles.desc, descStyle]}>{descriptor}</Animated.Text> : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const selectStyles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    minHeight: 96,
    borderRadius: R.xl,
    borderWidth: 1,
    padding: S.lg,
    justifyContent: 'space-between',
    shadowColor: '#1C3520',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  cardTall: { minHeight: 132 },
  ring: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: F.serifMedium, fontSize: 21, lineHeight: 25, marginBottom: 3 },
  desc: { fontFamily: F.sans, fontSize: 12, lineHeight: 16 },
});

// ─── OnboardingScaffold ──────────────────────────────────────────────────────
interface ScaffoldProps {
  step?: { current: number; total: number };
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaEnabled: boolean;
  onCta: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  scroll?: boolean;
}

export const OnboardingScaffold: React.FC<ScaffoldProps> = ({
  eyebrow, title, subtitle, children, ctaLabel, ctaEnabled, onCta, secondaryLabel, onSecondary, scroll,
}) => {
  const cta = useSharedValue(0);
  const ctaColor = useAnimatedStyle(() => ({
    backgroundColor: ctaEnabled ? C.inkBtn : C.textFaint,
    transform: [{ scale: 1 - cta.value * 0.03 }],
  }));

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { showsVerticalScrollIndicator: false, contentContainerStyle: scaffold.scrollContent }
    : { style: scaffold.bodyFlex };

  return (
    <View style={scaffold.root}>
      {/* Atmosphere is the persistent root world — this screen is transparent over it. */}
      <SafeAreaView style={scaffold.safe} edges={['top', 'bottom']}>
        <Body {...(bodyProps as any)}>
          <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={scaffold.header}>
            {/* Progress is the JourneyVine (root-level, left edge) — no bar here. */}
            {eyebrow ? <Text style={scaffold.eyebrow}>{eyebrow}</Text> : null}
            <Text style={scaffold.title}>{title}</Text>
            {subtitle ? <Text style={scaffold.subtitle}>{subtitle}</Text> : null}
          </Animated.View>
          <View style={scaffold.children}>{children}</View>
        </Body>

        <View style={scaffold.ctaWrap}>
          <AnimatedPressable
            disabled={!ctaEnabled}
            onPress={onCta}
            onPressIn={() => { cta.value = withSpring(1, M.spring.snappy); }}
            onPressOut={() => { cta.value = withSpring(0, M.spring.gentle); }}
            style={[scaffold.cta, ctaColor]}
          >
            <Text style={[scaffold.ctaText, !ctaEnabled && scaffold.ctaTextOff]}>{ctaLabel}</Text>
          </AnimatedPressable>
          {secondaryLabel ? (
            <Pressable onPress={onSecondary} hitSlop={8} style={scaffold.secondary}>
              <Text style={scaffold.secondaryText}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
};

const scaffold = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1, paddingHorizontal: 28 },
  bodyFlex: { flex: 1, paddingTop: S.lg },
  scrollContent: { paddingTop: S.lg, paddingBottom: S.lg },
  header: { marginBottom: S['2xl'] },
  eyebrow: { ...T.eyebrow, color: C.textMuted, marginBottom: S.md },
  title: { fontFamily: F.serifMedium, fontSize: 40, lineHeight: 44, letterSpacing: -0.4, color: C.textPrimary },
  subtitle: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21, marginTop: S.md },
  children: { flex: 1 },
  ctaWrap: { paddingTop: S.md, paddingBottom: S.sm, gap: S.md, alignItems: 'center' },
  cta: { width: '100%', borderRadius: R.pill, paddingVertical: 17, alignItems: 'center' },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },
  ctaTextOff: { color: 'rgba(255,255,255,0.7)' },
  secondary: { paddingVertical: S.xs },
  secondaryText: { ...T.label, fontSize: 13, color: C.textMuted },
});
