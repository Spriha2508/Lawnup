import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { ZoomIn } from 'react-native-reanimated';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'PlantsType'>;

const { width: W } = Dimensions.get('window');
const CARD_SIZE = (W - 28 * 2 - 12) / 2;

const OPTIONS = [
  { id: 'tropicals',  label: 'Indoor\ntropicals' },
  { id: 'flowering',  label: 'Outdoor\nflowering' },
  { id: 'succulents', label: 'Succulents' },
  { id: 'herbs',      label: 'Herbs &\nedible' },
];

const StepBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <View style={stepStyles.row}>
    {Array.from({ length: total }, (_, i) => (
      <View key={i} style={[stepStyles.seg, i < current && stepStyles.segActive]} />
    ))}
  </View>
);

const stepStyles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 6, marginBottom: 28 },
  seg:       { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#DDD4C7' },
  segActive: { backgroundColor: '#6F943E' },
});

const OptionCard: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label, active, onPress,
}) => (
  <Pressable style={[styles.card, active && styles.cardActive]} onPress={onPress}>
    <View style={[styles.radio, active && styles.radioActive]}>
      {active && <Animated.View entering={ZoomIn.duration(180)} style={styles.radioDot} />}
    </View>
    <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{label}</Text>
  </Pressable>
);

export const PlantsTypeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<string>('');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.scroll}>
          <StepBar current={3} total={4} />
          <Text style={styles.stepLabel}>STEP 3 OF 4</Text>
          <Text style={styles.question}>What kind of plants{'\n'}do you love?</Text>

          <View style={styles.grid}>
            {OPTIONS.map(o => (
              <OptionCard
                key={o.id}
                label={o.label}
                active={selected === o.id}
                onPress={() => setSelected(o.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            style={[styles.cta, !selected && styles.ctaDisabled]}
            disabled={!selected}
            onPress={() => navigation.navigate('Goal')}
          >
            <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F5F1E8' },
  safe:  { flex: 1 },
  scroll: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },

  stepLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  question: {
    fontSize: 38,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 44,
    marginBottom: 32,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.05,
    backgroundColor: '#EEE7DA',
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardActive: { backgroundColor: '#6F943E' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C4C0BA',
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.2)' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  cardLabel: {
    fontSize: 18,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 22,
  },
  cardLabelActive: { color: '#FFFFFF' },

  ctaWrap: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    paddingTop: 4,
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
});
