import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../auth/store/authStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { track } from '../../../services/analytics/posthog';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';

const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const OPTIONS = [
  { id: 'beginner',     icon: '🌱', label: 'Beginner',      desc: 'Just getting my hands dirty' },
  { id: 'intermediate', icon: '🌿', label: 'Intermediate',  desc: "I've kept a few alive" },
  { id: 'expert',       icon: '🌳', label: 'Expert',        desc: 'My home is a jungle' },
  { id: 'reluctant',    icon: '😅', label: 'Reluctant',     desc: 'Plants happened to me' },
];

export const SkillLevelScreen: React.FC = () => {
  const { user, setUser } = useAuthStore();
  // Single-select: only one skill level can be chosen. Tapping the active card
  // again clears it.
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const select = (id: string) => setSelected(prev => (prev === id ? null : id));

  // Final onboarding step — completes the flow and enters the app.
  const handleFinish = () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    track('onboarding_completed', { skillLevel: selected, city: user.city });

    // Enter the app on local state immediately — never block first-run on the
    // server round-trip. The write is queued by Firestore (offline-persistent)
    // and retried on reconnect, so a flaky/absent connection can't strand the
    // user here. A hard failure is logged but must not trap the user.
    updateDoc(doc(db, `users/${user.uid}`), { onboardingComplete: true }).catch((e: any) => {
      console.warn('[Onboarding] onboardingComplete write failed (will retry on sync):', e?.message);
    });

    setUser({ ...user, onboardingComplete: true });
  };

  const canSubmit = selected !== null && !isLoading;

  return (
    <OnboardingScaffold
      step={{ current: 2, total: 2 }}
      eyebrow="STEP 2 OF 2"
      title={'How would you\ndescribe yourself?'}
      subtitle="So your care tips land right — never too basic, never over your head."
      ctaLabel={isLoading ? 'Setting up your garden…' : 'Enter LawnUp'}
      ctaEnabled={canSubmit}
      onCta={handleFinish}
      secondaryLabel={isLoading ? undefined : 'Skip for now'}
      onSecondary={handleFinish}
      scroll
    >
      <View style={styles.grid}>
        {OPTIONS.map((o, i) => (
          <SelectCard
            key={o.id}
            index={i}
            icon={o.icon}
            label={o.label}
            descriptor={o.desc}
            active={selected === o.id}
            onPress={() => select(o.id)}
            width={CARD_W}
            tall
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } });
