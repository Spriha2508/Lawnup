// Scientific name → India-first friendly name mapping.
// Priority when resolving a display name:
//   1. This local table (Indian household / nursery names first)
//   2. Plant.id API common_names[]
//   3. Scientific name as last resort — never dominates UI

const INDIA_PLANT_MAP: Record<string, { commonName: string; indianNames?: string[] }> = {

  // ── Tulsi ───────────────────────────────────────────────────────────────────
  'Ocimum tenuiflorum': { commonName: 'Tulsi',          indianNames: ['Holy Basil', 'Vrinda'] },
  'Ocimum sanctum':     { commonName: 'Tulsi',          indianNames: ['Holy Basil'] },

  // ── Neem ─────────────────────────────────────────────────────────────────────
  'Azadirachta indica': { commonName: 'Neem',           indianNames: ['Neem Tree', 'Indian Lilac', 'Nimba'] },

  // ── Curry Leaf ───────────────────────────────────────────────────────────────
  'Murraya koenigii':   { commonName: 'Curry Leaf',     indianNames: ['Karipatta', 'Meetha Neem', 'Kadi Patta'] },

  // ── Money Plant family ───────────────────────────────────────────────────────
  'Epipremnum aureum':  { commonName: 'Money Plant',    indianNames: ['Golden Pothos', 'Devil\'s Ivy'] },
  'Pothos aureus':      { commonName: 'Money Plant',    indianNames: ['Golden Pothos'] },

  // ── Aloe Vera ─────────────────────────────────────────────────────────────────
  'Aloe vera':          { commonName: 'Aloe Vera',      indianNames: ['Ghritkumari', 'Kumari', 'Kathalai'] },
  'Aloe barbadensis':   { commonName: 'Aloe Vera',      indianNames: ['Ghritkumari'] },

  // ── Snake Plant ───────────────────────────────────────────────────────────────
  'Sansevieria trifasciata': { commonName: 'Snake Plant', indianNames: ['Mother-in-Law\'s Tongue', 'Naag Patta'] },
  'Dracaena trifasciata':    { commonName: 'Snake Plant', indianNames: ['Mother-in-Law\'s Tongue'] },

  // ── Areca Palm ────────────────────────────────────────────────────────────────
  'Dypsis lutescens':           { commonName: 'Areca Palm', indianNames: ['Butterfly Palm', 'Sona Chand Palm'] },
  'Chrysalidocarpus lutescens': { commonName: 'Areca Palm', indianNames: ['Butterfly Palm'] },

  // ── Monstera ──────────────────────────────────────────────────────────────────
  'Monstera deliciosa': { commonName: 'Monstera',       indianNames: ['Swiss Cheese Plant'] },

  // ── Rubber Plant ─────────────────────────────────────────────────────────────
  'Ficus elastica':     { commonName: 'Rubber Plant',   indianNames: ['Indian Rubber Tree'] },

  // ── Peace Lily ────────────────────────────────────────────────────────────────
  'Spathiphyllum wallisii':          { commonName: 'Peace Lily', indianNames: ['White Flag Plant'] },
  'Spathiphyllum cochlearispathum':  { commonName: 'Peace Lily', indianNames: [] },

  // ── Jade Plant ────────────────────────────────────────────────────────────────
  'Crassula ovata':     { commonName: 'Jade Plant',     indianNames: ['Lucky Plant', 'Friendship Plant'] },
  'Crassula argentea':  { commonName: 'Jade Plant',     indianNames: [] },

  // ── ZZ Plant ─────────────────────────────────────────────────────────────────
  'Zamioculcas zamiifolia': { commonName: 'ZZ Plant',   indianNames: ['Zanzibar Gem'] },

  // ── Spider Plant ─────────────────────────────────────────────────────────────
  'Chlorophytum comosum': { commonName: 'Spider Plant', indianNames: ['Ribbon Plant', 'Hen and Chickens'] },

  // ── Hibiscus ──────────────────────────────────────────────────────────────────
  'Hibiscus rosa-sinensis': { commonName: 'Hibiscus',   indianNames: ['Gudhal', 'Jaswand', 'China Rose'] },

  // ── Marigold ─────────────────────────────────────────────────────────────────
  'Tagetes erecta':     { commonName: 'Marigold',       indianNames: ['Genda', 'Zendu'] },
  'Tagetes patula':     { commonName: 'Marigold',       indianNames: ['Genda', 'French Marigold'] },

  // ── Jasmine / Mogra ──────────────────────────────────────────────────────────
  'Jasminum sambac':    { commonName: 'Mogra',          indianNames: ['Arabian Jasmine', 'Motia', 'Bela'] },
  'Jasminum officinale':{ commonName: 'Jasmine',        indianNames: ['Common Jasmine', 'Chameli'] },
  'Jasminum grandiflorum': { commonName: 'Chameli',     indianNames: ['Spanish Jasmine', 'Royal Jasmine'] },

  // ── Temple Tree / Champa (Plumeria) ──────────────────────────────────────────
  'Plumeria rubra':     { commonName: 'Temple Tree',    indianNames: ['Champa', 'Chafa', 'Red Frangipani'] },
  'Plumeria obtusa':    { commonName: 'Temple Tree',    indianNames: ['Champa', 'White Frangipani', 'Singapore Plumeria'] },
  'Plumeria alba':      { commonName: 'Temple Tree',    indianNames: ['Champa', 'White Champa'] },

  // ── Rose ──────────────────────────────────────────────────────────────────────
  'Rosa':               { commonName: 'Rose',           indianNames: ['Gulab'] },
  'Rosa chinensis':     { commonName: 'Rose',           indianNames: ['Gulab', 'China Rose'] },
  'Rosa hybrida':       { commonName: 'Rose',           indianNames: ['Gulab'] },
  'Rosa indica':        { commonName: 'Rose',           indianNames: ['Gulab', 'Indian Rose'] },

  // ── Banana Plant ─────────────────────────────────────────────────────────────
  'Musa acuminata':     { commonName: 'Banana Plant',   indianNames: ['Kela', 'Kadali'] },
  'Musa balbisiana':    { commonName: 'Banana Plant',   indianNames: ['Kela'] },
  'Musa paradisiaca':   { commonName: 'Banana Plant',   indianNames: ['Kela', 'Plantain'] },

  // ── Mango ─────────────────────────────────────────────────────────────────────
  'Mangifera indica':   { commonName: 'Mango',          indianNames: ['Aam', 'Aamra'] },

  // ── Bougainvillea ─────────────────────────────────────────────────────────────
  'Bougainvillea spectabilis': { commonName: 'Bougainvillea', indianNames: ['Kagaz Phool', 'Paper Flower', 'Buganwilya'] },
  'Bougainvillea glabra':      { commonName: 'Bougainvillea', indianNames: ['Paper Flower', 'Buganwilya'] },

  // ── Periwinkle / Sadabahar ────────────────────────────────────────────────────
  'Catharanthus roseus': { commonName: 'Sadabahar',     indianNames: ['Periwinkle', 'Vinca', 'Sadaphuli'] },

  // ── Ixora ─────────────────────────────────────────────────────────────────────
  'Ixora coccinea':     { commonName: 'Ixora',          indianNames: ['Jungle Flame', 'Rangoon', 'Rangan'] },

  // ── Coleus ───────────────────────────────────────────────────────────────────
  'Coleus scutellarioides': { commonName: 'Coleus',     indianNames: ['Painted Leaf', 'Painted Nettle'] },

  // ── Portulaca ────────────────────────────────────────────────────────────────
  'Portulaca grandiflora':  { commonName: 'Portulaca',  indianNames: ['Gulab Rani', 'Table Rose', 'Moss Rose'] },

  // ── Palms ─────────────────────────────────────────────────────────────────────
  'Phoenix roebelenii': { commonName: 'Dwarf Date Palm', indianNames: ['Pigmy Date Palm'] },
  'Phoenix dactylifera':{ commonName: 'Date Palm',       indianNames: ['Khajur'] },
  'Cocos nucifera':     { commonName: 'Coconut Palm',    indianNames: ['Nariyal', 'Naariyel'] },

  // ── Fig family ────────────────────────────────────────────────────────────────
  'Ficus benjamina':    { commonName: 'Weeping Fig',    indianNames: ['Benjamini', 'Bark Fig'] },
  'Ficus lyrata':       { commonName: 'Fiddle Leaf Fig', indianNames: [] },
  'Ficus religiosa':    { commonName: 'Peepal Tree',    indianNames: ['Sacred Fig', 'Ashwattha', 'Bodhi Tree'] },

  // ── Other tropicals ───────────────────────────────────────────────────────────
  'Pachira aquatica':   { commonName: 'Money Tree',     indianNames: ['Malabar Chestnut', 'Guiana Chestnut'] },
  'Caladium bicolor':   { commonName: 'Caladium',       indianNames: ['Elephant Ears', 'Heart of Jesus'] },
  'Adenium obesum':     { commonName: 'Desert Rose',    indianNames: ['Adenium', 'Karoo Rose'] },
  'Codiaeum variegatum':{ commonName: 'Croton',         indianNames: ['Garden Croton', 'Codiaeum'] },
  'Dracaena fragrans':  { commonName: 'Corn Plant',     indianNames: ['Dracaena', 'Happy Plant'] },
  'Aglaonema':          { commonName: 'Aglaonema',      indianNames: ['Chinese Evergreen', 'Lucky Red'] },
  'Aglaonema commutatum': { commonName: 'Aglaonema',    indianNames: ['Chinese Evergreen'] },

  // ── Water plants ──────────────────────────────────────────────────────────────
  'Nymphaea':           { commonName: 'Water Lily',     indianNames: ['Kamal', 'Padam', 'Nymphaea'] },
  'Nelumbo nucifera':   { commonName: 'Lotus',          indianNames: ['Kamal', 'Padma', 'Pundarika'] },
};

