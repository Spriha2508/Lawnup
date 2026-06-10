import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'PlantsType'>;
const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const OPTIONS = [
  { id: 'tropicals',  label: 'Tropicals',  desc: 'Monstera, pothos, ferns' },
  { id: 'flowering',  label: 'Flowering',  desc: 'Mogra, genda, roses' },
  { id: 'succulents', label: 'Succulents', desc: 'Aloe, jade, cacti' },
  { id: 'herbs',      label: 'Herbs',      desc: 'Tulsi, mint, chillies' },
];

export const PlantsTypeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState('');

  return (
    <OnboardingScaffold
      step={{ current: 3, total: 4 }}
      eyebrow="STEP 3 OF 4"
      title={'What kind of plants\ndo you love?'}
      subtitle="We'll fill your guides with the greens you care about."
      ctaLabel="Continue"
      ctaEnabled={!!selected}
      onCta={() => navigation.navigate('Goal')}
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
