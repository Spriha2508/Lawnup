import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { usePlantsStore } from '../store/plantsStore';
import { getNextWaterDate, getDaysSince } from '../../../shared/utils/plantUtils';
import type { PlantsStackParamList } from '../../../navigation/types';

type Route = RouteProp<PlantsStackParamList, 'PlantDetail'>;
type Nav = StackNavigationProp<PlantsStackParamList, 'PlantDetail'>;

const { width: SW } = Dimensions.get('window');
const HERO_H = Math.round(SW * 0.85);

// Health palette — aligned to app design system
const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Healthy:          { label: 'Thriving',       color: '#6F943E', bg: 'rgba(111,148,62,0.10)' },
  'Needs Attention':{ label: 'Needs attention', color: '#B07000', bg: 'rgba(176,112,0,0.10)' },
  Critical:         { label: 'Critical',        color: '#C0392B', bg: 'rgba(192,57,43,0.08)' },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLabel(n: number): string {
  if (n === 0) return 'Today';
  if (n === 1) return '1 day ago';
  return `${n} days ago`;
}

export const PlantDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { plantId } = route.params;
  const plants = usePlantsStore((s) => s.plants);
  const plant = plants.find((p) => p.plantId === plantId) ?? null;

  if (!plant) {
    return (
      <View style={styles.errorScreen}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnOverlay}>
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.errorBody}>
          <Text style={styles.errorMark}>✦</Text>
          <Text style={styles.errorText}>Plant not found</Text>
        </View>
      </View>
    );
  }

  const health = HEALTH_CONFIG[plant.healthStatus] ?? HEALTH_CONFIG['Healthy'];
  const nextWater = getNextWaterDate(plant);
  const daysSinceWater = getDaysSince(plant.lastWateredAt.toDate());
  const daysUntilWater = Math.max(0, Math.ceil((nextWater.getTime() - Date.now()) / 86_400_000));
  const waterOverdue = nextWater < new Date();
  const initial = plant.nickname.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { height: HERO_H }]}>
          {plant.imageUrl ? (
            <Image
              source={{ uri: plant.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}>
              <Text style={styles.heroInitial}>{initial}</Text>
            </View>
          )}

          {/* Scrim */}
          <View style={styles.heroScrimTop} />
          <View style={styles.heroScrimBottom} />

          {/* Back button */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <Text style={styles.backLabel}>← Back</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Hero title */}
          <View style={styles.heroContent}>
            <View style={[styles.healthPill, { backgroundColor: health.bg }]}>
              <View style={[styles.healthDot, { backgroundColor: health.color }]} />
              <Text style={[styles.healthPillText, { color: health.color }]}>{health.label}</Text>
            </View>
            <Text style={styles.heroNickname}>{plant.nickname}</Text>
            {plant.scientificName ? (
              <Text style={styles.heroSci}>{plant.scientificName}</Text>
            ) : (
              <Text style={styles.heroSci}>{plant.speciesName}</Text>
            )}
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* ── Care summary row ── */}
          <View style={styles.careRow}>
            {/* Watering */}
            <View style={styles.careCard}>
              <Text style={styles.careIcon}>◆</Text>
              <Text style={styles.careValue}>
                {waterOverdue ? 'Overdue' : daysUntilWater === 0 ? 'Today' : `${daysUntilWater}d`}
              </Text>
              <Text style={styles.careLabel}>Next water</Text>
            </View>

            {/* Last watered */}
            <View style={styles.careCard}>
              <Text style={styles.careIcon}>◇</Text>
              <Text style={styles.careValue}>{daysLabel(daysSinceWater)}</Text>
              <Text style={styles.careLabel}>Last watered</Text>
            </View>

            {/* Frequency */}
            <View style={styles.careCard}>
              <Text style={styles.careIcon}>✦</Text>
              <Text style={styles.careValue}>
                {plant.wateringFrequencyDays === 1 ? 'Daily' : `${plant.wateringFrequencyDays}d`}
              </Text>
              <Text style={styles.careLabel}>Frequency</Text>
            </View>
          </View>

          {/* ── Water detail bar ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WATERING</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Last watered</Text>
              <Text style={styles.infoVal}>{formatDate(plant.lastWateredAt.toDate())}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Next due</Text>
              <Text style={[
                styles.infoVal,
                waterOverdue && { color: '#C0392B' },
              ]}>
                {waterOverdue ? 'Overdue — water now' : formatDate(nextWater)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Schedule</Text>
              <Text style={styles.infoVal}>
                Every {plant.wateringFrequencyDays} {plant.wateringFrequencyDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>

          {/* ── Fertilise (if present) ── */}
          {plant.fertilizeFrequencyDays && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FERTILISING</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Schedule</Text>
                <Text style={styles.infoVal}>
                  Every {plant.fertilizeFrequencyDays} days
                </Text>
              </View>
              {plant.lastFertilizedAt && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Last fertilised</Text>
                    <Text style={styles.infoVal}>{formatDate(plant.lastFertilizedAt.toDate())}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* ── Location ── */}
          {plant.location ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOCATION</Text>
              <Text style={styles.noteText}>{plant.location}</Text>
            </View>
          ) : null}

          {/* ── Notes ── */}
          {plant.notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NOTES</Text>
              <Text style={styles.noteText}>{plant.notes}</Text>
            </View>
          ) : null}

          {/* ── Added date ── */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Added {formatDate(plant.createdAt.toDate())}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Error state
  errorScreen: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  backBtnOverlay: {
    margin: 20,
    alignSelf: 'flex-start',
  },
  errorBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorMark: {
    fontSize: 36,
    color: 'rgba(111,148,62,0.4)',
  },
  errorText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#9E9A94',
  },

  // Hero
  hero: {
    width: SW,
    backgroundColor: '#1A2416',
  },
  heroPlaceholder: {
    backgroundColor: '#1A2416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitial: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    fontSize: 96,
    color: 'rgba(255,255,255,0.12)',
  },
  heroScrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_H * 0.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: {
    margin: 20,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 28,
    gap: 6,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 4,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  healthPillText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
  },
  heroNickname: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    fontSize: 40,
    color: '#FFFFFF',
    lineHeight: 44,
  },
  heroSci: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },

  // Care summary row
  careRow: {
    flexDirection: 'row',
    gap: 10,
  },
  careCard: {
    flex: 1,
    backgroundColor: '#EEE7DA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD4C7',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  careIcon: {
    fontSize: 14,
    color: '#6F943E',
    marginBottom: 2,
  },
  careValue: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 14,
    color: '#111111',
    textAlign: 'center',
  },
  careLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 10,
    color: '#9E9A94',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Info section
  section: {
    backgroundColor: '#EEE7DA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD4C7',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 10,
    color: '#9E9A94',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#6B6B5E',
  },
  infoVal: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#111111',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDD4C7',
  },

  // Notes / location
  noteText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#111111',
    lineHeight: 22,
  },

  // Meta
  metaRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  metaText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 12,
    color: '#B0ACA6',
  },
});
