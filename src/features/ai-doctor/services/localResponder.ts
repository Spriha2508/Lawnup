/**
 * Local Dr. Banyan responder — used when no OpenAI key is configured
 * (internal-testing mode). It composes a grounded, helpful answer purely from
 * the retrieved knowledge in BanyanContext: light, seasonal watering, humidity,
 * fertiliser, soil recipe, diseases, propagation, toxicity.
 *
 * It never invents facts — if the plant isn't in the knowledge base it gives
 * safe general guidance and asks the user to scan/select a plant.
 */

import { currentSeason, SEASON_LABEL } from '../../../services/knowledge';
import type { BanyanContext } from '../../../services/knowledge/retrieval';
import type { BanyanDiagnosis } from '../../../services/knowledge';

interface Opts {
  nickname?: string | null;
  diagnosis?: BanyanDiagnosis | null;
}

export function localBanyanReply(query: string, ctx: BanyanContext, opts: Opts = {}): string {
  const q = query.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => q.includes(w));
  const r = ctx.resolved;
  const p = r?.plant;
  const season = currentSeason();
  const seasonLabel = SEASON_LABEL[season];
  const name = opts.nickname || p?.commonNameEn || 'your plant';

  // ── Social niceties ──────────────────────────────────────────────────────
  if (q.length <= 14 && has('hello', 'hi', 'hey', 'namaste')) {
    return `Hi! I'm Dr. Banyan 🌿 Ask me about ${p ? `your ${p.commonNameEn}` : 'your plants'} — watering, light, yellowing leaves, soil, pests, propagation, anything.`;
  }
  if (has('thank', 'thanks', 'thx')) return `Anytime — your ${name} is lucky to have you 🌱`;

  // ── Diagnosis acknowledgement (prepended) ────────────────────────────────
  let intro = '';
  if (opts.diagnosis) {
    const d = opts.diagnosis;
    intro = d.isHealthy
      ? `Good news — your ${d.commonName} looks healthy! `
      : `Your ${d.commonName}${d.diseases?.length ? ` may be showing ${d.diseases.map((x) => x.name).join(', ')}` : ' needs a little attention'}. `;
  }

  // ── Symptom / disease troubleshooting ────────────────────────────────────
  if (has('yellow', 'brown', 'spot', 'wilt', 'droop', 'dying', 'sick', 'pest', 'bug', 'insect', 'fungus', 'mould', 'mold', 'rot', 'curl', 'problem', 'disease', 'dropping', 'falling', 'leggy', 'mushy')) {
    const match = r?.diseases.find((d) =>
      d.keywords.some((k) => q.includes(k.toLowerCase())) ||
      d.symptoms.some((s) => s.toLowerCase().split(/\W+/).some((w) => w.length > 4 && q.includes(w))),
    );
    if (match) {
      const steps = match.treatment.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n');
      return `${intro}That sounds like ${match.name}. Common signs: ${match.symptoms.slice(0, 3).join(', ')}.\n\nWhat to do:\n${steps}`;
    }
    // generic: overwatering is the #1 cause of trouble
    return `${intro}For ${name}, most leaf trouble comes from watering. Check the soil 2–3 cm down: if it's still wet, hold off — soggy roots cause yellowing and mushy stems. If it's bone-dry and leaves are crisping, water more often.${p ? ` For reference, ${name} likes: ${p.light.toLowerCase()}.` : ''} Want me to walk through a specific symptom?`;
  }

  // ── Watering ─────────────────────────────────────────────────────────────
  if (has('water', 'thirsty', 'how often', 'overwater', 'underwater', 'moist', 'dry soil', 'drench')) {
    if (p) return `${intro}Watering ${name} (${seasonLabel}): ${p.watering[season]} Always check the top 2–3 cm of soil first — water only when it's starting to dry.`;
    return `${intro}A reliable rule: water only when the top 2–3 cm of soil feels dry. Most houseplants prefer a deep soak then time to dry out, rather than little sips daily. Tell me which plant and I'll give exact guidance.`;
  }

  // ── Light ────────────────────────────────────────────────────────────────
  if (has('light', 'sun', 'sunlight', 'shade', 'bright', 'window', 'dark', 'direct')) {
    if (p) return `${intro}Light for ${name}: ${p.light} A spot near a bright window (not harsh midday sun) suits most homes.`;
    return `${intro}Most indoor plants thrive in bright, indirect light — near a window but shielded from harsh midday sun. Low-light plants (pothos, snake plant, ZZ) tolerate dimmer corners. Which plant did you mean?`;
  }

  // ── Humidity ─────────────────────────────────────────────────────────────
  if (has('humid', 'mist', 'misting', 'dry air', 'crispy tip')) {
    if (p) return `${intro}Humidity for ${name}: ${p.humidity} Grouping plants, a pebble tray, or occasional misting all help in dry air.`;
    return `${intro}Brown, crispy leaf edges usually mean the air is too dry. Group plants together, use a pebble-and-water tray, or mist tropical types. Which plant?`;
  }

  // ── Fertiliser ───────────────────────────────────────────────────────────
  if (has('fertil', 'feed', 'feeding', 'nutrient', 'npk', 'manure', 'compost')) {
    if (p) return `${intro}Feeding ${name}: ${p.fertilizer} Feed during active growth (spring–monsoon) and ease off in winter.`;
    return `${intro}Feed during the growing season (spring through monsoon) with a balanced liquid fertiliser, roughly every 3–4 weeks, and pause in winter when growth slows. Which plant?`;
  }

  // ── Soil / repotting ─────────────────────────────────────────────────────
  if (has('soil', 'repot', 'potting', 'mix', 'transplant', 'pot ')) {
    if (r?.soil) {
      const parts = r.soil.components.map((c) => `${c.material} ${c.percent}%`).join(' · ');
      return `${intro}Soil mix for ${name} — ${r.soil.name}: ${parts}${r.soil.ph ? ` (pH ${r.soil.ph})` : ''}. Repot into a pot one size up with drainage holes when roots fill the current one.`;
    }
    return `${intro}A good all-round mix: 50% potting soil, 30% cocopeat or compost, 20% coarse sand/perlite for drainage. Always use a pot with drainage holes. Which plant are you repotting?`;
  }

  // ── Propagation ──────────────────────────────────────────────────────────
  if (has('propagat', 'cutting', 'grow new', 'multiply', 'new plant', 'clone', 'baby plant')) {
    if (r?.propagation.length) {
      const m = r.propagation[0];
      const steps = m.steps.slice(0, 4).map((t, i) => `${i + 1}. ${t}`).join('\n');
      return `${intro}You can propagate ${name} by ${m.name.toLowerCase()}:\n${steps}`;
    }
    return `${intro}Many houseplants propagate from stem cuttings: snip below a node, root it in water or moist mix, and pot up once roots are 3–4 cm long. Tell me the plant for exact steps.`;
  }

  // ── Safety / toxicity ────────────────────────────────────────────────────
  if (has('toxic', 'poison', 'safe', 'pet', 'cat', 'dog', 'child', 'baby', 'edible')) {
    if (p?.toxicity) return `${intro}Safety note for ${name}: ${p.toxicity}`;
    return `${intro}Toxicity varies by plant — many common ones (pothos, philodendron, lilies) are mildly toxic if chewed, so keep them away from curious pets and toddlers. Which plant should I check?`;
  }

  // ── Flowering ────────────────────────────────────────────────────────────
  if (has('bloom', 'flower', 'flowering', 'buds')) {
    if (p?.tags.includes('flowering')) return `${intro}To keep ${name} blooming: plenty of bright light, feed with a bloom-boosting (higher-phosphorus) fertiliser through the growing season, and remove spent flowers. ${p.seasonalCare[season]}`;
    return `${intro}For more blooms: maximise bright light, feed during the growing season, and don't over-water. Tell me the plant and I'll tailor it.`;
  }

  // ── Seasonal / general care ──────────────────────────────────────────────
  if (p) {
    return `${intro}Here's the essentials for ${name}:\n• Light: ${p.light}\n• Water (${seasonLabel}): ${p.watering[season]}\n• Humidity: ${p.humidity}\n\nAsk me about watering, soil, pests, feeding, or propagation for more.`;
  }

  return `${intro}I can help with watering, light, soil, feeding, pests, and propagation. Which plant are you asking about? Scan one or open it from your garden and I'll give exact, grounded advice 🌿`;
}
