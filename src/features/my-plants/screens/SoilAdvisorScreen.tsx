import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { usePlantsStore } from '../store/plantsStore';
import { retrievePlantKnowledge } from '../../../services/knowledge';
import { theme } from '@constants/designSystem';
import type { PlantsStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
type Nav = StackNavigationProp<PlantsStackParamList, 'SoilAdvisor'>;
type Route = RouteProp<PlantsStackParamList, 'SoilAdvisor'>;

const BAR_COLORS = ['#7E6B52', '#5E7F61', '#C2683C', '#8A8D80', '#46603F', '#B5781E'];

const DEFAULT_MIX = {
  name: 'All-purpose mix',
  components: [
    { material: 'Potting soil', percent: 50 },
    { material: 'Cocopeat / compost', percent: 30 },
    { material: 'Coarse sand / perlite', percent: 20 },
  ],
  ph: '6.0–7.0',
};

const MIX_STEPS = [
  'Combine the dry ingredients in the ratios above and mix thoroughly.',
  'Moisten lightly until the mix just holds together — never soggy.',
  'Fill the pot leaving room for roots, firm gently, then water in.',
];

const REPOT_TIP = 'Repot every 1–2 years, or when roots circle the pot or poke out the drainage holes. Go just one size up — too large a pot holds excess water and risks root rot.';

export const SoilAdvisorScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { plants } = usePlantsStore();

  const [selectedId, setSelectedId] = useState<string | null>(
    route.params?.plantId ?? plants[0]?.plantId ?? null,
  );

  const selectedPlant = plants.find((p) => p.plantId === selectedId) ?? null;
  const species = selectedPlant?.speciesName ?? route.params?.speciesName ?? '';

  const { mix, inKB, planted } = useMemo(() => {
    const resolved = species ? retrievePlantKnowledge(species) : null;
    if (resolved?.soil) return { mix: resolved.soil, inKB: true, planted: resolved.plant.commonNameEn };
    return { mix: DEFAULT_MIX, inKB: false, planted: null };
  }, [species]);

  const label = selectedPlant?.nickname || planted || species || 'your plant';

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Soil Advisor</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.lead}>The right mix for{'\n'}healthy roots.</Text>

          {/* Plant picker */}
          {plants.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {plants.map((p) => {
                const active = p.plantId === selectedId;
                return (
                  <TouchableOpacity key={p.plantId} style={[styles.chip, active && styles.chipActive]} onPress={() => setSelectedId(p.plantId)} activeOpacity={0.8}>
                    <Text style={[styles.chipText, active && { color: C.onPrimary }]} numberOfLines={1}>{p.nickname}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Recipe */}
          <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.card}>
            <Text style={styles.cardEyebrow}>{inKB ? 'IDEAL MIX' : 'RECOMMENDED MIX'}</Text>
            <Text style={styles.cardTitle}>{mix.name}</Text>
            <Text style={styles.cardSub}>for {label}{inKB ? '' : ' (general guidance)'}</Text>

            {/* Stacked bar */}
            <View style={styles.bar}>
              {mix.components.map((c, i) => (
                <View key={i} style={{ width: `${c.percent}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {mix.components.map((c, i) => (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                  <Text style={styles.legendMat}>{c.material}</Text>
                  <Text style={styles.legendPct}>{c.percent}%</Text>
                </View>
              ))}
            </View>

            {mix.ph && (
              <View style={styles.phRow}>
                <View style={styles.phChip}><Text style={styles.phChipText}>pH {mix.ph}</Text></View>
                <Text style={styles.phNote}>Always use a pot with drainage holes.</Text>
              </View>
            )}
          </Animated.View>

          {/* How to mix */}
          <Text style={styles.sectionLabel}>HOW TO MIX</Text>
          <View style={styles.stepsCard}>
            {MIX_STEPS.map((s, i) => (
              <View key={i} style={[styles.stepRow, i < MIX_STEPS.length - 1 && styles.stepBorder]}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Repotting */}
          <Text style={[styles.sectionLabel, { marginTop: S['2xl'] }]}>REPOTTING</Text>
          <View style={styles.repotCard}>
            <Text style={styles.repotText}>{REPOT_TIP}</Text>
          </View>

          {!inKB && (
            <Text style={styles.fallbackNote}>
              {species ? `We don't have a specific recipe for ${species} yet — this is a reliable all-purpose mix.` : 'Pick a plant for a tailored recipe, or use this reliable all-purpose mix.'}
            </Text>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: S.sm },
  lead: { fontFamily: F.serifMedium, fontSize: 30, color: C.textPrimary, marginBottom: S.xl, letterSpacing: -0.4, lineHeight: 36 },

  chips: { gap: 8, paddingBottom: S.xl, paddingRight: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, maxWidth: 160 },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 14, color: C.textPrimary },

  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.border, marginBottom: S['2xl'], ...theme.shadows.card },
  cardEyebrow: { ...T.statLabel, color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: S.sm },
  cardTitle: { fontFamily: F.serifMedium, fontSize: 24, color: C.textPrimary, marginBottom: 2 },
  cardSub: { ...T.caption, color: C.textMuted, marginBottom: S.lg },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: S.lg },
  legend: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendMat: { ...T.bodyMd, color: C.textPrimary, flex: 1 },
  legendPct: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textSecondary },
  phRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.lg, paddingTop: S.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  phChip: { backgroundColor: C.primaryWash, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5 },
  phChipText: { ...T.label, fontSize: 12, fontFamily: F.sansBold, color: C.primary },
  phNote: { ...T.caption, color: C.textMuted, flex: 1 },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },
  stepsCard: { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.lg, ...theme.shadows.sm },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, paddingVertical: 14 },
  stepBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { ...T.statLabel, fontSize: 12, fontFamily: F.sansBold, color: C.primary },
  stepText: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21, flex: 1 },

  repotCard: { backgroundColor: C.primaryWash, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.primarySoft },
  repotText: { ...T.bodyMd, color: C.textSecondary, lineHeight: 22 },

  fallbackNote: { ...T.caption, color: C.textMuted, marginTop: S.lg, lineHeight: 18, paddingHorizontal: 4 },
});
