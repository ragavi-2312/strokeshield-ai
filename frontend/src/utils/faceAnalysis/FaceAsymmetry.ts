/**
 * StrokeShield AI — Mathematical Facial Asymmetry Calculation Engine
 * 
 * Provides transparent, scale-invariant, and position-invariant bilateral asymmetry measurements.
 * Normalizes all measurements relative to anatomical Inter-Ocular Distance (IOD).
 * 
 * IMPORTANT MEDICAL SAFETY:
 * - Represents geometric facial asymmetry percentage only.
 * - Does NOT calculate stroke probability or clinical diagnostic score.
 */

import { FACE_ANALYSIS_CONFIG } from './faceAnalysisConfig';
import { 
  FaceKeypoints, 
  Point2D, 
  RegionalAsymmetryScores, 
  SingleFrameAsymmetryResult,
  FrameQualityCheck 
} from './types';

export class FaceAsymmetryCalculator {
  /**
   * Perpendicular distance from a 2D point (x0, y0) to the line passing through (x1, y1) and (x2, y2).
   */
  public static pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
    const x0 = point.x;
    const y0 = point.y;
    const x1 = lineStart.x;
    const y1 = lineStart.y;
    const x2 = lineEnd.x;
    const y2 = lineEnd.y;

    const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Euclidean distance between two 2D points.
   */
  public static euclideanDistance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Calculate regional and overall facial asymmetry percentages from standardized keypoints.
   */
  public static calculateFacialAsymmetry(
    keypoints: FaceKeypoints,
    quality: FrameQualityCheck,
    frameIndex: number = 0,
    timestamp: number = Date.now()
  ): SingleFrameAsymmetryResult {
    const { midline, eyes, eyebrows, mouth, cheeks, jaw, interOcularDistance } = keypoints;
    const iod = interOcularDistance > 0 ? interOcularDistance : 1.0;

    // Facial Midline Reference Vector: Sellion (Nose Bridge) -> Menton (Chin)
    const lineStart = midline.sellion;
    const lineEnd = midline.chin;

    // ==========================================
    // 1. MOUTH & NASOLABIAL ASYMMETRY (Weight: 40%)
    // ==========================================
    // A. Cheilions (Mouth Corners)
    const leftCheilionDist = this.pointToLineDistance(mouth.leftCheilion, lineStart, lineEnd);
    const rightCheilionDist = this.pointToLineDistance(mouth.rightCheilion, lineStart, lineEnd);
    const cheilionLateralDeltaNorm = Math.abs(leftCheilionDist - rightCheilionDist) / iod;
    const cheilionVerticalDeltaNorm = Math.abs(mouth.leftCheilion.y - mouth.rightCheilion.y) / iod;

    // B. Upper / Lower Lip Symmetry
    const leftUpperLipDist = this.pointToLineDistance(mouth.leftUpperLip, lineStart, lineEnd);
    const rightUpperLipDist = this.pointToLineDistance(mouth.rightUpperLip, lineStart, lineEnd);
    const upperLipDeltaNorm = Math.abs(leftUpperLipDist - rightUpperLipDist) / iod;

    const leftLowerLipDist = this.pointToLineDistance(mouth.leftLowerLip, lineStart, lineEnd);
    const rightLowerLipDist = this.pointToLineDistance(mouth.rightLowerLip, lineStart, lineEnd);
    const lowerLipDeltaNorm = Math.abs(leftLowerLipDist - rightLowerLipDist) / iod;

    // C. Nasolabial Fold Symmetry
    const leftNasolabialDist = this.pointToLineDistance(mouth.leftNasolabial, lineStart, lineEnd);
    const rightNasolabialDist = this.pointToLineDistance(mouth.rightNasolabial, lineStart, lineEnd);
    const nasolabialDeltaNorm = Math.abs(leftNasolabialDist - rightNasolabialDist) / iod;

    const rawMouthDelta = 
      cheilionVerticalDeltaNorm * 0.45 +
      cheilionLateralDeltaNorm * 0.25 +
      nasolabialDeltaNorm * 0.15 +
      upperLipDeltaNorm * 0.08 +
      lowerLipDeltaNorm * 0.07;

    const mouthScore = Math.max(0, Math.min(100, Number((rawMouthDelta * FACE_ANALYSIS_CONFIG.SCALING_FACTORS.mouth).toFixed(1))));

    // ==========================================
    // 2. EYES ASYMMETRY (Weight: 20%)
    // ==========================================
    // A. Outer Canthi & Pupils
    const leftOuterCanthusDist = this.pointToLineDistance(eyes.leftOuterCanthus, lineStart, lineEnd);
    const rightOuterCanthusDist = this.pointToLineDistance(eyes.rightOuterCanthus, lineStart, lineEnd);
    const outerCanthusDeltaNorm = Math.abs(leftOuterCanthusDist - rightOuterCanthusDist) / iod;
    const pupilVerticalDeltaNorm = Math.abs(eyes.leftPupil.y - eyes.rightPupil.y) / iod;

    // B. Palpebral Aperture (Eye Opening Height)
    const leftAperture = Math.abs(eyes.leftLowerLid.y - eyes.leftUpperLid.y);
    const rightAperture = Math.abs(eyes.rightLowerLid.y - eyes.rightUpperLid.y);
    const apertureDeltaNorm = Math.abs(leftAperture - rightAperture) / iod;

    const rawEyesDelta = 
      pupilVerticalDeltaNorm * 0.45 +
      apertureDeltaNorm * 0.35 +
      outerCanthusDeltaNorm * 0.20;

    const eyesScore = Math.max(0, Math.min(100, Number((rawEyesDelta * FACE_ANALYSIS_CONFIG.SCALING_FACTORS.eyes).toFixed(1))));

    // ==========================================
    // 3. EYEBROWS ASYMMETRY (Weight: 15%)
    // ==========================================
    const leftBrowPeakDist = this.pointToLineDistance(eyebrows.leftPeak, lineStart, lineEnd);
    const rightBrowPeakDist = this.pointToLineDistance(eyebrows.rightPeak, lineStart, lineEnd);
    const browPeakLateralDeltaNorm = Math.abs(leftBrowPeakDist - rightBrowPeakDist) / iod;
    const browPeakVerticalDeltaNorm = Math.abs(eyebrows.leftPeak.y - eyebrows.rightPeak.y) / iod;

    const leftBrowInnerDist = this.pointToLineDistance(eyebrows.leftInner, lineStart, lineEnd);
    const rightBrowInnerDist = this.pointToLineDistance(eyebrows.rightInner, lineStart, lineEnd);
    const browInnerLateralDeltaNorm = Math.abs(leftBrowInnerDist - rightBrowInnerDist) / iod;
    const browInnerVerticalDeltaNorm = Math.abs(eyebrows.leftInner.y - eyebrows.rightInner.y) / iod;

    const rawEyebrowsDelta = 
      browPeakVerticalDeltaNorm * 0.50 +
      browInnerVerticalDeltaNorm * 0.25 +
      browPeakLateralDeltaNorm * 0.15 +
      browInnerLateralDeltaNorm * 0.10;

    const eyebrowsScore = Math.max(0, Math.min(100, Number((rawEyebrowsDelta * FACE_ANALYSIS_CONFIG.SCALING_FACTORS.eyebrows).toFixed(1))));

    // ==========================================
    // 4. CHEEKS ASYMMETRY (Weight: 15%)
    // ==========================================
    const leftCheekDist = this.pointToLineDistance(cheeks.leftCheek, lineStart, lineEnd);
    const rightCheekDist = this.pointToLineDistance(cheeks.rightCheek, lineStart, lineEnd);
    const cheekLateralDeltaNorm = Math.abs(leftCheekDist - rightCheekDist) / iod;
    const cheekVerticalDeltaNorm = Math.abs(cheeks.leftCheek.y - cheeks.rightCheek.y) / iod;

    const rawCheeksDelta = cheekLateralDeltaNorm * 0.65 + cheekVerticalDeltaNorm * 0.35;
    const cheeksScore = Math.max(0, Math.min(100, Number((rawCheeksDelta * FACE_ANALYSIS_CONFIG.SCALING_FACTORS.cheeks).toFixed(1))));

    // ==========================================
    // 5. JAW / MANDIBLE ASYMMETRY (Weight: 10%)
    // ==========================================
    const leftGonionDist = this.pointToLineDistance(jaw.leftGonion, lineStart, lineEnd);
    const rightGonionDist = this.pointToLineDistance(jaw.rightGonion, lineStart, lineEnd);
    const gonionLateralDeltaNorm = Math.abs(leftGonionDist - rightGonionDist) / iod;
    const gonionVerticalDeltaNorm = Math.abs(jaw.leftGonion.y - jaw.rightGonion.y) / iod;

    const rawJawDelta = gonionLateralDeltaNorm * 0.70 + gonionVerticalDeltaNorm * 0.30;
    const jawScore = Math.max(0, Math.min(100, Number((rawJawDelta * FACE_ANALYSIS_CONFIG.SCALING_FACTORS.jaw).toFixed(1))));

    // ==========================================
    // 6. COMPOSITE OVERALL ASYMMETRY & SYMMETRY %
    // ==========================================
    const regionalScores: RegionalAsymmetryScores = {
      mouth: mouthScore,
      eyes: eyesScore,
      eyebrows: eyebrowsScore,
      cheeks: cheeksScore,
      jaw: jawScore,
    };

    const { REGIONAL_WEIGHTS } = FACE_ANALYSIS_CONFIG;
    const weightedSum = 
      regionalScores.mouth * REGIONAL_WEIGHTS.mouth +
      regionalScores.eyes * REGIONAL_WEIGHTS.eyes +
      regionalScores.eyebrows * REGIONAL_WEIGHTS.eyebrows +
      regionalScores.cheeks * REGIONAL_WEIGHTS.cheeks +
      regionalScores.jaw * REGIONAL_WEIGHTS.jaw;

    const overallAsymmetryPercent = Math.max(0, Math.min(100, Number(weightedSum.toFixed(1))));
    const symmetryPercent = Math.max(0, Math.min(100, Number((100.0 - overallAsymmetryPercent).toFixed(1))));

    return {
      frameIndex,
      timestamp,
      isQualityValid: quality.isValid,
      quality,
      landmarks: keypoints,
      headPose: quality.headPose,
      regionalScores,
      overallAsymmetryPercent,
      symmetryPercent,
    };
  }
}
