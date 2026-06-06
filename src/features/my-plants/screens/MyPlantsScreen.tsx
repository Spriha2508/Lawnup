import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Card } from '../../../shared/components/ui/Card';
import { HealthBadge } from '../../../shared/components/ui/Badge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { usePlantsStore } from '../store/plantsStore';

export const MyPlantsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { plants } = usePlantsStore();

  if (plants.length === 0) {
    return (
      <SafeScreen>
        <EmptyState
          emoji="🪴"
          title="Your garden is empty"
          subtitle="Scan a plant or add one manually to start tracking your green family."
          actionLabel="Scan a plant"
          onAction={() => navigation.navigate('Scan')}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-text-primary text-2xl font-nunito-bold">My Plants</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddPlant', {})}
            className="bg-primary rounded-xl px-4 py-2"
          >
            <Text className="text-white font-nunito-bold text-sm">+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={plants}
        keyExtractor={(p) => p.plantId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item: p }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PlantDetail', { plantId: p.plantId })}
            className="mb-3"
          >
            <Card className="flex-row items-center" padding="md">
              <View className="w-14 h-14 rounded-xl bg-green-50 items-center justify-center mr-3">
                <Text style={{ fontSize: 28 }}>🌿</Text>
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-base font-nunito-bold">{p.nickname}</Text>
                <Text className="text-text-secondary text-sm font-nunito-regular">{p.speciesName}</Text>
                <View className="mt-1">
                  <HealthBadge status={p.healthStatus} />
                </View>
              </View>
              <Text className="text-text-secondary">›</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeScreen>
  );
};
