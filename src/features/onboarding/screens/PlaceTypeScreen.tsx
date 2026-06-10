import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'PlaceType'>;
const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const OPTIONS = [
  { id: 'apartment', label: 'Apartment', desc: 'Indoor light & cozy corners' },
  { id: 'garden',    label: 'Garden',    desc: 'Open soil, sun & space' },
  { id: 'balcony',   label: 'Balcony',   desc: 'Pots, rails & city air' },
  { id: 'mix',       label: 'Mix of all', desc: 'A little of everything' },
];

export const PlaceTypeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState('');

  return (
    <OnboardingScaffold
      step={{ current: 1, total: 4 }}
      eyebrow="STEP 1 OF 4"
      title={'Where will your\nplants live?'}
      subtitle="So we tailor light and watering advice to your space."
      ctaLabel="Continue"
      ctaEnabled={!!selected}
      onCta={() => navigation.navigate('SkillLevel')}
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

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
