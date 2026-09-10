/**
 * StrokeShield AI — Mathematical Facial Asymmetry Calculation Engine
 * 
 * Implements:
 * 1. Symmetry axis reflection / mirror transformation (L_reflected across facial midline)
 * 2. Point-level Euclidean error comparison (d_i = ||L_reflected - R||)
 * 3. Scale normalization by anatomical Inter-Ocular Distance (e_i = d_i / S)
 * 4. Region-level robust median aggregation across anatomical bilateral pairs
 * 5. Weighted composite raw normalized error
 * 6. Explicit separation of RAW NORMALIZED ERROR from DISPLAY PERCENTAGE
 * 
 * IMPORTANT MEDICAL SAFETY:
 * - Geometric measurement only.
 * - Does NOT calculate stroke probability or clinical diagnostic score.
 */

import { FACE_ANALYSIS_CONFIG, LandmarkPair } from './faceAnalysisConfig';
import { 
  FaceKeypoints, 
  Point2D, 
  RegionalAsymmetryScores, 
  RegionalRawErrors,
  SingleFrameAsymmetryResult,
  FrameQualityCheck 
} from './types';

export class FaceAsymmetryCalculator {
  /**
   * Mathematically reflect a 2D point (x, y) across a line defined by (p1 -> p2).
   * Line equation: (y2 - y1)x - (x2 - x1)y + (x2*y1 - y2*x1) = 0 -> Ax + By + C = 0
   */
  public static reflectPointAcrossLine(
    point: Point2D, 
    lineStart: Point2D, 
    lineEnd: Point2D
  ): Point2D {
    const x = point.x;
    const y = point.y;
    const x1 = lineStart.x;
    const y1 = lineStart.y;
    const x2 = lineEnd.x;
    const y2 = lineEnd.y;

    const A = y2 - y1;
    const B = -(x2 - x1);
    const C = x2 * y1 - y2 * x1;

    const denom = A * A + B * B;
    if (denom === 0) {
      return { x, y };
    }

    const factor = (2 * (A * x + B * y + C)) / denom;
    const xReflected = x - A * factor;
    const yReflected = y - B * factor;

    return {
      x: Number(xReflected.toFixed(2)),
      y: Number(yReflected.toFixed(2)),
    };
  }

