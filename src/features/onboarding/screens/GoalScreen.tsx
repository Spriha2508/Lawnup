import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { SafeScreen } from '../../../shared/components/layout/SafeScreen';
import { Button } from '../../../shared/components/ui/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { track } from '../../../services/analytics/posthog';

const GOALS = [
  { id: 'identify', emoji: '🔍', label: 'Identify plants', desc: 'Learn what I have at home' },
  { id: 'diseases', emoji: '🤒', label: 'Detect diseases', desc: 'Keep my plants healthy' },
  { id: 'reminders', emoji: '💧', label: 'Care reminders', desc: 'Never forget to water' },
  { id: 'ai', emoji: '🤖', label: 'AI plant advice', desc: 'Get answers instantly' },
];

export const GoalScreen: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { goals, setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const handleFinish = async () => {
    if (!user) return;
    setIsLoading(true);
    setGoals(selected);
    await updateDoc(doc(db, `users/${user.uid}`), { onboardingComplete: true });
    setUser({ ...user, onboardingComplete: true });
    track('onboarding_completed', { goals: selected, city: user.city });
    setIsLoading(false);
  };

  return (
    <SafeScreen>
      <View className="flex-1 px-6 pt-12 pb-8 justify-between">
        <View>
          <Text className="text-text-secondary text-sm font-nunito-semibold mb-1">Step 2 of 2</Text>
          <Text className="text-text-primary text-2xl font-nunito-bold mb-2">
            What do you want to do?
          </Text>
          <Text className="text-text-secondary text-base font-nunito-regular mb-8">
            Select all that apply — we'll personalise your experience.
          </Text>

          <View className="gap-3">
            {GOALS.map((g) => {
              const active = selected.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => toggle(g.id)}
                  className={[
                    'flex-row items-center p-4 rounded-2xl border',
                    active ? 'bg-primary border-primary' : 'bg-surface border-border',
                  ].join(' ')}
                >
                  <Text style={{ fontSize: 28 }} className="mr-4">{g.emoji}</Text>
                  <View className="flex-1">
                    <Text className={`font-nunito-bold text-base ${active ? 'text-white' : 'text-text-primary'}`}>
                      {g.label}
                    </Text>
                    <Text className={`font-nunito-regular text-sm ${active ? 'text-green-100' : 'text-text-secondary'}`}>
                      {g.desc}
                    </Text>
                  </View>
                  {active && <Text className="text-white text-lg">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          label="Start growing 🌱"
          onPress={handleFinish}
          loading={isLoading}
          fullWidth
        />
      </View>
    </SafeScreen>
  );
};
