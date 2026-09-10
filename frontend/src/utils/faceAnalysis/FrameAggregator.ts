/**
 * StrokeShield AI — Multi-Frame Temporal Aggregator
 * 
 * Aggregates multiple video frames over 5 seconds using:
 * - Median raw error aggregation (FINAL_RAW_ERROR = median(valid_frame_raw_errors))
 * - Median Absolute Deviation (MAD) for robust temporal stability / dispersion
 * - Technical Analysis Quality grading (HIGH / MEDIUM / LOW)
 * - Returns the exact typed result object specified in Section 16
 */

import { FACE_ANALYSIS_CONFIG } from './faceAnalysisConfig';
import { 
  AnalysisQualityTier, 
  FaceAnalysisTypedResult, 
  RegionalAsymmetryScores, 
  RegionalRawErrors,
  RejectionReason, 
  SingleFrameAsymmetryResult 
} from './types';

export class FrameAggregator {
  /**
   * Calculate median of a numerical array.
   */
  public static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0.0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return Number(sorted[mid].toFixed(4));
    }
    return Number(((sorted[mid - 1] + sorted[mid]) / 2.0).toFixed(4));
  }

  /**
   * Calculate arithmetic mean.
   */
  public static calculateMean(values: number[]): number {
    if (values.length === 0) return 0.0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return Number((sum / values.length).toFixed(4));
  }

  /**
   * Calculate Median Absolute Deviation (MAD = median(|x_i - median(x)|)).
   * Robust statistical dispersion measure resistant to outlier frames.
   */
  public static calculateMAD(values: number[], median: number): number {
    if (values.length <= 1) return 0.0;
    const deviations = values.map((v) => Math.abs(v - median));
    return this.calculateMedian(deviations);
  }

  /**
   * Calculate population standard deviation.
   */
  public static calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0.0;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    return Number(Math.sqrt(variance).toFixed(4));
  }

  /**
   * Aggregate multi-frame sample into the typed Section 16 result object.
   */
  public static aggregateFrames(frames: SingleFrameAsymmetryResult[]): FaceAnalysisTypedResult {
    const totalFrames = frames.length;
    const validFrames = frames.filter((f) => f.isQualityValid);
    const validFramesCount = validFrames.length;
    const rejectedFramesCount = totalFrames - validFramesCount;
    const frameAcceptanceRate = totalFrames > 0 ? Number((validFramesCount / totalFrames).toFixed(2)) : 0;

    // Zero valid frames fallback (Section 15: Do NOT return percentage when quality is insufficient)
    if (validFramesCount === 0) {
      return {
        analysisType: 'FACIAL_ASYMMETRY',
        overallAsymmetryPercent: null,
        symmetryPercent: null,
        rawNormalizedError: null,
        regionalScores: {
          eyes: null,
          eyebrows: null,
          cheeks: null,
          mouth: null,
          jaw: null,
        },
        rawRegionalErrors: {
          eyes: null,
          eyebrows: null,
          cheeks: null,
          mouth: null,
          jaw: null,
        },
        totalFrames,
        validFrames: 0,
        rejectedFrames: totalFrames,
        frameAcceptanceRate: 0,
        measurementVariability: null,
        analysisQuality: 'LOW',
        qualityExplanation: 'Insufficient image quality for facial analysis. Please face the camera directly and repeat the test.',
        highestAsymmetryRegion: null,
        highestAsymmetryRegionScore: null,
        averageHeadPose: { yaw: 0, pitch: 0, roll: 0 },
        modelName: FACE_ANALYSIS_CONFIG.MODEL_NAME,
        modelVersion: FACE_ANALYSIS_CONFIG.MODEL_VERSION,
        timestamp: new Date().toISOString(),
      };
    }

    // 1. Raw Normalized Errors across valid frames
    const rawOverallErrors = validFrames.map((f) => f.rawNormalizedError);
    const rawMouthErrors = validFrames.map((f) => f.rawRegionalErrors.mouth);
    const rawEyesErrors = validFrames.map((f) => f.rawRegionalErrors.eyes);
    const rawEyebrowErrors = validFrames.map((f) => f.rawRegionalErrors.eyebrows);
    const rawCheekErrors = validFrames.map((f) => f.rawRegionalErrors.cheeks);
    const rawJawErrors = validFrames.map((f) => f.rawRegionalErrors.jaw);

    // 2. Final Raw Median Aggregation (Section 13)
    const finalRawError = this.calculateMedian(rawOverallErrors);
    const rawRegionalErrors: RegionalRawErrors = {
      mouth: this.calculateMedian(rawMouthErrors),
      eyes: this.calculateMedian(rawEyesErrors),
      eyebrows: this.calculateMedian(rawEyebrowErrors),
      cheeks: this.calculateMedian(rawCheekErrors),
      jaw: this.calculateMedian(rawJawErrors),
    };

    // 3. Temporal Dispersion / Measurement Variability (Section 14: MAD)
    const rawMAD = this.calculateMAD(rawOverallErrors, finalRawError);
    const { DISPLAY_NORMALIZATION_R, REGIONAL_NORMALIZATION_R } = FACE_ANALYSIS_CONFIG;
    const dispersionPercent = Number(((rawMAD / DISPLAY_NORMALIZATION_R) * 100).toFixed(1));

    // 4. Display Percentages from Median Raw Errors (Section 11)
    const overallAsymmetryPercent = Number((
      Math.min(1.0, finalRawError / DISPLAY_NORMALIZATION_R) * 100
    ).toFixed(1));

    const symmetryPercent = Math.max(0, Math.min(100, Number((100.0 - overallAsymmetryPercent).toFixed(1))));

    const regionalScores: RegionalAsymmetryScores = {
      mouth: Number((Math.min(1.0, rawRegionalErrors.mouth / REGIONAL_NORMALIZATION_R.mouth) * 100).toFixed(1)),
      eyes: Number((Math.min(1.0, rawRegionalErrors.eyes / REGIONAL_NORMALIZATION_R.eyes) * 100).toFixed(1)),
      eyebrows: Number((Math.min(1.0, rawRegionalErrors.eyebrows / REGIONAL_NORMALIZATION_R.eyebrows) * 100).toFixed(1)),
      cheeks: Number((Math.min(1.0, rawRegionalErrors.cheeks / REGIONAL_NORMALIZATION_R.cheeks) * 100).toFixed(1)),
      jaw: Number((Math.min(1.0, rawRegionalErrors.jaw / REGIONAL_NORMALIZATION_R.jaw) * 100).toFixed(1)),
    };

    // 5. Determine Technical Analysis Quality Tier (Section 15)
    let analysisQuality: AnalysisQualityTier = 'LOW';
    let qualityExplanation = '';

    const { MIN_VALID_FRAMES_HIGH_QUALITY, MIN_VALID_FRAMES_MEDIUM_QUALITY, MAX_DISPERSION_HIGH_QUALITY, MAX_DISPERSION_MEDIUM_QUALITY } = FACE_ANALYSIS_CONFIG;

    if (validFramesCount >= MIN_VALID_FRAMES_HIGH_QUALITY && dispersionPercent <= MAX_DISPERSION_HIGH_QUALITY) {
      analysisQuality = 'HIGH';
      qualityExplanation = `High measurement quality (${validFramesCount}/${totalFrames} frames accepted, acceptance rate: ${(frameAcceptanceRate * 100).toFixed(0)}%, stable head position, optimal lighting).`;
    } else if (validFramesCount >= MIN_VALID_FRAMES_MEDIUM_QUALITY && dispersionPercent <= MAX_DISPERSION_MEDIUM_QUALITY) {
      analysisQuality = 'MEDIUM';
      qualityExplanation = `Moderate measurement quality (${validFramesCount}/${totalFrames} frames accepted, acceptance rate: ${(frameAcceptanceRate * 100).toFixed(0)}%, minor movement detected).`;
    } else {
      analysisQuality = 'LOW';
      qualityExplanation = 'Insufficient image quality for reliable facial analysis. Please face the camera directly and repeat the test.';
    }

    // 6. Identify Highest Asymmetry Region
    const regionEntries: [string, number][] = [
      ['Mouth', regionalScores.mouth],
      ['Eyes', regionalScores.eyes],
      ['Eyebrows', regionalScores.eyebrows],
      ['Cheeks', regionalScores.cheeks],
      ['Jaw', regionalScores.jaw],
    ];
    regionEntries.sort((a, b) => b[1] - a[1]);
    const highestAsymmetryRegion = regionEntries[0][0];
    const highestAsymmetryRegionScore = regionEntries[0][1];

    // 7. Average Head Pose across valid frames
    const avgYaw = Number(this.calculateMean(validFrames.map((f) => f.headPose.yawDeg)).toFixed(1));
    const avgPitch = Number(this.calculateMean(validFrames.map((f) => f.headPose.pitchDeg)).toFixed(1));
    const avgRoll = Number(this.calculateMean(validFrames.map((f) => f.headPose.rollDeg)).toFixed(1));

    const isLowAndFew = analysisQuality === 'LOW' && validFramesCount < MIN_VALID_FRAMES_MEDIUM_QUALITY;

    return {
      analysisType: 'FACIAL_ASYMMETRY',
      overallAsymmetryPercent: isLowAndFew ? null : overallAsymmetryPercent,
      symmetryPercent: isLowAndFew ? null : symmetryPercent,
      medianOverallAsymmetryPercent: isLowAndFew ? null : overallAsymmetryPercent,
      medianSymmetryPercent: isLowAndFew ? null : symmetryPercent,
      rawNormalizedError: finalRawError,
      regionalScores: isLowAndFew ? { eyes: null, eyebrows: null, cheeks: null, mouth: null, jaw: null } : regionalScores,
      medianRegionalScores: isLowAndFew ? { eyes: null, eyebrows: null, cheeks: null, mouth: null, jaw: null } : regionalScores,
      rawRegionalErrors,
      totalFrames,
      validFrames: validFramesCount,
      rejectedFrames: rejectedFramesCount,
      frameAcceptanceRate,
      measurementVariability: dispersionPercent,
      analysisQuality,
      qualityExplanation,
      highestAsymmetryRegion: isLowAndFew ? null : highestAsymmetryRegion,
      highestAsymmetryRegionScore: isLowAndFew ? null : highestAsymmetryRegionScore,
      averageHeadPose: {
        yaw: avgYaw,
        pitch: avgPitch,
        roll: avgRoll,
      },
      validFramesCount,
      rejectedFramesCount,
      isStableMeasurement: dispersionPercent <= FACE_ANALYSIS_CONFIG.MAX_DISPERSION_HIGH_QUALITY,
      standardDeviation: dispersionPercent,
      modelName: FACE_ANALYSIS_CONFIG.MODEL_NAME,
      modelVersion: FACE_ANALYSIS_CONFIG.MODEL_VERSION,
      timestamp: new Date().toISOString(),
    };
  }
}
