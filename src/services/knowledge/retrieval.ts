/**
 * Retrieval + Context Assembly — the 70/30 pipeline.
 *
 * Dr. Banyan ALWAYS retrieves structured facts first, then reasons over them.
 * OpenAI is forbidden (via the system prompt) from generating scientific names,
 * soil recipes, propagation steps, or disease definitions — those are injected
 * here from the knowledge collections. The assembled `knowledgeBlock` is the
 * "70%"; the model only personalises/explains it (the "30%").
 */
import { knowledge } from './repository';
import { weatherRules } from './rules/weatherRules';
import { aqiRules } from './rules/aqiRules';
import { currentSeason, SEASON_LABEL } from './rules/season';
import type {
  PlantKnowledgeEntry, SoilProfile, PropagationMethod, DiseaseEntry, CityClimate, Season,
} from './types';
import type { WeatherData } from '../weather/weatherService';

// ── Resolved knowledge bundle for one plant ──────────────────────────────────
export interface ResolvedPlantKnowledge {
  plant: PlantKnowledgeEntry;
  soil: SoilProfile | null;
  propagation: PropagationMethod[];
  diseases: DiseaseEntry[];
}

export function retrievePlantKnowledge(plantNameOrId: string): ResolvedPlantKnowledge | null {
  const plant = knowledge.getPlant(plantNameOrId);
  if (!plant) return null;
  return {
    plant,
    soil: knowledge.getSoilProfile(plant.soilProfileId),
    propagation: plant.propagationMethods
      .map(id => knowledge.getPropagation(id))
      .filter((m): m is PropagationMethod => m !== null),
    diseases: plant.commonDiseaseIds
      .map(id => knowledge.getDisease(id))
      .filter((d): d is DiseaseEntry => d !== null),
  };
}

// ── Context assembly inputs (loosely typed to avoid coupling to Firestore) ────
export interface BanyanUserProfile { name?: string; city?: string | null; climateZone?: string; skillLevel?: string }
export interface BanyanPlantProfile {
  nickname?: string;
  speciesName?: string;
  scientificName?: string;
  healthStatus?: string;
  wateringFrequencyDays?: number;
  scanConfidence?: number;
}
export interface BanyanMemory { memorySummary?: string; recurringIssues?: string[]; userCarePattern?: string }
export interface BanyanDiagnosis { commonName: string; isHealthy: boolean; diseases?: { name: string }[] }

export interface AssembleInput {
  userQuery: string;
  plantProfile?: BanyanPlantProfile;
  plantMemory?: BanyanMemory;
  userProfile?: BanyanUserProfile;
  weather?: WeatherData | null;
  aqi?: number | null;
  conversationSummary?: string;
  diagnosis?: BanyanDiagnosis;     // present when continuing from a scan result
}

export interface BanyanContext {
  systemPrompt: string;
  knowledgeBlock: string;          // the retrieved "70%" injected into the prompt
  season: Season;
  resolved: ResolvedPlantKnowledge | null;
  retrievalHit: boolean;           // whether a plant was matched in the KB
}

const BANYAN_PERSONA =
  `You are Dr. Banyan, LawnUp's warm, expert plant companion for Indian homes. ` +
  `You give practical, encouraging, India-aware plant care advice in simple language. ` +
  `Your ONLY domain is plants and plant care: identification follow-ups, watering, ` +
  `soil, light, propagation, diagnosis, pests, seasonal and air-quality care.`;

const RETRIEVAL_GUARDRAILS =
  `STRICT RULES:\n` +
  `- Use ONLY the RETRIEVED KNOWLEDGE below for scientific names, soil recipes (exact %), ` +
  `propagation steps, and disease definitions. NEVER invent or guess these.\n` +
  `- If a needed fact is not in the retrieved knowledge, say you don't have that detail yet ` +
  `rather than making it up.\n` +
  `- Personalise advice using the plant's nickname, the user's city/season, current weather, and AQI.\n` +
  `- Be concise and actionable. Prefer steps and specifics over generic tips.\n` +
  `- SCOPE: You ONLY discuss plants and plant care. If asked about human medical, ` +
  `financial, legal, coding, or any non-plant topic, politely decline in one sentence ` +
  `and steer back to the user's plants. Do NOT act as a general-purpose assistant.`;

function fmtSoil(soil: SoilProfile | null): string {
  if (!soil) return 'Soil recipe: (not in knowledge base)';
  const parts = soil.components.map(c => `${c.material} ${c.percent}%`).join(' · ');
  return `Soil recipe — ${soil.name} (${parts})${soil.ph ? `, pH ${soil.ph}` : ''}.`;
}

function fmtPlant(p: PlantKnowledgeEntry, season: Season): string {
  return [
    `PLANT FACTS — ${p.commonNameEn}${p.commonNameHi ? ` / ${p.commonNameHi}` : ''}`,
    `Scientific name: ${p.scientificName}${p.family ? ` (${p.family})` : ''}`,
    `Light: ${p.light}`,
    `Watering (${SEASON_LABEL[season]}): ${p.watering[season]}`,
    `Humidity: ${p.humidity}`,
    `Fertilizer: ${p.fertilizer}`,
    `Seasonal care now: ${p.seasonalCare[season]}`,
    `Common pests: ${p.commonPests.join(', ')}`,
    p.toxicity ? `Safety: ${p.toxicity}` : '',
  ].filter(Boolean).join('\n');
}

