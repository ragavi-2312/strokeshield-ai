/**
 * StrokeShield AI — Multi-Frame Arm Drift Temporal Aggregator
 *
 * Buffers frame-by-frame motor measurements, computes robust temporal median
 * statistics, evaluates downward drift velocity via linear regression, and assigns
 * clinical quality tiers (HIGH, MEDIUM, LOW).
 */

import { ARM_ANALYSIS_CONFIG } from './armAnalysisConfig';
import {
  ArmAnalysisQuality,
  ArmAnalysisTypedResult,
  ArmDriftPattern,
  ArmFrameMetrics,
} from './types';

export class ArmFrameAggregator {
  private frames: ArmFrameMetrics[] = [];
  private rejectionCounts: Record<string, number> = {
    NO_POSE: 0,
    MULTIPLE_BODIES: 0,
    ARMS_NOT_VISIBLE: 0,
    ARMS_NOT_RAISED: 0,
    POOR_LIGHTING: 0,
    BODY_TILTED: 0,
    BODY_OFF_SCALE: 0,
    LOW_CONFIDENCE: 0,
  };

  /**
   * Add a single processed frame to the aggregation buffer.
   */
  public addFrame(metrics: ArmFrameMetrics): void {
    this.frames.push(metrics);
    if (!metrics.isValid && metrics.rejectionReason) {
      this.rejectionCounts[metrics.rejectionReason] =
        (this.rejectionCounts[metrics.rejectionReason] || 0) + 1;
    }
  }

  /**
   * Clear all frame history and reset rejection counters.
   */
  public reset(): void {
    this.frames = [];
    Object.keys(this.rejectionCounts).forEach((k) => {
      this.rejectionCounts[k] = 0;
    });
  }

  public getValidFramesCount(): number {
    return this.frames.filter((f) => f.isValid).length;
  }

  public getTotalFramesCount(): number {
    return this.frames.length;
  }

