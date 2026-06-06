import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DiseaseResult } from '../../../types/firestore.types';
import { colors } from '../../../constants/colors';

interface DiseaseCardProps {
  disease: DiseaseResult;
  index?: number;
}

const getSeverityLabel = (probability: number): { label: string; color: string; bg: string } => {
  if (probability >= 0.75) return { label: 'High risk', color: colors.error, bg: '#FEE2E2' };
  if (probability >= 0.45) return { label: 'Moderate', color: colors.warning, bg: '#FEF3C7' };
  return { label: 'Low risk', color: colors.accent, bg: '#FEF9EE' };
};

export const DiseaseCard: React.FC<DiseaseCardProps> = ({ disease, index = 0 }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const severity = getSeverityLabel(disease.probability);

  return (
    <View style={[styles.card, { borderLeftColor: severity.color }]}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.75}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{disease.name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
            <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
            <Text style={[styles.severityLabel, { color: severity.color }]}>
              {severity.label} · {Math.round(disease.probability * 100)}%
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, { color: severity.color }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.description}>{disease.description}</Text>

          {/* Treatment rows */}
          {disease.treatment.biological && (
            <TreatmentRow icon="🌿" label="Natural" text={disease.treatment.biological} />
          )}
          {disease.treatment.chemical && (
            <TreatmentRow icon="🧪" label="Chemical" text={disease.treatment.chemical} />
          )}
          <TreatmentRow icon="🛡" label="Prevention" text={disease.treatment.prevention} />
        </View>
      )}
    </View>
  );
};

const TreatmentRow: React.FC<{ icon: string; label: string; text: string }> = ({
  icon, label, text,
}) => (
  <View style={styles.treatRow}>
    <Text style={styles.treatIcon}>{icon}</Text>
    <View style={styles.treatContent}>
      <Text style={styles.treatLabel}>{label}</Text>
      <Text style={styles.treatText}>{text}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
  },
  chevron: {
    fontSize: 12,
    marginLeft: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  description: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  treatRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAF5',
    borderRadius: 12,
    padding: 12,
  },
  treatIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  treatContent: {
    flex: 1,
    gap: 2,
  },
  treatLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  treatText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
});
