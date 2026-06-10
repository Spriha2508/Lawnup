import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { doc, updateDoc } from 'firebase/firestore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../../auth/store/authStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { INDIAN_CITIES } from '../../../constants/plants';
import type { ClimateZone } from '../../../constants/plants';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { FloatingLeaves } from '@shared/components/motion/FloatingLeaves';
import { theme } from '@constants/designSystem';
import type { OnboardingStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Location'>;
const { width: W } = Dimensions.get('window');
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
const CHIP_W = (W - 56 - 10) / 2;

const ZONE_MAP: Record<string, ClimateZone> = {
  Delhi: 'north', Mumbai: 'coastal', Bengaluru: 'south', Hyderabad: 'south',
  Chennai: 'coastal', Kolkata: 'north', Pune: 'south', Ahmedabad: 'north',
  Jaipur: 'north', Lucknow: 'north', Chandigarh: 'north', Bhopal: 'north',
  Indore: 'north', Kochi: 'coastal', Nagpur: 'north', Patna: 'north',
  Vadodara: 'north', Surat: 'coastal', Coimbatore: 'south', Visakhapatnam: 'coastal',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PinIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21C12 21 19 15.5 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 15.5 12 21 12 21Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="2.4" stroke={color} strokeWidth={1.7} />
  </Svg>
);

const CityChip: React.FC<{ city: string; active: boolean; onPress: () => void; index: number }> = ({
  city, active, onPress, index,
}) => {
  const sel = useSharedValue(active ? 1 : 0);
  const press = useSharedValue(0);
  React.useEffect(() => {
    sel.value = withTiming(active ? 1 : 0, { duration: M.duration.standard, easing: M.ease.smooth });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [C.surface, C.inkBtn]),
    borderColor: interpolateColor(sel.value, [0, 1], [C.border, C.inkBtn]),
    transform: [{ scale: 1 - press.value * 0.04 }],
  }));
  const textStyle = useAnimatedStyle(() => ({ color: interpolateColor(sel.value, [0, 1], [C.textPrimary, C.onInkBtn]) }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 24, 260)).duration(360)} style={{ width: CHIP_W }}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { press.value = withSpring(1, M.spring.snappy); }}
        onPressOut={() => { press.value = withSpring(0, M.spring.gentle); }}
        style={[styles.chip, chipStyle]}
      >
        <Animated.Text style={[styles.chipText, textStyle]} numberOfLines={1}>{city}</Animated.Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

export const LocationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { setCity } = useOnboardingStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = INDIAN_CITIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const handleNext = useCallback(async () => {
    if (!selected || !user) return;
    const zone = ZONE_MAP[selected] ?? 'north';
    setCity(selected, zone);
    await updateDoc(doc(db, `users/${user.uid}`), { city: selected, climateZone: zone });
    navigation.navigate('PlaceType');
  }, [selected, user, setCity, navigation]);

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <FloatingLeaves />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.header}>
          <Text style={styles.eyebrow}>YOUR LOCATION</Text>
          <Text style={styles.title}>{'Where are\nyou based?'}</Text>
          <Text style={styles.sub}>Weather-smart care, tuned to your exact city.</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(M.duration.expressive)}
          style={[styles.searchWrap, focused && styles.searchWrapFocused]}
        >
          <PinIcon color={focused ? C.primary : C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your city…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </Animated.View>

        <View style={styles.listWrap}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <CityChip city={item} index={index} active={selected === item} onPress={() => setSelected(item)} />
            )}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(220).duration(M.duration.expressive)} style={styles.ctaWrap}>
          <Pressable style={[styles.cta, !selected && styles.ctaDisabled]} disabled={!selected} onPress={handleNext}>
            <Text style={[styles.ctaText, !selected && styles.ctaTextOff]}>
              {selected ? `Continue with ${selected}` : 'Select your city'}
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  safe: { flex: 1, paddingHorizontal: 28, paddingTop: S.lg, paddingBottom: S.sm },

  header: { marginBottom: S.xl },
  eyebrow: { ...T.eyebrow, color: C.textMuted, marginBottom: S.md },
  title: { fontFamily: F.serifMedium, fontSize: 40, lineHeight: 44, letterSpacing: -0.4, color: C.textPrimary },
  sub: { ...T.bodyMd, color: C.textSecondary, lineHeight: 20, marginTop: S.md },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: R.lg,
    paddingHorizontal: S.lg, marginBottom: S.lg,
    borderWidth: 1.5, borderColor: C.border,
  },
  searchWrapFocused: { borderColor: C.primary, backgroundColor: 'rgba(255,255,255,0.92)' },
  searchInput: { flex: 1, height: 50, ...T.body, color: C.textPrimary },
  clearBtn: { fontSize: 14, color: C.textMuted, paddingHorizontal: S.xs },

  listWrap: { flex: 1 },
  listContent: { paddingBottom: S.sm },
  columnWrap: { gap: 10, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: R.lg, paddingVertical: 14, paddingHorizontal: S.md,
    borderWidth: 1.5,
  },
  chipText: { ...T.bodyMd, fontFamily: F.sansMedium },

  ctaWrap: { paddingTop: S.sm, paddingBottom: S.xs },
  cta: { width: '100%', backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: 17, alignItems: 'center' },
  ctaDisabled: { backgroundColor: C.textFaint },
  ctaText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },
  ctaTextOff: { color: 'rgba(255,255,255,0.7)' },
});
