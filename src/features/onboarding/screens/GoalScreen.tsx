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
  { id: 'identify',  label: 'Keep them alive', desc: 'Never miss a watering' },
  { id: 'ai',        label: 'Help them thrive', desc: 'Smart, seasonal care' },
  { id: 'diseases',  label: 'Diagnose issues',  desc: 'Spot trouble early' },
  { id: 'reminders', label: 'Build a jungle',   desc: 'Grow my collection' },
];

export const GoalScreen: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]));

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
    >
      <View style={styles.grid}>
        {GOALS.map((g, i) => (
          <SelectCard
            key={g.id}
            index={i}
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
