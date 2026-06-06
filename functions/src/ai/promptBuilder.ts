interface PlantContext {
  nickname: string;
  speciesName: string;
  healthStatus: string;
  lastWateredAt: string;
  wateringFrequencyDays: number;
}

interface WeatherContext {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  season: string;
}

interface MemorySummary {
  summary: string;
  recurringIssues: string[];
}

export const buildSystemPrompt = (
  plant: PlantContext | null,
  weather: WeatherContext,
  kbSnippets: string[],
  memory: MemorySummary | null,
  allPlants: { nickname: string; species: string }[]
): string => {
  const plantSection = plant
    ? `
ACTIVE PLANT CONTEXT:
- Nickname: ${plant.nickname}
- Species: ${plant.speciesName}
- Health: ${plant.healthStatus}
- Last watered: ${plant.lastWateredAt}
- Watering frequency: every ${plant.wateringFrequencyDays} days`
    : '';

  const allPlantsSection =
    allPlants.length > 0
      ? `\nUSER'S OTHER PLANTS: ${allPlants.map((p) => `${p.nickname} (${p.species})`).join(', ')}`
      : '';

  const memorySection = memory
    ? `
PLANT MEMORY SUMMARY:
${memory.summary}
Recurring issues: ${memory.recurringIssues.join(', ') || 'none noted'}`
    : '';

  const kbSection =
    kbSnippets.length > 0
      ? `\nKNOWLEDGE BASE:\n${kbSnippets.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '';

  return `You are LawnUp AI, an expert Indian gardening assistant.
You speak in a warm, encouraging tone like a knowledgeable neighbor.
You have deep knowledge of Indian climate zones, seasonal gardening, and common Indian garden and house plants.

CURRENT WEATHER & LOCATION:
- City: ${weather.city}
- Temperature: ${weather.temp}°C, ${weather.condition}, humidity ${weather.humidity}%
- Season: ${weather.season} (Indian calendar)
${plantSection}${allPlantsSection}${memorySection}${kbSection}

RULES — follow strictly:
- ALWAYS refer to the active plant by its nickname "${plant?.nickname ?? 'your plant'}", never "your plant" or the species name alone
- Give India-specific advice (Indian soil, climate, seasons, local products)
- Keep responses under 200 words unless the user asks for detail
- Use simple, conversational language
- NEVER guarantee disease cures
- NEVER recommend specific chemical dosages — say "follow label instructions"
- NEVER provide human medical advice — redirect to a doctor
- For severe disease: always recommend consulting a local nursery or agricultural officer
- If unsure about something specific, say so — do not hallucinate`;
};

export const sanitizeInput = (message: string): string =>
  message
    .replace(/<[^>]*>/g, '')
    .replace(/\[INST\]|\[\/INST\]/gi, '')
    .replace(/system:/gi, '')
    .substring(0, 500)
    .trim();
