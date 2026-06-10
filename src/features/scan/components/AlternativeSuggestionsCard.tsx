import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AlternativeSuggestion } from '../../../services/api/plantIdentification';

interface AlternativeSuggestionsCardProps {
  topName: string;
  topConfidence: number;
  alternatives: AlternativeSuggestion[];
}

function barColor(confidence: number): string {
  if (confidence >= 0.60) return '#B07000';
  if (confidence >= 0.40) return '#9E9A94';
  return '#C4C0BA';
}

const AlternativeRow: React.FC<{ alt: AlternativeSuggestion; rank: number }> = ({ alt, rank }) => {
  const pct = Math.round(alt.confidence * 100);
  const color = barColor(alt.confidence);

  return (
    <View style={styles.row}>
      <Text style={styles.rowRank}>{rank}.</Text>
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowName}>{alt.commonName}</Text>
          <Text style={[styles.rowPct, { color }]}>{pct}%</Text>
        </View>
        <Text style={styles.rowScientific} numberOfLines={1}>{alt.scientificName}</Text>
        {/* Confidence bar */}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
};

export const AlternativeSuggestionsCard: React.FC<AlternativeSuggestionsCardProps> = ({
  topName,
  topConfidence,
  alternatives,
}) => {
  if (alternatives.length === 0 || topConfidence >= 0.90) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>POSSIBLE ALTERNATIVES</Text>
      <Text style={styles.subtitle}>
        The AI also considered {alternatives.length === 1 ? 'this match' : 'these matches'} for {topName}
      </Text>

      {alternatives.map((alt, i) => (
        <AlternativeRow key={alt.scientificName} alt={alt} rank={i + 2} />
      ))}

      <Text style={styles.footer}>
        Scan a clearer, closer photo for a more confident identification.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEE7DA',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DDD4C7',
    gap: 12,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#6B6B5E',
    lineHeight: 18,
    marginTop: -4,
  },

  // Alternative row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowRank: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    width: 18,
    marginTop: 2,
  },
  rowBody: { flex: 1, gap: 4 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
    flex: 1,
  },
  rowPct: {
    fontSize: 13,
    fontFamily: 'Nunito-ExtraBold',
    marginLeft: 8,
  },
  rowScientific: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    fontStyle: 'italic',
  },
  barTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    marginTop: 2,
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    maxWidth: '100%',
  },

  footer: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
