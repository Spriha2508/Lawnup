/**
 * LawnUp Knowledge Layer — public surface.
 *
 * The structured, authoritative plant-fact store that grounds Doc. Sage (70%
 * retrieval / 30% reasoning). Import from here:
 *
 *   import { knowledge, assembleBanyanContext } from '@/services/knowledge';
 */
export * from './types';
export { knowledge, LocalKnowledgeSource } from './repository';
export type { KnowledgeSource } from './repository';
export {
  retrievePlantKnowledge,
  assembleBanyanContext,
} from './retrieval';
export type {
  ResolvedPlantKnowledge,
  BanyanContext,
  AssembleInput,
  BanyanUserProfile,
  BanyanPlantProfile,
  BanyanMemory,
  BanyanDiagnosis,
} from './retrieval';
export { weatherRules } from './rules/weatherRules';
export type { WeatherAdvice } from './rules/weatherRules';
export { aqiRules, aqiBand, aqiRulesForBand } from './rules/aqiRules';
export type { AqiBand, AqiAdvice } from './rules/aqiRules';
export { currentSeason, SEASON_LABEL } from './rules/season';
export { SEEDED_PLANT_COUNT, ALL_PLANTS } from './data/plants';
export { ALL_DISEASES } from './data/diseases';
export { ALL_SOIL_PROFILES } from './data/soilProfiles';
export { ALL_PROPAGATION } from './data/propagation';
export { ALL_CITY_CLIMATES } from './data/cityClimate';
