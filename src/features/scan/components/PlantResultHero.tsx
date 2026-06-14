import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const C = theme.color;
const { width: SW, height: SH } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SH * 0.56);

interface PlantResultHeroProps {
  imageUri?: string | null;
  commonName: string;
  scientificName: string;
  indianAlternate?: string;
  confidence: number;
  isHealthy: boolean;
}

function confColor(v: number): string {
  if (v >= 0.70) return C.primary;   // brass — confident
  if (v >= 0.50) return C.waterFg;   // amber — qualify
  return C.textMuted;                // muted — uncertain
}

export const PlantResultHero: React.FC<PlantResultHeroProps> = ({
  imageUri,
  commonName,
  scientificName,
  indianAlternate,
  confidence,
  isHealthy,
}) => {
  const lowConfidence = confidence < 0.50;
  const col = confColor(confidence);

  // Option A: lead with the Indian common name when we have one, else English.
  const hasIndian = !!indianAlternate && indianAlternate !== commonName;
  const primaryName = hasIndian ? indianAlternate! : commonName;
  const showEnglishRow = hasIndian; // only when the Indian name is the primary

  return (
    <View style={[styles.hero, { height: HERO_HEIGHT }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill="rgba(255,255,255,0.22)" />
            <Path d="M12 3V21" stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} strokeLinecap="round" />
          </Svg>
        </View>
      )}

      {/* Multi-layer gradient approximation — top stays clear, bottom goes dark */}
      <View style={styles.scrim1} />
      <View style={[styles.scrimLayer, { height: HERO_HEIGHT * 0.80, backgroundColor: 'rgba(0,0,0,0.22)' }]} />
      <View style={[styles.scrimLayer, { height: HERO_HEIGHT * 0.58, backgroundColor: 'rgba(0,0,0,0.42)' }]} />
      <View style={[styles.scrimLayer, { height: HERO_HEIGHT * 0.36, backgroundColor: 'rgba(0,0,0,0.55)' }]} />

      {/* Health status pill — top of image, tag style */}
      {!lowConfidence && (
        <View style={[
          styles.healthPill,
          isHealthy ? styles.healthPillGreen : styles.healthPillAmber,
        ]}>
          <View style={[styles.healthDot, isHealthy ? styles.dotGreen : styles.dotAmber]} />
          <Text style={styles.healthText}>
            {isHealthy ? 'Healthy' : 'Needs attention'}
          </Text>
        </View>
      )}

      {/* Bottom content overlay */}
      <View style={styles.overlay}>
        {/* Uncertainty notice for low-confidence — replaces name */}
        {lowConfidence && (
          <Text style={styles.uncertainNotice}>
            Low confidence — try a well-lit, close-up photo for better results
          </Text>
        )}

        {/* For medium confidence (0.50–0.69), show a brief qualifier */}
        {!lowConfidence && confidence < 0.70 && (
          <Text style={styles.confidencePrefix}>This may be</Text>
        )}

        {/* Primary plant name — Indian common name when known, else English */}
        {!lowConfidence && (
          <Text style={styles.commonName} numberOfLines={2}>{primaryName}</Text>
        )}

        {/* English common name — shown as a labelled secondary when the Indian name leads */}
        {showEnglishRow && !lowConfidence && (
          <Text style={styles.nameRow} numberOfLines={1}>
            <Text style={styles.nameLabel}>ENGLISH  </Text>{commonName}
          </Text>
        )}

        {/* Scientific name (labelled) + confidence % in one line */}
        <View style={styles.metaRow}>
          <Text style={styles.scientificName} numberOfLines={1}>
            <Text style={styles.nameLabel}>SCIENTIFIC  </Text>{scientificName}
          </Text>
          <View style={[
            styles.confPill,
            { backgroundColor: col + '28', borderColor: col + '55' },
          ]}>
            <Text style={[styles.confPct, { color: col === C.textMuted ? 'rgba(255,255,255,0.45)' : col }]}>
              {Math.round(confidence * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    width: SW,
    backgroundColor: C.canvas,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  placeholderMark: {
    fontSize: 48,
    color: 'rgba(255,255,255,0.25)',
  },

  // Gradient scrim layers (stacked, each covering a different height from bottom)
  scrim1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  scrimLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // Health pill — top-left corner of image
  healthPill: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  healthPillGreen: { backgroundColor: 'rgba(28,74,58,0.85)' },
  healthPillAmber: { backgroundColor: 'rgba(100,60,0,0.78)' },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  dotGreen:  { backgroundColor: C.healthyFg },
  dotAmber:  { backgroundColor: C.waterFg },
  healthText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Bottom text overlay
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 28,
    paddingTop: 8,
    gap: 4,
  },
  uncertainNotice: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
  confidencePrefix: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.50)',
    fontStyle: 'italic',
    marginBottom: 0,
  },
  commonName: {
    fontFamily: 'Jakarta-SemiBoldItalic',
    fontSize: 46,
    color: '#FFFFFF',
    lineHeight: 50,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  nameRow: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 2,
  },
  nameLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'normal',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scientificName: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontStyle: 'italic',
    flex: 1,
    paddingRight: 10,
  },
  confPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confPct: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
