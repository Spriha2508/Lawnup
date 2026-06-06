import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Card } from '../../../shared/components/ui/Card';
import { HealthBadge } from '../../../shared/components/ui/Badge';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { isDueForWater } from '../../../shared/utils/plantUtils';
import { colors } from '../../../constants/colors';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { plants } = usePlantsStore();

  const duePlants = plants.filter(isDueForWater);
  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';

  return (
    <SafeScreen scrollable>
      <View className="px-4 pt-12 pb-24">
        {/* Greeting */}
        <View className="mb-6">
          <Text className="text-text-secondary text-base font-nunito-regular">
            Good morning,
          </Text>
          <Text className="text-text-primary text-3xl font-nunito-bold">
            {firstName} 🌿
          </Text>
        </View>

        {/* Today's tasks banner */}
        {duePlants.length > 0 && (
          <Card className="mb-4 border-l-4" style={{ borderLeftColor: colors.primary }}>
            <Text className="text-text-primary text-base font-nunito-bold mb-2">
              Today's care ({duePlants.length})
            </Text>
            {duePlants.slice(0, 3).map((p) => (
              <TouchableOpacity
                key={p.plantId}
                onPress={() => navigation.navigate('Plants', { screen: 'PlantDetail', params: { plantId: p.plantId } })}
                className="flex-row items-center py-1"
              >
                <Text className="mr-2">💧</Text>
                <Text className="text-text-primary text-sm font-nunito-semibold flex-1">
                  {p.nickname}
                </Text>
                <Text className="text-text-secondary text-xs font-nunito-regular">
                  Water now
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Quick scan CTA */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Scan')}
          className="bg-primary rounded-2xl p-5 mb-4 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-white text-lg font-nunito-bold mb-1">
              Scan a plant
            </Text>
            <Text className="text-green-100 text-sm font-nunito-regular">
              Identify or check for diseases
            </Text>
          </View>
          <Text style={{ fontSize: 36 }}>🔍</Text>
        </TouchableOpacity>

        {/* My Plants summary */}
        {plants.length > 0 ? (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-text-primary text-lg font-nunito-bold">
                My Plants ({plants.length})
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Plants')}>
                <Text className="text-primary text-sm font-nunito-semibold">See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {plants.slice(0, 5).map((p) => (
                <TouchableOpacity
                  key={p.plantId}
                  onPress={() => navigation.navigate('Plants', { screen: 'PlantDetail', params: { plantId: p.plantId } })}
                  className="mr-3"
                >
                  <Card padding="sm" className="w-32">
                    <View
                      className="w-full h-20 rounded-xl bg-green-50 items-center justify-center mb-2"
                    >
                      <Text style={{ fontSize: 32 }}>🌿</Text>
                    </View>
                    <Text
                      className="text-text-primary text-sm font-nunito-bold mb-1"
                      numberOfLines={1}
                    >
                      {p.nickname}
                    </Text>
                    <HealthBadge status={p.healthStatus} />
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Card className="items-center py-8">
            <Text style={{ fontSize: 48 }} className="mb-3">🌱</Text>
            <Text className="text-text-primary text-base font-nunito-bold text-center mb-1">
              No plants yet
            </Text>
            <Text className="text-text-secondary text-sm font-nunito-regular text-center mb-4">
              Scan a plant or add one manually to get started.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Scan')}
              className="bg-primary rounded-xl px-6 py-2.5"
            >
              <Text className="text-white font-nunito-bold text-sm">Scan your first plant</Text>
            </TouchableOpacity>
          </Card>
        )}
      </View>
    </SafeScreen>
  );
};
