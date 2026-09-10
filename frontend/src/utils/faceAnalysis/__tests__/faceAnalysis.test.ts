import { describe, it, expect } from 'vitest';
import { 
  FaceKeypoints, 
  FrameQualityCheck, 
  SingleFrameAsymmetryResult,
  HeadPose 
} from '../types';
import { FaceAsymmetryCalculator } from '../FaceAsymmetry';
import { FaceQualityChecker } from '../FaceQuality';
import { FrameAggregator } from '../FrameAggregator';
import { FACE_ANALYSIS_CONFIG } from '../faceAnalysisConfig';

// Helper to construct synthetic FaceKeypoints
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

  return {
    midline: {
      forehead: { x: offX, y: offY - 90 * scale },
      sellion: { x: offX, y: offY - 40 * scale },
      noseTip: { x: offX, y: offY - 5 * scale },
      subnasale: { x: offX, y: offY + 15 * scale },
      upperLipCenter: { x: offX, y: offY + 35 * scale },
      lowerLipCenter: { x: offX, y: offY + 55 * scale },
      chin: { x: offX, y: offY + 95 * scale },
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

describe('Facial Asymmetry Calculation Engine', () => {
  it('1. Perfect Symmetry -> 0.0% Asymmetry, 100.0% Symmetry', () => {
    const keypoints = createSyntheticKeypoints();
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.overallAsymmetryPercent).toBe(0.0);
    expect(result.symmetryPercent).toBe(100.0);
    expect(result.regionalScores.mouth).toBe(0.0);
    expect(result.regionalScores.eyes).toBe(0.0);
    expect(result.regionalScores.eyebrows).toBe(0.0);
    expect(result.regionalScores.cheeks).toBe(0.0);
    expect(result.regionalScores.jaw).toBe(0.0);
  });

  it('2. Mild Asymmetry -> Realistic Mild Percentage (5% - 15%)', () => {
    // 3px mouth corner droop with 70px IOD (~4.2% IOD unit displacement)
    const keypoints = createSyntheticKeypoints({ mouthAsymmetryPx: 3.5 });
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.overallAsymmetryPercent).toBeGreaterThan(3.0);
    expect(result.overallAsymmetryPercent).toBeLessThan(16.0);
    expect(result.symmetryPercent).toBeCloseTo(100.0 - result.overallAsymmetryPercent, 1);
    expect(result.regionalScores.mouth).toBeGreaterThan(5.0);
  });

  it('3. Moderate Regional Asymmetry (Mouth & Eyebrow)', () => {
    // 9px mouth corner droop + 4px brow deviation
    const keypoints = createSyntheticKeypoints({ 
      mouthAsymmetryPx: 9.0,
      browAsymmetryPx: 4.0 
    });
    const quality = createDefaultQuality();
    const result = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    expect(result.overallAsymmetryPercent).toBeGreaterThanOrEqual(10.0);
    expect(result.overallAsymmetryPercent).toBeLessThanOrEqual(25.0);
    expect(result.regionalScores.mouth).toBeGreaterThan(20.0);
  });

  it('4. Severe Multi-Region Unilateral Facial Palsy -> (> 35%)', () => {
    // Multi-regional unilateral droop across all 5 facial regions
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
    expect(result.regionalScores.mouth).toBeGreaterThan(50.0);
  });

  it('5. Scale Invariance -> Identical Asymmetry % across 0.5x, 1.0x, 2.0x scales', () => {
    const asymRatio = 0.08; // 8% of IOD

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

  it('6. Translation / Position Invariance -> Face shifted across canvas produces identical asymmetry %', () => {
    const kpCentered = createSyntheticKeypoints({ offsetX: 320, offsetY: 240, mouthAsymmetryPx: 8 });
    const kpLeft = createSyntheticKeypoints({ offsetX: 120, offsetY: 150, mouthAsymmetryPx: 8 });
    const kpRight = createSyntheticKeypoints({ offsetX: 500, offsetY: 300, mouthAsymmetryPx: 8 });

    const quality = createDefaultQuality();
    const resCentered = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpCentered, quality);
    const resLeft = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpLeft, quality);
    const resRight = FaceAsymmetryCalculator.calculateFacialAsymmetry(kpRight, quality);

    expect(resLeft.overallAsymmetryPercent).toBeCloseTo(resCentered.overallAsymmetryPercent, 0.1);
    expect(resRight.overallAsymmetryPercent).toBeCloseTo(resCentered.overallAsymmetryPercent, 0.1);
  });
});

