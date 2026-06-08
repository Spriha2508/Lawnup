import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DiseaseResult } from '../../../types/firestore.types';

const severityMeta = (p: number): { label: string; color: string; bg: string } => {
  if (p >= 0.75) return { label: 'High risk',  color: '#C0392B', bg: 'rgba(192,57,43,0.08)'  };
  if (p >= 0.45) return { label: 'Moderate',   color: '#B07000', bg: 'rgba(176,112,0,0.08)'  };
  return             { label: 'Low risk',   color: '#6F943E', bg: 'rgba(111,148,62,0.08)' };
};

export const DiseaseCard: React.FC<{ disease: DiseaseResult; index?: number }> = ({
  disease, index = 0,
}) => {
  const [expanded, setExpanded] = useState(index === 0);
  const sv = severityMeta(disease.probability);

  return (
    <View style={[styles.card, { borderLeftColor: sv.color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.75}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{disease.name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: sv.bg }]}>
            <View style={[styles.dot, { backgroundColor: sv.color }]} />
            <Text style={[styles.severityText, { color: sv.color }]}>
              {sv.label}  ·  {Math.round(disease.probability * 100)}%
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, { color: sv.color }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.description}>{disease.description}</Text>
          {disease.treatment.biological && (
            <TreatRow dotColor="#6F943E" label="Natural remedy" text={disease.treatment.biological} />
          )}
          {disease.treatment.chemical && (
            <TreatRow dotColor="#9E9A94" label="Chemical treatment" text={disease.treatment.chemical} />
          )}
          <TreatRow dotColor="#B07000" label="Prevention" text={disease.treatment.prevention} />
        </View>
      )}
    </View>
  );
};

const TreatRow: React.FC<{ dotColor: string; label: string; text: string }> = ({ dotColor, label, text }) => (
  <View style={styles.treatRow}>
    <View style={[styles.treatDot, { backgroundColor: dotColor }]} />
    <View style={styles.treatContent}>
      <Text style={[styles.treatLabel, { color: dotColor }]}>{label}</Text>
      <Text style={styles.treatText}>{text}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEE7DA',
    borderRadius: 16,
    borderLeftWidth: 3.5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    gap: 7,
  },
  name: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: '#111111',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  severityText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 11,
  },
  chevron: {
    fontSize: 11,
    marginLeft: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  description: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#6B6B5E',
    lineHeight: 21,
  },
  treatRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F5F1E8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  treatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  treatContent: {
    flex: 1,
    gap: 3,
  },
  treatLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  treatText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: '#111111',
    lineHeight: 19,
  },
});
