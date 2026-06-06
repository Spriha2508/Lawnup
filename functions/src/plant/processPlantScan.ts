import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';
import { checkAndDecrementQuota } from '../middleware/rateLimiter';

const db = admin.firestore();
const storage = admin.storage();

export const processPlantScan = functions
  .region('asia-south1')
  .https.onCall(async (data: { imageBase64: string }, context) => {
    const uid = requireAuth(context);

    if (!data.imageBase64) {
      throw new functions.https.HttpsError('invalid-argument', 'imageBase64 is required.');
    }

    // Check and decrement scan quota atomically
    await checkAndDecrementQuota(uid, 'scan');

    // Upload image to Firebase Storage
    const scanId = db.collection('plant_scans').doc().id;
    const fileName = `scans/${uid}/${scanId}/${Date.now()}.webp`;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    const buffer = Buffer.from(data.imageBase64, 'base64');
    await file.save(buffer, { metadata: { contentType: 'image/webp' } });
    const [imageUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '2099-01-01',
    });

    // Save processing placeholder
    await db.collection('plant_scans').doc(scanId).set({
      scanId,
      userId: uid,
      imageUrl,
      status: 'processing',
      plantIdResult: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Call Plant.id API
    const plantIdKey = functions.config().plantid?.key;
    const plantIdResponse = await axios.post(
      'https://api.plant.id/v3/identification',
      {
        images: [`data:image/webp;base64,${data.imageBase64}`],
        similar_images: false,
        health: 'all',
      },
      { headers: { 'Api-Key': plantIdKey, 'Content-Type': 'application/json' } }
    );

    const result = parsePlantIdResponse(plantIdResponse.data);

    // Update scan with results
    await db.collection('plant_scans').doc(scanId).update({
      status: 'completed',
      plantIdResult: result,
    });

    return {
      scanId,
      plantName: result.commonName,
      confidence: result.confidence,
      isHealthy: result.isHealthy,
      diseases: result.diseases,
      suggestedActions: buildSuggestedActions(result),
    };
  });

const parsePlantIdResponse = (data: Record<string, unknown>) => {
  const suggestion = (data.result as Record<string, unknown>)?.classification as Record<string, unknown>;
  const bestMatch = (suggestion?.suggestions as unknown[])?.[0] as Record<string, unknown>;
  const health = (data.result as Record<string, unknown>)?.disease as Record<string, unknown>;
  const diseases = (health?.suggestions as unknown[] ?? []).map((d) => {
    const disease = d as Record<string, unknown>;
    return {
      name: disease.name as string,
      probability: (disease.probability as number) ?? 0,
      description: ((disease.details as Record<string, unknown>)?.description as string) ?? '',
      treatment: {
        chemical: ((disease.details as Record<string, unknown>)?.treatment as Record<string, unknown>)?.chemical as string ?? '',
        biological: ((disease.details as Record<string, unknown>)?.treatment as Record<string, unknown>)?.biological as string ?? '',
        prevention: ((disease.details as Record<string, unknown>)?.treatment as Record<string, unknown>)?.prevention as string ?? '',
      },
    };
  });

  return {
    commonName: (bestMatch?.name as string) ?? 'Unknown plant',
    scientificName: ((bestMatch?.details as Record<string, unknown>)?.scientific_name as string) ?? '',
    confidence: (bestMatch?.probability as number) ?? 0,
    isHealthy: (health?.is_healthy as Record<string, unknown>)?.probability as number > 0.5,
    diseases: diseases.filter((d) => d.probability > 0.2),
  };
};

const buildSuggestedActions = (result: ReturnType<typeof parsePlantIdResponse>): string[] => {
  const actions: string[] = [];
  if (!result.isHealthy && result.diseases.length > 0) {
    actions.push(`Check for ${result.diseases[0].name}`);
    actions.push('Consult a local nursery if condition worsens');
  } else {
    actions.push('Plant looks healthy — keep up the good care!');
  }
  actions.push('Save to My Plants to set up watering reminders');
  return actions;
};