  /**
   * Calculate final aggregated clinical metrics across the multi-frame holding session.
   */
  public calculateTemporalResult(
    doctorConfirmation: 'normal' | 'possible_drift' | 'abnormal' | 'unable_to_assess' = 'normal',
    doctorNotes: string = ''
  ): ArmAnalysisTypedResult {
    const totalFrames = this.frames.length;
    const validFrames = this.frames.filter((f) => f.isValid);
    const validCount = validFrames.length;
    const rejectedCount = totalFrames - validCount;
    const acceptanceRate = totalFrames > 0 ? parseFloat((validCount / totalFrames).toFixed(2)) : 0;

    // Quality Tiering
    let analysisQuality: ArmAnalysisQuality = 'LOW';
    if (validCount >= ARM_ANALYSIS_CONFIG.SAMPLING.MIN_VALID_FRAMES_HIGH) {
      analysisQuality = 'HIGH';
    } else if (validCount >= ARM_ANALYSIS_CONFIG.SAMPLING.MIN_VALID_FRAMES_MED) {
      analysisQuality = 'MEDIUM';
    } else {
      analysisQuality = 'LOW';
    }

    // If LOW quality, return null metrics for safety
    if (analysisQuality === 'LOW' || validCount === 0) {
      return {
        analysisQuality: 'LOW',
        medianDriftAngleDeg: 0,
        meanDriftAngleDeg: 0,
        maxDriftAngleDeg: 0,
        driftPercent: null,
        motorSymmetryPercent: null,
        affectedSide: 'symmetric',
        driftPattern: 'no_drift',
        driftVelocityDegPerSec: 0,
        measurementStabilityMAD: 0,
        totalFramesSampled: totalFrames,
        validFramesCount: validCount,
        rejectedFramesCount: rejectedCount,
        acceptanceRate,
        rejectionBreakdown: { ...this.rejectionCounts },
        timestamp: new Date().toISOString(),
        doctorConfirmation,
        doctorNotes,
        modelName: 'MediaPipe Tasks-Vision Pose Landmarker',
        modelVersion: 'v1.0.1 (Biacromial Normalized)',
      };
    }

    // 1. Median Drift Angle
    const driftAngles = validFrames.map((f) => f.driftAngleDeltaDeg).sort((a, b) => a - b);
    const mid = Math.floor(driftAngles.length / 2);
    const medianDriftAngleDeg =
      driftAngles.length % 2 !== 0
        ? driftAngles[mid]
        : (driftAngles[mid - 1] + driftAngles[mid]) / 2;

    // 2. Mean and Max Drift Angles
    const sumDrift = driftAngles.reduce((acc, v) => acc + v, 0);
    const meanDriftAngleDeg = parseFloat((sumDrift / validCount).toFixed(1));
    const maxDriftAngleDeg = Math.max(...driftAngles);

    // 3. Measurement Stability: Median Absolute Deviation (MAD)
    const absoluteDeviations = driftAngles
      .map((val) => Math.abs(val - medianDriftAngleDeg))
      .sort((a, b) => a - b);
    const madMid = Math.floor(absoluteDeviations.length / 2);
    const measurementStabilityMAD = parseFloat(
      (absoluteDeviations.length % 2 !== 0
        ? absoluteDeviations[madMid]
        : (absoluteDeviations[madMid - 1] + absoluteDeviations[madMid]) / 2
      ).toFixed(2)
    );

    // Downgrade HIGH to MEDIUM if MAD is excessive (noisy test / tremor)
    if (
      analysisQuality === 'HIGH' &&
      measurementStabilityMAD > ARM_ANALYSIS_CONFIG.CALIBRATION.STABILITY_MAD_MAX_HIGH
    ) {
      analysisQuality = 'MEDIUM';
    }

    // 4. Downward Drift Velocity via Linear Regression (dθ/dt in °/sec)
    let driftVelocityDegPerSec = 0;
    if (validFrames.length >= 5) {
      const startTime = validFrames[0].timestampMs;
      const timesSec = validFrames.map((f) => (f.timestampMs - startTime) / 1000);
      const angles = validFrames.map((f) => f.driftAngleDeltaDeg);

      const tMean = timesSec.reduce((a, b) => a + b, 0) / timesSec.length;
      const aMean = angles.reduce((a, b) => a + b, 0) / angles.length;

      let num = 0;
      let den = 0;
      for (let i = 0; i < timesSec.length; i++) {
        const dt = timesSec[i] - tMean;
        num += dt * (angles[i] - aMean);
        den += dt * dt;
      }
      driftVelocityDegPerSec = den > 0.001 ? parseFloat((num / den).toFixed(2)) : 0;
    }

    // 5. Affected Side Consensus
    let leftVotes = 0;
    let rightVotes = 0;
    validFrames.forEach((f) => {
      if (f.driftSide === 'left') leftVotes++;
      else if (f.driftSide === 'right') rightVotes++;
    });

    let affectedSide: 'left' | 'right' | 'symmetric' = 'symmetric';
    if (leftVotes > validCount * 0.45 && leftVotes > rightVotes) {
      affectedSide = 'left';
    } else if (rightVotes > validCount * 0.45 && rightVotes > leftVotes) {
      affectedSide = 'right';
    }

    // 6. Drift Pattern Classification
    let driftPattern: ArmDriftPattern = 'no_drift';
    if (medianDriftAngleDeg < ARM_ANALYSIS_CONFIG.CALIBRATION.DRIFT_DETECTION_THRESHOLD_DEG) {
      driftPattern = 'no_drift';
    } else if (medianDriftAngleDeg < 16.0) {
      driftPattern = 'mild_unilateral_drift';
    } else if (medianDriftAngleDeg < 30.0) {
      driftPattern = 'marked_unilateral_drift';
    } else {
      driftPattern = 'severe_plegia';
    }

    // 7. Display Motor Symmetry & Drift Percentage
    const maxScale = ARM_ANALYSIS_CONFIG.CALIBRATION.MAX_DRIFT_ANGLE_SCALE_DEG;
    const driftRatio = Math.min(1.0, Math.max(0.0, medianDriftAngleDeg / maxScale));
    const driftPercent = parseFloat((driftRatio * 100).toFixed(1));
    const motorSymmetryPercent = parseFloat((100 - driftPercent).toFixed(1));

    return {
      analysisQuality,
      medianDriftAngleDeg: parseFloat(medianDriftAngleDeg.toFixed(1)),
      meanDriftAngleDeg,
      maxDriftAngleDeg: parseFloat(maxDriftAngleDeg.toFixed(1)),
      driftPercent,
      motorSymmetryPercent,
      affectedSide,
      driftPattern,
      driftVelocityDegPerSec,
      measurementStabilityMAD,
      totalFramesSampled: totalFrames,
      validFramesCount: validCount,
      rejectedFramesCount: rejectedCount,
      acceptanceRate,
      rejectionBreakdown: { ...this.rejectionCounts },
      timestamp: new Date().toISOString(),
      doctorConfirmation,
      doctorNotes,
      modelName: 'MediaPipe Tasks-Vision Pose Landmarker',
      modelVersion: 'v1.0.1 (Biacromial Normalized)',
    };
  }
}
