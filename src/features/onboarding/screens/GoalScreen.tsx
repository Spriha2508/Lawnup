import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { track } from '../../../services/analytics/posthog';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';

const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const GOALS = [
  { id: 'healthy',   icon: '🌿', label: 'Keep plants healthy',  desc: 'Thriving, not just surviving' },
  { id: 'learn',     icon: '📖', label: 'Learn plant care',     desc: 'Build green-thumb know-how' },
  { id: 'identify',  icon: '🔍', label: 'Identify plants',      desc: 'Name any unknown plant' },
  { id: 'balcony',   icon: '🪴', label: 'Balcony garden',       desc: 'Make the most of small space' },
  { id: 'herbs',     icon: '🌱', label: 'Grow herbs',           desc: 'Tulsi, mint, basil & more' },
  { id: 'veggies',   icon: '🍅', label: 'Grow vegetables',      desc: 'Homegrown & fresh' },
  { id: 'decorate',  icon: '🏡', label: 'Decorate with plants', desc: 'Style my home with green' },
  { id: 'confident', icon: '💚', label: 'Confident parent',     desc: 'Grow real green-thumb confidence' },
];

export const GoalScreen: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]));

  const handleFinish = () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    setGoals(selected);
    track('onboarding_completed', { goals: selected, city: user.city });

    // Enter the app on the local state immediately — never block first-run on the
    // server round-trip. The write is queued by Firestore (offline-persistent) and
    // retried on reconnect, so a flaky/absent connection can't trap the user on
    // this screen. A hard failure is logged but must not strand the user here.
    updateDoc(doc(db, `users/${user.uid}`), { onboardingComplete: true }).catch((e: any) => {
      console.warn('[Onboarding] onboardingComplete write failed (will retry on sync):', e?.message);
    });

    setUser({ ...user, onboardingComplete: true });
  };

  const canSubmit = selected.length > 0 && !isLoading;

  return (
    <OnboardingScaffold
      step={{ current: 4, total: 4 }}
      eyebrow="STEP 4 OF 4"
      title={"What's your\nmain goal?"}
      subtitle="Pick all that speak to you — we'll shape your home screen around them."
      ctaLabel={isLoading ? 'Setting up your garden…' : 'Enter Lawnup'}
      ctaEnabled={canSubmit}
      onCta={handleFinish}
      secondaryLabel={isLoading ? undefined : 'Skip for now'}
      onSecondary={handleFinish}
      scroll
    >
      <View style={styles.grid}>
        {GOALS.map((g, i) => (
          <SelectCard
            key={g.id}
            index={i}
            icon={g.icon}
            label={g.label}
            descriptor={g.desc}
            active={selected.includes(g.id)}
            onPress={() => toggle(g.id)}
            width={CARD_W}
            tall
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } });
