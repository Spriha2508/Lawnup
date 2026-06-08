import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { NicknameInputCard } from '../components/NicknameInputCard';
import { useScanStore } from '../store/scanStore';
import { track } from '../../../services/analytics/posthog';
import type { ScanStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<ScanStackParamList, 'Nickname'>;
type Route = RouteProp<ScanStackParamList, 'Nickname'>;

export const NicknameScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { scanId, speciesName } = route.params;
  const { setPendingNickname } = useScanStore();

  const handleSave = (nickname: string) => {
    setPendingNickname(nickname);
    track('plant_nicknamed', {
      nickname_length: nickname.length,
      species: speciesName,
    });
    navigation.navigate('AddPlant' as any, {
      fromScanId: scanId,
      speciesName,
      nickname,
    });
  };

  const handleSkip = () => {
    track('nickname_skipped', { species: speciesName });
    navigation.navigate('AddPlant' as any, { fromScanId: scanId, speciesName });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Decorative botanical mark */}
        <View style={styles.markWrap}>
          <Text style={styles.mark}>✦</Text>
        </View>

        {/* Input card fills the rest */}
        <View style={styles.cardWrap}>
          <NicknameInputCard
            speciesName={speciesName}
            onConfirm={handleSave}
            onSkip={handleSkip}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  safe: {
    flex: 1,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#6B6B5E',
  },
  markWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  mark: {
    fontSize: 32,
    color: 'rgba(111,148,62,0.4)',
  },
  cardWrap: {
    flex: 1,
  },
});
