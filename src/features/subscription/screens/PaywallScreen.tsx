import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { purchase as purchaseTier, restore as restorePurchases, PAYMENTS_READY, MOCK_PREMIUM_ENABLED } from '../services/purchasesService';
import { FREE_WEEKLY_SCAN_LIMIT } from '../constants/plans';
import { theme } from '@constants/designSystem';

const C = theme.color;
const { width: W } = Dimensions.get('window');

// Illustrative recovery examples — what Premium helps with (no fabricated
// testimonials; each names the feature that does the work, honestly).
const STORIES = [
  { emoji: '🌿', from: 'Yellowing leaves', to: 'Lush & thriving', days: '~3 weeks', how: 'Doc. Sage flags overwatering early' },
  { emoji: '🌱', from: 'Brown, crispy tips', to: 'Fresh new growth', days: '~2 weeks', how: 'A care plan tuned to its light & soil' },
  { emoji: '🌸', from: 'No blooms in months', to: 'Flowering again', days: '~5 weeks', how: 'Unlimited Doc. Sage check-ins as it recovers' },
];

// Feature comparison — reflects ACTUAL app functionality. Premium's real value
// is higher scan + AI-chat quotas; everything else is included on both plans
// ("✓"). Do not advertise as premium-only anything free users already get.
// `__SCANS__` is filled per selected tier at render.
const FEATURE_ROWS: { label: string; free: string; premium: string }[] = [
  { label: 'AI plant scans',           free: `${FREE_WEEKLY_SCAN_LIMIT} / week`, premium: '__SCANS__' },
  { label: 'Doc. Sage AI chat',       free: '20 / day',                         premium: 'Unlimited' },
  { label: 'Plant ID & disease check', free: '✓',                                premium: '✓' },
  { label: 'Watering reminders',       free: '✓',                                premium: '✓' },
  { label: 'Weather & AQI care tips',  free: '✓',                                premium: '✓' },
  { label: 'Plants in your garden',    free: 'Unlimited',                        premium: 'Unlimited' },
];

// SVG decorative elements
const BotanicDecor: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <Svg width={120} height={120} viewBox="0 0 120 120" fill="none" opacity={opacity}>
    <Path
      d="M60 10 C20 10 10 50 10 80 C40 80 90 80 90 50 C90 25 60 10 60 10Z"
      stroke="rgba(255,255,255,0.20)"
      strokeWidth={1.2}
      fill="rgba(255,255,255,0.05)"
    />
    <Path d="M60 10 L60 80" stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
    <Path d="M60 35 C45 28 30 36 22 50" stroke="rgba(255,255,255,0.13)" strokeWidth={0.8} />
    <Path d="M60 55 C75 48 82 34 80 18" stroke="rgba(255,255,255,0.13)" strokeWidth={0.8} />
    <Ellipse cx="60" cy="90" rx="18" ry="4" fill="rgba(255,255,255,0.05)" />
  </Svg>
);

