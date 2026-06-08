import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { track } from '../../../services/analytics/posthog';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 28 * 2 - 12) / 2;

const GOALS = [
  { id: 'identify',  label: 'Keep them\nalive',    },
  { id: 'ai',        label: 'Help them\nthrive',   },
  { id: 'diseases',  label: 'Diagnose\nissues',    },
  { id: 'reminders', label: 'Build a\njungle',     },
];

// ─── Step progress bar (4 dashes, shows step 2 of 2) ─────────────────────────
const StepBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <View style={stepStyles.row}>
    {Array.from({ length: total }, (_, i) => (
      <View
        key={i}
        style={[stepStyles.seg, i < current && stepStyles.segActive]}
      />
    ))}
  </View>
);

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#DDD4C7',
  },
  segActive: {
    backgroundColor: '#6F943E',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const GoalScreen: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );

  const handleFinish = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    setGoals(selected);
    await updateDoc(doc(db, `users/${user.uid}`), { onboardingComplete: true });
    setUser({ ...user, onboardingComplete: true });
    track('onboarding_completed', { goals: selected, city: user.city });
    setIsLoading(false);
  };

  const canSubmit = selected.length > 0 && !isLoading;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Step bar */}
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <StepBar current={4} total={4} />
            <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
          </Animated.View>

          {/* Question */}
          <Animated.View entering={FadeInDown.delay(80).duration(450)}>
            <Text style={styles.question}>What's your{'\n'}main goal?</Text>
          </Animated.View>

          {/* 2 × 2 option grid */}
          <Animated.View entering={FadeInDown.delay(160).duration(450)} style={styles.grid}>
            {GOALS.map((g, i) => {
              const active = selected.includes(g.id);
              return (
                <OptionCard
                  key={g.id}
                  label={g.label}
                  active={active}
                  onPress={() => toggle(g.id)}
                />
              );
            })}
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View entering={FadeInUp.delay(400).duration(450)} style={styles.ctaWrap}>
          <Pressable
            style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            disabled={!canSubmit}
            onPress={handleFinish}
          >
            <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
              {isLoading ? 'Setting up...' : 'Enter Lawnup'}
            </Text>
          </Pressable>
          <Text style={styles.skip} onPress={isLoading ? undefined : handleFinish}>
            Skip for now
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

// ─── Option card ──────────────────────────────────────────────────────────────

const OptionCard: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label, active, onPress,
}) => (
  <Pressable
    style={[styles.card, active && styles.cardActive]}
    onPress={onPress}
  >
    {/* Radio circle top-right */}
    <View style={[styles.radio, active && styles.radioActive]}>
      {active && (
        <Animated.View entering={ZoomIn.duration(180)} style={styles.radioDot} />
      )}
    </View>

    {/* Label bottom-left */}
    <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
      {label}
    </Text>
  </Pressable>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 20,
  },

  stepLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#8A8575',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  question: {
    fontSize: 38,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 44,
    marginBottom: 32,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_W,
    height: CARD_W * 1.1,
    backgroundColor: '#EEE7DA',
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardActive: {
    backgroundColor: '#6F943E',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C4C0BA',
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 18,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 22,
  },
  cardLabelActive: {
    color: '#FFFFFF',
  },

  // Bottom CTA
  ctaWrap: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    paddingTop: 4,
    gap: 10,
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#C8C8BC' },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaTextDisabled: { color: 'rgba(255,255,255,0.7)' },
  skip: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    paddingVertical: 4,
  },
});
