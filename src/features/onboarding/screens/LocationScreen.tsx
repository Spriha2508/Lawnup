import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { doc, updateDoc } from 'firebase/firestore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../../auth/store/authStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { INDIAN_CITIES } from '../../../constants/plants';
import type { ClimateZone } from '../../../constants/plants';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Location'>;

const { width: W } = Dimensions.get('window');

const ZONE_MAP: Record<string, ClimateZone> = {
  Delhi: 'north', Mumbai: 'coastal', Bengaluru: 'south', Hyderabad: 'south',
  Chennai: 'coastal', Kolkata: 'north', Pune: 'south', Ahmedabad: 'north',
  Jaipur: 'north', Lucknow: 'north', Chandigarh: 'north', Bhopal: 'north',
  Indore: 'north', Kochi: 'coastal', Nagpur: 'north', Patna: 'north',
  Vadodara: 'north', Surat: 'coastal', Coimbatore: 'south', Visakhapatnam: 'coastal',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Horizontal bar — 4 segments all dimmed (location precedes the 4-step flow)
const StepBar: React.FC = () => (
  <View style={stepStyles.row}>
    {Array.from({ length: 4 }, (_, i) => (
      <View key={i} style={stepStyles.seg} />
    ))}
  </View>
);

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#DDD4C7' },
});

export const LocationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { setCity } = useOnboardingStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const btnScale = useSharedValue(1);

  const filtered = INDIAN_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = async () => {
    if (!selected || !user) return;
    const zone = ZONE_MAP[selected] ?? 'north';
    setCity(selected, zone);
    await updateDoc(doc(db, `users/${user.uid}`), { city: selected, climateZone: zone });
    navigation.navigate('PlaceType');
  };

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.headerWrap}>
          <StepBar />
          <Text style={styles.stepLabel}>YOUR LOCATION</Text>
          <Text style={styles.title}>Where are{'\n'}you based?</Text>
          <Text style={styles.sub}>
            We'll give weather-smart care tips for your exact city.
          </Text>
        </Animated.View>

        {/* Search */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(450).springify()}
          style={styles.searchWrap}
        >
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your city..."
            placeholderTextColor="#A0A094"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* City grid */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(450)}
          style={styles.listWrap}
        >
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(Math.min(index * 25, 280)).duration(320)}
                style={styles.cityItem}
              >
                <TouchableOpacity
                  onPress={() => setSelected(item)}
                  style={[
                    styles.cityBtn,
                    selected === item && styles.cityBtnActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.cityText,
                    selected === item && styles.cityTextActive,
                  ]}>
                    {item}
                  </Text>
                  {selected === item && (
                    <Text style={styles.cityCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(300).duration(450).springify()} style={styles.ctaWrap}>
          <AnimatedPressable
            style={[styles.cta, !selected && styles.ctaDisabled, btnStyle]}
            disabled={!selected}
            onPressIn={() => { if (selected) btnScale.value = withSpring(0.96, { damping: 12 }); }}
            onPressOut={() => { btnScale.value = withSpring(1, { damping: 10 }); }}
            onPress={handleNext}
          >
            <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>
              {selected ? `Continue with ${selected}  →` : 'Select your city'}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1E8' },
  safe: { flex: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 8 },

  headerWrap: {
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#8A8575',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  title: {
    fontSize: 38,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 44,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6B6B5E',
    marginBottom: 20,
    lineHeight: 20,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: '#1A1A08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#1A1A14',
  },
  clearBtn: { fontSize: 14, color: '#A0A094', paddingHorizontal: 4 },

  listWrap: { flex: 1 },
  listContent: { paddingBottom: 8 },
  columnWrap: { gap: 10, marginBottom: 10 },
  cityItem: { flex: 1 },
  cityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEE7DA',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
  },
  cityBtnActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  cityText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
  },
  cityTextActive: { color: '#FFFFFF' },
  cityCheck: { fontSize: 12, color: '#FFFFFF' },

  ctaWrap: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  cta: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#C8C8BC' },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaTextDisabled: { color: 'rgba(255,255,255,0.7)' },
});
