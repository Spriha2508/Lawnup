import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const { color: C, spacing: S, typography: T, fonts: F } = theme;

const DoctorMark: React.FC = () => (
  <View style={styles.badge}>
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5C21 16 17 19 12 19C10.8 19 9.7 18.8 8.7 18.5L4 20L5.3 16.2C4.5 15 4 13.3 4 11.5C4 7 8 4 12 4C17 4 21 7 21 11.5Z"
        stroke={C.primary} strokeWidth={1.6} strokeLinejoin="round"
      />
      <Path d="M12 8C12 8 9 9.2 9 11.5C9 13 10.2 14 12 14C13 14 14 13 14 11.5C14 9.2 12 8 12 8Z" fill={C.primary} opacity={0.5} />
      <Circle cx="12" cy="11.5" r="0.9" fill={C.primary} />
    </Svg>
  </View>
);

export const ChatScreen: React.FC = () => (
  <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <Animated.View entering={FadeInDown.duration(theme.motion.duration.expressive)} style={styles.center}>
      <DoctorMark />
      <Text style={styles.eyebrow}>AI PLANT DOCTOR</Text>
      <Text style={styles.title}>Ask anything about{'\n'}your plants</Text>
      <Text style={styles.body}>
        Coming soon — describe a symptom or ask by name, and get warm, expert care advice for your green friends.
      </Text>
    </Animated.View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S['3xl'] },
  badge: {
    width: 80, height: 80, borderRadius: 28, backgroundColor: C.primaryWash,
    alignItems: 'center', justifyContent: 'center', marginBottom: S['2xl'],
  },
  eyebrow: { ...T.eyebrow, color: C.textMuted, marginBottom: S.md },
  title: { fontFamily: F.serifMedium, fontSize: 30, lineHeight: 36, color: C.textPrimary, textAlign: 'center', marginBottom: S.md },
  body: { ...T.bodyMd, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
});
