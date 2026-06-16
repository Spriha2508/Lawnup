import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { usePlantsStore } from '../store/plantsStore';
import { retrievePlantKnowledge, currentSeason } from '../../../services/knowledge';
import { askDrBanyan } from '@navigation/askDrBanyan';
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

type WateredId = 'today' | 'few' | 'week' | 'longer' | 'unsure';
const WATERED_OPTS: { id: WateredId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'few', label: '2–3 days ago' },
  { id: 'week', label: 'About a week' },
  { id: 'longer', label: 'Longer ago' },
  { id: 'unsure', label: 'Not sure' },
];

// ── Rule-based recommendation engine (no image AI) ───────────────────────────
// Outputs are derived from real inputs: plant watering need + indoor/outdoor +
// last-watered + the season + the mix's own drainage composition.
function soilCondition(w: WateredId, fastDrying: boolean): string {
  switch (w) {
    case 'today': return 'Freshly watered — the soil is moist right now. Let the top layer dry out before you water again.';
    case 'few': return fastDrying
      ? 'Drying out — the top is likely dry already; check the soil a few cm down before watering.'
      : 'Lightly moist — probably still damp below the surface, so hold off a little longer.';
    case 'week': return 'Likely dry — most plants will want water now. Confirm with a quick finger test first.';
    case 'longer': return 'Probably very dry — water soon, soaking gently until it drains, so the mix re-wets evenly.';
    default: return 'Unknown — push a finger (or a wooden skewer) 2–3 cm in; water only if it comes out dry.';
  }
}
function moistureGuidance(days: number, indoor: boolean): string {
  const base = `Aim to water roughly every ${days} day${days === 1 ? '' : 's'}.`;
  const env = indoor
    ? ' Indoors the soil holds moisture longer, so err on the dry side — overwatering is the bigger risk.'
    : ' Outdoors (and in heat) it dries faster, so check more often.';
  return `${base}${env} Always feel the top 2–3 cm and water only when it’s dry.`;
}
function drainageGuidance(drainagePct: number): string {
  if (drainagePct >= 30) {
    return 'This mix drains fast — ideal for roots that hate sitting wet. Use a pot with drainage holes and always empty the saucer.';
  }
  return 'Use a pot with drainage holes and never leave the saucer full. If water pools on the surface, mix in a handful of perlite or coarse sand to open it up.';
}

export const SoilAdvisorScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { plants } = usePlantsStore();

  // When opened straight from a scan we receive a speciesName (and no plantId).
  // In that case honour the scanned species rather than defaulting to the first
  // saved plant — so soil advice is available right after identification, even
  // for users who already have a garden.
  const [selectedId, setSelectedId] = useState<string | null>(
    route.params?.plantId ?? (route.params?.speciesName ? null : plants[0]?.plantId ?? null),
  );

  const selectedPlant = plants.find((p) => p.plantId === selectedId) ?? null;
  const species = selectedPlant?.speciesName ?? route.params?.speciesName ?? '';

  const { mix, inKB, planted } = useMemo(() => {
    const resolved = species ? retrievePlantKnowledge(species) : null;
    if (resolved?.soil) return { mix: resolved.soil, inKB: true, planted: resolved.plant.commonNameEn };
    return { mix: DEFAULT_MIX, inKB: false, planted: null };
  }, [species]);

  const label = selectedPlant?.nickname || planted || species || 'your plant';

  // ── Inputs for the recommendation engine ──────────────────────────────────
  const [indoor, setIndoor] = useState(true);
  const [watered, setWatered] = useState<WateredId>('few');

  const advice = useMemo(() => {
    const season = currentSeason();
    const fastDrying = !indoor || season === 'summer';
    const days = selectedPlant?.wateringFrequencyDays && selectedPlant.wateringFrequencyDays > 0
      ? selectedPlant.wateringFrequencyDays
      : 7;
    const drainagePct = mix.components
      .filter(c => /perlite|sand|bark|grit|pumice/i.test(c.material))
      .reduce((sum, c) => sum + c.percent, 0);
    return {
      condition: soilCondition(watered, fastDrying),
      moisture: moistureGuidance(days, indoor),
      drainage: drainageGuidance(drainagePct),
    };
  }, [indoor, watered, selectedPlant, mix]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
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

          {/* Inputs: indoor/outdoor + last watered */}
          <View style={styles.segment}>
            {([true, false] as const).map((isIndoor) => (
              <TouchableOpacity
                key={String(isIndoor)}
                style={[styles.segBtn, indoor === isIndoor && styles.segBtnActive]}
                onPress={() => setIndoor(isIndoor)}
                activeOpacity={0.85}
              >
                <Text style={[styles.segText, indoor === isIndoor && styles.segTextActive]}>{isIndoor ? 'Indoor' : 'Outdoor'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>LAST WATERED</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {WATERED_OPTS.map((o) => {
              const active = watered === o.id;
              return (
                <TouchableOpacity key={o.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setWatered(o.id)} activeOpacity={0.8}>
                  <Text style={[styles.chipText, active && { color: C.onPrimary }]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Outputs: soil condition · moisture · drainage */}
          <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.adviceCard}>
            <AdviceRow icon="🪴" label="Soil condition" text={advice.condition} />
            <AdviceRow icon="💧" label="Moisture" text={advice.moisture} />
            <AdviceRow icon="🌱" label="Drainage" text={advice.drainage} last />
          </Animated.View>

          {/* Ideal Soil Mix */}
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

          <TouchableOpacity
            style={styles.askBanyan}
            activeOpacity={0.85}
            onPress={() => askDrBanyan(navigation, {
              plant: selectedPlant
                ? { plantId: selectedPlant.plantId, nickname: selectedPlant.nickname, speciesName: selectedPlant.speciesName }
                : (species ? { speciesName: species } : null),
              prompt: `What soil mix and repotting advice do you recommend${species ? ` for my ${species}` : ''}?`,
            })}
          >
            <Text style={styles.askBanyanLabel}>🌿  ASK DOC. SAGE</Text>
            <Text style={styles.askBanyanText}>Get a soil & repotting plan  →</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const AdviceRow: React.FC<{ icon: string; label: string; text: string; last?: boolean }> = ({ icon, label, text, last }) => (
  <View style={[styles.adviceRow, !last && styles.adviceRowBorder]}>
    <View style={styles.adviceIcon}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.adviceLabel}>{label}</Text>
      <Text style={styles.adviceText}>{text}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },

  segment: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.pill, padding: 4, marginBottom: S.xl, borderWidth: 1, borderColor: C.border },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: R.pill },
  segBtnActive: { backgroundColor: C.primary },
  segText: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textSecondary },
  segTextActive: { color: C.onPrimary },
  inputLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },

  adviceCard: { backgroundColor: C.card, borderRadius: R.xl, paddingHorizontal: S.lg, borderWidth: 1, borderColor: C.border, marginBottom: S['2xl'], ...theme.shadows.card },
  adviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, paddingVertical: S.lg },
  adviceRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  adviceIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  adviceLabel: { ...T.statLabel, color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  adviceText: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21 },

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
  askBanyan: { marginTop: S['2xl'], backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.primary, ...theme.shadows.sm },
  askBanyanLabel: { ...T.statLabel, color: C.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  askBanyanText: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary },
});
