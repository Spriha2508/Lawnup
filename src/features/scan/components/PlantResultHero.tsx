import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../../constants/colors';
import { ConfidenceBadge } from './ConfidenceBadge';

const { width: SW } = Dimensions.get('window');
const HERO_HEIGHT = 300;

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
}) => {
  return (
    <View style={styles.hero}>
      {/* Background image or gradient placeholder */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>🌿</Text>
        </View>
      )}

      {/* Dark gradient scrim */}
      <View style={styles.scrim} />

      {/* Content overlay */}
      <View style={styles.overlay}>
        {/* Health pill */}
        <View style={[
          styles.healthPill,
          { backgroundColor: isHealthy ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)' },
        ]}>
          <Text style={styles.healthText}>
            {isHealthy ? '✓  Healthy' : '⚠  Needs care'}
          </Text>
        </View>

        {/* Plant name */}
        <Text style={styles.commonName} numberOfLines={2}>
          {commonName}
        </Text>
        <Text style={styles.scientificName} numberOfLines={1}>
          {scientificName}
        </Text>

        {/* Confidence */}
        <View style={styles.confidenceRow}>
          <ConfidenceBadge confidence={confidence} size="sm" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    width: SW,
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: colors.primaryDark,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    // Gradient-like effect using a darker bottom
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  healthPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  healthText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.3,
  },
  commonName: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 33,
    marginBottom: 4,
  },
  scientificName: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
  },
});
