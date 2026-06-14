import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { theme } from '@constants/designSystem';
import { openPaywall } from '@navigation/openPaywall';
import { useChatStore } from '../store/chatStore';
import { usePlantMemoryStore } from '../store/plantMemoryStore';
import { askBanyan } from '../services/banyanService';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { getCurrentWeather, type WeatherData } from '../../../services/weather/weatherService';
import { getAirQuality } from '../../../services/weather/aqiService';
import type { ChatDoc } from '../../../types/firestore.types';

const { color: C, spacing: S, typography: T, fonts: F, radii: R, motion: M } = theme;

const SUGGESTIONS = [
  'How often should I water this plant?',
  'What soil mix is best?',
  'How do I propagate it?',
  'Its leaves are turning yellow — what now?',
];

function makeMsg(role: 'user' | 'assistant', content: string, plantNickname?: string): ChatDoc {
  return {
    chatId: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role, content, plantNickname,
    createdAt: Timestamp.now(),
  };
}

const DoctorMark: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 11.5C21 16 17 19 12 19C10.8 19 9.7 18.8 8.7 18.5L4 20L5.3 16.2C4.5 15 4 13.3 4 11.5C4 7 8 4 12 4C17 4 21 7 21 11.5Z" stroke={C.primary} strokeWidth={1.6} strokeLinejoin="round" />
    <Path d="M12 8C12 8 9 9.2 9 11.5C9 13 10.2 14 12 14C13 14 14 13 14 11.5C14 9.2 12 8 12 8Z" fill={C.primary} opacity={0.5} />
    <Circle cx="12" cy="11.5" r="0.9" fill={C.primary} />
  </Svg>
);

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { messages, isTyping, activePlant, appendMessage, setTyping, consumePendingPrompt, consumePendingDiagnosis } = useChatStore();
  const recordDiagnosis = usePlantMemoryStore(s => s.recordDiagnosis);
  const recordCarePattern = usePlantMemoryStore(s => s.recordCarePattern);

  const user = useAuthStore(s => s.user);
  const onboardingCity = useOnboardingStore(s => s.city);
  const plants = usePlantsStore(s => s.plants);

  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatDoc>>(null);
  const weatherRef = useRef<WeatherData | null>(null);
  const aqiRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const city = onboardingCity || user?.city || null;

  // Enrich the active plant from the saved plant doc (health, watering cadence).
  const enrichedPlant = useMemo(() => {
    if (!activePlant) return null;
    const doc = activePlant.plantId ? plants.find(p => p.plantId === activePlant.plantId) : undefined;
    return {
      ...activePlant,
      speciesName: activePlant.speciesName ?? doc?.speciesName,
      scientificName: activePlant.scientificName ?? doc?.scientificName,
      healthStatus: activePlant.healthStatus ?? doc?.healthStatus,
      wateringFrequencyDays: activePlant.wateringFrequencyDays ?? doc?.wateringFrequencyDays,
      nickname: activePlant.nickname ?? doc?.nickname,
    };
  }, [activePlant, plants]);

  // Fetch weather + AQI context once per city.
  useEffect(() => {
    let alive = true;
    if (!city) { weatherRef.current = null; aqiRef.current = null; return; }
    getCurrentWeather(city).then(w => { if (alive) weatherRef.current = w; }).catch(() => {});
    getAirQuality(city).then(a => { if (alive) aqiRef.current = a?.aqi ?? null; }).catch(() => {});
    return () => { alive = false; };
  }, [city]);

  const send = useCallback(async (text: string, diagnosisOverride?: ReturnType<typeof consumePendingDiagnosis>) => {
    const query = text.trim();
    if (!query || isTyping) return;

    // Quota gate (free: 20/day · premium: unlimited)
    const sub = useSubscriptionStore.getState();
    if (!sub.canSendMessageToday()) {
      openPaywall(navigation);
      return;
    }

    appendMessage(makeMsg('user', query));
    setInput('');
    setTyping(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { reply } = await askBanyan({
        userQuery: query,
        activePlant: enrichedPlant,
        userProfile: { name: user?.name, city, climateZone: user?.climateZone },
        weather: weatherRef.current,
        aqi: aqiRef.current,
        diagnosis: diagnosisOverride ?? undefined,
        history: useChatStore.getState().messages,
        signal: controller.signal,
      });
      appendMessage(makeMsg('assistant', reply, enrichedPlant?.nickname));
      // Charge the daily message quota only on a successful reply — never burn
      // a free user's credit on a network/timeout/API failure.
      sub.incrementMessage();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong — please try again';
      appendMessage(makeMsg('assistant', `Sorry, I couldn't respond just now. ${msg}`));
    } finally {
      setTyping(false);
      abortRef.current = null;
    }
  }, [isTyping, enrichedPlant, user, city, appendMessage, setTyping, navigation]);

  // On entry: record any carried-in diagnosis to memory + auto-send the opening prompt.
  useEffect(() => {
    const diagnosis = consumePendingDiagnosis();
    const prompt = consumePendingPrompt();
    if (enrichedPlant?.plantId) {
      recordCarePattern(enrichedPlant.plantId, enrichedPlant.nickname ?? '', enrichedPlant.wateringFrequencyDays);
      if (diagnosis) {
        recordDiagnosis(enrichedPlant.plantId, enrichedPlant.nickname ?? '', {
          name: diagnosis.commonName, healthy: diagnosis.isHealthy,
          issues: diagnosis.diseases?.map(d => d.name),
        });
      }
    }
    if (prompt) send(prompt, diagnosis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isTyping]);

  const remaining = useSubscriptionStore(s => s.messagesRemainingToday());
  const isPremium = useSubscriptionStore(s => s.isPremiumActive());

  const renderItem: ListRenderItem<ChatDoc> = ({ item }) => {
    const mine = item.role === 'user';
    return (
      <Animated.View entering={FadeInUp.duration(M.duration.standard)} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        {!mine && <View style={styles.avatar}><DoctorMark size={18} /></View>}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
        </View>
      </Animated.View>
    );
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.headerBadge}><DoctorMark size={20} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Dr. Banyan</Text>
        <Text style={styles.headerSub}>
          {enrichedPlant?.nickname ? `Caring for ${enrichedPlant.nickname}` : 'AI plant doctor'}
        </Text>
      </View>
      {!isPremium && (
        <View style={styles.quotaChip}>
          <Text style={styles.quotaChipText}>{remaining} left today</Text>
        </View>
      )}
    </View>
  );

  const empty = (
    <Animated.View entering={FadeIn.duration(M.duration.expressive)} style={styles.empty}>
      <View style={styles.emptyBadge}><DoctorMark size={34} /></View>
      <Text style={styles.emptyEyebrow}>AI PLANT DOCTOR</Text>
      <Text style={styles.emptyTitle}>Meet Dr. Banyan</Text>
      <Text style={styles.emptyBody}>
        {enrichedPlant?.nickname
          ? `I know ${enrichedPlant.nickname} — ask me anything about its watering, light, soil, or any trouble you’re seeing.`
          : 'I’m your AI plant doctor, grounded in care data for 100+ Indian plants. Ask about watering, light, soil, pests — or that mystery yellow leaf.'}
      </Text>
      <Text style={styles.chipsHint}>Tap a question to begin</Text>
      <View style={styles.chips}>
        {SUGGESTIONS.map(s => (
          <Pressable key={s} style={styles.chip} onPress={() => send(s)}>
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {header}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.chatId}
          renderItem={renderItem}
          contentContainerStyle={messages.length ? styles.listContent : styles.listEmpty}
          ListEmptyComponent={empty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.avatar}><DoctorMark size={18} /></View>
            <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={styles.typingText}>Dr. Banyan is thinking…</Text>
            </View>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your plant…"
            placeholderTextColor={C.textMuted}
            multiline
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            blurOnSubmit
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || isTyping}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12L20 4L14 20L11 13L4 12Z" fill={C.onPrimary} stroke={C.onPrimary} strokeWidth={1.4} strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingHorizontal: S.screenX, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  headerBadge: { width: 40, height: 40, borderRadius: R.md, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  headerSub: { ...T.caption, color: C.textSecondary },
  quotaChip: { backgroundColor: C.surface, borderRadius: R.pill, paddingHorizontal: S.md, paddingVertical: S.xs, borderWidth: 1, borderColor: C.border },
  quotaChipText: { ...T.caption, color: C.textSecondary },

  listContent: { padding: S.screenX, paddingBottom: S.lg, gap: S.md },
  listEmpty: { flexGrow: 1 },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: S.sm, maxWidth: '92%' },
  rowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  rowTheirs: { alignSelf: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.md, maxWidth: '88%' },
  bubbleMine: { backgroundColor: C.primary, borderBottomRightRadius: R.xs },
  bubbleTheirs: { backgroundColor: C.card, borderBottomLeftRadius: R.xs, borderWidth: 1, borderColor: C.border },
  bubbleText: { ...T.body, color: C.textPrimary },
  bubbleTextMine: { color: C.onPrimary },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: S.sm, paddingHorizontal: S.screenX, paddingBottom: S.sm },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  typingText: { ...T.caption, color: C.textSecondary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S['2xl'] },
  emptyBadge: { width: 76, height: 76, borderRadius: 26, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center', marginBottom: S.lg },
  emptyEyebrow: { ...T.eyebrow, color: C.primary, letterSpacing: 2.5, marginBottom: S.xs },
  emptyTitle: { fontFamily: F.serifMedium, fontSize: 26, color: C.textPrimary, marginBottom: S.sm },
  emptyBody: { ...T.body, color: C.textSecondary, textAlign: 'center', marginBottom: S.xl },
  chipsHint: { ...T.caption, color: C.textMuted, alignSelf: 'flex-start', marginBottom: S.sm },
  chips: { gap: S.sm, width: '100%' },
  chip: { backgroundColor: C.card, borderRadius: R.md, paddingHorizontal: S.lg, paddingVertical: S.md, borderWidth: 1, borderColor: C.border },
  chipText: { ...T.bodyMd, color: C.textPrimary },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: S.sm, paddingHorizontal: S.screenX, paddingVertical: S.md, borderTopWidth: 1, borderTopColor: C.divider, backgroundColor: C.canvas },
  input: { flex: 1, maxHeight: 120, backgroundColor: C.input, borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.md, ...T.body, color: C.textPrimary },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
