import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthCardProps {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

const BotanicalShapes: React.FC = () => (
  <>
    {/* Large blob, top-left */}
    <View style={styles.blobTopLeft} />
    {/* Leaf teardrop, top-right */}
    <View style={styles.leafTopRight} />
    {/* Medium circle, bottom-right */}
    <View style={styles.blobBottomRight} />
    {/* Small leaf, bottom-left */}
    <View style={styles.leafBottomLeft} />
    {/* Accent dot, mid-right */}
    <View style={styles.dotMidRight} />
    {/* Tiny circle, top-center */}
    <View style={styles.dotTopCenter} />
  </>
);

export const AuthCard: React.FC<AuthCardProps> = ({ children, contentStyle }) => (
  <SafeAreaView style={styles.root}>
    <BotanicalShapes />
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, Platform.OS === 'web' && styles.scrollContentWeb]}
      >
        <View style={[styles.card, Platform.OS === 'web' && (styles.cardWeb as ViewStyle), contentStyle]}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  scrollContentWeb: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  card: {
    width: '100%',
    backgroundColor: '#EEE7DA',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 36,
    borderWidth: 1,
    borderColor: '#DDD4C7',
  },
  cardWeb: {
    maxWidth: 420,
    ...({ boxShadow: '0 8px 40px rgba(0,0,0,0.06)' } as object),
  },

  // ── Botanical shapes ────────────────────────────────────────────────────────
  blobTopLeft: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(111,148,62,0.07)',
    top: -90,
    left: -90,
  },
  leafTopRight: {
    position: 'absolute',
    width: 88,
    height: 136,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 80,
    backgroundColor: 'rgba(111,148,62,0.07)',
    top: 24,
    right: -28,
    transform: [{ rotate: '18deg' }],
  },
  blobBottomRight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(140,180,100,0.08)',
    bottom: -70,
    right: -55,
  },
  leafBottomLeft: {
    position: 'absolute',
    width: 58,
    height: 92,
    borderTopLeftRadius: 56,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 56,
    backgroundColor: 'rgba(111,148,62,0.06)',
    bottom: 90,
    left: -18,
    transform: [{ rotate: '-22deg' }],
  },
  dotMidRight: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(140,180,100,0.09)',
    top: 200,
    right: 28,
  },
  dotTopCenter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(111,148,62,0.05)',
    top: 120,
    left: 60,
  },
});
