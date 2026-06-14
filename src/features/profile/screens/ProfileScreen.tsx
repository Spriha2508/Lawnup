import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { openPaywall } from '@navigation/openPaywall';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;

// ─── Icons ───────────────────────────────────────────────────────────────────
const I = { stroke: C.textMuted, w: 1.6 };
const StarIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" fill={color === C.primary ? C.primaryWash : 'none'} /></Svg>
);
const EditIcon = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M4 20h4L19 9l-4-4L4 16v4z" stroke={I.stroke} strokeWidth={I.w} strokeLinejoin="round" /><Path d="M14 6l4 4" stroke={I.stroke} strokeWidth={I.w} strokeLinecap="round" /></Svg>);
const BellIcon = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={I.stroke} strokeWidth={I.w} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
const ThemeIcon = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke={I.stroke} strokeWidth={I.w} strokeLinejoin="round" /></Svg>);
const HistoryIcon = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={I.stroke} strokeWidth={I.w} /><Path d="M12 7v5l3 3" stroke={I.stroke} strokeWidth={I.w} strokeLinecap="round" /></Svg>);
const HelpIcon = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={I.stroke} strokeWidth={I.w} /><Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17v.1" stroke={I.stroke} strokeWidth={I.w} strokeLinecap="round" /></Svg>);

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};
const getMemberSince = (createdAt: any): string => {
  if (!createdAt) return '2024';
  const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  return String(d.getFullYear());
};
const LEVELS = [
  { name: 'Seedling', at: 0 },
  { name: 'Sprout', at: 2 },
  { name: 'Gardener', at: 6 },
  { name: 'Botanist', at: 12 },
];
const gardenLevel = (n: number): string => (n >= 12 ? 'Botanist' : n >= 6 ? 'Gardener' : n >= 2 ? 'Sprout' : 'Seedling');