function fmtPropagation(methods: PropagationMethod[]): string {
  if (!methods.length) return '';
  return 'PROPAGATION METHODS:\n' + methods.map(m =>
    `• ${m.name} (${m.difficulty}, ${m.timeToRoot}, best in ${m.bestSeason}): ${m.steps.join(' ')}`
  ).join('\n');
}

function fmtDiseases(diseases: DiseaseEntry[]): string {
  if (!diseases.length) return '';
  return 'RELEVANT CONDITIONS:\n' + diseases.map(d =>
    `• ${d.name} [${d.severity}] — ${d.definition} Treatment: ${d.treatment.join(' ')}`
  ).join('\n');
}

/**
 * Assemble Dr. Banyan's full grounded context: retrieve plant knowledge, soil,
 * propagation, relevant diseases, city/season rules, weather + AQI guidance,
 * plus user/plant/memory/conversation context. Returns a ready-to-send system
 * prompt + knowledge block for the OpenAI client (built in Task #5).
 */
export function assembleBanyanContext(input: AssembleInput): BanyanContext {
  const season = currentSeason();
  const sections: string[] = [];

  // 1. Resolve the plant from profile or diagnosis
  const plantKey =
    input.plantProfile?.scientificName ||
    input.plantProfile?.speciesName ||
    input.diagnosis?.commonName ||
    '';
  const resolved = plantKey ? retrievePlantKnowledge(plantKey) : null;

  if (resolved) {
    sections.push(fmtPlant(resolved.plant, season));
    sections.push(fmtSoil(resolved.soil));
    const prop = fmtPropagation(resolved.propagation);
    if (prop) sections.push(prop);
  } else if (plantKey) {
    sections.push(`PLANT FACTS — "${plantKey}" is not yet in the knowledge base; do not invent species-specific facts.`);
  }

  // 2. Disease retrieval — from symptoms in the query + any diagnosis + plant's common conditions
  const symptomText = [input.userQuery, ...(input.diagnosis?.diseases?.map(d => d.name) ?? [])].join(' ');
  const symptomDiseases = knowledge.searchDiseasesByKeywords(symptomText, 3);
  const diseaseSet = new Map<string, DiseaseEntry>();
  [...symptomDiseases, ...(resolved?.diseases ?? [])].forEach(d => diseaseSet.set(d.id, d));
  const diseaseBlock = fmtDiseases([...diseaseSet.values()].slice(0, 4));
  if (diseaseBlock) sections.push(diseaseBlock);

  // 3. City + season rules
  const cityClimate: CityClimate | null = knowledge.getCityClimate(input.userProfile?.city);
  if (cityClimate) {
    sections.push(`CITY & SEASON — ${cityClimate.city} (${SEASON_LABEL[season]}): ${cityClimate.seasonal[season]} AQI tendency: ${cityClimate.aqiTendency}`);
  } else {
    sections.push(`SEASON — ${SEASON_LABEL[season]}.`);
  }

  // 4. Weather rules
  const wAdvice = weatherRules(input.weather ?? null);
  if (wAdvice) sections.push(`WEATHER NOW — ${wAdvice.headline}\n${wAdvice.rules.map(r => `• ${r}`).join('\n')}`);

  // 5. AQI rules
  const aAdvice = aqiRules(input.aqi);
  if (aAdvice) sections.push(`AIR QUALITY — ${aAdvice.label}:\n${aAdvice.rules.map(r => `• ${r}`).join('\n')}`);

  // 6. Plant + user + memory context
  const ctx: string[] = [];
  if (input.plantProfile?.nickname) ctx.push(`This plant's nickname: "${input.plantProfile.nickname}".`);
  if (input.plantProfile?.healthStatus) ctx.push(`Current health: ${input.plantProfile.healthStatus}.`);
  if (input.plantProfile?.wateringFrequencyDays) ctx.push(`User waters every ${input.plantProfile.wateringFrequencyDays} days.`);
  if (input.diagnosis) ctx.push(`Latest scan: ${input.diagnosis.commonName}, ${input.diagnosis.isHealthy ? 'healthy' : 'needs attention'}${input.diagnosis.diseases?.length ? ` (${input.diagnosis.diseases.map(d => d.name).join(', ')})` : ''}.`);
  if (input.plantMemory?.memorySummary) ctx.push(`Plant memory: ${input.plantMemory.memorySummary}`);
  if (input.plantMemory?.recurringIssues?.length) ctx.push(`Recurring issues: ${input.plantMemory.recurringIssues.join(', ')}.`);
  if (input.plantMemory?.userCarePattern) ctx.push(`User care pattern: ${input.plantMemory.userCarePattern}`);
  if (input.userProfile?.name) ctx.push(`User's name: ${input.userProfile.name}.`);
  if (input.userProfile?.skillLevel) ctx.push(`User gardening level: ${input.userProfile.skillLevel}.`);
  if (input.conversationSummary) ctx.push(`Conversation so far: ${input.conversationSummary}`);
  if (ctx.length) sections.push('CONTEXT:\n' + ctx.map(c => `• ${c}`).join('\n'));

  const knowledgeBlock = sections.join('\n\n');
  const systemPrompt = `${BANYAN_PERSONA}\n\n${RETRIEVAL_GUARDRAILS}\n\n=== RETRIEVED KNOWLEDGE ===\n${knowledgeBlock}\n=== END KNOWLEDGE ===`;

  return { systemPrompt, knowledgeBlock, season, resolved, retrievalHit: !!resolved };
}
