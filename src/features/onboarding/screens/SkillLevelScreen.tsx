import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'SkillLevel'>;
const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const OPTIONS = [
  { id: 'beginner',     icon: '🌱', label: 'Beginner',      desc: 'Just getting my hands dirty' },
  { id: 'intermediate', icon: '🌿', label: 'Intermediate',  desc: "I've kept a few alive" },
  { id: 'expert',       icon: '🌳', label: 'Expert',        desc: 'My home is a jungle' },
  { id: 'reluctant',    icon: '😅', label: 'Reluctant',     desc: 'Plants happened to me' },
];

export const SkillLevelScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  // Single-select: only one skill level can be chosen. Tapping the active card
  // again clears it. (The other personality screens stay multi-select.)
  const [selected, setSelected] = useState<string | null>(null);
  const select = (id: string) => setSelected(prev => (prev === id ? null : id));

  return (
    <OnboardingScaffold
      step={{ current: 2, total: 4 }}
      eyebrow="STEP 2 OF 4"
      title={'How would you\ndescribe yourself?'}
      subtitle="So your care tips land right — never too basic, never over your head."
      ctaLabel="Continue"
      ctaEnabled={selected !== null}
      onCta={() => navigation.navigate('PlantsType')}
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
