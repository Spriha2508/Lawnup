import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';
import { assertQuotaAvailable, incrementUsage } from '../middleware/rateLimiter';

const db = admin.firestore();
const storage = admin.storage();

// Set once with: firebase functions:secrets:set PLANT_ID_KEY
const PLANT_ID_KEY = defineSecret('PLANT_ID_KEY');

const PLANT_ID_URL = 'https://plant.id/api/v3/identification';

// Mirrors the thresholds previously tuned on the client
// (src/services/api/plantIdentification.ts) — keep in sync.
const IS_PLANT_THRESHOLD = 0.40;
const MAX_IMAGES = 5;

// ── Wire types returned to the client ────────────────────────────────────────
// The client keeps presentation logic (name normalization, care guide,
// confidence labels); the server returns structured Plant.id data.

interface WireSuggestion {
  name: string;                 // latin/scientific name from Plant.id
  probability: number;
  commonNames: string[];
  watering?: { min?: number; max?: number };
}

interface WireDisease {
  name: string;
  probability: number;
  description?: string;
  treatment?: {
    prevention?: string[];
    chemical?: string[];
    biological?: string[];
  };
}

export interface ProcessPlantScanResult {
  scanId: string;
  imageUrl: string;             // durable Storage URL of the primary image
  isPlantProbability: number;
  isHealthyBinary: boolean;
  suggestions: WireSuggestion[];
  diseases: WireDisease[];
}

export const processPlantScan = onCall(
  { secrets: [PLANT_ID_KEY], timeoutSeconds: 90, memory: '512MiB' },
  async (request): Promise<ProcessPlantScanResult> => {
    const uid = requireAuth(request);
    const data = request.data as { imageBase64?: string; extraImagesBase64?: string[] };

    const primary = sanitizeBase64(data.imageBase64 ?? '');
    if (!primary || primary.length < 1000) {
      throw new HttpsError('invalid-argument', 'imageBase64 is missing or too short.');
    }

    const extras = (data.extraImagesBase64 ?? [])
      .map(sanitizeBase64)
      .filter((b) => b.length >= 1000)
      .slice(0, MAX_IMAGES - 1);

    // Read-only gate — quota is consumed only after a successful identification,
    // so blurry/not-a-plant photos never burn a free scan.
    await assertQuotaAvailable(uid, 'scan');

    // ── Call Plant.id v3 ─────────────────────────────────────────────────────
    // similar_images is only a valid modifier when true — omit it (false → HTTP 400).
    let plantIdData: PlantIdResponse;
    try {
      const res = await axios.post(
        PLANT_ID_URL,
        { images: [primary, ...extras], health: 'all' },
        {
          headers: { 'Api-Key': PLANT_ID_KEY.value(), 'Content-Type': 'application/json' },
          timeout: 30_000,
        },
      );
      plantIdData = res.data as PlantIdResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        logger.error('Plant.id request failed', { uid, status, body: JSON.stringify(err.response?.data)?.slice(0, 300) });
        if (status >= 400 && status < 500) {
          throw new HttpsError('internal', `Plant.id rejected the request (HTTP ${status}).`);
        }
        throw new HttpsError('unavailable', 'Plant identification service is busy — try again.');
      }
      throw new HttpsError('internal', 'Plant identification failed unexpectedly.');
    }

    // ── is_plant gate ────────────────────────────────────────────────────────
    const isPlantProbability = plantIdData.result?.is_plant?.probability ?? 1;
    if (isPlantProbability < IS_PLANT_THRESHOLD) {
      throw new HttpsError('failed-precondition', 'not_plant_detected');
    }

    const rawSuggestions = plantIdData.result?.classification?.suggestions ?? [];
    const suggestions: WireSuggestion[] = rawSuggestions.slice(0, 4).map((s) => ({
      name: s.name,
      probability: s.probability,
      commonNames: s.details?.common_names ?? [],
      watering: s.details?.watering,
    }));

    const isHealthyBinary = plantIdData.result?.is_healthy?.binary ?? true;
    const diseases: WireDisease[] = (plantIdData.result?.disease?.suggestions ?? [])
      .slice(0, 5)
      .map((d) => ({
        name: d.name,
        probability: d.probability,
        description: d.details?.description,
        treatment: d.details?.treatment,
      }));

    // ── Persist image + scan history (best-effort: never fail the scan) ─────
    const scanId = db.collection('plant_scans').doc().id;
    let imageUrl = '';
    try {
      const fileName = `scans/${uid}/${scanId}/photo.jpg`;
      const file = storage.bucket().file(fileName);
      await file.save(Buffer.from(primary, 'base64'), {
        metadata: { contentType: 'image/jpeg' },
      });
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: '2099-01-01' });
      imageUrl = signedUrl;
    } catch (err) {
      logger.warn('Scan image upload failed — continuing without imageUrl', { uid, scanId, err });
    }

    try {
      await db.collection('plant_scans').doc(scanId).set({
        scanId,
        userId: uid,
        imageUrl,
        status: 'completed',
        isPlantProbability,
        isHealthy: isHealthyBinary,
        topSuggestion: suggestions[0]?.name ?? null,
        topConfidence: suggestions[0]?.probability ?? 0,
        suggestions,
        diseases,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.error('plant_scans write failed', { uid, scanId, err });
    }

    // Consume quota only after successful identification
    await incrementUsage(uid, 'scan');

    return { scanId, imageUrl, isPlantProbability, isHealthyBinary, suggestions, diseases };
  },
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeBase64(raw: string): string {
  return raw
    .replace(/^data:image\/\w+;base64,/, '')
    .replace(/[\r\n]/g, '')
    .trim();
}

interface PlantIdResponse {
  result?: {
    is_plant?: { probability: number; binary: boolean };
    is_healthy?: { probability: number; binary: boolean };
    classification?: {
      suggestions: Array<{
        name: string;
        probability: number;
        details?: {
          common_names?: string[];
          watering?: { min?: number; max?: number };
        };
      }>;
    };
    disease?: {
      suggestions: Array<{
        name: string;
        probability: number;
        details?: {
          description?: string;
          treatment?: {
            prevention?: string[];
            chemical?: string[];
            biological?: string[];
          };
        };
      }>;
    };
  };
}