const CheckMark: React.FC = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M5 13l4 4L19 7" stroke={C.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CrossMark: React.FC = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={C.textFaint} strokeWidth={2} strokeLinecap="round" />
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

  const handleUpgrade = useCallback(async () => {
    // Real payments go through RevenueCat once PAYMENTS_READY (see
    // purchasesService + docs/revenuecat-setup.md). Until then, non-production
    // builds (dev/preview/staging) use a LOCAL mock so the upgrade flow is fully
    // testable on device. MOCK_PREMIUM_ENABLED is hard-gated off in production.
    if (PAYMENTS_READY) {
      const res = await purchaseTier(selectedPlan);
      if (res.success) navigation.goBack();
      return;
    }
    if (MOCK_PREMIUM_ENABLED) {
      activateMockPremium(true);
      setPlan('premium', undefined, selectedPlan);
      navigation.goBack();
    }
  }, [activateMockPremium, setPlan, navigation, selectedPlan]);

  const handleRestore = useCallback(async () => {
    if (!PAYMENTS_READY) {
      Alert.alert('Restore purchases', 'Purchases will be available at launch — nothing to restore yet.');
      return;
    }
    const res = await restorePurchases();
    if (res.success) {
      Alert.alert('Purchases restored', 'Your Premium access is active again.');
      navigation.goBack();
    } else {
      Alert.alert('Nothing to restore', 'We couldn’t find a previous Premium purchase on this account.');
    }
  }, [navigation]);

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
          <Text style={styles.heroTitle}>Never lose a{'\n'}plant to a guess.</Text>
          <Text style={styles.heroSubtitle}>
            Many more AI scans each month and unlimited Doc. Sage chat — the full LawnUp experience, tuned for Indian gardens.
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

            {FEATURE_ROWS.map((row, i) => {
              const premiumText =
                row.premium === '__SCANS__'
                  ? (selectedPlan === 'annual' ? '100 / month' : '80 / month')
                  : row.premium;
              return (
                <View key={row.label}>
                  <View style={styles.compRow}>
                    <View style={styles.colFeature}>
                      <Text style={styles.featureLabel}>{row.label}</Text>
                    </View>
                    <View style={styles.colFree}>
                      {row.free === '—' ? (
                        <CrossMark />
                      ) : row.free === '✓' ? (
                        <CheckMark />
                      ) : (
                        <Text style={styles.freeVal}>{row.free}</Text>
                      )}
                    </View>
                    <View style={styles.colPremium}>
                      <View style={styles.premiumValRow}>
                        <CheckMark />
                        {premiumText !== '✓' && <Text style={styles.premiumVal}>{premiumText}</Text>}
                      </View>
                    </View>
                  </View>
                  {i < FEATURE_ROWS.length - 1 && <View style={styles.compRowDivider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Emotional proof: real transformations ──────────────────────── */}
        <View style={styles.emotionalSection}>
          <Text style={styles.sectionLabel}>WHAT PREMIUM HELPS WITH</Text>
          <Text style={styles.emotionalTitle}>From struggling{'\n'}to thriving.</Text>
          <Text style={styles.emotionalBody}>
            Premium gives you the tools to catch problems early and bring plants back — here’s what that looks like.
          </Text>
        </View>

        {/* Transformation story cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyScroll}
          decelerationRate="fast"
          snapToInterval={W * 0.74 + 12}
          snapToAlignment="start"
        >
          {STORIES.map((s, i) => (
            <View key={i} style={styles.storyCard}>
              <Text style={styles.storyEmoji}>{s.emoji}</Text>
              <View style={styles.storyBA}>
                <View style={styles.pillBad}><Text style={styles.pillBadText}>{s.from}</Text></View>
                <Text style={styles.storyArrow}>→</Text>
                <View style={styles.pillGood}><Text style={styles.pillGoodText}>{s.to}</Text></View>
              </View>
              <Text style={styles.storyDays}>Recovered in {s.days}</Text>
              <Text style={styles.storyQuote}>{s.how}</Text>
            </View>
          ))}
        </ScrollView>

        {/* AI Doctor example */}
        <View style={styles.section}>
          <View style={styles.aiCard}>
            <Text style={styles.aiEyebrow}>🌿  DOC. SAGE</Text>
            <View style={styles.bubbleUser}><Text style={styles.bubbleUserText}>Why are my Tulsi leaves curling?</Text></View>
            <View style={styles.bubbleAI}>
              <Text style={styles.bubbleAIText}>
                Likely heat stress with dry soil. Move it to gentle morning light and water every 2 days — new leaves should flatten out within a week 🌿
              </Text>
            </View>
          </View>
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

          {/* CTA — tappable once payments are live (RevenueCat) or in DEV (mock).
              In release before payments are wired it stays disabled rather than
              dead-tapping. */}
          {(() => {
            const ctaEnabled = PAYMENTS_READY || MOCK_PREMIUM_ENABLED;
            return (
              <Pressable style={[styles.ctaBtn, !ctaEnabled && styles.ctaBtnDisabled]} onPress={handleUpgrade} disabled={!ctaEnabled}>
                <Text style={styles.ctaBtnText}>{ctaEnabled ? 'Start Premium  →' : 'Premium — coming soon'}</Text>
              </Pressable>
            );
          })()}

          <Pressable style={styles.restoreBtn} onPress={handleRestore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.restoreBtnText}>Restore purchases</Text>
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
    backgroundColor: C.primaryDark,
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
    color: C.primarySoft,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: 'Jakarta-SemiBoldItalic',
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
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // ── Comparison table ──────────────────────────────────────────────────────
  compCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  compHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  compDivider:    { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  compRowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.divider, marginHorizontal: 16 },
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
    color: C.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  colLabelPremium: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: C.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  featureLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: C.textPrimary,
    lineHeight: 17,
  },
  freeVal: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: C.textMuted,
    textAlign: 'center',
  },
  premiumValRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  premiumVal: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: C.primaryDark,
  },

  // ── Emotional copy ────────────────────────────────────────────────────────
  emotionalSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  emotionalTitle: {
    fontSize: 30,
    fontFamily: 'Jakarta-SemiBold',
    color: C.textPrimary,
    lineHeight: 35,
    marginBottom: 12,
  },
  emotionalBody: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: C.textSecondary,
    lineHeight: 22,
  },

  // ── Transformation stories ────────────────────────────────────────────────
  storyScroll: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  storyCard: { width: W * 0.74, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, ...theme.shadows.card },
  storyEmoji: { fontSize: 28, marginBottom: 12 },
  storyBA: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  pillBad: { backgroundColor: C.criticalBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillBadText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: C.criticalFg },
  storyArrow: { fontSize: 14, color: C.textMuted },
  pillGood: { backgroundColor: C.healthyBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillGoodText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: C.healthyFg },
  storyDays: { fontSize: 11, fontFamily: 'Nunito-Bold', color: C.primary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  storyQuote: { fontSize: 14, fontFamily: 'Nunito-Regular', color: C.textSecondary, lineHeight: 21, fontStyle: 'italic', marginBottom: 10 },
  storyWho: { fontSize: 12, fontFamily: 'Nunito-Bold', color: C.textPrimary },

  // ── AI Doctor example ─────────────────────────────────────────────────────
  aiCard: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, gap: 10, ...theme.shadows.card },
  aiEyebrow: { fontSize: 10, fontFamily: 'Nunito-Bold', color: C.primary, letterSpacing: 1.8, marginBottom: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: C.primary, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '85%' },
  bubbleUserText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: C.onPrimary, lineHeight: 18 },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: C.surface, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '92%', borderWidth: 1, borderColor: C.border },
  bubbleAIText: { fontSize: 13, fontFamily: 'Nunito-Regular', color: C.textPrimary, lineHeight: 19 },

  // ── Plan cards ────────────────────────────────────────────────────────────
  planCard: { borderRadius: 20, padding: 20, overflow: 'hidden' },
  planCardDark:  { backgroundColor: C.primaryDark },
  planCardLight: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  planCardSelected:      { borderWidth: 2, borderColor: C.primary },
  planCardSelectedLight: { borderWidth: 2, borderColor: C.primary },

  bestValueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
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
  planPriceDark:   { fontSize: 34, fontFamily: 'Jakarta-Bold', color: '#FFFFFF' },
  planPeriodDark:  { fontSize: 15, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.45)' },
  planPerMonthDark:{ fontSize: 12, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.38)', marginTop: 3 },

  planNameLight:   { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: C.textSecondary, marginBottom: 4 },
  planPriceLight:  { fontSize: 28, fontFamily: 'Jakarta-SemiBold', color: C.textPrimary },
  planPeriodLight: { fontSize: 13, fontFamily: 'Nunito-Regular', color: C.textMuted },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  radioActive: { borderColor: C.primary },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },

  // CTA
  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnDisabled: {
    backgroundColor: C.textFaint,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: C.onPrimary,
    letterSpacing: 0.2,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  restoreBtnText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: C.textMuted,
    textDecorationLine: 'underline',
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
  trustText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: C.textMuted },
  trustDot:  { fontSize: 12, color: C.textFaint },
});
