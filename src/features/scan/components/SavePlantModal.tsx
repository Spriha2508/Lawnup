import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../constants/colors';
import { NicknameInputCard } from './NicknameInputCard';
import type { ScanResult } from '../store/scanStore';

const { height: SH } = Dimensions.get('window');

interface SavePlantModalProps {
  visible: boolean;
  scanResult: ScanResult;
  onSave: (nickname: string) => void;
  onDismiss: () => void;
  isSaving?: boolean;
}

export const SavePlantModal: React.FC<SavePlantModalProps> = ({
  visible,
  scanResult,
  onSave,
  onDismiss,
  isSaving = false,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SH,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 230,
          useNativeDriver: true,
        }),
      ]).start(() => setIsRendered(false));
    }
  }, [visible, slideAnim, backdropAnim]);

  if (!isRendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        onTouchEnd={onDismiss}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Plant preview row */}
        <View style={styles.previewRow}>
          {scanResult.imageUri ? (
            <Image
              source={{ uri: scanResult.imageUri }}
              style={styles.thumb}
            />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={{ fontSize: 28 }}>🌿</Text>
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.previewName} numberOfLines={1}>
              {scanResult.commonName}
            </Text>
            <Text style={styles.previewSci} numberOfLines={1}>
              {scanResult.scientificName}
            </Text>
            <View style={[
              styles.healthPill,
              { backgroundColor: scanResult.isHealthy ? '#DCFCE7' : '#FEE2E2' },
            ]}>
              <Text style={[
                styles.healthText,
                { color: scanResult.isHealthy ? colors.success : colors.error },
              ]}>
                {scanResult.isHealthy ? '✓ Healthy' : '⚠ Needs care'}
              </Text>
            </View>
          </View>
          {/* Dismiss */}
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Nickname input */}
        <NicknameInputCard
          speciesName={scanResult.commonName}
          onConfirm={onSave}
          onSkip={() => onSave(scanResult.commonName)}
          isLoading={isSaving}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  thumbPlaceholder: {
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
    gap: 4,
  },
  previewName: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 17,
    color: colors.textPrimary,
  },
  previewSci: {
    fontFamily: 'Nunito-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  healthPill: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  healthText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
});
