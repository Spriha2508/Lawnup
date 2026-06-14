import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../../../services/reminders/notificationScheduler';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;
type Nav = StackNavigationProp<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signOut, deleteAccount } = useAuthStore();

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Re-check OS permission whenever the screen regains focus (it may have been
  // changed in system settings while we were away).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      hasNotificationPermission().then((g) => { if (alive) setNotifGranted(g); });
      return () => { alive = false; };
    }, []),
  );

  const onToggleNotifications = useCallback(async () => {
    if (notifGranted) {
      // The OS doesn't let an app revoke its own permission — send the user to
      // system settings to turn it off.
      Alert.alert(
        'Turn off notifications',
        'To stop reminders, disable notifications for LawnUp in your device Settings.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (!granted) {
      Alert.alert(
        'Notifications blocked',
        'Enable notifications for LawnUp in your device Settings to receive watering reminders.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
    }
  }, [notifGranted]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and profile. Your saved plants and history cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (deleting) return;
            setDeleting(true);
            try {
              await deleteAccount();
              // On success the auth listener unmounts this stack — nothing else to do.
            } catch (e: any) {
              setDeleting(false);
              if (e?.message === 'RECENT_LOGIN_REQUIRED') {
                Alert.alert(
                  'Please sign in again',
                  'For your security, sign out and sign back in, then delete your account.',
                );
              } else {
                Alert.alert('Could not delete account', 'Please check your connection and try again.');
              }
            }
          },
        },
      ],
    );
  }, [deleteAccount, deleting]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Notifications */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Watering reminders</Text>
                <Text style={styles.rowSub}>
                  {notifGranted === null ? 'Checking…' : notifGranted ? 'On — you’ll get care reminders' : 'Off — enable to get reminders'}
                </Text>
              </View>
              <Switch
                value={!!notifGranted}
                onValueChange={onToggleNotifications}
                trackColor={{ false: C.border, true: C.primarySoft }}
                thumbColor={notifGranted ? C.primary : C.card}
                disabled={notifGranted === null}
              />
            </View>
          </View>

          {/* Appearance */}
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Dark mode</Text>
                <Text style={styles.rowSub}>Coming in a future update</Text>
              </View>
              <View style={styles.soonPill}><Text style={styles.soonText}>SOON</Text></View>
            </View>
          </View>

          {/* Account */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <PressableScale style={styles.row} onPress={signOut} to={0.99}>
              <Text style={[styles.rowTitle, { flex: 1 }]}>Sign out</Text>
              <Chevron />
            </PressableScale>
            <View style={styles.divider} />
            <PressableScale style={styles.row} onPress={confirmDelete} to={0.99} disabled={deleting}>
              <Text style={[styles.rowTitle, { flex: 1, color: C.criticalFg }]}>
                {deleting ? 'Deleting…' : 'Delete account'}
              </Text>
            </PressableScale>
          </View>
          <Text style={styles.hint}>Deleting your account is permanent and removes your profile and saved data.</Text>

          <Text style={styles.version}>LawnUp · v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Chevron: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={C.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  body: { paddingHorizontal: 20, paddingTop: S.md, paddingBottom: S['3xl'] },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginTop: S.xl, marginBottom: S.sm },
  card: { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, ...theme.shadows.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowTitle: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary },
  rowSub: { ...T.caption, color: C.textMuted, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },

  soonPill: { backgroundColor: C.primaryWash, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  soonText: { ...T.caption, fontFamily: F.sansBold, color: C.primary, letterSpacing: 1, fontSize: 10 },

  hint: { ...T.caption, color: C.textMuted, marginTop: S.md, paddingHorizontal: 4 },
  version: { ...T.caption, color: C.textFaint, textAlign: 'center', marginTop: S['2xl'] },
});
