/**
 * AQI Rules Engine — deterministic plant-care guidance by air-quality band
 * (India CPCB / US-EPA AQI scale). Doc. Sage retrieves this guidance; it is
 * never LLM-generated. Live AQI is fed in from the OpenWeather Air Pollution
 * API (src/services/weather/aqiService.ts) — Home, Doc. Sage context, and
 * care recommendations all pass the resolved AQI value into aqiRules().
 */
export type AqiBand = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very-poor' | 'severe';

export interface AqiAdvice {
  band: AqiBand;
  label: string;
  rules: string[];
}

export function aqiBand(aqi: number): AqiBand {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very-poor';
  return 'severe';
}

const BAND_RULES: Record<AqiBand, { label: string; rules: string[] }> = {
  good: {
    label: 'Good (0–50)',
    rules: [
      'Air is clean — open windows for fresh air and good circulation.',
      'A great time to move plants outdoors or onto the balcony for a light boost.',
      'Ideal conditions for repotting, pruning and propagating with less stress on plants.',
    ],
  },
  satisfactory: {
    label: 'Satisfactory (51–100)',
    rules: [
      'Minor dust — wipe broad leaves weekly so they can breathe and photosynthesise.',
      'Outdoor and balcony plants are fine; flowering and fruiting are unaffected.',
      'Still a good window for repotting and propagation.',
    ],
  },
  moderate: {
    label: 'Moderate (101–200)',
    rules: [
      'Dust settles on foliage — wipe leaves with a damp cloth twice a week.',
      'Air-purifying plants (snake plant, areca palm, peace lily, money plant) help indoor air.',
    ],
  },
  poor: {
    label: 'Poor (201–300)',
    rules: [
      'Keep windows shut during peak pollution; clean leaves often to prevent clogged stomata.',
      'Group air-purifying plants in living spaces.',
      'Expect slower growth as dust reduces light reaching leaves.',
    ],
  },
  'very-poor': {
    label: 'Very Poor (301–400)',
    rules: [
      'Heavy particulate load — wipe leaves every 1–2 days; mist to settle dust.',
      'Move sensitive plants away from open windows/balconies near traffic.',
      'Maximise indoor air-purifying plants.',
    ],
  },
  severe: {
    label: 'Severe (401+)',
    rules: [
      'Keep balcony/outdoor plants protected; bring delicate pots indoors if possible.',
      'Clean foliage frequently; a thick dust film blocks light and gas exchange.',
      'Prioritise hardy air-purifying species indoors (snake plant, ZZ, areca palm).',
      'Hold off on repotting or heavy pruning until the air improves — plants are already stressed.',
      'Wipe leaves with plain water only (no leaf-shine products, which trap more dust).',
      'Run an air purifier in plant rooms if you have one — it helps the plants and you.',
    ],
  },
};

export function aqiRules(aqi: number | null | undefined): AqiAdvice | null {
  if (aqi == null || Number.isNaN(aqi)) return null;
  const band = aqiBand(aqi);
  const { label, rules } = BAND_RULES[band];
  return { band, label, rules };
}

export function aqiRulesForBand(band: AqiBand): AqiAdvice {
  const { label, rules } = BAND_RULES[band];
  return { band, label, rules };
}
