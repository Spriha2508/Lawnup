import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { FEATURE_LABELS, FREE_WEEKLY_SCAN_LIMIT } from '../constants/plans';
import type { FeatureName } from '../constants/plans';

const { width: W } = Dimensions.get('window');

// Feature comparison rows
const FEATURE_ROWS: Array<{ feature: FeatureName; freeValue: string; premiumValue: string }> = [
  { feature: 'unlimitedScans',   freeValue: `${FREE_WEEKLY_SCAN_LIMIT} / week`, premiumValue: '80–100 / month' },
  { feature: 'aiDoctor',         freeValue: '20 / day',                         premiumValue: 'Unlimited' },
  { feature: 'diseaseDetection', freeValue: '—',                               premiumValue: 'Included' },
  { feature: 'advancedWeather',  freeValue: 'Basic',                           premiumValue: 'Full insights' },
  { feature: 'reminders',        freeValue: '—',                               premiumValue: 'Smart reminders' },
  { feature: 'priorityAI',       freeValue: '—',                               premiumValue: 'Priority' },
];

// SVG decorative elements
const BotanicDecor: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <Svg width={120} height={120} viewBox="0 0 120 120" fill="none" opacity={opacity}>
    <Path
      d="M60 10 C20 10 10 50 10 80 C40 80 90 80 90 50 C90 25 60 10 60 10Z"
      stroke="#6F943E"
      strokeWidth={1.2}
      fill="rgba(111,148,62,0.06)"
    />
    <Path d="M60 10 L60 80" stroke="rgba(111,148,62,0.18)" strokeWidth={1} />
    <Path d="M60 35 C45 28 30 36 22 50" stroke="rgba(111,148,62,0.14)" strokeWidth={0.8} />
    <Path d="M60 55 C75 48 82 34 80 18" stroke="rgba(111,148,62,0.14)" strokeWidth={0.8} />
    <Ellipse cx="60" cy="90" rx="18" ry="4" fill="rgba(111,148,62,0.06)" />
  </Svg>
);

