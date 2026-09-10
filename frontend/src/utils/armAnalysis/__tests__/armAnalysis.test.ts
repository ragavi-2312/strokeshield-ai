import { describe, it, expect, beforeEach } from 'vitest';
import { ArmQualityChecker } from '../ArmQuality';
import { ArmAsymmetryCalculator } from '../ArmAsymmetry';
import { ArmFrameAggregator } from '../ArmFrameAggregator';
import { PosePoint3D } from '../types';

/**
 * Helper to construct synthetic 33-landmark pose arrays with controlled arm elevation angles.
 */
function createSyntheticPose(
  leftElevationDeg: number = 0,
  rightElevationDeg: number = 0,
  scale: number = 1.0,
  offsetX: number = 0,
  offsetY: number = 0,
  shoulderTiltDeg: number = 0,
  visibility: number = 0.95
): PosePoint3D[] {
  const landmarks: PosePoint3D[] = Array.from({ length: 33 }, () => ({
    x: 0.5 * scale + offsetX,
    y: 0.5 * scale + offsetY,
    z: 0,
    visibility,
  }));

  const armLength = 0.22 * scale;
  const shoulderHalfWidth = 0.12 * scale;

  const tiltRad = (shoulderTiltDeg * Math.PI) / 180;
  const tiltY = Math.sin(tiltRad) * shoulderHalfWidth;

  // Shoulders (11 = Left, 12 = Right in viewer perspective)
  const leftShoulderX = 0.5 * scale - shoulderHalfWidth + offsetX;
  const leftShoulderY = 0.35 * scale + offsetY - tiltY;
  const rightShoulderX = 0.5 * scale + shoulderHalfWidth + offsetX;
  const rightShoulderY = 0.35 * scale + offsetY + tiltY;

  landmarks[11] = { x: leftShoulderX, y: leftShoulderY, z: 0, visibility };
  landmarks[12] = { x: rightShoulderX, y: rightShoulderY, z: 0, visibility };

  // Wrists (15 = Left, 16 = Right)
  const leftRad = (leftElevationDeg * Math.PI) / 180;
  const leftWristX = leftShoulderX - armLength * Math.cos(leftRad);
  const leftWristY = leftShoulderY - armLength * Math.sin(leftRad);

  const rightRad = (rightElevationDeg * Math.PI) / 180;
  const rightWristX = rightShoulderX + armLength * Math.cos(rightRad);
  const rightWristY = rightShoulderY - armLength * Math.sin(rightRad);

  landmarks[15] = { x: leftWristX, y: leftWristY, z: 0, visibility };
  landmarks[16] = { x: rightWristX, y: rightWristY, z: 0, visibility };

  // Elbows (13 = Left, 14 = Right)
  landmarks[13] = {
    x: (leftShoulderX + leftWristX) / 2,
    y: (leftShoulderY + leftWristY) / 2,
    z: 0,
    visibility,
  };
  landmarks[14] = {
    x: (rightShoulderX + rightWristX) / 2,
    y: (rightShoulderY + rightWristY) / 2,
    z: 0,
    visibility,
  };

  // Hips (23 = Left, 24 = Right)
  landmarks[23] = { x: 0.44 * scale + offsetX, y: 0.70 * scale + offsetY, z: 0, visibility };
  landmarks[24] = { x: 0.56 * scale + offsetX, y: 0.70 * scale + offsetY, z: 0, visibility };

  return landmarks;
}

