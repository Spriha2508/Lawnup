import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Button } from '../../../shared/components/ui/Button';
import { useScanStore } from '../store/scanStore';
import { track } from '../../../services/analytics/posthog';
import { NICKNAME_SUGGESTIONS } from '../../../constants/plants';
import type { ScanStackParamList } from '../../../navigation/types';
import { colors } from '../../../constants/colors';

type Nav = StackNavigationProp<ScanStackParamList, 'Nickname'>;
type Route = RouteProp<ScanStackParamList, 'Nickname'>;

export const NicknameScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { scanId, speciesName } = route.params;
  const { setPendingNickname } = useScanStore();
  const [nickname, setNickname] = useState('');

  const suggestions = NICKNAME_SUGGESTIONS[speciesName] ?? NICKNAME_SUGGESTIONS.default;

  const handleSave = () => {
    const finalName = nickname.trim() || suggestions[0];
    setPendingNickname(finalName);
    track('plant_nicknamed', {
      nickname_length: finalName.length,
      species: speciesName,
      used_suggestion: !nickname.trim(),
    });
    navigation.navigate('AddPlant' as any, {
      fromScanId: scanId,
      speciesName,
      nickname: finalName,
    });
  };

  const handleSkip = () => {
    track('nickname_skipped', { species: speciesName });
    navigation.navigate('AddPlant' as any, { fromScanId: scanId, speciesName });
  };

  return (
    <SafeScreen>
      <View className="flex-1 px-6 pt-20 pb-8 justify-between">
        <View>
          <Text style={{ fontSize: 48 }} className="mb-4">🌿</Text>
          <Text className="text-text-primary text-2xl font-nunito-bold mb-2">
            Give it a name
          </Text>
          <Text className="text-text-secondary text-base font-nunito-regular mb-8 leading-6">
            Plants with names get better care — you'll love it more!
          </Text>

          {/* Name input */}
          <TextInput
            className="bg-surface border-2 border-primary rounded-2xl px-4 py-4 text-text-primary text-xl font-nunito-bold mb-6"
            placeholder={suggestions[0]}
            placeholderTextColor={colors.textSecondary}
            value={nickname}
            onChangeText={setNickname}
            maxLength={24}
            autoFocus
          />

          {/* Suggestions */}
          <Text className="text-text-secondary text-sm font-nunito-semibold mb-3">
            Suggestions for {speciesName}:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setNickname(s)}
                className={[
                  'rounded-full px-4 py-2 border',
                  nickname === s ? 'bg-primary border-primary' : 'bg-surface border-border',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-sm font-nunito-semibold',
                    nickname === s ? 'text-white' : 'text-text-primary',
                  ].join(' ')}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Button
            label={`Save as "${nickname.trim() || suggestions[0]}"`}
            onPress={handleSave}
            fullWidth
          />
          <Button
            label="Skip for now"
            onPress={handleSkip}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </SafeScreen>
  );
};
