import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { ConfidenceBadge } from './ConfidenceBadge';

const { width: SW } = Dimensions.get('window');
const HERO_HEIGHT = 360;

interface PlantResultHeroProps {
  imageUri?: string | null;
  commonName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
}

export const PlantResultHero: React.FC<PlantResultHeroProps> = ({
  imageUri,
  commonName,
  scientificName,
  confidence,
  isHealthy,
}) => (
  <View style={styles.hero}>
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    ) : (
      <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
        <Text style={styles.placeholderIcon}>🌿</Text>
      </View>
    )}

    {/* Gradient scrim — heavier at bottom */}
    <View style={styles.scrimTop} />
    <View style={styles.scrimBottom} />

    {/* Content overlay */}
    <View style={styles.overlay}>
      <View style={[styles.healthPill, isHealthy ? styles.healthPillGreen : styles.healthPillRed]}>
        <View style={[styles.healthDot, isHealthy ? styles.dotGreen : styles.dotRed]} />
        <Text style={styles.healthText}>
          {isHealthy ? 'Healthy' : 'Needs attention'}
        </Text>
      </View>

      <Text style={styles.commonName} numberOfLines={2}>
        {commonName}
      </Text>
      <Text style={styles.scientificName} numberOfLines={1}>
        {scientificName}
      </Text>

      <ConfidenceBadge confidence={confidence} size="sm" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  hero: {
    width: SW,
    height: HERO_HEIGHT,
    backgroundColor: '#0D1610',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2416',
  },
  placeholderIcon: {
    fontSize: 80,
  },
  scrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.65,
    // Bottom-heavy scrim via solid overlay
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 22,
    paddingBottom: 26,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  healthPillGreen: {
    backgroundColor: 'rgba(111,148,62,0.75)',
  },
  healthPillRed: {
    backgroundColor: 'rgba(192,57,43,0.75)',
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: { backgroundColor: '#FFFFFF' },
  dotRed:   { backgroundColor: '#FFB3B3' },
  healthText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.2,
  },
  commonName: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    fontSize: 36,
    color: '#fff',
    lineHeight: 40,
    marginBottom: 4,
  },
  scientificName: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
    marginBottom: 14,
  },
});
