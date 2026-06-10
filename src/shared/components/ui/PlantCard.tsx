import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { DS } from '../../../constants/ds';
import { computeHealthScore, getIKImageUrl } from '../../utils/plantUtils';
import { getWaterInfo } from '../../../services/reminders/reminderService';
import type { UserPlantDoc } from '../../../types/firestore.types';

interface PlantCardProps {
  plant: UserPlantDoc;
  width: number;
  index: number;
  onPress: () => void;
}

function healthLabel(score: number): { label: string; bg: string; text: string } {
  if (score >= 75) return { label: 'Healthy',    bg: DS.color.healthGreenBg, text: DS.color.healthGreenText };
  if (score >= 45) return { label: 'Needs care', bg: DS.color.healthAmberBg, text: DS.color.healthAmberText };
  return              { label: 'Needs care',  bg: DS.color.healthRedBg,   text: DS.color.healthRedText  };
}

function scanAgo(isoDate?: string): string | null {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days === 0) return 'Scanned today';
  if (days === 1) return 'Scanned yesterday';
  if (days < 30)  return `Scanned ${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8)  return `Scanned ${weeks}w ago`;
  return null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PlantCard: React.FC<PlantCardProps> = ({ plant, width, index, onPress }) => {
  const scale = useSharedValue(1);
  const imageHeight = Math.round(width * 0.88);
  const score = computeHealthScore(plant);
  const badge = healthLabel(score);
  const ago = scanAgo(plant.scanDate);
  const waterInfo = getWaterInfo(plant);
  const showWaterAlert = waterInfo.status === 'overdue' || waterInfo.status === 'today';

  const imageUrl = plant.imageUrl
    ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-360,q-80,fo-auto')
    : null;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(380).springify()}
      style={[styles.wrapper, { width }, animStyle]}
    >
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 20, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1,    { damping: 18, stiffness: 250 }); }}
        onPress={onPress}
        style={[styles.card, DS.shadow.card]}
      >
        {/* Photo */}
        <View style={[styles.imageWrap, { height: imageHeight }]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <PlantPlaceholder name={plant.speciesName} />
          )}
          {/* Health label badge */}
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Text */}
        <View style={styles.info}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.nickname}</Text>
          <Text style={styles.plantSpecies} numberOfLines={1}>{plant.speciesName}</Text>
          {showWaterAlert ? (
            <View style={styles.waterAlertRow}>
              <View style={[
                styles.waterAlertDot,
                { backgroundColor: waterInfo.status === 'overdue' ? '#C0392B' : '#B07000' },
              ]} />
              <Text style={[
                styles.waterAlertText,
                { color: waterInfo.status === 'overdue' ? '#C0392B' : '#B07000' },
              ]}>{waterInfo.urgentLabel}</Text>
            </View>
          ) : ago ? (
            <Text style={styles.plantAgo} numberOfLines={1}>{ago}</Text>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const PLACEHOLDER_COLORS: [string, string][] = [
  ['#D4EDD0', '#A8D4A0'],
  ['#EDD4C8', '#D4A8A0'],
  ['#D4DEED', '#A0B8D4'],
  ['#EDE8D4', '#D4C8A0'],
  ['#D4EDE8', '#A0D4C8'],
];

const PlantPlaceholder: React.FC<{ name: string }> = ({ name }) => {
  const idx = name.charCodeAt(0) % PLACEHOLDER_COLORS.length;
  const [bgTop] = PLACEHOLDER_COLORS[idx];
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bgTop, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 32, fontFamily: 'Cormorant-SemiBoldItalic', color: 'rgba(0,0,0,0.25)' }}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: DS.space.cardGap,
  },
  card: {
    backgroundColor: DS.color.card,
    borderRadius: DS.radius.card,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    backgroundColor: DS.color.inputBg,
    overflow: 'hidden',
    borderTopLeftRadius: DS.radius.card,
    borderTopRightRadius: DS.radius.card,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    borderRadius: DS.radius.badge,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: DS.type.badge.size,
    fontFamily: DS.type.badge.family,
    letterSpacing: DS.type.badge.tracking,
  },
  info: {
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
  },
  plantName: {
    fontSize: DS.type.cardName.size,
    fontFamily: DS.type.cardName.family,
    color: DS.color.ink,
    marginBottom: 2,
  },
  plantSpecies: {
    fontSize: DS.type.cardSub.size,
    fontFamily: DS.type.cardSub.family,
    color: DS.color.inkMuted,
    marginBottom: 1,
  },
  plantAgo: {
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    color: DS.color.inkMuted,
    opacity: 0.7,
    marginTop: 2,
  },
  waterAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  waterAlertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  waterAlertText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
  },
});
