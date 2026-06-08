import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { DS } from '../../../constants/ds';
import { PlantCard } from '../../../shared/components/ui/PlantCard';
import { usePlantsStore } from '../store/plantsStore';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: SCREEN_W } = Dimensions.get('window');
const CONTENT_W = Math.min(SCREEN_W, 430); // cap at 430px on large screens
const H_PAD = DS.space.screenH;
const CARD_GAP = DS.space.cardGap;
const CARD_W = Math.floor((CONTENT_W - H_PAD * 2 - CARD_GAP) / 2);

type FilterKey = 'All' | 'Thriving' | 'Needs Care' | 'Indoor' | 'Outdoor';

const FILTERS: FilterKey[] = ['All', 'Thriving', 'Needs Care', 'Indoor', 'Outdoor'];

const INDOOR_KEYWORDS = ['living room', 'bedroom', 'kitchen', 'bathroom', 'office', 'study', 'hall', 'balcony', 'indoor'];
const OUTDOOR_KEYWORDS = ['garden', 'terrace', 'lawn', 'yard', 'outdoor', 'patio', 'driveway'];

function matchesFilter(plant: UserPlantDoc, filter: FilterKey): boolean {
  if (filter === 'All') return true;
  if (filter === 'Thriving') return plant.healthStatus === 'Healthy';
  if (filter === 'Needs Care') return plant.healthStatus !== 'Healthy';
  const loc = (plant.location ?? '').toLowerCase();
  if (filter === 'Indoor')  return INDOOR_KEYWORDS.some(k => loc.includes(k))  || !OUTDOOR_KEYWORDS.some(k => loc.includes(k));
  if (filter === 'Outdoor') return OUTDOOR_KEYWORDS.some(k => loc.includes(k));
  return true;
}

export const MyPlantsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { plants } = usePlantsStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');

  const filtered = useMemo(
    () => plants.filter(p => matchesFilter(p, activeFilter)),
    [plants, activeFilter],
  );

  const thriving  = plants.filter(p => p.healthStatus === 'Healthy').length;
  const needCare  = plants.filter(p => p.healthStatus !== 'Healthy').length;

  const handlePlantPress = useCallback((plantId: string) => {
    navigation.navigate('PlantDetail', { plantId });
  }, [navigation]);

  // Empty state
  if (plants.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>🪴</Text>
          </View>
          <Text style={styles.emptyTitle}>Your greenhouse is empty</Text>
          <Text style={styles.emptySub}>
            Scan a plant or add one manually to start tracking your green family.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>Scan a plant</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={p => p.plantId}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <GreenhouseHeader
            totalPlants={plants.length}
            thriving={thriving}
            needCare={needCare}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onAdd={() => navigation.navigate('AddPlant', {})}
          />
        }
        renderItem={({ item, index }) => (
          <PlantCard
            plant={item}
            width={CARD_W}
            index={index}
            onPress={() => handlePlantPress(item.plantId)}
          />
        )}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyFilter}>
            <Text style={styles.emptyFilterIcon}>🔍</Text>
            <Text style={styles.emptyFilterText}>No plants match this filter</Text>
          </Animated.View>
        }
      />
    </SafeAreaView>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface HeaderProps {
  totalPlants: number;
  thriving: number;
  needCare: number;
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  onAdd: () => void;
}

const GreenhouseHeader: React.FC<HeaderProps> = ({
  totalPlants, thriving, needCare, activeFilter, onFilterChange, onAdd,
}) => (
  <View style={styles.header}>
    {/* Eyebrow + title row */}
    <View style={styles.titleRow}>
      <View>
        <Text style={styles.eyebrow}>MY COLLECTION</Text>
        <Text style={styles.title}>Your Greenhouse</Text>
      </View>
      <AddButton onPress={onAdd} />
    </View>

    {/* Filter tabs */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContent}
      style={styles.filters}
    >
      {FILTERS.map(f => (
        <FilterPill
          key={f}
          label={f}
          active={activeFilter === f}
          onPress={() => onFilterChange(f)}
        />
      ))}
    </ScrollView>

    {/* Stats row */}
    <View style={styles.statsRow}>
      <StatItem label="PLANTS"    value={totalPlants} />
      <View style={styles.statDivider} />
      <StatItem label="THRIVING"  value={thriving} />
      <View style={styles.statDivider} />
      <StatItem label="NEED CARE" value={needCare} />
    </View>
  </View>
);

const AddButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1,    { damping: 18 }); }}
        onPress={onPress}
        style={[styles.addBtn, DS.shadow.addBtn]}
      >
        <Text style={styles.addBtnText}>+</Text>
      </Pressable>
    </Animated.View>
  );
};

interface FilterPillProps { label: string; active: boolean; onPress: () => void; }

const FilterPill: React.FC<FilterPillProps> = ({ label, active, onPress }) => (
  <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </Pressable>
);

interface StatItemProps { label: string; value: number; }

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },

  // Header
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: DS.type.eyebrow.size,
    fontFamily: DS.type.eyebrow.family,
    color: DS.color.inkMuted,
    letterSpacing: DS.type.eyebrow.tracking,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    fontSize: 34,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.addBtn,
    backgroundColor: DS.color.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
    fontFamily: 'Nunito-Regular',
    marginTop: -1,
  },

  // Filters
  filters: {
    marginBottom: 18,
    marginHorizontal: -H_PAD,
  },
  filtersContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: DS.radius.pill,
  },
  pillActive: {
    backgroundColor: '#111111',
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#A0A094',
    letterSpacing: 0.1,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE7DA',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: DS.type.statLabel.size,
    fontFamily: DS.type.statLabel.family,
    color: DS.color.inkMuted,
    letterSpacing: DS.type.statLabel.tracking,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: DS.type.statNum.size,
    fontFamily: DS.type.statNum.family,
    color: DS.color.ink,
    letterSpacing: DS.type.statNum.tracking,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: DS.color.divider,
  },

  // Grid
  listContent: {
    paddingBottom: 110,
  },
  row: {
    paddingHorizontal: H_PAD,
    justifyContent: 'space-between',
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DS.color.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...DS.shadow.card,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: DS.type.h2.size,
    fontFamily: DS.type.h2.family,
    color: DS.color.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: DS.type.body.size,
    fontFamily: DS.type.body.family,
    color: DS.color.inkMid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: DS.color.forestDark,
    borderRadius: DS.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  emptyFilter: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFilterIcon: { fontSize: 32, marginBottom: 10 },
  emptyFilterText: {
    fontSize: DS.type.body.size,
    fontFamily: DS.type.body.family,
    color: DS.color.inkMid,
  },
});
