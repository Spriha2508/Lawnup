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
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  return (
    <OnboardingScaffold
      step={{ current: 2, total: 4 }}
      eyebrow="STEP 2 OF 4"
      title={'How would you\ndescribe yourself?'}
      subtitle="No judgement — we'll meet you exactly where you are."
      ctaLabel="Continue"
      ctaEnabled={selected.length > 0}
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
            active={selected.includes(o.id)}
            onPress={() => toggle(o.id)}
            width={CARD_W}
            tall
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } });
