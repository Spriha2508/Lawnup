/**
 * Knowledge repository — the RETRIEVAL layer (the "70%").
 *
 * All structured facts Dr. Banyan needs come through these query functions.
 * Behind a KnowledgeSource interface so the bundled LocalKnowledgeSource (used
 * during client-side internal-testing mode) can be swapped for a Firestore
 * source later without touching callers.
 */
import { PLANTS, ALL_PLANTS, SEEDED_PLANT_COUNT } from './data/plants';
import { DISEASES, ALL_DISEASES } from './data/diseases';
import { SOIL_PROFILES } from './data/soilProfiles';
import { PROPAGATION_METHODS } from './data/propagation';
import { findCityClimate } from './data/cityClimate';
import type {
  PlantKnowledgeEntry, DiseaseEntry, SoilProfile, PropagationMethod,
  CityClimate, DiseaseId, PropagationMethodId,
} from './types';

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface KnowledgeSource {
  getPlant(idOrName: string): PlantKnowledgeEntry | null;
  searchPlants(query: string, limit?: number): PlantKnowledgeEntry[];
  getDisease(id: DiseaseId): DiseaseEntry | null;
  searchDiseasesByKeywords(text: string, limit?: number): DiseaseEntry[];
  getSoilProfile(id: string): SoilProfile | null;
  getPropagation(id: PropagationMethodId): PropagationMethod | null;
  getCityClimate(city: string | null | undefined): CityClimate | null;
  readonly plantCount: number;
}

/** Bundled, offline knowledge source (the default during internal-testing). */
export const LocalKnowledgeSource: KnowledgeSource = {
  plantCount: SEEDED_PLANT_COUNT,

  getPlant(idOrName: string): PlantKnowledgeEntry | null {
    if (!idOrName) return null;
    const q = norm(idOrName);

    // 1. direct id
    if (PLANTS[q]) return PLANTS[q];

    // 2. exact match on names / scientific / aliases
    for (const p of ALL_PLANTS) {
      if (
        norm(p.commonNameEn) === q ||
        (p.commonNameHi && norm(p.commonNameHi) === q) ||
        norm(p.scientificName) === q ||
        p.aliases?.some(a => norm(a) === q) ||
        p.regionalNames?.some(r => norm(r) === q)
      ) {
        return p;
      }
    }

    // 3. partial / contains match (scan names often carry author suffixes etc.)
    for (const p of ALL_PLANTS) {
      const hay = [p.commonNameEn, p.scientificName, ...(p.aliases ?? [])].map(norm);
      if (hay.some(h => h.includes(q) || q.includes(h))) return p;
    }
    return null;
  },

  searchPlants(query: string, limit = 8): PlantKnowledgeEntry[] {
    const q = norm(query);
    if (!q) return [];
    return ALL_PLANTS.filter(p => {
      const hay = [p.commonNameEn, p.commonNameHi ?? '', p.scientificName, ...(p.tags), ...(p.aliases ?? [])].map(norm);
      return hay.some(h => h.includes(q));
    }).slice(0, limit);
  },

  getDisease(id: DiseaseId): DiseaseEntry | null {
    return DISEASES[id] ?? null;
  },

  searchDiseasesByKeywords(text: string, limit = 3): DiseaseEntry[] {
    const q = norm(text);
    if (!q) return [];
    const scored = ALL_DISEASES.map(d => {
      const hay = [...d.keywords, ...d.symptoms, d.name].map(norm);
      const score = hay.reduce((acc, h) => acc + (q.includes(h) || h.includes(q) ? 1 : 0), 0);
      return { d, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(x => x.d);
  },

  getSoilProfile(id: string): SoilProfile | null {
    return SOIL_PROFILES[id] ?? null;
  },

  getPropagation(id: PropagationMethodId): PropagationMethod | null {
    return PROPAGATION_METHODS[id] ?? null;
  },

  getCityClimate(city: string | null | undefined): CityClimate | null {
    return findCityClimate(city);
  },
};

/** The active source. Swap to a FirestoreKnowledgeSource at production hardening. */
export const knowledge: KnowledgeSource = LocalKnowledgeSource;
