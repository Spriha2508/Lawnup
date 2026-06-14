// Species-specific care profiles for common Indian houseplants.
// Indexed by normalized common name. Used by plantIdentification to build
// honest, plant-specific care actions instead of generic fallbacks.

import { knowledge, currentSeason } from '../../services/knowledge';

export interface PlantCareProfile {
  water: string;
  light: string;
  humidity?: string;
  fertilizer?: string;
  tips: string[];
}

const CARE_PROFILES: Record<string, PlantCareProfile> = {
  Tulsi: {
    water: 'Water every 2–3 days — keep soil moist but never waterlogged',
    light: 'Needs 4–6 hours of direct sunlight; best on a south-facing balcony',
    humidity: 'Prefers moderate to high humidity — mist lightly in dry weather',
    fertilizer: 'Add a small amount of compost or vermicompost once a month',
    tips: [
      'Pinch off flower buds to keep the plant in leaf-producing mode longer',
      'Use neem water spray monthly to prevent whitefly and aphids',
    ],
  },
  'Money Plant': {
    water: 'Water every 7–10 days; let the top 2 cm of soil dry between waterings',
    light: 'Bright indirect light — tolerates low light but grows faster in brighter spots',
    humidity: 'Adapts well; mist the leaves in dry or air-conditioned rooms',
    tips: [
      'Wipe leaves monthly to remove dust and improve light absorption',
      'Propagates easily — cut below a node and root in a glass of water',
    ],
  },
  'Aloe Vera': {
    water: 'Water deeply every 14–21 days; allow the soil to dry completely between waterings',
    light: 'Bright indirect to direct morning sun — avoid harsh afternoon sun',
    humidity: 'Drought tolerant; prefers dry air — do not mist the leaves',
    tips: [
      'Never let Aloe sit in standing water — root rot sets in very quickly',
      'Repot every 2 years as the root ball outgrows the pot',
    ],
  },
  'Snake Plant': {
    water: 'Water every 14–21 days in summer; every 28 days in winter — one of the hardiest plants',
    light: 'Adapts to low light but grows best in bright indirect light',
    humidity: 'Tolerates dry, air-conditioned rooms well — ideal for offices',
    tips: [
      'Overwatering is the most common mistake — when in doubt, skip a watering',
      'One of the best plants for filtering indoor air overnight',
    ],
  },
  'Areca Palm': {
    water: 'Water every 5–7 days; keep soil evenly moist but not saturated',
    light: 'Bright indirect light — harsh afternoon sun scorches the frond tips',
    humidity: 'Thrives in humidity — mist the fronds daily in dry or winter weather',
    fertilizer: 'Feed with a balanced liquid fertiliser every 2 months during summer',
    tips: [
      'Brown tips often mean fluoride in tap water — switch to filtered or rainwater',
      'Wipe fronds with a damp cloth to keep them pest-free and glossy',
    ],
  },
  Monstera: {
    water: 'Water every 7–10 days; let the top 3 cm of soil dry between waterings',
    light: 'Bright indirect light — the more light, the bigger and more split the leaves become',
    humidity: 'Loves high humidity — mist regularly or place near a water-filled pebble tray',
    tips: [
      'The iconic split leaves only develop in good light — move closer to a window',
      'Support with a moss pole to encourage healthier aerial root growth',
    ],
  },
  'Rubber Plant': {
    water: 'Water every 7–10 days; allow the top 3 cm to dry out between waterings',
    light: 'Bright indirect light — avoid direct harsh sun which fades the leaves',
    humidity: 'Prefers moderate humidity; avoid draughty spots near doors or vents',
    tips: [
      'Wipe the large glossy leaves with a damp cloth every month',
      'Prune in spring to control height and encourage a fuller, bushier shape',
    ],
  },
  'Peace Lily': {
    water: 'Water every 5–7 days — the plant will droop slightly when it needs water',
    light: 'Low to medium indirect light; one of the best low-light houseplants',
    humidity: 'Prefers high humidity — ideal for bathrooms or near humidifiers',
    tips: [
      'Keep away from direct sun — leaves scorch and turn yellow easily',
      'Brown tips signal low humidity or over-fertilising; reduce feeding',
    ],
  },
  Hibiscus: {
    water: 'Water daily in summer; every 2 days in other seasons — prefers consistently moist soil',
    light: 'Full sun — needs at least 6 hours of direct sunlight for blooms',
    humidity: 'Thrives outdoors in India\'s humid climate; water more in dry weather',
    fertilizer: 'Use a phosphorus-rich fertiliser fortnightly during the flowering season',
    tips: [
      'Deadhead spent flowers to encourage continuous blooming throughout the season',
      'Neem oil spray once a month prevents aphids and mealybugs effectively',
    ],
  },
  Marigold: {
    water: 'Water every 2–3 days; avoid wetting the flowers — water at the base',
    light: 'Full sun — best flowering with 6+ hours of direct sun daily',
    tips: [
      'Deadhead regularly to keep the plant producing new blooms',
      'Plant near vegetables — marigolds naturally repel many common garden pests',
    ],
  },
  'Jade Plant': {
    water: 'Water every 10–14 days; soil must dry completely between waterings',
    light: 'Bright indirect to direct morning sun — 4+ hours daily is ideal',
    humidity: 'Prefers dry conditions — do not mist; drought tolerant once established',
    tips: [
      'Jade Plants can live for decades with minimal care if not overwatered',
      'Water very sparingly in winter when the plant is semi-dormant',
    ],
  },
  Frangipani: {
    water: 'Water deeply every 5–7 days; reduce to once a fortnight in winter',
    light: 'Full sun is essential — needs 6+ hours of direct sunlight to flower',
    tips: [
      'Allow the soil to dry between waterings — root rot is the main risk',
      'Leaf drop in winter is normal dormancy; do not increase watering',
    ],
  },
  'ZZ Plant': {
    water: 'Water every 21–28 days — one of the most drought-tolerant houseplants available',
    light: 'Low to bright indirect light — extremely forgiving of neglect and dim rooms',
    humidity: 'Tolerates dry air well; ideal for air-conditioned offices and apartments',
    tips: [
      'The rhizomes store water, so underwatering is far safer than overwatering',
      'Do not fertilise in winter — feed monthly with diluted liquid fertiliser in summer',
    ],
  },
  'Spider Plant': {
    water: 'Water every 7–10 days; allow soil to dry slightly between waterings',
    light: 'Bright to medium indirect light; tolerates lower light well',
    tips: [
      'Produces baby "spiderettes" on trailing runners — propagate these in water',
      'Brown tips are usually caused by fluoride — use filtered water for best results',
    ],
  },
  Periwinkle: {
    water: 'Water every 2–3 days during summer; every 4–5 days in cooler months',
    light: 'Full sun to partial shade — highly adaptable and drought tolerant',
    tips: [
      'Pinch growing tips when young to encourage a fuller, more compact plant',
      'Excellent ground cover plant — spreads naturally in Indian gardens',
    ],
  },
  Bougainvillea: {
    water: 'Water deeply every 7–10 days; allow soil to dry between waterings — drought tolerant once established',
    light: 'Full sun essential — needs 6+ hours of direct sun to produce vibrant bracts',
    humidity: 'Thrives in warm, dry conditions; too much humidity can reduce flowering',
    tips: [
      'Stress the plant slightly by reducing water before the flowering season to trigger blooms',
      'Prune hard after each flush of flowering to encourage the next wave of colour',
    ],
  },
  'Curry Leaf': {
    water: 'Water every 3–5 days in summer; reduce to weekly in winter — never let it dry completely',
    light: 'Full sun to partial shade; best growth in 5–6 hours of morning sun',
    humidity: 'Loves India\'s humid climate — mist lightly in very dry weather',
    fertilizer: 'Feed with diluted buttermilk or rice water fortnightly for lush foliage',
    tips: [
      'Harvest regularly from the tips — frequent picking encourages bushier, more fragrant growth',
      'Plant with Tulsi nearby; both thrive in similar Indian conditions',
    ],
  },
  Neem: {
    water: 'Water every 7–10 days once established; young trees need water every 3–4 days',
    light: 'Full sun — a native Indian tree that thrives in tropical heat',
    humidity: 'Heat and drought tolerant; reduce watering in monsoon season',
    tips: [
      'Extremely hardy once established — one of the lowest-maintenance trees for Indian gardens',
      'Neem oil from the leaves is a natural, effective pest deterrent for nearby plants',
    ],
  },
  Jasmine: {
    water: 'Water every 2–3 days during flowering season; every 5–7 days otherwise',
    light: 'Bright indirect to full morning sun — at least 4 hours daily for blooms',
    humidity: 'Loves humidity — mist the foliage in dry weather for best fragrance',
    fertilizer: 'Apply a phosphorus-rich fertiliser fortnightly during the flowering season',
    tips: [
      'Train onto a trellis or fence — jasmine blooms more when it can climb freely',
      'Prune lightly after flowering to keep the plant compact and encourage the next flush',
    ],
  },
  Cactus: {
    water: 'Water every 14–28 days in summer; every 4–6 weeks in winter — let soil dry fully',
    light: 'Bright direct sun — at least 4–6 hours of strong sunlight daily',
    humidity: 'Prefers dry air; keep away from humid rooms like bathrooms',
    tips: [
      'The number one mistake is overwatering — when in doubt, wait another week',
      'Use a fast-draining cactus mix; standard potting soil retains too much moisture',
    ],
  },
  Succulent: {
    water: 'Water thoroughly every 10–14 days; allow the pot to dry completely before the next watering',
    light: 'Bright indirect to direct morning sun; avoid harsh afternoon sun that scorches leaves',
    humidity: 'Dry air preferred — succulents suffer in high humidity or waterlogged conditions',
    tips: [
      'Etiolation (stretching towards light) means the plant needs more direct sun',
      'Use a well-draining pot with drainage holes — soggy roots cause rot within days',
    ],
  },
  Pothos: {
    water: 'Water every 7–10 days; the leaves will curl slightly when thirsty — a reliable indicator',
    light: 'Tolerates low light but grows faster in bright indirect light',
    humidity: 'Adapts well to most conditions; mist in very dry or air-conditioned rooms',
    tips: [
      'One of the hardiest and most forgiving houseplants — ideal for beginners',
      'Propagates very easily — place a node cutting in water for a few weeks',
    ],
  },
  'Boston Fern': {
    water: 'Keep soil consistently moist but never waterlogged; water every 3–4 days in summer',
    light: 'Bright indirect light only — direct sun scorches the delicate fronds',
    humidity: 'Needs high humidity — one of the most demanding houseplants; mist daily in dry weather',
    tips: [
      'Yellowing fronds usually signal dry air or irregular watering',
      'Place on a pebble tray with water to maintain the humidity it needs to thrive',
    ],
  },
  Croton: {
    water: 'Water every 5–7 days; keep soil evenly moist but not waterlogged',
    light: 'Bright direct to indirect light — more sun means more vivid leaf colour',
    humidity: 'Prefers high humidity; mist the colourful leaves daily in dry weather',
    tips: [
      'Leaf drop after moving the plant is normal — give it a few weeks to adjust',
      'The bold red, orange, and yellow leaf colours intensify with more direct morning sun',
    ],
  },
};

