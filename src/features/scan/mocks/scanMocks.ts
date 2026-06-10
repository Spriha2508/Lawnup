import type { DiseaseResult } from '../../../types/firestore.types';
import type { AlternativeSuggestion } from '../../../services/api/plantIdentification';

export interface ScanResult {
  scanId: string;
  imageUri: string;
  commonName: string;
  scientificName: string;
  indianAlternate?: string; // Indian / vernacular alt name, e.g. "Champa" for Temple Tree
  confidence: number;
  isHealthy: boolean;
  diseases: DiseaseResult[];
  suggestedActions: string[];
  alternatives?: AlternativeSuggestion[];
  scanDate?: string;
  city?: string;
}

export const PROCESSING_STAGES = [
  { message: 'Studying your plant…',           icon: '✦', durationMs: 800 },
  { message: 'Finding the right match…',       icon: '◆', durationMs: 900 },
  { message: 'Checking how it\'s doing…',      icon: '◇', durationMs: 700 },
  { message: 'Building a care plan…',          icon: '✦', durationMs: 600 },
  { message: 'Your results are almost ready…', icon: '✧', durationMs: 400 },
];
