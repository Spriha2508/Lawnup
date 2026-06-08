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
import type { UserPlantDoc } from '../../../types/firestore.types';

interface PlantCardProps {
  plant: UserPlantDoc;
  width: number;
  index: number;
  onPress: () => void;
}

function healthBadgeStyle(score: number) {
  if (score >= 75) return { bg: DS.color.healthGreenBg, text: DS.color.healthGreenText };
  if (score >= 45) return { bg: DS.color.healthAmberBg, text: DS.color.healthAmberText };
  return { bg: DS.color.healthRedBg, text: DS.color.healthRedText };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PlantCard: React.FC<PlantCardProps> = ({ plant, width, index, onPress }) => {
  const scale = useSharedValue(1);
  const imageHeight = Math.round(width * 0.78);
  const score = computeHealthScore(plant);
  const badge = healthBadgeStyle(score);

  const imageUrl = plant.imageUrl
    ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-320,q-80,fo-auto')
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
          {/* Health score badge */}
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{score}%</Text>
          </View>
        </View>

        {/* Text */}
        <View style={styles.info}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.nickname}</Text>
          {plant.location ? (
            <Text style={styles.plantLocation} numberOfLines={1}>{plant.location}</Text>
          ) : (
            <Text style={styles.plantLocation} numberOfLines={1}>{plant.speciesName}</Text>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

// Gradient-ish placeholder when no image is available
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
    // Top corners match card radius; bottom is straight (handled by card overflow)
    borderTopLeftRadius: DS.radius.card,
    borderTopRightRadius: DS.radius.card,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    borderRadius: DS.radius.badge,
    paddingHorizontal: 7,
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
  plantLocation: {
    fontSize: DS.type.cardSub.size,
    fontFamily: DS.type.cardSub.family,
    color: DS.color.inkMuted,
  },
});
