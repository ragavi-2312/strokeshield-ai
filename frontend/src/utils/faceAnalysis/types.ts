/**
 * StrokeShield AI — Facial Asymmetry Module Types
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * Standardized Semantic Anatomical Face Keypoints
 * Extracted from MediaPipe 478 3D landmark mesh
 */
export interface FaceKeypoints {
  // Centerline References (Sellion -> Subnasale -> Chin)
  midline: {
    forehead: Point2D;     // Index 10
    sellion: Point2D;      // Index 168 (Nose bridge / Glabella)
    noseTip: Point2D;      // Index 1
    subnasale: Point2D;    // Index 2
    upperLipCenter: Point2D; // Index 0
    lowerLipCenter: Point2D; // Index 17
    chin: Point2D;         // Index 152
  };

  // Eyes
  eyes: {
    leftPupil: Point2D;       // Index 468
    rightPupil: Point2D;      // Index 473
    leftOuterCanthus: Point2D; // Index 263
    leftInnerCanthus: Point2D; // Index 362
    leftUpperLid: Point2D;     // Index 386
    leftLowerLid: Point2D;     // Index 374
    rightOuterCanthus: Point2D; // Index 33
    rightInnerCanthus: Point2D; // Index 133
    rightUpperLid: Point2D;    // Index 159
    rightLowerLid: Point2D;    // Index 145
  };

  // Eyebrows
  eyebrows: {
    leftInner: Point2D;   // Index 285
    leftPeak: Point2D;    // Index 282
    leftOuter: Point2D;   // Index 300
    rightInner: Point2D;  // Index 55
    rightPeak: Point2D;   // Index 52
    rightOuter: Point2D;  // Index 70
  };

  // Mouth & Nasolabial
  mouth: {
    leftCheilion: Point2D;   // Index 291 (Left mouth corner)
    rightCheilion: Point2D;  // Index 61  (Right mouth corner)
    leftUpperLip: Point2D;   // Index 267
    rightUpperLip: Point2D;  // Index 37
    leftLowerLip: Point2D;   // Index 314
    rightLowerLip: Point2D;  // Index 84
    leftNasolabial: Point2D; // Index 345
    rightNasolabial: Point2D; // Index 116
  };

  // Cheeks (Zygomatic Prominence)
  cheeks: {
    leftCheek: Point2D;   // Index 425
    rightCheek: Point2D;  // Index 205
  };

  // Jaw / Lower Face (Mandibular Angle & Jawline)
  jaw: {
    leftGonion: Point2D;   // Index 365
    rightGonion: Point2D;  // Index 136
    leftJawline: Point2D;  // Index 377
    rightJawline: Point2D; // Index 148
  };

  // Bounding & Reference Metrics
  interOcularDistance: number; // Reference Scale Unit (Distance between Left & Right Pupils)
  faceWidth: number;
  faceHeight: number;
  faceCenter: Point2D;
  rawLandmarks?: NormalizedLandmark[];
}

export type RejectionReason =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'LOW_CONFIDENCE'
  | 'FACE_TOO_SMALL'
  | 'FACE_NOT_FRONTAL'
  | 'POOR_LIGHTING'
  | 'EXCESSIVE_MOTION'
  | 'BLURRY_FRAME';

export interface HeadPose {
  yawDeg: number;       // Horizontal turn (- left, + right)
  pitchDeg: number;     // Vertical tilt (- down, + up)
  rollDeg: number;      // In-plane tilt (- counter-clockwise, + clockwise)
  isFrontal: boolean;
  statusMessage: string;
}

export interface FrameQualityCheck {
  isValid: boolean;
  rejectionReason: RejectionReason | null;
  lightingScore: number;       // 0 - 100
  luminance: number;           // 0 - 255
  faceWidthRatio: number;      // 0.0 - 1.0 (relative to canvas width)
  confidence: number;          // 0.0 - 1.0
  headPose: HeadPose;
}

export interface RegionalAsymmetryScores {
  eyes: number;      // 0.0 - 100.0%
  eyebrows: number;  // 0.0 - 100.0%
  mouth: number;     // 0.0 - 100.0%
  cheeks: number;    // 0.0 - 100.0%
  jaw: number;       // 0.0 - 100.0%
}

export interface SingleFrameAsymmetryResult {
  frameIndex: number;
  timestamp: number;
  isQualityValid: boolean;
  quality: FrameQualityCheck;
  landmarks?: FaceKeypoints;
  headPose: HeadPose;
  regionalScores: RegionalAsymmetryScores;
  overallAsymmetryPercent: number; // 0.0 - 100.0%
  symmetryPercent: number;         // 100.0 - overallAsymmetryPercent
}

export type AnalysisQualityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MultiFrameAggregatedResult {
  totalFrames: number;
  validFramesCount: number;
  rejectedFramesCount: number;
  rejectionBreakdown: Record<RejectionReason, number>;

  // Continuous Asymmetry & Symmetry Values
  medianOverallAsymmetryPercent: number; // e.g. 12.4%
  medianSymmetryPercent: number;         // e.g. 87.6%
  meanOverallAsymmetryPercent: number;

  // Regional Breakdown (Medians across valid frames)
  medianRegionalScores: RegionalAsymmetryScores;

  // Dispersion & Stability Metrics
  standardDeviation: number; // ± %
  interQuartileRange: number;
  isStableMeasurement: boolean;

  // Technical Analysis Quality
  analysisQuality: AnalysisQualityTier;
  qualityExplanation: string;

  // Salient Regional Flag
  highestAsymmetryRegion: string;       // e.g. "Mouth"
  highestAsymmetryRegionScore: number;  // e.g. 18.6%

  // Head Pose Averages across valid frames
  averageHeadPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };

  // Model Metadata & Provenance
  modelName: string;
  modelVersion: string;
  timestamp: string;
}

export type FaceAnalysisState =
  | 'WAITING'         // Waiting for user to start / position face
  | 'DETECTING'       // Detecting face in stream
  | 'ANALYZING'       // 5-second sampling in progress (0% -> 100%)
  | 'QUALITY_CHECK'   // Evaluating captured frames
  | 'COMPLETED'       // Analysis complete with valid result
  | 'RETRY_REQUIRED'  // Low quality -> Prompt retry
  | 'ERROR';          // Camera / Model failure