export interface NormalizedPlantName {
  commonName: string;
  scientificName: string;
  indianNames?: string[];
}

/**
 * Resolves a user-friendly plant name for Indian users.
 *
 * Priority:
 *  1. Local India-first table — familiar names like "Tulsi", "Temple Tree", "Mogra"
 *  2. Plant.id API common_names[] — uses the shortest readable entry
 *  3. Scientific name — last resort, never shown as the dominant title
 */
export function normalizePlantName(
  scientificName: string,
  apiCommonNames: string[] = [],
): NormalizedPlantName {
  // 1. Exact match
  const local = INDIA_PLANT_MAP[scientificName];
  if (local) {
    return { commonName: local.commonName, scientificName, indianNames: local.indianNames };
  }

  // 2. Case-insensitive fallback
  const lowerKey = scientificName.toLowerCase();
  const mapEntry = Object.entries(INDIA_PLANT_MAP).find(
    ([k]) => k.toLowerCase() === lowerKey,
  );
  if (mapEntry) {
    const [, val] = mapEntry;
    return { commonName: val.commonName, scientificName, indianNames: val.indianNames };
  }

  // 3. Genus-level match (first word of scientific name)
  const genus = scientificName.split(' ')[0];
  const genusEntry = Object.entries(INDIA_PLANT_MAP).find(
    ([k]) => k.split(' ')[0].toLowerCase() === genus.toLowerCase() && !k.includes(' '),
  );
  if (genusEntry) {
    const [, val] = genusEntry;
    return { commonName: val.commonName, scientificName, indianNames: val.indianNames };
  }

  // 4. API common names — prefer shorter, more familiar names, skip scientific-sounding ones
  if (apiCommonNames.length > 0) {
    const best =
      apiCommonNames.find((n) => n.length < 22 && !/\d/.test(n) && !/[A-Z]{2,}/.test(n)) ??
      apiCommonNames[0];
    const formatted = best.charAt(0).toUpperCase() + best.slice(1);
    return { commonName: formatted, scientificName };
  }

  // 5. Scientific name as display fallback — never ideal, but always readable
  return { commonName: scientificName, scientificName };
}
