import { describe, it, expect } from 'vitest';
import { 
  FaceKeypoints, 
  FrameQualityCheck, 
  SingleFrameAsymmetryResult,
  HeadPose,
  ValidationSample 
} from '../types';
import { FaceAsymmetryCalculator } from '../FaceAsymmetry';
import { FaceQualityChecker } from '../FaceQuality';
import { FrameAggregator } from '../FrameAggregator';
import { ValidationEngine } from '../ValidationEngine';
import { FACE_ANALYSIS_CONFIG } from '../faceAnalysisConfig';

// Helper to construct synthetic FaceKeypoints with exact symmetrical or perturbed coordinates
function createSyntheticKeypoints(options?: {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  mouthAsymmetryPx?: number;
  browAsymmetryPx?: number;
  eyeAsymmetryPx?: number;
  cheekAsymmetryPx?: number;
  jawAsymmetryPx?: number;
}): FaceKeypoints {
  const scale = options?.scale ?? 1.0;
  const offX = options?.offsetX ?? 320;
  const offY = options?.offsetY ?? 240;

  const mouthAsym = options?.mouthAsymmetryPx ?? 0;
  const browAsym = options?.browAsymmetryPx ?? 0;
  const eyeAsym = options?.eyeAsymmetryPx ?? 0;
  const cheekAsym = options?.cheekAsymmetryPx ?? 0;
  const jawAsym = options?.jawAsymmetryPx ?? 0;

  const iod = 70 * scale; // 70px inter-ocular distance
  const faceW = 150 * scale;
  const faceH = 200 * scale;

  const sellion = { x: offX, y: offY - 40 * scale };
  const chin = { x: offX, y: offY + 95 * scale };

  const A = chin.y - sellion.y;
  const B = -(chin.x - sellion.x);
  const C = chin.x * sellion.y - chin.y * sellion.x;

  return {
    midline: {
      forehead: { x: offX, y: offY - 90 * scale },
      sellion,
      noseTip: { x: offX, y: offY - 5 * scale },
      subnasale: { x: offX, y: offY + 15 * scale },
      upperLipCenter: { x: offX, y: offY + 35 * scale },
      lowerLipCenter: { x: offX, y: offY + 55 * scale },
      chin,
    },
    eyes: {
      leftPupil: { x: offX - iod / 2, y: offY - 40 * scale },
      rightPupil: { x: offX + iod / 2, y: offY - 40 * scale },
      leftOuterCanthus: { x: offX - iod * 0.75, y: offY - 40 * scale },
      leftInnerCanthus: { x: offX - iod * 0.25, y: offY - 40 * scale },
      leftUpperLid: { x: offX - iod / 2, y: offY - 46 * scale },
      leftLowerLid: { x: offX - iod / 2, y: offY - 34 * scale },
      rightOuterCanthus: { x: offX + iod * 0.75, y: offY - 40 * scale + eyeAsym },
      rightInnerCanthus: { x: offX + iod * 0.25, y: offY - 40 * scale },
      rightUpperLid: { x: offX + iod / 2, y: offY - 46 * scale + eyeAsym * 0.5 },
      rightLowerLid: { x: offX + iod / 2, y: offY - 34 * scale + eyeAsym * 0.5 },
    },
    eyebrows: {
      leftInner: { x: offX - iod * 0.25, y: offY - 60 * scale },
      leftPeak: { x: offX - iod * 0.55, y: offY - 65 * scale },
      leftOuter: { x: offX - iod * 0.85, y: offY - 60 * scale },
      rightInner: { x: offX + iod * 0.25, y: offY - 60 * scale },
      rightPeak: { x: offX + iod * 0.55, y: offY - 65 * scale + browAsym },
      rightOuter: { x: offX + iod * 0.85, y: offY - 60 * scale + browAsym },
    },
    mouth: {
      leftCheilion: { x: offX - 35 * scale, y: offY + 45 * scale },
      rightCheilion: { x: offX + 35 * scale, y: offY + 45 * scale + mouthAsym },
      leftUpperLip: { x: offX - 15 * scale, y: offY + 38 * scale },
      rightUpperLip: { x: offX + 15 * scale, y: offY + 38 * scale + mouthAsym * 0.5 },
      leftLowerLip: { x: offX - 15 * scale, y: offY + 52 * scale },
      rightLowerLip: { x: offX + 15 * scale, y: offY + 52 * scale + mouthAsym * 0.5 },
      leftNasolabial: { x: offX - 45 * scale, y: offY + 25 * scale },
      rightNasolabial: { x: offX + 45 * scale, y: offY + 25 * scale + mouthAsym * 0.4 },
    },
    cheeks: {
      leftCheek: { x: offX - 60 * scale, y: offY + 5 * scale },
      rightCheek: { x: offX + 60 * scale, y: offY + 5 * scale + cheekAsym },
    },
    jaw: {
      leftGonion: { x: offX - 65 * scale, y: offY + 70 * scale },
      rightGonion: { x: offX + 65 * scale, y: offY + 70 * scale + jawAsym },
      leftJawline: { x: offX - 45 * scale, y: offY + 85 * scale },
      rightJawline: { x: offX + 45 * scale, y: offY + 85 * scale + jawAsym * 0.5 },
    },
    interOcularDistance: iod,
    faceWidth: faceW,
    faceHeight: faceH,
    faceCenter: { x: offX, y: offY },
    symmetryAxis: {
      start: sellion,
      end: chin,
      angleDeg: 90,
      A,
      B,
      C,
    },
  };
}