  /**
   * Euclidean distance between two 2D points.
   */
  public static euclideanDistance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Calculate median of a numerical array.
   */
  public static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2.0;
  }

  /**
   * Calculate normalized point-level reflection asymmetry error for a bilateral pair:
   * 1. Reflect Left point across facial symmetry midline axis
   * 2. Compute Euclidean distance: d_i = ||L_reflected - R||
   * 3. Normalize by scale S (Inter-Ocular Distance): e_i = d_i / S
   */
  public static calculatePointPairError(
    leftPoint: Point2D,
    rightPoint: Point2D,
    axisStart: Point2D,
    axisEnd: Point2D,
    scaleS: number
  ): number {
    const s = scaleS > 0 ? scaleS : 1.0;
    const leftReflected = this.reflectPointAcrossLine(leftPoint, axisStart, axisEnd);
    const distance = this.euclideanDistance(leftReflected, rightPoint);
    return distance / s; // Dimensionless normalized error
  }

  /**
   * Calculate single frame asymmetry from standardized keypoints.
   */
  public static calculateFacialAsymmetry(
    keypoints: FaceKeypoints,
    quality: FrameQualityCheck,
    frameIndex: number = 0,
    timestamp: number = Date.now()
  ): SingleFrameAsymmetryResult {
    const scaleS = keypoints.interOcularDistance > 0 ? keypoints.interOcularDistance : 1.0;
    const axisStart = keypoints.midline.sellion;
    const axisEnd = keypoints.midline.chin;

    const { eyes, eyebrows, mouth, cheeks, jaw } = keypoints;

    // =========================================================================
    // 1. POINT-LEVEL REFLECTION ERRORS PER ANATOMICAL REGION
    // =========================================================================

    // A. EYES
    const eyesErrors: number[] = [
      this.calculatePointPairError(eyes.leftPupil, eyes.rightPupil, axisStart, axisEnd, scaleS) * 1.5,
      this.calculatePointPairError(eyes.leftOuterCanthus, eyes.rightOuterCanthus, axisStart, axisEnd, scaleS) * 1.2,
      this.calculatePointPairError(eyes.leftInnerCanthus, eyes.rightInnerCanthus, axisStart, axisEnd, scaleS),
      this.calculatePointPairError(eyes.leftUpperLid, eyes.rightUpperLid, axisStart, axisEnd, scaleS) * 1.2,
      this.calculatePointPairError(eyes.leftLowerLid, eyes.rightLowerLid, axisStart, axisEnd, scaleS) * 1.2,
    ];
    const rawEyesError = this.calculateMedian(eyesErrors);

    // B. EYEBROWS
    const eyebrowsErrors: number[] = [
      this.calculatePointPairError(eyebrows.leftInner, eyebrows.rightInner, axisStart, axisEnd, scaleS) * 1.2,
      this.calculatePointPairError(eyebrows.leftPeak, eyebrows.rightPeak, axisStart, axisEnd, scaleS) * 1.5,
      this.calculatePointPairError(eyebrows.leftOuter, eyebrows.rightOuter, axisStart, axisEnd, scaleS),
    ];
    const rawEyebrowsError = this.calculateMedian(eyebrowsErrors);

    // C. CHEEKS (Zygomatic prominence & contour)
    const cheeksErrors: number[] = [
      this.calculatePointPairError(cheeks.leftCheek, cheeks.rightCheek, axisStart, axisEnd, scaleS) * 1.4,
    ];
    const rawCheeksError = this.calculateMedian(cheeksErrors);

    // D. MOUTH & NASOLABIAL (Cheilions, lips, nasolabial folds)
    const mouthErrors: number[] = [
      this.calculatePointPairError(mouth.leftCheilion, mouth.rightCheilion, axisStart, axisEnd, scaleS) * 2.0,
      this.calculatePointPairError(mouth.leftUpperLip, mouth.rightUpperLip, axisStart, axisEnd, scaleS) * 1.2,
      this.calculatePointPairError(mouth.leftLowerLip, mouth.rightLowerLip, axisStart, axisEnd, scaleS) * 1.2,
      this.calculatePointPairError(mouth.leftNasolabial, mouth.rightNasolabial, axisStart, axisEnd, scaleS) * 1.3,
    ];
    const rawMouthError = this.calculateMedian(mouthErrors);

    // E. JAW / LOWER FACE (Gonion angle & mandibular line)
    const jawErrors: number[] = [
      this.calculatePointPairError(jaw.leftGonion, jaw.rightGonion, axisStart, axisEnd, scaleS) * 1.4,
      this.calculatePointPairError(jaw.leftJawline, jaw.rightJawline, axisStart, axisEnd, scaleS),
    ];
    const rawJawError = this.calculateMedian(jawErrors);

    // =========================================================================
    // 2. RAW NORMALIZED ASYMMETRY ERROR (Section 11 Concept A)
    // =========================================================================
    const rawRegionalErrors: RegionalRawErrors = {
      mouth: Number(rawMouthError.toFixed(4)),
      eyes: Number(rawEyesError.toFixed(4)),
      eyebrows: Number(rawEyebrowsError.toFixed(4)),
      cheeks: Number(rawCheeksError.toFixed(4)),
      jaw: Number(rawJawError.toFixed(4)),
    };

    const { REGION_WEIGHTS } = FACE_ANALYSIS_CONFIG;
    const rawNormalizedError = Number((
      rawRegionalErrors.mouth * REGION_WEIGHTS.mouth +
      rawRegionalErrors.eyes * REGION_WEIGHTS.eyes +
      rawRegionalErrors.eyebrows * REGION_WEIGHTS.eyebrows +
      rawRegionalErrors.cheeks * REGION_WEIGHTS.cheeks +
      rawRegionalErrors.jaw * REGION_WEIGHTS.jaw
    ).toFixed(4));

    // =========================================================================
    // 3. DISPLAY ASYMMETRY PERCENTAGE (Section 11 Concept B)
    // Formula: display_percentage = 100 * clamp(raw_error / R, 0, 1)
    // R is the clearly documented display normalization parameter in FACE_ANALYSIS_CONFIG
    // =========================================================================
    const { DISPLAY_NORMALIZATION_R, REGIONAL_NORMALIZATION_R } = FACE_ANALYSIS_CONFIG;

    const mouthScore = Number((Math.min(1.0, rawRegionalErrors.mouth / REGIONAL_NORMALIZATION_R.mouth) * 100).toFixed(1));
    const eyesScore = Number((Math.min(1.0, rawRegionalErrors.eyes / REGIONAL_NORMALIZATION_R.eyes) * 100).toFixed(1));
    const eyebrowsScore = Number((Math.min(1.0, rawRegionalErrors.eyebrows / REGIONAL_NORMALIZATION_R.eyebrows) * 100).toFixed(1));
    const cheeksScore = Number((Math.min(1.0, rawRegionalErrors.cheeks / REGIONAL_NORMALIZATION_R.cheeks) * 100).toFixed(1));
    const jawScore = Number((Math.min(1.0, rawRegionalErrors.jaw / REGIONAL_NORMALIZATION_R.jaw) * 100).toFixed(1));

    const regionalScores: RegionalAsymmetryScores = {
      mouth: Math.max(0, Math.min(100, mouthScore)),
      eyes: Math.max(0, Math.min(100, eyesScore)),
      eyebrows: Math.max(0, Math.min(100, eyebrowsScore)),
      cheeks: Math.max(0, Math.min(100, cheeksScore)),
      jaw: Math.max(0, Math.min(100, jawScore)),
    };

    const overallAsymmetryPercent = Number((
      Math.min(1.0, rawNormalizedError / DISPLAY_NORMALIZATION_R) * 100
    ).toFixed(1));

    const symmetryPercent = Math.max(0, Math.min(100, Number((100.0 - overallAsymmetryPercent).toFixed(1))));

    return {
      frameIndex,
      timestamp,
      isQualityValid: quality.isValid,
      quality,
      landmarks: keypoints,
      headPose: quality.headPose,
      rawNormalizedError,
      rawRegionalErrors,
      regionalScores,
      overallAsymmetryPercent,
      symmetryPercent,
    };
  }
}
