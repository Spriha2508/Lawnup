import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { useScanStore } from '../store/scanStore';
import { ScanFrame } from '../components/ScanFrame';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { openPaywall } from '@navigation/openPaywall';
import { logger } from '../../../shared/utils/logger';
import { theme } from '@constants/designSystem';
import type { ScanStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<ScanStackParamList, 'ScanLanding'>;
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

export const ScanLandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { canScanThisWeek, scanPeriodUsed, activeScanLimit, isPremiumActive } = useSubscriptionStore();
  const { reset, setCapturedImageUri } = useScanStore();

  React.useEffect(() => { reset(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCamera = () => {
    if (!canScanThisWeek()) return;
    logger.scan.started();
    navigation.navigate('Camera');
  };

  const handleGallery = async () => {
    if (!canScanThisWeek()) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setCapturedImageUri(uri);
      logger.scan.imageSelected('gallery');
      navigation.navigate('Processing', { imageUri: uri });
    }
  };

  const used = scanPeriodUsed();
  const limit = activeScanLimit();
  const periodWord = isPremiumActive() ? 'month' : 'week';
  const scanLimitDisplay = limit === -1 ? '∞' : String(limit);
  const scanPercent = limit === -1 ? 0 : used / limit;
  const limitReached = !canScanThisWeek();
  const remainingScans = limit === -1 ? -1 : Math.max(0, limit - used);

  return (
    <View style={styles.root}>
      {/* Dark hero */}
      <SafeAreaView edges={['top']} style={styles.hero}>
        <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.heroContent}>
          <Text style={styles.eyebrow}>AI DIAGNOSTICIAN</Text>
          <Text style={styles.heroTitle}>Identify your{'\n'}plant.</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).duration(M.duration.cinematic)} style={styles.frameWrap}>
          <ScanFrame active />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(M.duration.expressive)} style={styles.tagRow}>
          {['5,000+ species', 'Disease scan', 'Care advice'].map(tag => (
            <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
          ))}
        </Animated.View>
      </SafeAreaView>

      {/* Cream sheet */}
      <Animated.View entering={FadeInUp.delay(150).duration(M.duration.expressive)} style={styles.sheet}>
        {limit !== -1 && (
          <View style={styles.quotaRow}>
            <Text style={styles.quotaLabel}>
              {limitReached
                ? `${used} of ${scanLimitDisplay} scans used this ${periodWord}`
                : `${remainingScans} ${isPremiumActive() ? '' : 'free '}scan${remainingScans === 1 ? '' : 's'} left this ${periodWord}`}
            </Text>
            <View style={styles.quotaTrack}>
              <View style={[styles.quotaFill, { width: `${Math.min(100, scanPercent * 100)}%` as any, backgroundColor: limitReached ? C.criticalFg : C.primary }]} />
            </View>
            {limitReached && (
              <Text style={styles.quotaWarning}>
                {isPremiumActive()
                  ? 'Monthly limit reached — resets next month.'
                  : 'That’s your free scans for this week — they refresh Monday.'}
              </Text>
            )}
          </View>
        )}

        <PressableScale style={[styles.cameraBtn, limitReached && styles.btnDisabled]} onPress={handleCamera} disabled={limitReached} to={0.97}>
          <Text style={styles.cameraBtnText}>Open camera  →</Text>
        </PressableScale>

        <PressableScale style={[styles.galleryBtn, limitReached && styles.btnDisabled]} onPress={handleGallery} disabled={limitReached} to={0.97}>
          <Text style={styles.galleryBtnText}>Upload from gallery</Text>
        </PressableScale>

        {limitReached && (
          <PressableScale style={styles.upgradeBtn} onPress={() => openPaywall(navigation)} to={0.95}>
            <Text style={styles.upgradeBtnText}>Upgrade for unlimited scans</Text>
          </PressableScale>
        )}

        <SafeAreaView edges={['bottom']} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1610' },
  hero: { flex: 1, paddingHorizontal: 24, paddingBottom: S.sm },
  heroContent: { paddingTop: S.sm, marginBottom: S.sm },
  eyebrow: { ...T.statLabel, color: C.primary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: S.sm },
  heroTitle: { fontFamily: F.serifMediumItalic, fontSize: 44, color: '#FFFFFF', lineHeight: 48 },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap', marginBottom: S.xs },
  tag: { paddingHorizontal: S.md, paddingVertical: 6, borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(111,148,62,0.35)', backgroundColor: 'rgba(111,148,62,0.08)' },
  tagText: { ...T.label, fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  sheet: { backgroundColor: C.canvas, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingHorizontal: S.xl, paddingTop: S['2xl'], paddingBottom: S.xs, gap: S.md, ...theme.shadows.lg },
  quotaRow: { gap: S.sm, marginBottom: S.xs },
  quotaLabel: { ...T.caption, color: C.textMuted },
  quotaTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  quotaFill: { height: 4, borderRadius: 2 },
  quotaWarning: { ...T.label, fontSize: 12, color: C.criticalFg },

  cameraBtn: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 17, alignItems: 'center', ...theme.shadows.cta },
  cameraBtnText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },
  galleryBtn: { borderRadius: R.pill, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  galleryBtnText: { ...T.bodyStrong, fontFamily: F.sansMedium, color: C.textSecondary },
  btnDisabled: { opacity: 0.35 },
  upgradeBtn: { paddingVertical: S.sm, alignItems: 'center' },
  upgradeBtnText: { ...T.label, fontSize: 13, color: C.primary, textDecorationLine: 'underline' },
});
