import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeatherData } from '../../../services/weather/weatherService';
import { getWeatherPlantAdvice } from '../../../services/weather/weatherAdvice';

interface WeatherAdviceCardProps {
  weather: WeatherData;
}

const RISK_PALETTE = {
  low:      { bg: 'rgba(111,148,62,0.07)',  border: 'rgba(111,148,62,0.18)',  accent: '#4A7A28' },
  moderate: { bg: 'rgba(176,112,0,0.07)',   border: 'rgba(176,112,0,0.18)',   accent: '#8B5E00' },
  high:     { bg: 'rgba(192,57,43,0.07)',   border: 'rgba(192,57,43,0.18)',   accent: '#8B2010' },
};

export const WeatherAdviceCard: React.FC<WeatherAdviceCardProps> = ({ weather }) => {
  const advice = getWeatherPlantAdvice(weather);
  const pal = RISK_PALETTE[advice.riskLevel];

  return (
    <View style={[styles.card, { backgroundColor: pal.bg, borderColor: pal.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{advice.icon}</Text>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>WEATHER TODAY · {weather.city.toUpperCase()}</Text>
          <Text style={[styles.headline, { color: pal.accent }]} numberOfLines={2}>
            {advice.headline}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: pal.accent }]}>{weather.tempC}°C</Text>
          <Text style={styles.statLabel}>Temp</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: pal.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: pal.accent }]}>{weather.humidity}%</Text>
          <Text style={styles.statLabel}>Humidity</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: pal.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: pal.accent }]}>
            {weather.isRaining ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statLabel}>Rain</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tips}>
        {advice.tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={[styles.tipBullet, { color: pal.accent }]}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIcon: {
    fontSize: 26,
    lineHeight: 30,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 12,
    padding: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 18,
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 10,
    color: '#9E9A94',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 4,
  },
  tips: {
    gap: 7,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Nunito-Bold',
  },
  tipText: {
    flex: 1,
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: '#4A4A3E',
    lineHeight: 19,
  },
});
