import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export type QualityLevel = 'good' | 'acceptable' | 'poor';
export type QualityIssue = 'too_dark' | 'blurry' | 'move_closer' | null;

export interface QualityMetrics {
  thumbBytes: number;
  blurScore: number;       // 0–100, higher = sharper
  brightnessScore: number; // 0–100, higher = brighter
  coverageScore: number;   // 0–100, placeholder for future ML integration
  overallScore: number;    // 0–100 weighted composite
}

export interface ImageQualityResult {
  level: QualityLevel;
  issue: QualityIssue;
  feedback: string;
  metrics: QualityMetrics;
}

// JPEG entropy thresholds for a 96px-wide thumbnail at 50% quality.
// Err on the side of leniency — false "poor" blocks hurt trust more than
// sending a slightly blurry photo. Plant.id handles moderate blur well.
const BYTES_VERY_DARK = 320;  // < 0.3 KB  →  almost black / lens covered
const BYTES_BLURRY    = 700;  // < 0.7 KB  →  severely blurry / featureless
const BYTES_GOOD      = 2200; // > 2.2 KB  →  sharp, well-lit

export async function analyzeImageQuality(imageUri: string): Promise<ImageQualityResult> {
  let thumbUri: string | null = null;

  try {
    // Resize to 96px wide — fast, low memory, enough detail for entropy check
    const thumb = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 96 } }],
      { compress: 0.50, format: ImageManipulator.SaveFormat.JPEG, base64: false },
    );
    thumbUri = thumb.uri;

    const info = await FileSystem.getInfoAsync(thumb.uri);
    const thumbBytes = info.exists && 'size' in info ? (info as { exists: true; size: number }).size : 0;

    // Blur score: based on entropy relative to a "sharp" image benchmark
    const blurScore = Math.min(100, Math.round((thumbBytes / BYTES_GOOD) * 100));

    // Brightness score: very dark images cluster near zero bytes regardless of content
    const brightnessScore =
      thumbBytes < BYTES_VERY_DARK ? 10
      : thumbBytes < BYTES_BLURRY ? 42
      : 85;

    // Coverage: no pixel access available — held at 70 for future ML replacement
    const coverageScore = 70;

    const overallScore = Math.round(
      blurScore * 0.55 + brightnessScore * 0.35 + coverageScore * 0.10,
    );

    const metrics: QualityMetrics = {
      thumbBytes,
      blurScore,
      brightnessScore,
      coverageScore,
      overallScore,
    };

    if (thumbBytes < BYTES_VERY_DARK) {
      return {
        level: 'poor',
        issue: 'too_dark',
        feedback: 'More light needed — try near a window or in natural daylight',
        metrics,
      };
    }

    if (thumbBytes < BYTES_BLURRY) {
      return {
        level: 'poor',
        issue: 'blurry',
        feedback: 'Hold steady for a clearer scan',
        metrics,
      };
    }

    if (thumbBytes < BYTES_GOOD) {
      return {
        level: 'acceptable',
        issue: null,
        feedback: 'Looks good — tap Analyse to continue',
        metrics,
      };
    }

    return {
      level: 'good',
      issue: null,
      feedback: 'Great shot',
      metrics,
    };

  } catch (err) {
    // Fail open — never block a scan because the quality check itself threw
    if (__DEV__) console.warn('[ImageQuality] analysis threw — failing open:', err);
    return {
      level: 'acceptable',
      issue: null,
      feedback: '',
      metrics: { thumbBytes: 0, blurScore: 50, brightnessScore: 50, coverageScore: 50, overallScore: 50 },
    };
  } finally {
    if (thumbUri) {
      FileSystem.deleteAsync(thumbUri, { idempotent: true }).catch(() => {});
    }
  }
}
