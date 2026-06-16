/**
 * LawnUp Knowledge Layer — type system.
 *
 * The knowledge layer is the structured, authoritative source of plant facts.
 * Doc. Sage RETRIEVES from here (70%) and only REASONS over it (30%). OpenAI
 * must never invent scientific names, soil recipes, propagation steps, or
 * disease definitions — those always come from these collections.
 *
 * Each entry type mirrors a Firestore collection (FIREBASE_SCHEMA.md):
 *   PlantKnowledgeEntry → plantKnowledgeBase
 *   DiseaseEntry        → diseaseLibrary
 *   SoilProfile         → soilProfiles
 *   PropagationMethod   → propagationLibrary
 *   CityClimate         → (india knowledge layer)
 *
 * During internal-testing mode the data is BUNDLED locally (see ./data/*) for
 * offline, zero-read retrieval; the shapes match Firestore docs so a later
 * server seed + sync is a drop-in (see KnowledgeSource in ./repository).
 */

import type { ClimateZone } from '../../constants/plants';

export type Season = 'summer' | 'winter' | 'monsoon';

export type PropagationMethodId =
  | 'stem-cutting'
  | 'leaf-cutting'
  | 'division'
  | 'offsets'
  | 'air-layering'
  | 'water-propagation'
  | 'seed'
  | 'grafting'
  | 'tuber'
  | 'rhizome';

export type DiseaseId =
  | 'root-rot'
  | 'powdery-mildew'
  | 'leaf-spot'
  | 'fungal-infection'
  | 'nutrient-deficiency'
  | 'overwatering'
  | 'underwatering'
  | 'sunburn'
  | 'spider-mites'
  | 'mealybugs'
  | 'aphids'
  | 'anthracnose'
  | 'rust'
  | 'sooty-mould';

export type DiseaseType = 'fungal' | 'bacterial' | 'pest' | 'environmental' | 'nutrient';
export type Difficulty = 'easy' | 'moderate' | 'hard';

/** plantKnowledgeBase — one per species. Structured to scale to 500 entries. */
export interface PlantKnowledgeEntry {
  id: string;                 // stable slug, e.g. 'money-plant'
  commonNameEn: string;       // English name
  commonNameHi?: string;      // Common Indian / Hindi name
  regionalNames?: string[];   // other regional names (Tamil, Bengali, …)
  scientificName: string;
  family?: string;
  /** lookup aliases (lowercased) — scientific synonyms + colloquial names. */
  aliases?: string[];
  tags: string[];             // 'low-light' | 'air-purifying' | 'pet-safe' | 'flowering' | 'edible' | …
  difficulty: Difficulty;

  light: string;
  watering: { summer: string; winter: string; monsoon: string };
  humidity: string;
  fertilizer: string;

  soilProfileId: string;          // → SoilProfile
  propagationMethods: PropagationMethodId[];
  commonDiseaseIds: DiseaseId[];
  commonPests: string[];

  seasonalCare: { summer: string; winter: string; monsoon: string };
  toxicity?: string;          // pet/child safety note
}

/** diseaseLibrary — authoritative definitions, never LLM-generated. */
export interface DiseaseEntry {
  id: DiseaseId;
  name: string;
  type: DiseaseType;
  definition: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  severity: 'low' | 'moderate' | 'high';
  /** keywords for symptom-based retrieval. */
  keywords: string[];
}

/** soilProfiles — plant-specific recipes; components must sum to ~100%. */
export interface SoilComponent {
  material: string;
  percent: number;
}
export interface SoilProfile {
  id: string;                 // 'aroid-mix'
  name: string;
  components: SoilComponent[];
  description: string;
  ph?: string;
  suitableFor: string[];      // tags or plant ids
}

/** propagationLibrary — method definitions, never LLM-generated. */
export interface PropagationMethod {
  id: PropagationMethodId;
  name: string;
  steps: string[];
  difficulty: Difficulty;
  bestSeason: Season | 'any';
  timeToRoot: string;
  notes?: string;
}

/** India knowledge layer — per-city climate + seasonal + AQI tendencies. */
export interface CityClimate {
  city: string;
  zone: ClimateZone;
  seasonal: { summer: string; winter: string; monsoon: string };
  aqiTendency: string;        // e.g. 'severe in winter (Nov–Jan)'
}
