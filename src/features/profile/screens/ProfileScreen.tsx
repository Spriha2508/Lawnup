import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Card } from '../../../shared/components/ui/Card';
import { useAuthStore } from '../../auth/store/authStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { plan, scansUsed, scanLimit, chatsUsed, chatLimit } = useSubscriptionStore();

  return (
    <SafeScreen scrollable>
      <View className="px-4 pt-12 pb-24">
        <Text className="text-text-primary text-2xl font-nunito-bold mb-6">Profile</Text>

        <Card className="mb-4">
          <Text className="text-text-primary text-lg font-nunito-bold">{user?.name}</Text>
          <Text className="text-text-secondary text-sm font-nunito-regular">{user?.email}</Text>
          <Text className="text-text-secondary text-sm font-nunito-regular mt-1">
            📍 {user?.city || 'City not set'}
          </Text>
        </Card>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-primary text-base font-nunito-bold">Plan</Text>
            <View className={`rounded-full px-3 py-1 ${plan === 'premium' ? 'bg-primary' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-nunito-bold ${plan === 'premium' ? 'text-white' : 'text-text-secondary'}`}>
                {plan === 'premium' ? '✨ Premium' : 'Free'}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-text-secondary text-sm font-nunito-regular">
              Scans: {scansUsed} / {scanLimit === -1 ? '∞' : scanLimit}
            </Text>
            <Text className="text-text-secondary text-sm font-nunito-regular">
              Chats: {chatsUsed} / {chatLimit === -1 ? '∞' : chatLimit}
            </Text>
          </View>
        </Card>

        <TouchableOpacity
          onPress={signOut}
          className="bg-red-50 border border-error rounded-xl px-4 py-3 items-center mt-4"
        >
          <Text className="text-error font-nunito-bold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
};
