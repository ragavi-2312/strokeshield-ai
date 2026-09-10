/**
 * StrokeShield AI — Geometric Arm Drift & Motor Symmetry Engine
 *
 * Implements biacromial-normalized arm angle calculation, bilateral drift delta,
 * pronator sag estimation, and motor symmetry scoring.
 */

import { ARM_ANALYSIS_CONFIG } from './armAnalysisConfig';
import { ArmFrameMetrics, ArmQualityResult, PosePoint3D } from './types';
import { PoseLandmarkService } from './PoseLandmarks';

export class ArmAsymmetryCalculator {
  /**
   * Calculate single-frame motor metrics from pose landmarks.
   */
  public static calculateFrameMetrics(
    landmarks: PosePoint3D[],
    frameIndex: number,
    timestampMs: number,
    qualityResult: ArmQualityResult
  ): ArmFrameMetrics {
    if (!qualityResult.isValid) {
      return {
        frameIndex,
        timestampMs,
        leftArmElevationDeg: 0,
        rightArmElevationDeg: 0,
        driftAngleDeltaDeg: 0,
        normalizedDriftDelta: 0,
        biacromialDiameterNorm: qualityResult.shoulderWidthNorm,
        shoulderTiltDeg: qualityResult.bodyRollDeg,
        pronatorSagRatio: 0,
        driftSide: 'symmetric',
        driftPercent: 0,
        symmetryPercent: 100,
        isValid: false,
        rejectionReason: qualityResult.rejectionReason,
      };
    }

    const kp = PoseLandmarkService.extractKeypoints(landmarks);

    // 1. Biacromial Diameter (Shoulder-to-Shoulder Distance)
    const dxShoulders = kp.leftShoulder.x - kp.rightShoulder.x;
    const dyShoulders = kp.leftShoulder.y - kp.rightShoulder.y;
    const biacromialDiameter = Math.max(0.01, Math.sqrt(dxShoulders * dxShoulders + dyShoulders * dyShoulders));

    // 2. Left & Right Arm Elevation Angles Relative to Horizontal
    // Note: Canvas Y increases downward. Negative dy means arm is elevated above shoulder.
    const leftDx = Math.abs(kp.leftWrist.x - kp.leftShoulder.x);
    const leftDy = -(kp.leftWrist.y - kp.leftShoulder.y); // Positive = elevated above shoulder
    const leftArmElevationDeg = Math.atan2(leftDy, Math.max(0.001, leftDx)) * (180 / Math.PI);

    const rightDx = Math.abs(kp.rightWrist.x - kp.rightShoulder.x);
    const rightDy = -(kp.rightWrist.y - kp.rightShoulder.y);
    const rightArmElevationDeg = Math.atan2(rightDy, Math.max(0.001, rightDx)) * (180 / Math.PI);

    // 3. Bilateral Drift Delta Angle
    const driftAngleDeltaDeg = Math.abs(leftArmElevationDeg - rightArmElevationDeg);

    // 4. Normalized Vertical Distance Delta (relative to shoulder width)
    const normLeftDrop = (kp.leftWrist.y - kp.leftShoulder.y) / biacromialDiameter;
    const normRightDrop = (kp.rightWrist.y - kp.rightShoulder.y) / biacromialDiameter;
    const normalizedDriftDelta = Math.abs(normLeftDrop - normRightDrop);

    // 5. Determine Affected Side
    const thresholdDeg = ARM_ANALYSIS_CONFIG.CALIBRATION.DRIFT_DETECTION_THRESHOLD_DEG;
    let driftSide: 'left' | 'right' | 'symmetric' = 'symmetric';
    if (leftArmElevationDeg < rightArmElevationDeg - thresholdDeg) {
      driftSide = 'left'; // Left arm drooping significantly lower
    } else if (rightArmElevationDeg < leftArmElevationDeg - thresholdDeg) {
      driftSide = 'right'; // Right arm drooping significantly lower
    }

    // 6. Pronator Sag Ratio (wrist dropping below elbow)
    const leftElbowDrop = (kp.leftWrist.y - kp.leftElbow.y) / biacromialDiameter;
    const rightElbowDrop = (kp.rightWrist.y - kp.rightElbow.y) / biacromialDiameter;
    const pronatorSagRatio = Math.max(0, Math.max(leftElbowDrop, rightElbowDrop));

    // 7. Motor Drift Display Percentage & Symmetry Score
    const maxScale = ARM_ANALYSIS_CONFIG.CALIBRATION.MAX_DRIFT_ANGLE_SCALE_DEG;
    const driftRatio = Math.min(1.0, Math.max(0.0, driftAngleDeltaDeg / maxScale));
    const driftPercent = parseFloat((driftRatio * 100).toFixed(1));
    const symmetryPercent = parseFloat((100 - driftPercent).toFixed(1));

    return {
      frameIndex,
      timestampMs,
      leftArmElevationDeg: parseFloat(leftArmElevationDeg.toFixed(1)),
      rightArmElevationDeg: parseFloat(rightArmElevationDeg.toFixed(1)),
      driftAngleDeltaDeg: parseFloat(driftAngleDeltaDeg.toFixed(1)),
      normalizedDriftDelta: parseFloat(normalizedDriftDelta.toFixed(3)),
      biacromialDiameterNorm: parseFloat(biacromialDiameter.toFixed(3)),
      shoulderTiltDeg: parseFloat(qualityResult.bodyRollDeg.toFixed(1)),
      pronatorSagRatio: parseFloat(pronatorSagRatio.toFixed(3)),
      driftSide,
      driftPercent,
      symmetryPercent,
      isValid: true,
      rejectionReason: null,
    };
  }
}
