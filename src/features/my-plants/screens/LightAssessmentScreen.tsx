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
import { askDrBanyan } from '@navigation/askDrBanyan';
import { theme } from '@constants/designSystem';
import type { PlantsStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
type Nav = StackNavigationProp<PlantsStackParamList, 'LightAssessment'>;
type Route = RouteProp<PlantsStackParamList, 'LightAssessment'>;

type Level = 'bright' | 'medium' | 'low';

const OPTIONS: { id: Level; icon: string; title: string; desc: string }[] = [
  { id: 'bright', icon: '☀️', title: 'Sharp, crisp shadow', desc: 'A clear, hard-edged shadow' },
  { id: 'medium', icon: '⛅', title: 'Soft, fuzzy shadow', desc: 'A blurry-edged shadow' },
  { id: 'low', icon: '☁️', title: 'Barely any shadow', desc: 'Little to no shadow at all' },
];

const RESULT: Record<Level, { label: string; tone: string; body: string; good: string; caution?: string }> = {
  bright: {
    label: 'Bright / direct light',
    tone: C.waterFg,
    body: 'This spot gets direct sun for part of the day.',
    good: 'Succulents, cacti, most herbs, and flowering or fruiting plants thrive here.',
    caution: 'Shield delicate foliage from harsh midday sun to avoid scorching.',
  },
  medium: {
    label: 'Bright indirect light',
    tone: C.healthyFg,
    body: 'Plenty of light without direct sun — the houseplant sweet spot.',
    good: 'Monstera, pothos, peace lily, ferns, and most foliage plants love this.',
  },
  low: {
    label: 'Low light',
    tone: C.textMuted,
    body: 'Dim — away from windows or in a shaded room.',
    good: 'Only tolerant plants: snake plant, ZZ, pothos, and peace lily.',
    caution: 'Avoid succulents and flowering plants — they\'ll struggle here.',
  },
};

type Place = 'window' | 'near' | 'interior';
type Exposure = 'south' | 'eastwest' | 'north' | 'none';
const PLACES: { id: Place; label: string }[] = [
  { id: 'window', label: 'At a window' },
  { id: 'near', label: 'Within ~1 m' },
  { id: 'interior', label: 'Room interior' },
];
const EXPOSURES: { id: Exposure; label: string }[] = [
  { id: 'south', label: 'South-facing' },
  { id: 'eastwest', label: 'East / West' },
  { id: 'north', label: 'North-facing' },
  { id: 'none', label: 'No direct sun' },
];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Spot brightness 0–100 from the three real inputs.
function spotLight(level: Level, place: Place, exposure: Exposure): number {
  let v = level === 'bright' ? 80 : level === 'medium' ? 55 : 30;
  v += place === 'window' ? 10 : place === 'interior' ? -15 : 0;
  v += exposure === 'south' ? 10 : exposure === 'eastwest' ? 5 : exposure === 'north' ? -5 : -10;
  return clamp(v, 5, 100);
}
// Plant's preferred brightness band, parsed from its knowledge `light` text.
function preferredRange(lightText: string): [number, number] {
  const t = lightText.toLowerCase();
  if (/direct|full sun/.test(t)) return [70, 100];
  if (/bright/.test(t)) return [50, 80];
  if (/low/.test(t)) return [15, 45];
  return [35, 65];
}
// 0–100 suitability of this spot for the plant's preferred range.
function suitabilityScore(spot: number, [min, max]: [number, number]): number {
  const mid = (min + max) / 2, half = Math.max(1, (max - min) / 2);
  if (spot >= min && spot <= max) return clamp(Math.round(100 - (Math.abs(spot - mid) / half) * 12), 88, 100);
  const dist = spot < min ? min - spot : spot - max;
  return clamp(Math.round(85 - dist * 2), 10, 100);
}

export const LightAssessmentScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { plants } = usePlantsStore();

  const [level, setLevel] = useState<Level | null>(null);
  const [place, setPlace] = useState<Place>('near');
  const [exposure, setExposure] = useState<Exposure>('eastwest');
  const [selectedId, setSelectedId] = useState<string | null>(route.params?.plantId ?? plants[0]?.plantId ?? null);

  const selectedPlant = plants.find((p) => p.plantId === selectedId) ?? null;
  const species = selectedPlant?.speciesName ?? route.params?.speciesName ?? '';

  const plantInfo = useMemo(() => {
    const resolved = species ? retrievePlantKnowledge(species) : null;
    if (!resolved) return null;
    return {
      name: selectedPlant?.nickname || resolved.plant.commonNameEn,
      light: resolved.plant.light,
      lowLight: resolved.plant.tags.map((t) => t.toLowerCase()).includes('low-light'),
    };
  }, [species, selectedPlant]);

  const assessment = useMemo(() => {
    if (!level) return null;
    const spot = spotLight(level, place, exposure);
    const score = plantInfo ? suitabilityScore(spot, preferredRange(plantInfo.light)) : null;
    return { spot, score };
  }, [level, place, exposure, plantInfo]);

  const verdict = useMemo(() => {
    if (!level || !plantInfo) return null;
    const n = plantInfo.name;
    if (level === 'low') {
      return plantInfo.lowLight
        ? { ok: true, text: `${n} tolerates low light — it'll be fine here.` }
        : { ok: false, text: `${n} will likely want more light. Move it closer to a window.` };
    }
    if (level === 'bright') {
      return plantInfo.lowLight
        ? { ok: false, text: `${n} prefers gentler light — keep it out of harsh midday sun.` }
        : { ok: true, text: `Plenty of light for ${n}.` };
    }
    return { ok: true, text: `Great light for ${n}.` };
  }, [level, plantInfo]);

  const sc = assessment?.score ?? null;
  const scoreColor = sc == null ? C.primary : sc >= 75 ? C.healthyFg : sc >= 45 ? C.waterFg : C.criticalFg;
  const scoreText = sc == null ? ''
    : sc >= 75 ? 'Great match — this plant should be happy here.'
    : sc >= 45 ? 'Workable — keep an eye on it and move it if it stretches or scorches.'
    : 'Poor match — a brighter or dimmer spot (or a more tolerant plant) would do better.';

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Light check</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.lead}>How bright is{'\n'}this spot?</Text>

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

          {/* Shadow test instruction */}
          <View style={styles.instr}>
            <Text style={styles.instrTitle}>The shadow test</Text>
            <Text style={styles.instrBody}>On a bright day, hold your hand about 30 cm above the spot and look at the shadow it casts.</Text>
          </View>

          {/* Options */}
          <Text style={styles.sectionLabel}>WHAT DO YOU SEE?</Text>
          {OPTIONS.map((o, i) => {
            const active = level === o.id;
            return (
              <Animated.View key={o.id} entering={FadeInDown.delay(60 + i * 50).duration(M.duration.standard)}>
                <TouchableOpacity style={[styles.optionRow, active && styles.optionRowActive]} onPress={() => setLevel(o.id)} activeOpacity={0.85}>
                  <Text style={styles.optionIcon}>{o.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, active && { color: C.onPrimary }]}>{o.title}</Text>
                    <Text style={[styles.optionDesc, active && { color: 'rgba(255,255,255,0.82)' }]}>{o.desc}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioFill} />}</View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Location + exposure — refine the score */}
          <Text style={[styles.sectionLabel, { marginTop: S.lg }]}>WHERE IS THE SPOT?</Text>
          <View style={styles.pillRow}>
            {PLACES.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.pill, place === p.id && styles.pillActive]} onPress={() => setPlace(p.id)} activeOpacity={0.85}>
                <Text style={[styles.pillText, place === p.id && styles.pillTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sectionLabel, { marginTop: S.lg }]}>DIRECT SUN / DIRECTION</Text>
          <View style={styles.pillRow}>
            {EXPOSURES.map((e) => (
              <TouchableOpacity key={e.id} style={[styles.pill, exposure === e.id && styles.pillActive]} onPress={() => setExposure(e.id)} activeOpacity={0.85}>
                <Text style={[styles.pillText, exposure === e.id && styles.pillTextActive]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Result */}
          {level && (
            <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.resultCard}>
              <View style={[styles.resultBadge, { backgroundColor: RESULT[level].tone }]} />
              <Text style={styles.resultLabel}>{RESULT[level].label}</Text>

              {assessment && (
                <View style={styles.scoreRow}>
                  <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
                    <Text style={[styles.scoreNum, { color: scoreColor }]}>{assessment.score ?? assessment.spot}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scoreLabel}>{assessment.score != null ? `Suitability for ${plantInfo?.name}` : 'Light availability'}</Text>
                    <Text style={styles.scoreSub}>{assessment.score != null ? scoreText : 'How much usable light this spot offers (0–100).'}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.resultBody}>{RESULT[level].body}</Text>
              <Text style={styles.resultGood}>{RESULT[level].good}</Text>
              {RESULT[level].caution && <Text style={styles.resultCaution}>⚠  {RESULT[level].caution}</Text>}

              {plantInfo && verdict && (
                <View style={[styles.verdict, { borderColor: verdict.ok ? C.healthyFg : C.waterFg, backgroundColor: verdict.ok ? C.healthyBg : C.waterBg }]}>
                  <Text style={[styles.verdictText, { color: verdict.ok ? C.healthyFg : C.waterFg }]}>
                    {verdict.ok ? '✓' : '△'}  {verdict.text}
                  </Text>
                  <Text style={styles.verdictPref}>{plantInfo.name} prefers: {plantInfo.light}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.askBanyan}
                activeOpacity={0.85}
                onPress={() => askDrBanyan(navigation, {
                  plant: selectedPlant ? { plantId: selectedPlant.plantId, nickname: selectedPlant.nickname, speciesName: selectedPlant.speciesName } : null,
                  prompt: `My spot gets ${RESULT[level].label.toLowerCase()}.${plantInfo ? ` Is that right for my ${plantInfo.name}, and` : ' Which plants suit it, and'} how should I care for it?`,
                })}
              >
                <Text style={styles.askBanyanLabel}>ASK DR. BANYAN</Text>
                <Text style={styles.askBanyanText}>Get light & placement advice  →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: S.sm },
  lead: { fontFamily: F.serifMedium, fontSize: 30, color: C.textPrimary, marginBottom: S.xl, letterSpacing: -0.4, lineHeight: 36 },

  chips: { gap: 8, paddingBottom: S.xl, paddingRight: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, maxWidth: 160 },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 14, color: C.textPrimary },

  instr: { backgroundColor: C.primaryWash, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.primarySoft, marginBottom: S['2xl'] },
  instrTitle: { ...T.bodyStrong, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 4 },
  instrBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21 },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: C.card, borderRadius: R.lg, padding: S.lg, marginBottom: 10,
    borderWidth: 1.5, borderColor: C.border,
  },
  optionRowActive: { backgroundColor: C.primary, borderColor: C.primary },
  optionIcon: { fontSize: 24 },
  optionTitle: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 1 },
  optionDesc: { ...T.caption, color: C.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#FFFFFF' },
  radioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: S.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillText: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 13, color: C.textPrimary },
  pillTextActive: { color: C.onPrimary },

  resultCard: { backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.border, marginTop: S.lg, ...theme.shadows.card },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: S.lg, marginVertical: S.md },
  scoreBadge: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontFamily: F.sansHeavy, fontSize: 22 },
  scoreLabel: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 2 },
  scoreSub: { ...T.caption, color: C.textSecondary, lineHeight: 18 },
  resultBadge: { width: 40, height: 5, borderRadius: 3, marginBottom: S.lg },
  resultLabel: { fontFamily: F.serifMedium, fontSize: 24, color: C.textPrimary, marginBottom: S.sm },
  resultBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21, marginBottom: S.md },
  resultGood: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, lineHeight: 21 },
  resultCaution: { ...T.bodyMd, color: C.waterFg, lineHeight: 21, marginTop: S.md },

  verdict: { borderRadius: R.lg, borderWidth: 1, padding: S.lg, marginTop: S.lg, gap: 4 },
  verdictText: { ...T.bodyMd, fontFamily: F.sansBold, lineHeight: 20 },
  verdictPref: { ...T.caption, color: C.textSecondary },
  askBanyan: { marginTop: S.lg, backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg, borderWidth: 1, borderColor: C.primary },
  askBanyanLabel: { ...T.statLabel, color: C.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  askBanyanText: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary },
});