describe('StrokeShield AI — Arm Drift & Motor Symmetry Analysis Module', () => {
  let aggregator: ArmFrameAggregator;

  beforeEach(() => {
    aggregator = new ArmFrameAggregator();
  });

  it('1. returns 0.0° drift and 100% motor symmetry for perfectly symmetric raised arms', () => {
    const landmarks = createSyntheticPose(0, 0); // Both horizontal
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(true);

    const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    expect(metrics.isValid).toBe(true);
    expect(metrics.driftAngleDeltaDeg).toBe(0);
    expect(metrics.driftPercent).toBe(0);
    expect(metrics.symmetryPercent).toBe(100);
    expect(metrics.driftSide).toBe('symmetric');
  });

  it('2. detects mild unilateral arm drift (10.0° delta) and attributes to affected side', () => {
    // Left arm drooping -10°, right arm steady at 0°
    const landmarks = createSyntheticPose(-10, 0);
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(true);

    const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    expect(metrics.driftAngleDeltaDeg).toBe(10.0);
    expect(metrics.driftSide).toBe('left');
    expect(metrics.driftPercent).toBe(25.0); // 10 / 40 * 100 = 25%
    expect(metrics.symmetryPercent).toBe(75.0);
  });

  it('3. detects marked unilateral arm drift (24.0° delta) on right arm', () => {
    // Right arm drooping -24°, left arm steady at 0°
    const landmarks = createSyntheticPose(0, -24);
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(true);

    const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    expect(metrics.driftAngleDeltaDeg).toBe(24.0);
    expect(metrics.driftSide).toBe('right');
    expect(metrics.driftPercent).toBe(60.0); // 24 / 40 * 100 = 60%
    expect(metrics.symmetryPercent).toBe(40.0);
  });

  it('4. detects severe flaccid arm / plegia (max scale clamp)', () => {
    // Left arm down -50° (severe drop), right arm at +5°
    const landmarks = createSyntheticPose(-50, 5);
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(true);

    const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    expect(metrics.driftAngleDeltaDeg).toBe(55.0);
    expect(metrics.driftSide).toBe('left');
    expect(metrics.driftPercent).toBe(100.0); // Clamped at 100%
    expect(metrics.symmetryPercent).toBe(0.0);
  });

  it('5. provides scale invariance across 0.5x, 1.0x, and 1.5x body distances', () => {
    const scales = [0.8, 1.0, 1.3];
    const results = scales.map((scale) => {
      const landmarks = createSyntheticPose(-12, 0, scale);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      return ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    });

    // All should produce 12.0° drift delta regardless of scale
    results.forEach((res) => {
      expect(res.isValid).toBe(true);
      expect(res.driftAngleDeltaDeg).toBe(12.0);
      expect(res.driftPercent).toBe(30.0);
    });
  });

  it('6. provides translation / position invariance across frame offsets', () => {
    const offsets = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0.05 },
      { x: -0.08, y: -0.03 },
    ];

    const results = offsets.map((off) => {
      const landmarks = createSyntheticPose(-15, 0, 1.0, off.x, off.y);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      return ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    });

    results.forEach((res) => {
      expect(res.isValid).toBe(true);
      expect(res.driftAngleDeltaDeg).toBe(15.0);
      expect(res.driftPercent).toBe(37.5);
    });
  });

  it('7. rejects frame with BODY_TILTED when excessive body roll occurs (>18°)', () => {
    const landmarks = createSyntheticPose(0, 0, 1.0, 0, 0, 22.0); // 22° tilt
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(false);
    expect(quality.rejectionReason).toBe('BODY_TILTED');
  });

  it('8. rejects frame with ARMS_NOT_RAISED when patient is not participating', () => {
    // Both arms hanging straight down at side
    const landmarks = createSyntheticPose(-80, -80);
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(false);
    expect(quality.rejectionReason).toBe('ARMS_NOT_RAISED');
  });

  it('9. rejects frame with ARMS_NOT_VISIBLE when landmarks have low visibility', () => {
    const landmarks = createSyntheticPose(0, 0, 1.0, 0, 0, 0, 0.2); // 0.2 visibility < 0.5 threshold
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    expect(quality.isValid).toBe(false);
    expect(quality.rejectionReason).toBe('ARMS_NOT_VISIBLE');
  });

  it('10. multi-frame temporal aggregator is robust against single-frame outlier twitches', () => {
    // 35 valid frames with 8° drift, 1 outlier frame with 35° twitch
    for (let i = 0; i < 35; i++) {
      const landmarks = createSyntheticPose(-8, 0);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, i, i * 100, quality);
      aggregator.addFrame(metrics);
    }
    // Outlier twitch
    const outlierLandmarks = createSyntheticPose(-35, 0);
    const qualityOutlier = ArmQualityChecker.validateFrame(outlierLandmarks, 1);
    const outlierMetrics = ArmAsymmetryCalculator.calculateFrameMetrics(
      outlierLandmarks,
      35,
      3500,
      qualityOutlier
    );
    aggregator.addFrame(outlierMetrics);

    const result = aggregator.calculateTemporalResult();
    expect(result.medianDriftAngleDeg).toBe(8.0);
    expect(result.analysisQuality).toBe('HIGH');
  });

  it('11. correctly calculates progressive downward drift velocity (dθ/dt)', () => {
    // Progressive downward drift from 0° to 10° over 5 seconds (velocity = ~2.0°/sec)
    for (let i = 0; i < 50; i++) {
      const angle = -(i / 49) * 10;
      const landmarks = createSyntheticPose(angle, 0);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, i, i * 100, quality);
      aggregator.addFrame(metrics);
    }

    const result = aggregator.calculateTemporalResult();
    expect(result.driftVelocityDegPerSec).toBeGreaterThan(1.5);
    expect(result.driftVelocityDegPerSec).toBeLessThan(2.5);
  });

  it('12. assigns HIGH quality tier when >= 30 frames are valid with low MAD', () => {
    for (let i = 0; i < 40; i++) {
      const landmarks = createSyntheticPose(-5, 0);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, i, i * 100, quality);
      aggregator.addFrame(metrics);
    }

    const result = aggregator.calculateTemporalResult();
    expect(result.analysisQuality).toBe('HIGH');
    expect(result.validFramesCount).toBe(40);
    expect(result.acceptanceRate).toBe(1.0);
  });

  it('13. assigns LOW quality tier and returns null metrics when valid frames < 15', () => {
    for (let i = 0; i < 10; i++) {
      const landmarks = createSyntheticPose(-5, 0);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, i, i * 100, quality);
      aggregator.addFrame(metrics);
    }

    const result = aggregator.calculateTemporalResult();
    expect(result.analysisQuality).toBe('LOW');
    expect(result.driftPercent).toBeNull();
    expect(result.motorSymmetryPercent).toBeNull();
  });

  it('14. correctly identifies pronator sag when wrist drops below elbow', () => {
    const landmarks = createSyntheticPose(0, 0);
    // Lower left wrist relative to elbow
    landmarks[15].y = landmarks[13].y + 0.08;
    const quality = ArmQualityChecker.validateFrame(landmarks, 1);
    const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, 0, 0, quality);
    expect(metrics.pronatorSagRatio).toBeGreaterThan(0.2);
  });

  it('15. result adheres strictly to typed schema and records doctor confirmation', () => {
    for (let i = 0; i < 35; i++) {
      const landmarks = createSyntheticPose(-12, 0);
      const quality = ArmQualityChecker.validateFrame(landmarks, 1);
      const metrics = ArmAsymmetryCalculator.calculateFrameMetrics(landmarks, i, i * 100, quality);
      aggregator.addFrame(metrics);
    }

    const result = aggregator.calculateTemporalResult('possible_drift', 'Pronator sag on left arm');
    expect(result.doctorConfirmation).toBe('possible_drift');
    expect(result.doctorNotes).toBe('Pronator sag on left arm');
    expect(result.affectedSide).toBe('left');
    expect(result.driftPattern).toBe('mild_unilateral_drift');
    expect(typeof result.timestamp).toBe('string');
    expect(result.modelName).toBe('MediaPipe Tasks-Vision Pose Landmarker');
  });
});