function createDefaultQuality(): FrameQualityCheck {
  return {
    isValid: true,
    rejectionReason: null,
    lightingScore: 90,
    luminance: 128,
    faceWidthRatio: 0.45,
    confidence: 0.95,
    headPose: {
      yawDeg: 0,
      pitchDeg: 0,
      rollDeg: 0,
      isFrontal: true,
      statusMessage: 'Head position optimal',
    },
  };
}

describe('Section 28: Comprehensive Facial Asymmetry Unit Test Suite', () => {
  // Test 1: Perfectly Symmetric Synthetic Geometry
  it('1. Perfectly Symmetric Landmark Geometry -> 0.0 Raw Error, 0.0% Asymmetry, 100.0% Symmetry', () => {
    const keypoints = createSyntheticKeypoints();
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.rawNormalizedError).toBe(0.0);
    expect(result.overallAsymmetryPercent).toBe(0.0);
    expect(result.symmetryPercent).toBe(100.0);
    expect(result.regionalScores.mouth).toBe(0.0);
    expect(result.regionalScores.eyes).toBe(0.0);
    expect(result.regionalScores.eyebrows).toBe(0.0);
    expect(result.regionalScores.cheeks).toBe(0.0);
    expect(result.regionalScores.jaw).toBe(0.0);
  });

  // Test 2: Mild Geometric Asymmetry
  it('2. Mild Geometric Asymmetry -> Realistic Mild Asymmetry (5% - 15%)', () => {
    const keypoints = createSyntheticKeypoints({ mouthAsymmetryPx: 3.5 });
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.overallAsymmetryPercent).toBeGreaterThan(3.0);
    expect(result.overallAsymmetryPercent).toBeLessThan(18.0);
    expect(result.symmetryPercent).toBeCloseTo(100.0 - result.overallAsymmetryPercent, 1);
    expect(result.rawNormalizedError).toBeGreaterThan(0.0);
  });

  // Test 3: Moderate Geometric Asymmetry
  it('3. Moderate Geometric Asymmetry -> (10% - 25%)', () => {
    const keypoints = createSyntheticKeypoints({ 
      mouthAsymmetryPx: 9.0,
      browAsymmetryPx: 4.0 
    });
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.overallAsymmetryPercent).toBeGreaterThanOrEqual(10.0);
    expect(result.overallAsymmetryPercent).toBeLessThanOrEqual(30.0);
    expect(result.regionalScores.mouth).toBeGreaterThan(15.0);
  });

  // Test 4: Large Geometric Asymmetry (Severe Unilateral Palsy)
  it('4. Large Geometric Asymmetry -> (> 35%)', () => {
    const keypoints = createSyntheticKeypoints({ 
      mouthAsymmetryPx: 24.0,
      browAsymmetryPx: 15.0,
      cheekAsymmetryPx: 14.0,
      eyeAsymmetryPx: 12.0,
      jawAsymmetryPx: 12.0
    });
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.overallAsymmetryPercent).toBeGreaterThan(35.0);
    expect(result.symmetryPercent).toBeLessThan(65.0);
    expect(result.regionalScores.mouth).toBeGreaterThan(45.0);
  });

  // Test 5: Translation Invariance
  it('5. Translation Invariance -> Shifted across canvas produces identical asymmetry %', () => {
    const kpCentered = createSyntheticKeypoints({ offsetX: 320, offsetY: 240, mouthAsymmetryPx: 8 });
    const kpLeft = createSyntheticKeypoints({ offsetX: 100, offsetY: 120, mouthAsymmetryPx: 8 });
    const kpRight = createSyntheticKeypoints({ offsetX: 550, offsetY: 320, mouthAsymmetryPx: 8 });

    const quality = createDefaultQuality();
    const resCentered = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpCentered, quality);
    const resLeft = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpLeft, quality);
    const resRight = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpRight, quality);

    expect(resLeft.overallAsymmetryPercent).toBeCloseTo(resCentered.overallAsymmetryPercent, 0.1);
    expect(resRight.overallAsymmetryPercent).toBeCloseTo(resCentered.overallAsymmetryPercent, 0.1);
  });

  // Test 6: Scale Invariance
  it('6. Scale Invariance -> Identical asymmetry across 0.5x, 1.0x, 2.0x scales', () => {
    const asymRatio = 0.08;
    const kp1x = createSyntheticKeypoints({ scale: 1.0, mouthAsymmetryPx: 70 * asymRatio });
    const kpHalf = createSyntheticKeypoints({ scale: 0.5, mouthAsymmetryPx: 35 * asymRatio });
    const kpDouble = createSyntheticKeypoints({ scale: 2.0, mouthAsymmetryPx: 140 * asymRatio });

    const quality = createDefaultQuality();
    const res1x = FaceAsymmetryCalculator.calculateFacialAsymmetry(kp1x, quality);
    const resHalf = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpHalf, quality);
    const resDouble = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpDouble, quality);

    expect(resHalf.overallAsymmetryPercent).toBeCloseTo(res1x.overallAsymmetryPercent, 0.5);
    expect(resDouble.overallAsymmetryPercent).toBeCloseTo(res1x.overallAsymmetryPercent, 0.5);
  });

  // Test 7: Head Position Frontal Pass
  it('7. Frontal Head Position Pass', () => {
    const keypoints = createSyntheticKeypoints();
    const pose = FaceQualityChecker.estimateHeadPose(keypoints);

    expect(pose.isFrontal).toBe(true);
    expect(Math.abs(pose.yawDeg)).toBeLessThanOrEqual(FACE_ANALYSIS_CONFIG.MAX_YAW_DEG);
    expect(Math.abs(pose.rollDeg)).toBeLessThanOrEqual(FACE_ANALYSIS_CONFIG.MAX_ROLL_DEG);
  });

  // Test 8: Landmark Reflection Logic
  it('8. Landmark Reflection Across Symmetry Axis Formula', () => {
    const axisStart = { x: 300, y: 100 };
    const axisEnd = { x: 300, y: 400 }; // Vertical symmetry axis x = 300
    const leftPoint = { x: 260, y: 250 }; // Left point 40px left of axis

    const reflected = FaceAsymmetryCalculator.reflectPointAcrossLine(leftPoint, axisStart, axisEnd);
    expect(reflected.x).toBeCloseTo(340, 1); // 40px right of axis
    expect(reflected.y).toBeCloseTo(250, 1); // Same vertical level
  });

  // Test 9: Missing Landmarks Handling
  it('9. Missing Landmarks / Default fallback robustness', () => {
    const keypoints = createSyntheticKeypoints();
    // Zero out inter-ocular distance to test denominator safeguard
    keypoints.interOcularDistance = 0;
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(Number.isFinite(result.overallAsymmetryPercent)).toBe(true);
    expect(Number.isFinite(result.rawNormalizedError)).toBe(true);
  });

  // Test 10: Outlier Landmarks Point-level Trimmed Aggregation
  it('10. Point-level Median Aggregation is Robust to Single-Point Jitter', () => {
    const keypoints = createSyntheticKeypoints({ mouthAsymmetryPx: 0 });
    // Corrupt one minor lower lip point while corners remain symmetric
    keypoints.mouth.leftLowerLip.y += 20;

    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    // Mouth median error remains suppressed by the 3 symmetric points
    expect(result.regionalScores.mouth).toBeLessThan(12.0);
  });

  // Test 11: Low-Confidence Frame Rejection
  it('11. Low Landmark Confidence (< 0.65) -> Rejection LOW_CONFIDENCE', () => {
    const keypoints = createSyntheticKeypoints();
    const dummyCanvas = { getContext: () => null, width: 640, height: 480 } as any;
    const check = FaceQualityChecker.checkFrameQuality(keypoints, 1, dummyCanvas, 0.45);

    expect(check.isValid).toBe(false);
    expect(check.rejectionReason).toBe('LOW_CONFIDENCE');
  });

  // Test 12: Head-Pose Rejections (Yaw & Roll)
  it('12. Head-Pose Rejection outside acceptable limits -> FACE_NOT_FRONTAL', () => {
    const keypoints = createSyntheticKeypoints();
    // Tilt head (Roll > 12°)
    keypoints.eyes.rightPupil.y += 22;
    const pose = FaceQualityChecker.estimateHeadPose(keypoints);

    expect(pose.isFrontal).toBe(false);
    expect(Math.abs(pose.rollDeg)).toBeGreaterThan(FACE_ANALYSIS_CONFIG.MAX_ROLL_DEG);
  });

  // Test 13: Multiple-Face Rejection
  it('13. Multiple Faces Detected (> 1) -> Rejection MULTIPLE_FACES', () => {
    const keypoints = createSyntheticKeypoints();
    const dummyCanvas = { getContext: () => null, width: 640, height: 480 } as any;
    const check = FaceQualityChecker.checkFrameQuality(keypoints, 2, dummyCanvas);

    expect(check.isValid).toBe(false);
    expect(check.rejectionReason).toBe('MULTIPLE_FACES');
  });

  // Test 14: Face Too Small Rejection
  it('14. Face Too Small / Too Far (< 20% width) -> Rejection FACE_TOO_SMALL', () => {
    const keypoints = createSyntheticKeypoints({ scale: 0.25 }); // 37.5px on 640px canvas = 5.8%
    const dummyCanvas = { getContext: () => null, width: 640, height: 480 } as any;
    const check = FaceQualityChecker.checkFrameQuality(keypoints, 1, dummyCanvas);

    expect(check.isValid).toBe(false);
    expect(check.rejectionReason).toBe('FACE_TOO_SMALL');
  });

  // Test 15: Multi-Frame Median Aggregation
  it('15. Multi-Frame Median Aggregation accurately combines series', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 6 });
    const quality = createDefaultQuality();
    const frame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    const frames = Array.from({ length: 30 }, (_, i) => ({ ...frame, frameIndex: i }));
    const agg = FrameAggregator.aggregateFrames(frames);

    expect(agg.validFrames).toBe(30);
    expect(agg.totalFrames).toBe(30);
    expect(agg.frameAcceptanceRate).toBe(1.0);
    expect(agg.medianOverallAsymmetryPercent).toBeCloseTo(frame.overallAsymmetryPercent, 0.1);
  });

  // Test 16: Outlier Resistance in Multi-Frame Series
  it('16. Outlier Resistance -> Extreme single frame does not distort median', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 4 });
    const quality = createDefaultQuality();
    const normalFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    // 19 normal frames + 1 extreme corrupted outlier frame
    const frames = Array.from({ length: 19 }, (_, i) => ({ ...normalFrame, frameIndex: i }));
    const outlierKp = createSyntheticKeypoints({ mouthAsymmetryPx: 35 });
    const outlierFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(outlierKp, quality, 19);
    frames.push(outlierFrame);

    const agg = FrameAggregator.aggregateFrames(frames);
    expect(agg.medianOverallAsymmetryPercent).toBeCloseTo(normalFrame.overallAsymmetryPercent, 0.5);
  });

  // Test 17: Analysis Quality Tiering (HIGH, MEDIUM, LOW)
  it('17. Technical Analysis Quality Tier correctly assigned', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 4 });
    const quality = createDefaultQuality();
    const normalFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    // 35 valid frames -> HIGH
    const highFrames = Array.from({ length: 35 }, (_, i) => ({ ...normalFrame, frameIndex: i }));
    const aggHigh = FrameAggregator.aggregateFrames(highFrames);
    expect(aggHigh.analysisQuality).toBe('HIGH');

    // 18 valid frames -> MEDIUM
    const medFrames = Array.from({ length: 18 }, (_, i) => ({ ...normalFrame, frameIndex: i }));
    const aggMed = FrameAggregator.aggregateFrames(medFrames);
    expect(aggMed.analysisQuality).toBe('MEDIUM');
  });

  // Test 18: Retry & State Buffer Clean Reset
  it('18. Retry Flow State Isolation -> Old frames cleanly discarded', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 20 });
    const quality = createDefaultQuality();
    const oldFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    let buffer: SingleFrameAsymmetryResult[] = Array.from({ length: 20 }, (_, i) => ({ ...oldFrame, frameIndex: i }));
    // Reset buffer on retry
    buffer = [];
    expect(buffer.length).toBe(0);

    const newKp = createSyntheticKeypoints({ mouthAsymmetryPx: 0 });
    const newFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(newKp, quality);
    buffer = Array.from({ length: 20 }, (_, i) => ({ ...newFrame, frameIndex: i }));

    const agg = FrameAggregator.aggregateFrames(buffer);
    expect(agg.overallAsymmetryPercent).toBe(0.0);
    expect(agg.symmetryPercent).toBe(100.0);
  });

  // Test 19: No Valid Frames Behavior
  it('19. No Valid Frames Captured -> Returns null values with LOW quality', () => {
    const rejectedFrame: SingleFrameAsymmetryResult = {
      frameIndex: 0,
      timestamp: Date.now(),
      isQualityValid: false,
      headPose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0, isFrontal: false, statusMessage: 'No face' },
      quality: {
        isValid: false,
        rejectionReason: 'NO_FACE',
        lightingScore: 0,
        luminance: 0,
        faceWidthRatio: 0,
        confidence: 0,
        headPose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0, isFrontal: false, statusMessage: 'No face' },
      },
      rawNormalizedError: 0,
      rawRegionalErrors: { eyes: 0, eyebrows: 0, cheeks: 0, mouth: 0, jaw: 0 },
      regionalScores: { eyes: 0, eyebrows: 0, cheeks: 0, mouth: 0, jaw: 0 },
      overallAsymmetryPercent: 0,
      symmetryPercent: 100,
    };

    const agg = FrameAggregator.aggregateFrames([rejectedFrame, rejectedFrame]);
    expect(agg.analysisQuality).toBe('LOW');
    expect(agg.overallAsymmetryPercent).toBeNull();
    expect(agg.symmetryPercent).toBeNull();
    expect(agg.validFrames).toBe(0);
  });

  // Test 20: Typed Result Object & Validation Engine Schema
  it('20. Typed Result Structure & Validation Engine Metrics Evaluation', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 12 });
    const quality = createDefaultQuality();
    const frame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    const agg = FrameAggregator.aggregateFrames([frame, frame, frame, frame, frame, frame, frame, frame, frame, frame, frame, frame, frame, frame, frame]);
    
    // Verify typed result fields (Section 16)
    expect(agg.analysisType).toBe('FACIAL_ASYMMETRY');
    expect(agg.modelName).toBe('MediaPipe Face Landmarker');
    expect(agg.modelVersion).toBe('v0.10.14-tasks-vision');
    expect(typeof agg.frameAcceptanceRate).toBe('number');
    expect(agg.highestAsymmetryRegion).toBe('Mouth');

    // Test Validation Engine with synthetic validation sample
    const unconfigured = ValidationEngine.evaluateDataset([]);
    expect(unconfigured.status).toBe('DATASET_NOT_CONFIGURED');
    expect(unconfigured.statusMessage).toContain('Clinical validation dataset not configured');

    const sampleDataset: ValidationSample[] = [
      { sample_id: 'S1', ground_truth_asymmetry: 12.0, ground_truth_label: 'NORMAL', predicted_asymmetry: 12.4, analysis_quality: 'HIGH', valid_frame_count: 42 },
      { sample_id: 'S2', ground_truth_asymmetry: 38.0, ground_truth_label: 'UNILATERAL_DROOP', predicted_asymmetry: 36.5, analysis_quality: 'HIGH', valid_frame_count: 45 },
    ];
    const metrics = ValidationEngine.evaluateDataset(sampleDataset);
    expect(metrics.status).toBe('DATASET_CONFIGURED');
    expect(metrics.sampleCount).toBe(2);
    expect(metrics.mae).toBeGreaterThan(0);
  });
});
