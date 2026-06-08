import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';

// ─── Icons ────────────────────────────────────────────────────────────────────

const SettingsIcon: React.FC = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke="#6E6A64" strokeWidth={1.75} />
    <Path
      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke="#6E6A64"
      strokeWidth={1.75}
      strokeLinecap="round"
    />
  </Svg>
);

const BadgeIcon: React.FC = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z"
      stroke="#6F943E"
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill="rgba(111,148,62,0.08)"
    />
  </Svg>
);

const HistoryIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#6E6A64" strokeWidth={1.6} />
    <Path d="M12 7v5l3 3" stroke="#6E6A64" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

const BellIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      stroke="#6E6A64"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShopIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
      stroke="#6E6A64"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke="#6E6A64" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { plan, scansUsed, scanLimit, chatsUsed, chatLimit } = useSubscriptionStore();
  const { plants } = usePlantsStore();

  const initials  = user?.name ? getInitials(user.name) : 'G';
  const thriving  = plants.filter(p => p.healthStatus === 'Healthy').length;
  const year      = getMemberSince(user?.createdAt);
  const isPremium = plan === 'premium';

  const achievements = [
    {
      id: 'first_plant',
      title: 'First plant added',
      time: plants.length > 0 ? 'Earned' : 'Not yet',
      earned: plants.length > 0,
    },
    {
      id: 'first_scan',
      title: 'First AI scan',
      time: scansUsed > 0 ? 'Earned' : 'Not yet',
      earned: scansUsed > 0,
    },
    {
      id: 'green_thumb',
      title: 'Green thumb',
      time: thriving >= 3 ? 'Earned' : 'Need 3 healthy plants',
      earned: thriving >= 3,
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Top row ──────────────────────────────────────────────────── */}
        <View style={styles.topRow}>
          <Text style={styles.screenLabel}>PROFILE</Text>
          <Pressable style={styles.settingsBtn}>
            <SettingsIcon />
          </Pressable>
        </View>

        {/* ── Avatar + identity ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).duration(450)} style={styles.identity}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.userName}>{user?.name ?? 'Gardener'}</Text>
          <Text style={styles.userSince}>Plant parent since {year}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, styles.badgeTextGreen]}>GREEN THUMB</Text>
            </View>
            {isPremium ? (
              <View style={[styles.badge, styles.badgeAmber]}>
                <Text style={[styles.badgeText, styles.badgeTextAmber]}>PREMIUM</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeAmber]}>
                <Text style={[styles.badgeText, styles.badgeTextAmber]}>EARLY ADOPTER</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.statsRow}>
          <StatBlock value={plants.length} label="PLANTS" />
          <View style={styles.statDiv} />
          <StatBlock value={thriving} label="THRIVING" />
          <View style={styles.statDiv} />
          <StatBlock value={scansUsed} label="AI SCANS" />
        </Animated.View>

        {/* ── Achievements ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
          <View style={styles.listCard}>
            {achievements.map((a, i) => (
              <AchievementRow
                key={a.id}
                title={a.title}
                time={a.time}
                earned={a.earned}
                isLast={i === achievements.length - 1}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Subscription banner ──────────────────────────────────────── */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.premiumBanner}>
            <View style={styles.premiumLeft}>
              <Text style={styles.premiumLabel}>LAWNUP PREMIUM</Text>
              <Text style={styles.premiumTitle}>Unlimited scans,{'\n'}zero limits.</Text>
            </View>
            <Pressable style={styles.premiumBtn}>
              <Text style={styles.premiumBtnText}>Upgrade</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Quick links ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).duration(450)}>
          <Text style={styles.sectionLabel}>QUICK LINKS</Text>
          <View style={styles.listCard}>
            <QuickLinkRow icon={<HistoryIcon />} label="AI scan history" isLast={false} />
            <QuickLinkRow icon={<BellIcon />}    label="Notifications"  isLast={false} />
            <QuickLinkRow icon={<ShopIcon />}    label="Marketplace"    isLast={true} />
          </View>
        </Animated.View>

        {/* ── Sign out ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(330).duration(450)}>
          <Pressable style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.statBlock}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AchievementRow: React.FC<{
  title: string;
  time: string;
  earned: boolean;
  isLast: boolean;
}> = ({ title, time, earned, isLast }) => (
  <View style={[styles.listRow, !isLast && styles.listRowBorder]}>
    <View style={[styles.listIconWrap, earned && styles.listIconWrapEarned]}>
      <BadgeIcon />
    </View>
    <View style={styles.listText}>
      <Text style={styles.listTitle}>{title}</Text>
      <Text style={styles.listSub}>{time}</Text>
    </View>
    <Text style={styles.listChevron}>›</Text>
  </View>
);

const QuickLinkRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  isLast: boolean;
}> = ({ icon, label, isLast }) => (
  <View style={[styles.listRow, !isLast && styles.listRowBorder]}>
    <View style={styles.listIconWrap}>
      {icon}
    </View>
    <Text style={[styles.listTitle, { flex: 1 }]}>{label}</Text>
    <Text style={styles.listChevron}>›</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  content: {
    paddingHorizontal: 20,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 24,
  },
  screenLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Identity
  identity: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6F943E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(111,148,62,0.2)',
  },
  avatarText: {
    fontSize: 30,
    fontFamily: 'Nunito-ExtraBold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 30,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#111111',
    marginBottom: 4,
    textAlign: 'center',
  },
  userSince: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  badgeGreen: {
    borderColor: '#6F943E',
    backgroundColor: 'rgba(111,148,62,0.06)',
  },
  badgeAmber: {
    borderColor: '#E39B64',
    backgroundColor: 'rgba(227,155,100,0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.8,
  },
  badgeTextGreen: { color: '#6F943E' },
  badgeTextAmber: { color: '#C07840' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 32,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Cormorant-Bold',
    color: '#111111',
    lineHeight: 32,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statDiv: {
    width: 1,
    height: 36,
    backgroundColor: '#DDD4C7',
    alignSelf: 'center',
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // List card (shared by achievements + quick links)
  listCard: {
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 14,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDD4C7',
  },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIconWrapEarned: {
    backgroundColor: 'rgba(111,148,62,0.08)',
  },
  listText: { flex: 1 },
  listTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
    marginBottom: 2,
  },
  listSub: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  listChevron: {
    fontSize: 20,
    color: '#C4C0BA',
    lineHeight: 24,
  },

  // Premium banner
  premiumBanner: {
    backgroundColor: '#1A2416',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  premiumLeft: { flex: 1 },
  premiumLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  premiumTitle: {
    fontSize: 20,
    fontFamily: 'Cormorant-SemiBold',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  premiumBtn: {
    backgroundColor: '#6F943E',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 16,
  },
  premiumBtnText: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },

  // Sign out
  signOutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E8B4B4',
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#C0392B',
    letterSpacing: 0.2,
  },
});
