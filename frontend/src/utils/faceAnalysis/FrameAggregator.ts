/**
 * StrokeShield AI — Multi-Frame Temporal Aggregator
 * 
 * Aggregates multiple video frames over 5 seconds using:
 * - Median statistical aggregation (resistant to blinks, sudden twitches, and outlier noise)
 * - Measurement dispersion & standard deviation calculation
 * - Technical Analysis Quality grading (HIGH / MEDIUM / LOW)
 * - Transparent rejection breakdown tracking
 */

import { FACE_ANALYSIS_CONFIG } from './faceAnalysisConfig';
import { 
  AnalysisQualityTier, 
  MultiFrameAggregatedResult, 
  RegionalAsymmetryScores, 
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
      return Number(sorted[mid].toFixed(1));
    }
    return Number(((sorted[mid - 1] + sorted[mid]) / 2.0).toFixed(1));
  }

  /**
   * Calculate arithmetic mean.
   */
  public static calculateMean(values: number[]): number {
    if (values.length === 0) return 0.0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return Number((sum / values.length).toFixed(1));
  }

  /**
   * Calculate population standard deviation.
   */
  public static calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0.0;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    return Number(Math.sqrt(variance).toFixed(1));
  }

  /**
   * Calculate Inter-Quartile Range (IQR = Q3 - Q1).
   */
  public static calculateIQR(values: number[]): number {
    if (values.length < 4) return 0.0;
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    return Number((q3 - q1).toFixed(1));
  }

  /**
   * Aggregate multi-frame sample into a comprehensive result.
   */
  public static aggregateFrames(frames: SingleFrameAsymmetryResult[]): MultiFrameAggregatedResult {
    const totalFrames = frames.length;
    const validFrames = frames.filter((f) => f.isQualityValid);
    const validFramesCount = validFrames.length;
    const rejectedFramesCount = totalFrames - validFramesCount;

    // Track rejection reasons
    const rejectionBreakdown: Record<RejectionReason, number> = {
      NO_FACE: 0,
      MULTIPLE_FACES: 0,
      LOW_CONFIDENCE: 0,
      FACE_TOO_SMALL: 0,
      FACE_NOT_FRONTAL: 0,
      POOR_LIGHTING: 0,
      EXCESSIVE_MOTION: 0,
      BLURRY_FRAME: 0,
    };

    frames.forEach((f) => {
      if (!f.isQualityValid && f.quality.rejectionReason) {
        rejectionBreakdown[f.quality.rejectionReason] =
          (rejectionBreakdown[f.quality.rejectionReason] || 0) + 1;
      }
    });

    // Insufficient frames fallback
    if (validFramesCount === 0) {
      return {
        totalFrames,
        validFramesCount: 0,
        rejectedFramesCount: totalFrames,
        rejectionBreakdown,
        medianOverallAsymmetryPercent: 0.0,
        medianSymmetryPercent: 100.0,
        meanOverallAsymmetryPercent: 0.0,
        medianRegionalScores: { eyes: 0, eyebrows: 0, mouth: 0, cheeks: 0, jaw: 0 },
        standardDeviation: 0.0,
        interQuartileRange: 0.0,
        isStableMeasurement: false,
        analysisQuality: 'LOW',
        qualityExplanation: 'Image quality was not sufficient for reliable facial analysis. Please repeat the test with better lighting and keep your face straight.',
        highestAsymmetryRegion: 'None',
        highestAsymmetryRegionScore: 0.0,
        averageHeadPose: { yaw: 0, pitch: 0, roll: 0 },
        modelName: FACE_ANALYSIS_CONFIG.MODEL_NAME,
        modelVersion: FACE_ANALYSIS_CONFIG.MODEL_VERSION,
        timestamp: new Date().toISOString(),
      };
    }

    // Extract arrays of measurements across valid frames
    const overallScores = validFrames.map((f) => f.overallAsymmetryPercent);
    const mouthScores = validFrames.map((f) => f.regionalScores.mouth);
    const eyesScores = validFrames.map((f) => f.regionalScores.eyes);
    const eyebrowScores = validFrames.map((f) => f.regionalScores.eyebrows);
    const cheekScores = validFrames.map((f) => f.regionalScores.cheeks);
    const jawScores = validFrames.map((f) => f.regionalScores.jaw);

    // Compute Medians
    const medianOverallAsymmetryPercent = this.calculateMedian(overallScores);
    const medianSymmetryPercent = Math.max(0, Math.min(100, Number((100.0 - medianOverallAsymmetryPercent).toFixed(1))));
    const meanOverallAsymmetryPercent = this.calculateMean(overallScores);

    const medianRegionalScores: RegionalAsymmetryScores = {
      mouth: this.calculateMedian(mouthScores),
      eyes: this.calculateMedian(eyesScores),
      eyebrows: this.calculateMedian(eyebrowScores),
      cheeks: this.calculateMedian(cheekScores),
      jaw: this.calculateMedian(jawScores),
    };

    // Dispersion Metrics
    const standardDeviation = this.calculateStdDev(overallScores, meanOverallAsymmetryPercent);
    const interQuartileRange = this.calculateIQR(overallScores);
    const isStableMeasurement = standardDeviation <= FACE_ANALYSIS_CONFIG.MAX_STD_DEV_HIGH_QUALITY;

    // Head Pose Averages
    const avgYaw = this.calculateMean(validFrames.map((f) => f.headPose.yawDeg));
    const avgPitch = this.calculateMean(validFrames.map((f) => f.headPose.pitchDeg));
    const avgRoll = this.calculateMean(validFrames.map((f) => f.headPose.rollDeg));

    // Determine Technical Analysis Quality Tier
    let analysisQuality: AnalysisQualityTier = 'LOW';
    let qualityExplanation = '';

    const { MIN_VALID_FRAMES_HIGH_QUALITY, MIN_VALID_FRAMES_MEDIUM_QUALITY, MAX_STD_DEV_HIGH_QUALITY, MAX_STD_DEV_MEDIUM_QUALITY } = FACE_ANALYSIS_CONFIG;

    if (validFramesCount >= MIN_VALID_FRAMES_HIGH_QUALITY && standardDeviation <= MAX_STD_DEV_HIGH_QUALITY) {
      analysisQuality = 'HIGH';
      qualityExplanation = `High measurement quality (${validFramesCount}/${totalFrames} frames accepted, stable head position, optimal lighting).`;
    } else if (validFramesCount >= MIN_VALID_FRAMES_MEDIUM_QUALITY && standardDeviation <= MAX_STD_DEV_MEDIUM_QUALITY) {
      analysisQuality = 'MEDIUM';
      qualityExplanation = `Moderate measurement quality (${validFramesCount}/${totalFrames} frames accepted, minor movement detected).`;
    } else {
      analysisQuality = 'LOW';
      qualityExplanation = 'Image quality was not sufficient for reliable facial analysis. Please repeat the test with better lighting and keep your face straight.';
    }

    // Identify Highest Asymmetry Region
    const regionEntries: [string, number][] = [
      ['Mouth', medianRegionalScores.mouth],
      ['Eyes', medianRegionalScores.eyes],
      ['Eyebrows', medianRegionalScores.eyebrows],
      ['Cheeks', medianRegionalScores.cheeks],
      ['Jaw', medianRegionalScores.jaw],
    ];

    regionEntries.sort((a, b) => b[1] - a[1]);
    const highestAsymmetryRegion = regionEntries[0][0];
    const highestAsymmetryRegionScore = regionEntries[0][1];

    return {
      totalFrames,
      validFramesCount,
      rejectedFramesCount,
      rejectionBreakdown,
      medianOverallAsymmetryPercent,
      medianSymmetryPercent,
      meanOverallAsymmetryPercent,
      medianRegionalScores,
      standardDeviation,
      interQuartileRange,
      isStableMeasurement,
      analysisQuality,
      qualityExplanation,
      highestAsymmetryRegion,
      highestAsymmetryRegionScore,
      averageHeadPose: {
        yaw: avgYaw,
        pitch: avgPitch,
        roll: avgRoll,
      },
      modelName: FACE_ANALYSIS_CONFIG.MODEL_NAME,
      modelVersion: FACE_ANALYSIS_CONFIG.MODEL_VERSION,
      timestamp: new Date().toISOString(),
    };
  }
}