const CheckMark: React.FC = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M5 13l4 4L19 7" stroke="#6F943E" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CrossMark: React.FC = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#C4C0BA" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { activateMockPremium, setPlan } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const annualScale  = useRef(new Animated.Value(1)).current;
  const monthlyScale = useRef(new Animated.Value(1)).current;

  const pressIn  = (a: Animated.Value) =>
    Animated.spring(a, { toValue: 0.97, damping: 20, stiffness: 300, useNativeDriver: true }).start();
  const pressOut = (a: Animated.Value) =>
    Animated.spring(a, { toValue: 1,    damping: 18, stiffness: 250, useNativeDriver: true }).start();

  const handleUpgrade = useCallback(() => {
    // In production this would launch RevenueCat / Cashfree payment.
    // For now: activate mock premium so the app works end-to-end.
    if (__DEV__) {
      activateMockPremium(true);
      setPlan('premium', undefined, selectedPlan);
      navigation.goBack();
    }
  }, [activateMockPremium, setPlan, navigation, selectedPlan]);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* ── Dark hero ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Botanical decoration */}
          <View style={styles.decorTL}>
            <BotanicDecor opacity={0.55} />
          </View>
          <View style={styles.decorBR}>
            <BotanicDecor opacity={0.35} />
          </View>

          <Pressable
            style={[styles.closeBtn, { top: insets.top + 14 }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          <Text style={styles.heroEyebrow}>LAWNUP PREMIUM</Text>
          <Text style={styles.heroTitle}>Grow beyond{'\n'}the basics.</Text>
          <Text style={styles.heroSubtitle}>
            Unlimited AI scans, smart reminders, and expert plant care — tailored for Indian gardens.
          </Text>
        </View>

        {/* ── Feature comparison ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.compCard}>
            {/* Column headers */}
            <View style={styles.compHeaderRow}>
              <View style={styles.colFeature} />
              <View style={styles.colFree}>
                <Text style={styles.colLabelFree}>FREE</Text>
              </View>
              <View style={styles.colPremium}>
                <Text style={styles.colLabelPremium}>PREMIUM</Text>
              </View>
            </View>
            <View style={styles.compDivider} />

            {FEATURE_ROWS.map((row, i) => (
              <View key={row.feature}>
                <View style={styles.compRow}>
                  <View style={styles.colFeature}>
                    <Text style={styles.featureLabel}>{FEATURE_LABELS[row.feature]}</Text>
                  </View>
                  <View style={styles.colFree}>
                    {row.freeValue === '—' ? (
                      <CrossMark />
                    ) : (
                      <Text style={styles.freeVal}>{row.freeValue}</Text>
                    )}
                  </View>
                  <View style={styles.colPremium}>
                    <View style={styles.premiumValRow}>
                      <CheckMark />
                      <Text style={styles.premiumVal}>{row.premiumValue}</Text>
                    </View>
                  </View>
                </View>
                {i < FEATURE_ROWS.length - 1 && <View style={styles.compRowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Emotional copy ─────────────────────────────────────────────── */}
        <View style={styles.emotionalSection}>
          <Text style={styles.emotionalTitle}>Your plants deserve{'\n'}expert care every day.</Text>
          <Text style={styles.emotionalBody}>
            Thousands of Indian gardeners use LawnUp Premium to keep their Tulsi, Money Plants, and Areca Palms thriving through every season.
          </Text>
        </View>

        {/* ── Plan picker ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CHOOSE YOUR PLAN</Text>

          {/* Annual card — selected by default */}
          <Animated.View style={{ transform: [{ scale: annualScale }] }}>
            <Pressable
              style={[styles.planCard, styles.planCardDark, selectedPlan === 'annual' && styles.planCardSelected]}
              onPress={() => { setSelectedPlan('annual'); pressOut(annualScale); }}
              onPressIn={() => pressIn(annualScale)}
              onPressOut={() => pressOut(annualScale)}
                          >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE · SAVE 17%</Text>
              </View>

              <View style={styles.planRowHeader}>
                <View>
                  <Text style={styles.planNameDark}>Premium Annual</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPriceDark}>₹1990</Text>
                    <Text style={styles.planPeriodDark}> / year</Text>
                  </View>
                  <Text style={styles.planPerMonthDark}>Just ₹166 per month</Text>
                </View>
                <View style={[styles.radio, selectedPlan === 'annual' && styles.radioActive]}>
                  {selectedPlan === 'annual' && <View style={styles.radioFill} />}
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Monthly card */}
          <Animated.View style={{ transform: [{ scale: monthlyScale }], marginTop: 12 }}>
            <Pressable
              style={[styles.planCard, styles.planCardLight, selectedPlan === 'monthly' && styles.planCardSelectedLight]}
              onPress={() => { setSelectedPlan('monthly'); pressOut(monthlyScale); }}
              onPressIn={() => pressIn(monthlyScale)}
              onPressOut={() => pressOut(monthlyScale)}
                          >
              <View style={styles.planRowHeader}>
                <View>
                  <Text style={styles.planNameLight}>Premium Monthly</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPriceLight}>₹199</Text>
                    <Text style={styles.planPeriodLight}> / month</Text>
                  </View>
                </View>
                <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioActive]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioFill} />}
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* CTA */}
          <Pressable style={styles.ctaBtn} onPress={handleUpgrade}>
            <Text style={styles.ctaBtnText}>Start Premium  →</Text>
          </Pressable>
        </View>

        {/* ── Trust row ──────────────────────────────────────────────────── */}
        <View style={styles.trustRow}>
          {['Cancel anytime', 'Secure payments', 'Instant access'].map((t, i, arr) => (
            <React.Fragment key={t}>
              <Text style={styles.trustText}>{t}</Text>
              {i < arr.length - 1 && <Text style={styles.trustDot}>·</Text>}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: 40 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1A2416',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  decorTL: { position: 'absolute', top: -30, left: -30 },
  decorBR: { position: 'absolute', bottom: -30, right: -30, transform: [{ scaleX: -1 }, { scaleY: -1 }] },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  heroEyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#FFFFFF',
    lineHeight: 46,
    marginBottom: 14,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 22,
  },

  // ── Section shell ─────────────────────────────────────────────────────────
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // ── Comparison table ──────────────────────────────────────────────────────
  compCard: {
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD4C7',
  },
  compHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  compDivider:    { height: 1, backgroundColor: '#DDD4C7', marginHorizontal: 16 },
  compRowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(200,196,188,0.5)', marginHorizontal: 16 },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  colFeature: { flex: 1 },
  colFree:    { width: 72, alignItems: 'center' },
  colPremium: { width: 98, alignItems: 'flex-start', paddingLeft: 6 },
  colLabelFree: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: '#9E9A94',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  colLabelPremium: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: '#6F943E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  featureLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#1A1A14',
    lineHeight: 17,
  },
  freeVal: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    textAlign: 'center',
  },
  premiumValRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  premiumVal: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#3D6B19',
  },

  // ── Emotional copy ────────────────────────────────────────────────────────
  emotionalSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  emotionalTitle: {
    fontSize: 30,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#111111',
    lineHeight: 35,
    marginBottom: 12,
  },
  emotionalBody: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6B6B5E',
    lineHeight: 22,
  },

  // ── Plan cards ────────────────────────────────────────────────────────────
  planCard: { borderRadius: 20, padding: 20, overflow: 'hidden' },
  planCardDark:  { backgroundColor: '#1A2416' },
  planCardLight: {
    backgroundColor: '#EEE7DA',
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
  },
  planCardSelected:      { borderWidth: 2, borderColor: '#6F943E' },
  planCardSelectedLight: { borderWidth: 2, borderColor: '#6F943E' },

  bestValueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6F943E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  bestValueText: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  planRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline' },

  planNameDark:    { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
  planPriceDark:   { fontSize: 34, fontFamily: 'Cormorant-Bold', color: '#FFFFFF' },
  planPeriodDark:  { fontSize: 15, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.45)' },
  planPerMonthDark:{ fontSize: 12, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.38)', marginTop: 3 },

  planNameLight:   { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#6B6B5E', marginBottom: 4 },
  planPriceLight:  { fontSize: 28, fontFamily: 'Cormorant-SemiBold', color: '#111111' },
  planPeriodLight: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#9E9A94' },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C4C0BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  radioActive: { borderColor: '#6F943E' },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6F943E',
  },

  // CTA
  ctaBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Trust row
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  trustText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9E9A94' },
  trustDot:  { fontSize: 12, color: '#C4C0BA' },
});
