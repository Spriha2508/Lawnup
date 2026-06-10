import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'SkillLevel'>;
const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const OPTIONS = [
  { id: 'beginner',     label: 'Beginner',      desc: 'Just getting my hands dirty' },
  { id: 'intermediate', label: 'Intermediate',  desc: "I've kept a few alive" },
  { id: 'expert',       label: 'Expert',        desc: 'My home is a jungle' },
  { id: 'reluctant',    label: 'Reluctant',     desc: 'Plants happened to me' },
];

export const SkillLevelScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState('');

  return (
    <OnboardingScaffold
      step={{ current: 2, total: 4 }}
      eyebrow="STEP 2 OF 4"
      title={'How would you\ndescribe yourself?'}
      subtitle="No judgement — we'll meet you exactly where you are."
      ctaLabel="Continue"
      ctaEnabled={!!selected}
      onCta={() => navigation.navigate('PlantsType')}
    >
      <View style={styles.grid}>
        {OPTIONS.map((o, i) => (
          <SelectCard
            key={o.id}
            index={i}
            label={o.label}
            descriptor={o.desc}
            active={selected === o.id}
            onPress={() => setSelected(o.id)}
            width={CARD_W}
            tall
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } });
