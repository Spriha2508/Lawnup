import type { SoilProfile } from '../types';

/**
 * soilProfiles seed — plant-specific recipes as exact component percentages
 * (each recipe sums to 100%). Dr. Banyan retrieves these recipes verbatim and
 * never invents soil mixes. Plants reference a profile by `soilProfileId`.
 */
export const SOIL_PROFILES: Record<string, SoilProfile> = {
  'aroid-mix': {
    id: 'aroid-mix',
    name: 'Chunky Aroid Mix',
    components: [
      { material: 'Cocopeat', percent: 40 },
      { material: 'Perlite', percent: 25 },
      { material: 'Pine bark', percent: 20 },
      { material: 'Compost', percent: 15 },
    ],
    description: 'Airy, fast-draining mix for aroids that want moisture but hate soggy roots.',
    ph: '5.5–6.5',
    suitableFor: ['monstera', 'pothos', 'money-plant', 'philodendron', 'peace-lily', 'aroid'],
  },
  'succulent-mix': {
    id: 'succulent-mix',
    name: 'Gritty Succulent / Cactus Mix',
    components: [
      { material: 'Coarse sand', percent: 40 },
      { material: 'Perlite', percent: 30 },
      { material: 'Cocopeat', percent: 20 },
      { material: 'Compost', percent: 10 },
    ],
    description: 'Sharp-draining, low-organic mix for succulents and cacti to prevent rot.',
    ph: '6.0–7.0',
    suitableFor: ['aloe-vera', 'jade-plant', 'snake-plant', 'succulent', 'cactus'],
  },
  'general-houseplant': {
    id: 'general-houseplant',
    name: 'Balanced Houseplant Mix',
    components: [
      { material: 'Garden soil', percent: 30 },
      { material: 'Cocopeat', percent: 30 },
      { material: 'Compost', percent: 25 },
      { material: 'Perlite/sand', percent: 15 },
    ],
    description: 'All-rounder for most foliage houseplants — moisture-retentive yet draining.',
    ph: '6.0–7.0',
    suitableFor: ['spider-plant', 'rubber-plant', 'croton', 'general'],
  },
  'fern-mix': {
    id: 'fern-mix',
    name: 'Moisture-Retentive Fern Mix',
    components: [
      { material: 'Cocopeat', percent: 45 },
      { material: 'Compost', percent: 25 },
      { material: 'Perlite', percent: 20 },
      { material: 'Leaf mould', percent: 10 },
    ],
    description: 'Holds humidity and moisture for ferns and humidity-loving plants.',
    ph: '5.5–6.5',
    suitableFor: ['boston-fern', 'fern', 'calathea'],
  },
  'herb-mix': {
    id: 'herb-mix',
    name: 'Kitchen Herb / Edible Mix',
    components: [
      { material: 'Garden soil', percent: 35 },
      { material: 'Compost', percent: 30 },
      { material: 'Cocopeat', percent: 20 },
      { material: 'Sand', percent: 15 },
    ],
    description: 'Fertile, free-draining mix for culinary herbs and leafy edibles.',
    ph: '6.0–7.0',
    suitableFor: ['tulsi', 'curry-leaf', 'mint', 'coriander', 'herb', 'edible'],
  },
  'flowering-mix': {
    id: 'flowering-mix',
    name: 'Flowering Plant Mix',
    components: [
      { material: 'Garden soil', percent: 30 },
      { material: 'Compost', percent: 30 },
      { material: 'Cocopeat', percent: 20 },
      { material: 'Sand', percent: 10 },
      { material: 'Bone meal', percent: 10 },
    ],
    description: 'Nutrient-rich, draining mix to fuel abundant blooms.',
    ph: '6.0–7.0',
    suitableFor: ['rose', 'hibiscus', 'marigold', 'jasmine', 'bougainvillea', 'flowering'],
  },
};

export const ALL_SOIL_PROFILES: SoilProfile[] = Object.values(SOIL_PROFILES);
