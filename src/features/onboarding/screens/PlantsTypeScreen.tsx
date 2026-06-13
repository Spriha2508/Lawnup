import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingScaffold, SelectCard } from '../components/OnboardingKit';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'PlantsType'>;
const CARD_W = (Dimensions.get('window').width - 56 - 12) / 2;

const OPTIONS = [
  { id: 'indoor',     icon: '🪴', label: 'Indoor plants',   desc: 'Pothos, monstera, peace lily' },
  { id: 'outdoor',    icon: '🌳', label: 'Outdoor plants',  desc: 'Hardy garden growers' },
  { id: 'succulents', icon: '🌵', label: 'Succulents',      desc: 'Aloe, jade, cacti' },
  { id: 'flowering',  icon: '🌸', label: 'Flowering',       desc: 'Mogra, roses, hibiscus' },
  { id: 'herbs',      icon: '🌿', label: 'Herbs',           desc: 'Tulsi, mint, chillies' },
  { id: 'veggies',    icon: '🍅', label: 'Vegetables',      desc: 'Tomato, spinach, beans' },
  { id: 'rare',       icon: '✨', label: 'Rare plants',     desc: 'Collector specimens' },
  { id: 'tropicals',  icon: '🌴', label: 'Tropical',        desc: 'Lush, humid-loving' },
  { id: 'lowmaint',   icon: '🌱', label: 'Low maintenance', desc: 'Forgiving & easy' },
  { id: 'airpure',    icon: '💨', label: 'Air purifying',   desc: 'Cleaner indoor air' },
];

export const PlantsTypeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  return (
    <OnboardingScaffold
      step={{ current: 3, total: 4 }}
      eyebrow="STEP 3 OF 4"
      title={'What kind of plants\ndo you love?'}
      subtitle="We'll fill your guides with the greens you care about."
      ctaLabel="Continue"
      ctaEnabled={selected.length > 0}
      onCta={() => navigation.navigate('Goal')}
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
