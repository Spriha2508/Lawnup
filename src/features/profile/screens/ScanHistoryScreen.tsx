import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { useScanHistoryStore, type ScanHistoryItem } from '../../scan/store/scanHistoryStore';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
type Nav = StackNavigationProp<ProfileStackParamList, 'ScanHistory'>;

const relDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const confTone = (c: number) => (c >= 0.7 ? C.healthyFg : c >= 0.5 ? C.waterFg : C.textMuted);

export const ScanHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const entries = useScanHistoryStore((s) => s.entries);
  const clear = useScanHistoryStore((s) => s.clear);

  const confirmClear = () =>
    Alert.alert('Clear scan history?', 'This removes your past scans from this device. Saved plants are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);

  const renderItem = ({ item, index }: { item: ScanHistoryItem; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(M.duration.standard)}>
      <View style={styles.row}>
        <View style={styles.thumbWrap}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <Text style={styles.thumbInitial}>{item.commonName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{item.commonName}</Text>
          <Text style={styles.sci} numberOfLines={1}>{item.scientificName}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.healthDot, { backgroundColor: item.isHealthy ? C.healthyFg : C.waterFg }]} />
            <Text style={styles.meta}>{item.isHealthy ? 'Healthy' : 'Needs care'} · {relDate(item.date)}</Text>
          </View>
        </View>
        <Text style={[styles.conf, { color: confTone(item.confidence) }]}>{Math.round(item.confidence * 100)}%</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan history</Text>
          {entries.length > 0 ? (
            <TouchableOpacity onPress={confirmClear} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.clear}>Clear</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your scans will appear here. Scan a plant to start building your history.</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.scanId}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
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
  backBtn: { width: 40 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  clear: { ...T.label, fontSize: 14, color: C.criticalFg, fontFamily: F.sansBold, width: 40, textAlign: 'right' },

  list: { paddingHorizontal: 20, paddingTop: S.sm, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: C.card, borderRadius: R.xl, padding: S.md,
    borderWidth: 1, borderColor: C.border, ...theme.shadows.sm,
  },
  thumbWrap: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { fontFamily: F.serifMedium, fontSize: 22, color: C.primary },
  name: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 1 },
  sci: { ...T.caption, color: C.textMuted, fontStyle: 'italic', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  meta: { ...T.caption, color: C.textSecondary },
  conf: { fontFamily: F.sansHeavy, fontSize: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 44 },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});
