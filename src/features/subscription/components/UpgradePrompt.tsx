import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

interface UpgradePromptProps {
  visible: boolean;
  context?: 'scan_limit' | 'ai_doctor' | 'reminders' | 'after_save' | 'general';
  title?: string;
  message?: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}

// Copy reflects ACTUAL premium value: more scans per month + unlimited Dr.
// Banyan chat. Disease detection, reminders, weather tips and unlimited plants
// are FREE — never sell them as premium-only here.
const COPY: Record<string, { title: string; message: string }> = {
  scan_limit: {
    title: "You've used all 3 free scans this week",
    message:
      'Free includes 3 scans a week. Premium gives you 80–100 scans every month — scan every plant in your garden.',
  },
  ai_doctor: {
    title: "You've hit today's free AI messages",
    message:
      'Free includes 20 Dr. Banyan messages a day. Premium makes them unlimited, so you can keep the conversation going.',
  },
  reminders: {
    title: 'Get more from LawnUp',
    message:
      'Premium gives you many more scans each month and unlimited Dr. Banyan chat for your whole garden.',
  },
  after_save: {
    title: 'Keep scanning your garden',
    message:
      "You're building a beautiful garden. Premium gives you 80–100 scans a month and unlimited Dr. Banyan chat.",
  },
  general: {
    title: 'Upgrade to LawnUp Premium',
    message:
      'More AI scans every month and unlimited Dr. Banyan chat — the full LawnUp experience.',
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  context = 'general',
  title,
  message,
  onUpgrade,
  onDismiss,
}) => {
  const copy = COPY[context];
  const displayTitle = title ?? copy.title;
  const displayMessage = message ?? copy.message;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <Text style={styles.icon}>✦</Text>
          </View>

          <Text style={styles.eyebrow}>LAWNUP PREMIUM</Text>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.message}>{displayMessage}</Text>

          <Pressable style={styles.upgradeBtn} onPress={onUpgrade}>
            <Text style={styles.upgradeBtnText}>See Premium plans  →</Text>
          </Pressable>

          <Pressable style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F5F1E8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD4C7',
    marginBottom: 28,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(111,148,62,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(111,148,62,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  icon: {
    fontSize: 26,
    color: '#6F943E',
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Jakarta-SemiBoldItalic',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 29,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6B6B5E',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 6,
  },
  upgradeBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dismissBtn: {
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
});