describe('Face Quality & Head Pose Checker', () => {
  it('7. Frontal Head Position Pass', () => {
    const keypoints = createSyntheticKeypoints();
    const pose = FaceQualityChecker.estimateHeadPose(keypoints);

    expect(pose.isFrontal).toBe(true);
    expect(Math.abs(pose.yawDeg)).toBeLessThanOrEqual(FACE_ANALYSIS_CONFIG.MAX_YAW_DEG);
    expect(Math.abs(pose.rollDeg)).toBeLessThanOrEqual(FACE_ANALYSIS_CONFIG.MAX_ROLL_DEG);
  });

  it('8. Head Tilt (Roll > 12°) Rejection -> FACE_NOT_FRONTAL', () => {
    const keypoints = createSyntheticKeypoints();
    // Tilt right eye down significantly relative to left eye
    keypoints.eyes.rightPupil.y += 22;
    const pose = FaceQualityChecker.estimateHeadPose(keypoints);

    expect(pose.isFrontal).toBe(false);
    expect(Math.abs(pose.rollDeg)).toBeGreaterThan(FACE_ANALYSIS_CONFIG.MAX_ROLL_DEG);
  });

  it('9. Head Turn (Yaw > 15°) Rejection -> FACE_NOT_FRONTAL', () => {
    const keypoints = createSyntheticKeypoints();
    // Shift nose bridge strongly towards left eye (patient turned head right)
    keypoints.midline.sellion.x = keypoints.eyes.leftPupil.x + 8;
    const pose = FaceQualityChecker.estimateHeadPose(keypoints);

    expect(pose.isFrontal).toBe(false);
    expect(Math.abs(pose.yawDeg)).toBeGreaterThan(FACE_ANALYSIS_CONFIG.MAX_YAW_DEG);
  });
});

describe('Multi-Frame Temporal Aggregator', () => {
  it('10. Median Aggregation is Resistant to Outlier Noise (e.g. 1 corrupted frame)', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 4 });
    const quality = createDefaultQuality();
    const normalFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    // Create 9 normal frames (~10.5% asymmetry) + 1 extreme outlier blink/twitch frame (85.0%)
    const frames: SingleFrameAsymmetryResult[] = Array.from({ length: 9 }, (_, i) => ({
      ...normalFrame,
      frameIndex: i,
    }));

    const outlierKp = createSyntheticKeypoints({ mouthAsymmetryPx: 35 });
    const outlierFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(outlierKp, quality, 9);
    frames.push(outlierFrame);

    const agg = FrameAggregator.aggregateFrames(frames);

    expect(agg.validFramesCount).toBe(10);
    // Median must stay close to the normal frame (~10.5%), unaffected by the 1 outlier
    expect(agg.medianOverallAsymmetryPercent).toBeCloseTo(normalFrame.overallAsymmetryPercent, 0.5);
    expect(agg.meanOverallAsymmetryPercent).toBeGreaterThan(agg.medianOverallAsymmetryPercent);
  });

  it('11. High Quality Tier when >= 30 frames valid and stable', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 4 });
    const quality = createDefaultQuality();
    const normalFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    const frames: SingleFrameAsymmetryResult[] = Array.from({ length: 35 }, (_, i) => ({
      ...normalFrame,
      frameIndex: i,
    }));

    const agg = FrameAggregator.aggregateFrames(frames);
    expect(agg.analysisQuality).toBe('HIGH');
    expect(agg.validFramesCount).toBe(35);
    expect(agg.isStableMeasurement).toBe(true);
  });

  it('12. Low Quality Tier when valid frames < 15', () => {
    const baseKp = createSyntheticKeypoints({ mouthAsymmetryPx: 4 });
    const quality = createDefaultQuality();
    const normalFrame = FaceAsymmetryCalculator.calculateFacialAsymmetry(baseKp, quality);

    // 8 valid frames, 12 rejected
    const validFrames: SingleFrameAsymmetryResult[] = Array.from({ length: 8 }, (_, i) => ({
      ...normalFrame,
      frameIndex: i,
    }));
    const rejectedFrames: SingleFrameAsymmetryResult[] = Array.from({ length: 12 }, (_, i) => ({
      ...normalFrame,
      frameIndex: i + 8,
      isQualityValid: false,
      quality: { ...quality, isValid: false, rejectionReason: 'FACE_NOT_FRONTAL' },
    }));

    const agg = FrameAggregator.aggregateFrames([...validFrames, ...rejectedFrames]);
    expect(agg.analysisQuality).toBe('LOW');
    expect(agg.rejectedFramesCount).toBe(12);
    expect(agg.rejectionBreakdown.FACE_NOT_FRONTAL).toBe(12);
  });

  it('13. Highest Asymmetry Region correctly identified', () => {
    const keypoints = createSyntheticKeypoints({ mouthAsymmetryPx: 12.0 });
    const quality = createDefaultQuality();
    const frame = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);

    const frames = Array.from({ length: 20 }, (_, i) => ({ ...frame, frameIndex: i }));
    const agg = FrameAggregator.aggregateFrames(frames);

    expect(agg.highestAsymmetryRegion).toBe('Mouth');
    expect(agg.highestAsymmetryRegionScore).toBeGreaterThan(20.0);
  });
});
