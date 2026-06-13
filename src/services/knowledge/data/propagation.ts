import type { PropagationMethod } from '../types';

/**
 * propagationLibrary seed — the 6 core methods. Dr. Banyan retrieves these
 * steps verbatim and never invents propagation instructions.
 */
export const PROPAGATION_METHODS: Record<string, PropagationMethod> = {
  'stem-cutting': {
    id: 'stem-cutting',
    name: 'Stem Cutting',
    steps: [
      'Cut a 10–15 cm healthy stem just below a node with sterile scissors',
      'Remove the lower leaves, leaving 2–3 at the top',
      'Optionally dip the cut end in rooting hormone',
      'Plant in moist, airy mix (or water) keeping a node submerged/buried',
      'Keep in bright indirect light and warm, humid conditions until roots form',
    ],
    difficulty: 'easy',
    bestSeason: 'monsoon',
    timeToRoot: '2–4 weeks',
    notes: 'Works for pothos, money plant, philodendron, hibiscus, rose, croton.',
  },
  'leaf-cutting': {
    id: 'leaf-cutting',
    name: 'Leaf Cutting',
    steps: [
      'Remove a healthy leaf (with a short petiole for some species)',
      'Let the cut callus for a few hours (succulents)',
      'Lay or insert the leaf base on/into moist mix',
      'Mist lightly and keep warm in bright indirect light',
      'Wait for pups/roots to emerge from the base',
    ],
    difficulty: 'moderate',
    bestSeason: 'summer',
    timeToRoot: '3–8 weeks',
    notes: 'Works for snake plant, succulents, begonia, ZZ plant.',
  },
  division: {
    id: 'division',
    name: 'Division',
    steps: [
      'Unpot the plant and gently shake off excess soil',
      'Identify natural clumps each with roots and shoots',
      'Separate clumps by hand or with a sterile knife',
      'Repot each division into fresh mix',
      'Water in and keep in indirect light to recover',
    ],
    difficulty: 'easy',
    bestSeason: 'monsoon',
    timeToRoot: 'Immediate (already rooted)',
    notes: 'Works for snake plant, peace lily, ferns, spider plant, ZZ plant.',
  },
  offsets: {
    id: 'offsets',
    name: 'Offsets / Pups',
    steps: [
      'Locate baby offsets (pups) at the base of the parent',
      'Wait until the pup has its own small roots',
      'Separate it from the parent with a clean cut',
      'Pot the pup into a small container of appropriate mix',
      'Water lightly and keep warm',
    ],
    difficulty: 'easy',
    bestSeason: 'summer',
    timeToRoot: 'Immediate to 2 weeks',
    notes: 'Works for aloe vera, snake plant, succulents, banana, bromeliads.',
  },
  'air-layering': {
    id: 'air-layering',
    name: 'Air Layering',
    steps: [
      'Choose a healthy woody stem and make an upward cut or remove a ring of bark',
      'Apply rooting hormone to the wound',
      'Wrap the area in moist sphagnum moss',
      'Cover the moss with plastic and secure both ends',
      'Keep moss moist; once roots fill it, cut below and pot up',
    ],
    difficulty: 'hard',
    bestSeason: 'monsoon',
    timeToRoot: '4–8 weeks',
    notes: 'Works for rubber plant, ficus, hibiscus, guava, citrus.',
  },
  'water-propagation': {
    id: 'water-propagation',
    name: 'Water Propagation',
    steps: [
      'Take a stem cutting with at least one node',
      'Place the node(s) in a jar of clean water, leaves above the waterline',
      'Keep in bright indirect light',
      'Change the water every 3–4 days',
      'Once roots reach 4–5 cm, pot into soil',
    ],
    difficulty: 'easy',
    bestSeason: 'any',
    timeToRoot: '2–4 weeks',
    notes: 'Works for money plant, pothos, philodendron, coleus, mint.',
  },
};

export const ALL_PROPAGATION: PropagationMethod[] = Object.values(PROPAGATION_METHODS);
