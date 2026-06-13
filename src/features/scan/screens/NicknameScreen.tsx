import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { NicknameInputCard } from '../components/NicknameInputCard';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { useScanStore } from '../store/scanStore';
import { track } from '../../../services/analytics/posthog';
import { theme } from '@constants/designSystem';
import type { ScanStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<ScanStackParamList, 'Nickname'>;
type Route = RouteProp<ScanStackParamList, 'Nickname'>;
const { color: C, spacing: S, typography: T, fonts: F } = theme;

export const NicknameScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { scanId, speciesName } = route.params;
  const { setPendingNickname } = useScanStore();

  const handleSave = (nickname: string) => {
    setPendingNickname(nickname);
    track('plant_nicknamed', { nickname_length: nickname.length, species: speciesName });
    navigation.navigate('AddPlant' as any, { fromScanId: scanId, speciesName, nickname });
  };

  const handleSkip = () => {
    track('nickname_skipped', { species: speciesName });
    navigation.navigate('AddPlant' as any, { fromScanId: scanId, speciesName });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }} to={0.9}>
          <Text style={styles.backText}>← Back</Text>
        </PressableScale>

        <View style={styles.markWrap}>
          <View style={styles.markBadge}>
            <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={C.primary} opacity={0.9} />
              <Path d="M12 3V21" stroke={C.canvas} strokeWidth={1.3} strokeLinecap="round" />
            </Svg>
          </View>
        </View>

        <View style={styles.cardWrap}>
          <NicknameInputCard speciesName={speciesName} onConfirm={handleSave} onSkip={handleSkip} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },
  backBtn: { paddingHorizontal: 24, paddingTop: S.lg, paddingBottom: S.sm, alignSelf: 'flex-start' },
  backText: { ...T.bodyStrong, fontFamily: F.sansMedium, color: C.textSecondary },
  markWrap: { alignItems: 'center', paddingVertical: S['3xl'] },
  markBadge: { width: 72, height: 72, borderRadius: 26, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { flex: 1 },
});
