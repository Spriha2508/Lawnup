import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { doc, updateDoc } from 'firebase/firestore';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { db } from '../../../services/firebase/firebaseConfig';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;
type Nav = StackNavigationProp<ProfileStackParamList, 'EditProfile'>;

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'G';
};

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const dirty = trimmed.length > 0 && trimmed !== user?.name;

  const handleSave = useCallback(async () => {
    if (!user || !dirty || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}`), { name: trimmed });
      setUser({ ...user, name: trimmed });
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [user, trimmed, dirty, saving, setUser, navigation]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.body}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name || 'G')}</Text></View>
          </View>

          {/* Name (editable) */}
          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={C.textMuted}
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {/* Read-only info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Email</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{user?.email ?? '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>City</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{user?.city || 'Not set'}</Text>
            </View>
          </View>
          <Text style={styles.hint}>Email and city are set during sign-up and onboarding.</Text>
        </View>

        {/* CTA */}
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale
            style={[styles.cta, (!dirty || saving) && styles.ctaDisabled]}
            onPress={handleSave}
            disabled={!dirty || saving}
            to={0.97}
          >
            <Text style={styles.ctaText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: S.lg },

  avatarWrap: { alignItems: 'center', marginBottom: S['2xl'] },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.primarySoft },
  avatarText: { fontFamily: F.sansHeavy, fontSize: 28, color: C.onPrimary },

  label: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.sm },
  input: {
    backgroundColor: C.input, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: F.sansMedium, fontSize: 16, color: C.textPrimary, marginBottom: S['2xl'],
  },

  infoCard: { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, ...theme.shadows.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, gap: 12 },
  infoKey: { ...T.bodyMd, color: C.textSecondary },
  infoVal: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, flexShrink: 1, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  hint: { ...T.caption, color: C.textMuted, marginTop: S.md, paddingHorizontal: 4 },

  ctaBar: {
    paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.canvas,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
  },
  cta: { backgroundColor: C.primary, borderRadius: R.pill, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { ...T.button, fontFamily: F.sansBold, color: C.onPrimary, letterSpacing: 0.2 },
});
