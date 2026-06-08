import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { isDueForWater, computeHealthScore, getIKImageUrl } from '../../../shared/utils/plantUtils';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: W } = Dimensions.get('window');
const H_PAD        = 20;
const PLANT_CARD_W = Math.floor(W * 0.42);

const JOURNAL_ARTICLES = [
  { id: '1', tag: 'WATERING',    title: 'The Art of\nDeep Watering',    },
  { id: '2', tag: 'LIGHT',       title: 'Low Light\nSurvivors',         },
  { id: '3', tag: 'SOIL',        title: 'Perfect Mix\nfor Tropicals',   },
  { id: '4', tag: 'PESTS',       title: 'Spotting Early\nInfestation',  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const getDateLabel = (): string => {
  const now = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
};

function healthBadgeStyle(score: number) {
  if (score >= 75) return { bg: 'rgba(111,148,62,0.14)', text: '#4A6E25' };
  if (score >= 45) return { bg: 'rgba(176,112,0,0.12)',  text: '#7A5200' };
  return { bg: 'rgba(192,57,43,0.10)', text: '#8B2010' };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { plants } = usePlantsStore();

  const firstName  = user?.name?.split(' ')[0] ?? 'Gardener';
  const duePlants  = useMemo(() => plants.filter(isDueForWater), [plants]);
  const showPlants = plants.slice(0, 6);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Header row ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.firstName}>{firstName}</Text>
            <Text style={styles.subtitle}>
              {duePlants.length > 0
                ? `${duePlants.length} plant${duePlants.length > 1 ? 's' : ''} need${duePlants.length === 1 ? 's' : ''} attention today.`
                : 'Ready to help your plants thrive.'}
            </Text>
          </View>
          <Pressable
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name[0].toUpperCase() : 'G'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.searchWrap}>
          <Text style={styles.searchPlaceholder}>Search your greenhouse...</Text>
        </Animated.View>

        {/* ── AI Diagnostics hero card ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.88}
          >
            <View style={styles.aiBlob} />

            <Text style={styles.aiLabel}>AI DIAGNOSTICIAN</Text>
            <Text style={styles.aiTitle}>Instant Health{'\n'}Check</Text>
            <Text style={styles.aiBody}>
              Point your camera to identify species{'\n'}
              and diagnose leaf issues in seconds.
            </Text>

            <Pressable
              style={styles.aiBtn}
              onPress={() => navigation.navigate('Scan')}
            >
              <Text style={styles.aiBtnText}>Scan a leaf  →</Text>
            </Pressable>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Your Greenhouse ───────────────────────────────────────────── */}
        {plants.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.greenhouseWrap}>
            <View style={[styles.sectionRow, { paddingHorizontal: H_PAD, marginBottom: 14 }]}>
              <Text style={styles.sectionLabel}>YOUR GREENHOUSE</Text>
              <Pressable onPress={() => navigation.navigate('Plants')}>
                <Text style={styles.sectionLink}>View all →</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plantScroll}
              decelerationRate="fast"
              snapToInterval={PLANT_CARD_W + 12}
              snapToAlignment="start"
            >
              {showPlants.map((plant) => (
                <HomePlantCard
                  key={plant.plantId}
                  plant={plant}
                  onPress={() =>
                    navigation.navigate('Plants', {
                      screen: 'PlantDetail',
                      params: { plantId: plant.plantId },
                    })
                  }
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Empty greenhouse ─────────────────────────────────────────── */}
        {plants.length === 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              Your first leaf awaits. Scan any plant to begin.
            </Text>
          </Animated.View>
        )}

        {/* ── Plant Journal ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.journalWrap}>
          <View style={[styles.sectionRow, { paddingHorizontal: H_PAD, marginBottom: 14 }]}>
            <Text style={styles.sectionLabel}>PLANT JOURNAL</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.journalScroll}
            decelerationRate="fast"
          >
            {JOURNAL_ARTICLES.map((article) => (
              <Pressable key={article.id} style={styles.journalCard}>
                <Text style={styles.journalTag}>{article.tag}</Text>
                <Text style={styles.journalTitle}>{article.title}</Text>
                <View style={styles.journalReadMore}>
                  <Text style={styles.journalReadMoreText}>Read →</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Today's Care ─────────────────────────────────────────────── */}
        {duePlants.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(400)}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>TODAY'S CARE</Text>
              <Pressable onPress={() => navigation.navigate('Plants')}>
                <Text style={styles.sectionLink}>All →</Text>
              </Pressable>
            </View>

            <View style={styles.careCard}>
              {duePlants.slice(0, 4).map((plant, i) => (
                <CareRow
                  key={plant.plantId}
                  plant={plant}
                  isLast={i === Math.min(duePlants.length, 4) - 1}
                  onPress={() =>
                    navigation.navigate('Plants', {
                      screen: 'PlantDetail',
                      params: { plantId: plant.plantId },
                    })
                  }
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Home plant card ──────────────────────────────────────────────────────────

const HomePlantCard: React.FC<{ plant: UserPlantDoc; onPress: () => void }> = ({
  plant, onPress,
}) => {
  const score  = computeHealthScore(plant);
  const badge  = healthBadgeStyle(score);
  const imgUrl = plant.imageUrl
    ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-320,q-80,fo-auto')
    : null;

  return (
    <Pressable style={styles.plantCard} onPress={onPress}>
      <View style={styles.plantImageWrap}>
        {imgUrl ? (
          <Image
            source={{ uri: imgUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.plantPlaceholder]}>
            <Text style={styles.plantPlaceholderInitial}>
              {plant.nickname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.healthBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.healthBadgeText, { color: badge.text }]}>{score}%</Text>
        </View>
      </View>

      <View style={styles.plantInfo}>
        <Text style={styles.plantName} numberOfLines={1}>{plant.nickname}</Text>
        <View style={styles.plantStatusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: score >= 75 ? '#6F943E' : score >= 45 ? '#B07000' : '#C0392B' },
          ]} />
          <Text style={styles.plantStatus}>{plant.healthStatus ?? 'Unknown'}</Text>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Care row ─────────────────────────────────────────────────────────────────

const CareRow: React.FC<{
  plant: UserPlantDoc;
  isLast: boolean;
  onPress: () => void;
}> = ({ plant, isLast, onPress }) => (
  <Pressable
    style={[styles.careRow, !isLast && styles.careRowBorder]}
    onPress={onPress}
  >
    <View style={styles.careIcon}>
      <Text style={styles.careIconText}>◆</Text>
    </View>
    <View style={styles.careText}>
      <Text style={styles.carePlantName}>Water {plant.nickname}</Text>
      <Text style={styles.careTime}>Today</Text>
    </View>
    <View style={styles.careCheck}>
      <Text style={styles.careCheckText}>✓</Text>
    </View>
  </Pressable>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 120,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  dateLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
    marginBottom: 2,
  },
  firstName: {
    fontSize: 36,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#111111',
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6F943E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE7DA',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },

  // AI card
  aiCard: {
    backgroundColor: '#1A2416',
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    overflow: 'hidden',
  },
  aiBlob: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(111,148,62,0.08)',
    top: -80,
    right: -60,
  },
  aiLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  aiTitle: {
    fontSize: 28,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 10,
  },
  aiBody: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    marginBottom: 20,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(111,148,62,0.20)',
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(111,148,62,0.30)',
  },
  aiBtnText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#A7C47C',
    letterSpacing: 0.2,
  },

  // Sections
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
  },

  // Greenhouse horizontal scroll
  greenhouseWrap: {
    marginLeft: -H_PAD,
    marginRight: -H_PAD,
    marginBottom: 28,
  },
  plantScroll: {
    paddingHorizontal: H_PAD,
    gap: 12,
  },
  plantCard: {
    width: PLANT_CARD_W,
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    overflow: 'hidden',
  },
  plantImageWrap: {
    width: '100%',
    height: PLANT_CARD_W * 0.9,
    backgroundColor: '#DDD4C7',
    position: 'relative',
  },
  plantPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E0D0',
  },
  plantPlaceholderInitial: {
    fontSize: 32,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: 'rgba(0,0,0,0.22)',
  },
  healthBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  healthBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
  },
  plantInfo: {
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
  },
  plantName: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#111111',
    marginBottom: 4,
  },
  plantStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  plantStatus: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
  },

  // Plant Journal
  journalWrap: {
    marginLeft: -H_PAD,
    marginRight: -H_PAD,
    marginBottom: 28,
  },
  journalScroll: {
    paddingHorizontal: H_PAD,
    gap: 12,
  },
  journalCard: {
    width: W * 0.54,
    backgroundColor: '#1A2416',
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  journalTag: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  journalTitle: {
    fontSize: 20,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#FFFFFF',
    lineHeight: 24,
    flex: 1,
  },
  journalReadMore: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(111,148,62,0.5)',
  },
  journalReadMoreText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#A7C47C',
    paddingBottom: 2,
  },

  // Care section
  careCard: {
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD4C7',
  },
  careRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  careRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDD4C7',
  },
  careIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(111,148,62,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careIconText: { fontSize: 12, color: '#6F943E' },
  careText: { flex: 1 },
  carePlantName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
    marginBottom: 2,
  },
  careTime: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  careCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careCheckText: {
    fontSize: 12,
    color: '#9E9A94',
    fontFamily: 'Nunito-SemiBold',
  },

  // Empty state
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    textAlign: 'center',
  },
});