// Aliases map variant names (from Plant.id API) to canonical profile keys
const ALIASES: Record<string, string> = {
  'holy basil': 'Tulsi',
  'golden pothos': 'Pothos',
  'devil\'s ivy': 'Pothos',
  'epipremnum aureum': 'Pothos',
  'dracaena trifasciata': 'Snake Plant',
  'mother-in-law\'s tongue': 'Snake Plant',
  'sansevieria': 'Snake Plant',
  'aloe': 'Aloe Vera',
  'chinese money plant': 'Money Plant',
  'jade pothos': 'Pothos',
  'plumeria': 'Frangipani',
  'curry leaf plant': 'Curry Leaf',
  'murraya koenigii': 'Curry Leaf',
  'catharanthus roseus': 'Periwinkle',
  'vinca': 'Periwinkle',
  'camellia sinensis': 'Money Plant',
};

export function getPlantCareProfile(commonName: string): PlantCareProfile | null {
  const key = CARE_PROFILES[commonName]
    ? commonName
    : ALIASES[commonName.toLowerCase()] ?? null;
  return key ? (CARE_PROFILES[key] ?? null) : null;
}

export function buildSpeciesActions(
  commonName: string,
  apiWatering?: { min?: number; max?: number },
): string[] {
  const profile = getPlantCareProfile(commonName);

  if (profile) {
    const actions = [profile.water, profile.light];
    if (profile.humidity) actions.push(profile.humidity);
    if (profile.tips.length > 0) actions.push(profile.tips[0]);
    if (profile.tips.length > 1) actions.push(profile.tips[1]);
    return actions.slice(0, 4);
  }

  // Knowledge layer (112 structured Indian plants) — season-aware, plant-specific
  // care before falling back to anything generic.
  const k = knowledge.getPlant(commonName);
  if (k) {
    const season = currentSeason();
    const actions = [k.watering[season], k.light, k.humidity];
    if (k.seasonalCare?.[season]) actions.push(k.seasonalCare[season]);
    return actions.slice(0, 4);
  }

  // Generic fallback using Plant.id watering data when available
  const waterTip =
    apiWatering?.min && apiWatering?.max
      ? `Water every ${apiWatering.min}–${apiWatering.max} days — check soil moisture before each watering`
      : 'Water when the top 2 cm of soil feels dry; avoid overwatering';

  return [
    waterTip,
    'Keep in bright indirect light — avoid harsh afternoon sun',
    'Inspect leaves monthly for common pests like mealybugs, aphids, and scale',
    `Ask AI Doctor for personalised care advice on your ${commonName}`,
  ];
}
