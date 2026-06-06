import type { DiseaseResult } from '../../../types/firestore.types';

export interface ScanResult {
  scanId: string;
  imageUri: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
  diseases: DiseaseResult[];
  suggestedActions: string[];
}

const MOCK_RESULTS: Omit<ScanResult, 'imageUri'>[] = [
  {
    scanId: 'mock_001',
    commonName: 'Money Plant',
    scientificName: 'Epipremnum aureum',
    confidence: 0.94,
    isHealthy: true,
    diseases: [],
    suggestedActions: [
      'Water when the top inch of soil is dry (every 7–10 days)',
      'Keep in bright indirect sunlight — avoid harsh afternoon sun',
      'Wipe leaves monthly to remove dust and improve photosynthesis',
      'Add to My Plants to get personalised care reminders',
    ],
  },
  {
    scanId: 'mock_002',
    commonName: 'Rose',
    scientificName: 'Rosa × hybrida',
    confidence: 0.87,
    isHealthy: false,
    diseases: [
      {
        name: 'Black Spot',
        probability: 0.81,
        description:
          'A fungal disease (Diplocarpon rosae) causing circular black spots on leaves, leading to yellowing and premature leaf drop. Thrives in warm, humid monsoon conditions.',
        treatment: {
          biological: 'Spray neem oil solution (5ml per litre) weekly in the morning. Remove all affected leaves immediately.',
          chemical: 'Apply fungicide containing chlorothalonil or mancozeb every 7–14 days.',
          prevention:
            'Water at the base, never overhead. Ensure good airflow between plants. Remove fallen leaves promptly.',
        },
      },
    ],
    suggestedActions: [
      'Remove all visibly spotted leaves immediately',
      'Apply neem oil spray this evening (avoid midday heat)',
      'Improve drainage — waterlogged roots worsen fungal issues',
      'Ask AI Doctor for a full treatment plan tailored to your climate',
    ],
  },
  {
    scanId: 'mock_003',
    commonName: 'Aloe Vera',
    scientificName: 'Aloe barbadensis miller',
    confidence: 0.96,
    isHealthy: true,
    diseases: [],
    suggestedActions: [
      'Water deeply once every 2–3 weeks in summer, monthly in winter',
      'Use well-draining sandy or cactus soil mix',
      'Needs 6+ hours of bright sunlight daily — ideal for balconies',
      'Repot every 2 years or when roots emerge from drainage holes',
    ],
  },
  {
    scanId: 'mock_004',
    commonName: 'Tulsi',
    scientificName: 'Ocimum tenuiflorum',
    confidence: 0.91,
    isHealthy: false,
    diseases: [
      {
        name: 'Powdery Mildew',
        probability: 0.69,
        description:
          'White powdery fungal coating on leaves. Common in humid conditions with poor air circulation. Can inhibit photosynthesis if untreated.',
        treatment: {
          biological: 'Mix 1 tsp baking soda + 1 tsp neem oil in 1 litre water, spray weekly.',
          prevention:
            'Space plants well apart. Water at soil level only. Prune overcrowded stems.',
        },
      },
    ],
    suggestedActions: [
      'Prune affected stems back to healthy growth',
      'Apply baking soda + neem oil spray immediately',
      'Move to a spot with better air circulation',
      'Avoid watering on leaves — water directly at the roots',
    ],
  },
];

// Returns a random mock result for frontend-first testing
export const getMockScanResult = (): Omit<ScanResult, 'imageUri'> =>
  MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];

// Returns the healthy mock for predictable testing
export const getHealthyMockResult = (): Omit<ScanResult, 'imageUri'> => MOCK_RESULTS[0];

// Simulates the staged delay of an AI scan
export const simulateScanDelay = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 2600));

export const PROCESSING_STAGES = [
  { message: 'Analyzing leaf structure...', icon: '🔬', durationMs: 700 },
  { message: 'Identifying species...', icon: '🌿', durationMs: 700 },
  { message: 'Checking plant health...', icon: '🩺', durationMs: 500 },
  { message: 'Searching disease patterns...', icon: '🦠', durationMs: 400 },
  { message: 'Generating care advice...', icon: '💡', durationMs: 300 },
];