type ProfileNav = StackNavigationProp<ProfileStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNav>();
  const { user, signOut } = useAuthStore();
  const { scansUsed, scansRemainingThisWeek, isPremiumActive } = useSubscriptionStore();
  const { plants } = usePlantsStore();

  const initials = user?.name ? getInitials(user.name) : 'G';
  const thriving = plants.filter(p => p.healthStatus === 'Healthy').length;
  const year = getMemberSince(user?.createdAt);
  const isPremium = isPremiumActive();
  const remaining = scansRemainingThisWeek();
  const level = gardenLevel(plants.length);

  // Growth toward the next garden level — a living progression.
  const curIdx = LEVELS.reduce((acc, l, i) => (plants.length >= l.at ? i : acc), 0);
  const isMaxLevel = curIdx === LEVELS.length - 1;
  const curAt = LEVELS[curIdx].at;
  const nextAt = isMaxLevel ? curAt : LEVELS[curIdx + 1].at;
  const nextName = isMaxLevel ? '' : LEVELS[curIdx + 1].name;
  const toNext = isMaxLevel ? 0 : nextAt - plants.length;
  const growthPct = isMaxLevel ? 100 : Math.max(6, Math.round(((plants.length - curAt) / (nextAt - curAt)) * 100));

  const achievements = [
    { id: 'first_plant', title: 'First plant added', sub: plants.length > 0 ? 'Earned' : 'Add a plant to earn', earned: plants.length > 0 },
    { id: 'first_scan', title: 'First AI scan', sub: scansUsed > 0 ? 'Earned' : 'Scan a plant to earn', earned: scansUsed > 0 },
    { id: 'green_thumb', title: 'Green thumb', sub: thriving >= 3 ? 'Earned' : `${thriving}/3 healthy plants`, earned: thriving >= 3 },
    { id: 'collector', title: 'Plant collector', sub: plants.length >= 5 ? 'Earned' : `${plants.length}/5 plants`, earned: plants.length >= 5 },
    { id: 'scan_pro', title: 'Scan explorer', sub: scansUsed >= 10 ? 'Earned' : `${scansUsed}/10 scans`, earned: scansUsed >= 10 },
    { id: 'botanist', title: 'Master botanist', sub: plants.length >= 12 ? 'Earned' : `${plants.length}/12 plants`, earned: plants.length >= 12 },
  ];
  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <View style={styles.root}>
      <AmbientBackground animated={false} vignette={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.screenLabel}>PROFILE</Text>

          {/* Identity */}
          <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.identity}>
            <View style={styles.avatarRing}><Text style={styles.avatarText}>{initials}</Text></View>
            <Text style={styles.userName}>{user?.name ?? 'Gardener'}</Text>
            <Text style={styles.userSince}>{level} · Plant parent since {year}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgeGreen]}><Text style={[styles.badgeText, { color: C.primary }]}>{level.toUpperCase()}</Text></View>
              <View style={[styles.badge, isPremium ? styles.badgeGreen : styles.badgeAmber]}>
                <Text style={[styles.badgeText, { color: isPremium ? C.primary : C.secondary }]}>{isPremium ? 'PREMIUM' : 'EARLY ADOPTER'}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(70).duration(M.duration.expressive)} style={styles.statsRow}>
            <StatBlock value={plants.length} label="PLANTS" />
            <View style={styles.statDiv} />
            <StatBlock value={thriving} label="THRIVING" tone={C.healthyFg} />
            <View style={styles.statDiv} />
            <StatBlock value={scansUsed} label="AI SCANS" />
          </Animated.View>

          {/* Growth progress — toward the next garden level */}
          <Animated.View entering={FadeInDown.delay(110).duration(M.duration.expressive)} style={styles.growthCard}>
            <View style={styles.growthHead}>
              <Text style={styles.growthLevel}>{level}</Text>
              <Text style={styles.growthNext}>
                {isMaxLevel ? 'Top level reached 🌳' : `${toNext} more to ${nextName}`}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${growthPct}%` }]} />
            </View>
          </Animated.View>

          {/* Premium */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(140).duration(M.duration.expressive)} style={styles.premiumBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumLabel}>LAWNUP PREMIUM</Text>
                <Text style={styles.premiumTitle}>More scans,{'\n'}deeper care.</Text>
                {remaining >= 0 && remaining <= 1 && (
                  <Text style={styles.premiumScansLeft}>{remaining === 0 ? 'No free scans left this week' : `${remaining} free scan left this week`}</Text>
                )}
              </View>
              <PressableScale style={styles.premiumBtn} onPress={() => openPaywall(navigation)} to={0.95}>
                <Text style={styles.premiumBtnText}>Upgrade</Text>
              </PressableScale>
            </Animated.View>
          )}

          {/* Achievements */}
          <Animated.View entering={FadeInDown.delay(200).duration(M.duration.expressive)}>
            <Text style={styles.sectionLabel}>ACHIEVEMENTS · {earnedCount}/{achievements.length}</Text>
            <View style={styles.listCard}>
              {achievements.map((a, i) => (
                <View key={a.id} style={[styles.listRow, i < achievements.length - 1 && styles.listRowBorder]}>
                  <View style={[styles.iconWrap, a.earned && styles.iconWrapEarned]}><StarIcon color={a.earned ? C.primary : C.textFaint} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, !a.earned && { color: C.textMuted }]}>{a.title}</Text>
                    <Text style={styles.listSub}>{a.sub}</Text>
                  </View>
                  {a.earned && <View style={styles.earnedDot} />}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Account — settings (clearly Coming soon, no dead taps) */}
          <Animated.View entering={FadeInDown.delay(250).duration(M.duration.expressive)}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.listCard}>
              <NavRow icon={<EditIcon />} label="Edit profile" isLast={false} onPress={() => navigation.navigate('EditProfile')} />
              <NavRow icon={<BellIcon />} label="Reminders" isLast={false} onPress={() => navigation.navigate('Reminders')} />
              <SoonRow icon={<ThemeIcon />} label="Appearance (dark mode)" isLast={false} />
              <NavRow icon={<HistoryIcon />} label="Scan history" isLast onPress={() => navigation.navigate('ScanHistory')} />
            </View>
          </Animated.View>

          {/* Support */}
          <Animated.View entering={FadeInDown.delay(300).duration(M.duration.expressive)}>
            <Text style={styles.sectionLabel}>SUPPORT</Text>
            <View style={styles.listCard}>
              <NavRow icon={<HelpIcon />} label="Help & support" isLast onPress={() => navigation.navigate('HelpSupport')} />
            </View>
          </Animated.View>

          {/* Sign out */}
          <Animated.View entering={FadeInDown.delay(350).duration(M.duration.expressive)}>
            <PressableScale style={styles.signOutBtn} onPress={signOut} to={0.97}>
              <Text style={styles.signOutText}>Sign out</Text>
            </PressableScale>
          </Animated.View>

          <Text style={styles.version}>LawnUp · v1.0.0</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const StatBlock: React.FC<{ value: number; label: string; tone?: string }> = ({ value, label, tone }) => (
  <View style={styles.statBlock}>
    <Text style={[styles.statValue, tone && { color: tone }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SoonRow: React.FC<{ icon: React.ReactNode; label: string; isLast: boolean }> = ({ icon, label, isLast }) => (
  <View style={[styles.listRow, !isLast && styles.listRowBorder]}>
    <View style={styles.iconWrap}>{icon}</View>
    <Text style={[styles.listTitle, { flex: 1, color: C.textSecondary }]}>{label}</Text>
    <View style={styles.soonPill}><Text style={styles.soonText}>SOON</Text></View>
  </View>
);

const NavRow: React.FC<{ icon: React.ReactNode; label: string; isLast: boolean; onPress: () => void }> = ({ icon, label, isLast, onPress }) => (
  <PressableScale style={[styles.listRow, !isLast && styles.listRowBorder]} onPress={onPress} to={0.99}>
    <View style={styles.iconWrap}>{icon}</View>
    <Text style={[styles.listTitle, { flex: 1, color: C.textPrimary }]}>{label}</Text>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={C.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </PressableScale>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: S.xl, paddingTop: S.sm },
  screenLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S['2xl'] },

  identity: { alignItems: 'center', marginBottom: S['2xl'] },
  avatarRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: S.lg, borderWidth: 3, borderColor: C.primarySoft },
  avatarText: { fontFamily: F.sansHeavy, fontSize: 30, color: C.onPrimary },
  userName: { fontFamily: F.serifMediumItalic, fontSize: 32, color: C.textPrimary, marginBottom: 4, textAlign: 'center' },
  userSince: { ...T.bodyMd, color: C.textMuted, marginBottom: S.lg },
  badgeRow: { flexDirection: 'row', gap: S.sm },
  badge: { paddingHorizontal: S.md, paddingVertical: 5, borderRadius: R.pill, borderWidth: 1.5 },
  badgeGreen: { borderColor: C.primary, backgroundColor: C.primaryWash },
  badgeAmber: { borderColor: C.secondary, backgroundColor: 'rgba(194,104,60,0.10)' },
  badgeText: { ...T.statLabel, fontSize: 10, fontFamily: F.sansBold, letterSpacing: 0.8 },

  statsRow: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.xl, paddingVertical: S.lg, marginBottom: S.lg, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },

  // Growth progress
  growthCard: { backgroundColor: C.card, borderRadius: R.xl, paddingHorizontal: S.lg, paddingVertical: S.lg, marginBottom: S['3xl'], borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  growthHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: S.md },
  growthLevel: { fontFamily: F.serifMedium, fontSize: 18, color: C.textPrimary },
  growthNext: { ...T.caption, color: C.textMuted },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: C.input, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: C.primary },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: F.sansHeavy, fontSize: 26, color: C.textPrimary, marginBottom: 4 },
  statLabel: { ...T.statLabel, color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  statDiv: { width: 1, height: 34, backgroundColor: C.divider, alignSelf: 'center' },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },
  listCard: { backgroundColor: C.card, borderRadius: R.xl, marginBottom: S['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: S.lg, gap: S.lg },
  listRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center' },
  iconWrapEarned: { backgroundColor: C.primaryWash },
  listTitle: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, marginBottom: 2 },
  listSub: { ...T.caption, color: C.textMuted },
  earnedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  soonPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: R.pill, backgroundColor: C.input },
  soonText: { ...T.statLabel, fontSize: 9, color: C.textMuted, letterSpacing: 1 },

  premiumBanner: { backgroundColor: C.primaryDark, borderRadius: R.xl, padding: S.xl, flexDirection: 'row', alignItems: 'center', marginBottom: S['3xl'], ...theme.shadows.lg },
  premiumLabel: { ...T.statLabel, color: C.primarySoft, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  premiumTitle: { fontFamily: F.serifMedium, fontSize: 22, color: '#FFFFFF', lineHeight: 26 },
  premiumScansLeft: { ...T.caption, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  premiumBtn: { backgroundColor: C.card, borderRadius: R.pill, paddingHorizontal: S.lg, paddingVertical: 11, marginLeft: S.lg },
  premiumBtnText: { ...T.label, fontFamily: F.sansBold, color: C.primaryDark },

  signOutBtn: { paddingVertical: S.lg, alignItems: 'center', borderRadius: R.pill, borderWidth: 1.5, borderColor: 'rgba(229,72,77,0.4)', marginBottom: S.lg },
  signOutText: { ...T.bodyStrong, fontFamily: F.sansMedium, color: C.criticalFg },
  version: { ...T.caption, color: C.textFaint, textAlign: 'center' },
});
