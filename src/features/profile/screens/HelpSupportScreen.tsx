import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
type Nav = StackNavigationProp<ProfileStackParamList, 'HelpSupport'>;

const SUPPORT_EMAIL = 'hello@lawnup.app';

const FAQS = [
  { q: 'How do I scan a plant?', a: 'Tap the Scan tab (or the + button), point your camera at a single leaf or the whole plant in good natural light, and capture. You\'ll get the species, a health check, and a care plan in seconds.' },
  { q: 'How accurate is identification?', a: 'Most scans are highly accurate, but lighting and angle matter. For the best result, fill the frame with one leaf on a plain background in daylight. If confidence is low, we\'ll suggest a better photo and show alternative matches.' },
  { q: 'How do watering reminders work?', a: 'Open a plant (or Profile → Reminders) and turn on its reminder. We schedule a local notification based on its watering frequency — fully on-device, no account needed. Enable notifications when prompted.' },
  { q: 'What does Premium include?', a: 'More scans per month and unlimited Doc. Sage chat. Disease detection, watering reminders and weather insights are included free. You can manage Premium from Profile → Premium.' },
  { q: 'Is my data private?', a: 'Your plants and profile sync to your private account. Scans are processed to identify your plant and are not shared with other users.' },
];

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [open, setOpen] = useState<number | null>(0);

  const mail = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=LawnUp%20Support`).catch(() => {});

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & support</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.lead}>How can we help?</Text>

          {/* FAQ */}
          <Text style={styles.sectionLabel}>FREQUENTLY ASKED</Text>
          <View style={styles.faqCard}>
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <View key={i} style={[i < FAQS.length - 1 && styles.faqBorder]}>
                  <TouchableOpacity style={styles.faqRow} onPress={() => setOpen(isOpen ? null : i)} activeOpacity={0.7}>
                    <Text style={styles.faqQ}>{f.q}</Text>
                    <Text style={[styles.faqChevron, isOpen && styles.faqChevronOpen]}>⌄</Text>
                  </TouchableOpacity>
                  {isOpen && (
                    <Animated.Text entering={FadeInDown.duration(M.duration.standard)} style={styles.faqA}>{f.a}</Animated.Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Contact */}
          <Text style={[styles.sectionLabel, { marginTop: S['2xl'] }]}>STILL STUCK?</Text>
          <PressableScale style={styles.contactCard} onPress={mail} to={0.98}>
            <View style={styles.contactIcon}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M4 6h16v12H4z" stroke={C.primary} strokeWidth={1.7} strokeLinejoin="round" />
                <Path d="M4 7l8 6 8-6" stroke={C.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Email us</Text>
              <Text style={styles.contactSub}>{SUPPORT_EMAIL}</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </PressableScale>

          <Text style={styles.version}>LawnUp · v1.0.0</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
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
  content: { paddingHorizontal: 20, paddingTop: S.sm },
  lead: { fontFamily: F.serifMedium, fontSize: 30, color: C.textPrimary, marginBottom: S.xl, letterSpacing: -0.4 },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },
  faqCard: { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.lg, ...theme.shadows.sm },
  faqBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, gap: 12 },
  faqQ: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, flex: 1 },
  faqChevron: { fontSize: 18, color: C.textMuted, transform: [{ rotate: '0deg' }] },
  faqChevronOpen: { transform: [{ rotate: '180deg' }], color: C.primary },
  faqA: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21, paddingBottom: 16, paddingRight: 8 },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: C.card, borderRadius: R.xl, padding: S.lg,
    borderWidth: 1, borderColor: C.border, ...theme.shadows.sm,
  },
  contactIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 1 },
  contactSub: { ...T.caption, color: C.textMuted },
  contactArrow: { fontSize: 18, color: C.textMuted },

  version: { ...T.caption, color: C.textFaint, textAlign: 'center', marginTop: S['2xl'] },
});
