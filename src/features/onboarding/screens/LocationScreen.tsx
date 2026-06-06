import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { doc, updateDoc } from 'firebase/firestore';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../../auth/store/authStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { INDIAN_CITIES } from '../../../constants/plants';
import type { ClimateZone } from '../../../constants/plants';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Location'>;

const ZONE_MAP: Record<string, ClimateZone> = {
  Delhi: 'north', Mumbai: 'coastal', Bengaluru: 'south', Hyderabad: 'south',
  Chennai: 'coastal', Kolkata: 'north', Pune: 'south', Ahmedabad: 'north',
  Jaipur: 'north', Lucknow: 'north', Chandigarh: 'north', Bhopal: 'north',
  Indore: 'north', Kochi: 'coastal', Nagpur: 'north', Patna: 'north',
  Vadodara: 'north', Surat: 'coastal', Coimbatore: 'south', Visakhapatnam: 'coastal',
};

export const LocationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { setCity } = useOnboardingStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');

  const filtered = INDIAN_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = async () => {
    if (!selected || !user) return;
    const zone = ZONE_MAP[selected] ?? 'north';
    setCity(selected, zone);
    await updateDoc(doc(db, `users/${user.uid}`), { city: selected, climateZone: zone });
    navigation.navigate('Goal');
  };

  return (
    <SafeScreen>
      <View className="flex-1 px-6 pt-12 pb-8">
        <Text className="text-text-secondary text-sm font-nunito-semibold mb-1">Step 1 of 2</Text>
        <Text className="text-text-primary text-2xl font-nunito-bold mb-2">
          Where are you based?
        </Text>
        <Text className="text-text-secondary text-base font-nunito-regular mb-6">
          This helps us give weather-smart plant advice for your city.
        </Text>

        <Input
          placeholder="Search city..."
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              className={[
                'flex-row items-center justify-between px-4 py-3.5 rounded-xl mb-2',
                selected === item
                  ? 'bg-primaryLight'
                  : 'bg-surface border border-border',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-base font-nunito-semibold',
                  selected === item ? 'text-white' : 'text-text-primary',
                ].join(' ')}
              >
                {item}
              </Text>
              {selected === item && (
                <Text className="text-white">✓</Text>
              )}
            </TouchableOpacity>
          )}
        />

        <Button
          label="Next →"
          onPress={handleNext}
          disabled={!selected}
          fullWidth
          className="mt-4"
        />
      </View>
    </SafeScreen>
  );
};
