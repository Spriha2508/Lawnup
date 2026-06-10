import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { computeHealthScore, getIKImageUrl } from '../../utils/plantUtils';
import { getWaterInfo } from '../../../services/reminders/reminderService';
import { HealthRing } from '../motion/HealthRing';
import { theme } from '@constants/designSystem';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

interface PlantCardProps {
  plant: UserPlantDoc;
  width: number;
  index: number;
  onPress: () => void;
}

const tone = (score: number) =>
  score >= 75 ? C.healthyFg : score >= 45 ? C.waterFg : C.criticalFg;

function scanAgo(isoDate?: string): string | null {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days === 0) return 'Scanned today';
  if (days === 1) return 'Scanned yesterday';
  if (days < 30) return `Scanned ${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `Scanned ${weeks}w ago`;
  return null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PLACEHOLDER: string[] = ['#D4EDD0', '#EDD4C8', '#D4DEED', '#EDE8D4', '#D4EDE8'];

export const PlantCard: React.FC<PlantCardProps> = ({ plant, width, index, onPress }) => {
  const scale = useSharedValue(1);
  const imageHeight = Math.round(width * 0.92);
  const score = computeHealthScore(plant);
  const t = tone(score);
  const ago = scanAgo(plant.scanDate);
  const waterInfo = getWaterInfo(plant);
  const showWaterAlert = waterInfo.status === 'overdue' || waterInfo.status === 'today';
  const imageUrl = plant.imageUrl ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-360,q-80,fo-auto') : null;
  const alertColor = waterInfo.status === 'overdue' ? C.criticalFg : C.waterFg;

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * M.stagger.base).duration(M.duration.expressive).springify().damping(18)} style={[styles.wrapper, { width }, animStyle]}>
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.96, M.spring.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, M.spring.gentle); }}
        onPress={onPress}
        style={styles.card}
      >
        <View style={[styles.imageWrap, { height: imageHeight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: PLACEHOLDER[plant.speciesName.charCodeAt(0) % PLACEHOLDER.length], alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.placeholderInitial}>{plant.speciesName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.ringWrap}>
            <HealthRing progress={score / 100} size={40} stroke={4} color={t} delay={index * M.stagger.base + 200}>
              <Text style={[styles.ringScore, { color: t }]}>{score}</Text>
            </HealthRing>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.nickname}</Text>
          <Text style={styles.plantSpecies} numberOfLines={1}>{plant.speciesName}</Text>
          {showWaterAlert ? (
            <View style={styles.alertRow}>
              <View style={[styles.alertDot, { backgroundColor: alertColor }]} />
              <Text style={[styles.alertText, { color: alertColor }]}>{waterInfo.urgentLabel}</Text>
            </View>
          ) : ago ? (
            <Text style={styles.plantAgo} numberOfLines={1}>{ago}</Text>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: S.md },
  card: { backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden', ...theme.shadows.card },
  imageWrap: { width: '100%', backgroundColor: C.input, overflow: 'hidden' },
  placeholderInitial: { fontSize: 34, fontFamily: F.serifMediumItalic, color: 'rgba(0,0,0,0.24)' },
  ringWrap: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 22, padding: 2 },
  ringScore: { fontFamily: F.sansHeavy, fontSize: 12 },
  info: { paddingHorizontal: S.md, paddingTop: 10, paddingBottom: S.md },
  plantName: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 2 },
  plantSpecies: { ...T.caption, color: C.textSecondary },
  plantAgo: { ...T.caption, fontSize: 10, color: C.textMuted, marginTop: 3 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  alertDot: { width: 5, height: 5, borderRadius: 3 },
  alertText: { fontFamily: F.sansBold, fontSize: 10 },
});
