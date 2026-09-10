/**
 * StrokeShield AI — Type Definitions for Arm Drift Analysis
 */

export type ArmRejectionReason =
  | 'NO_POSE'
  | 'MULTIPLE_BODIES'
  | 'ARMS_NOT_VISIBLE'
  | 'ARMS_NOT_RAISED'
  | 'POOR_LIGHTING'
  | 'BODY_TILTED'
  | 'BODY_OFF_SCALE'
  | 'LOW_CONFIDENCE';

export type ArmAnalysisQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export type ArmDriftPattern =
  | 'no_drift'
  | 'mild_unilateral_drift'
  | 'marked_unilateral_drift'
  | 'severe_plegia'
  | 'bilateral_drift';

export interface PosePoint3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ArmQualityResult {
  isValid: boolean;
  rejectionReason: ArmRejectionReason | null;
  bodyRollDeg: number;
  shoulderWidthNorm: number;
  armsRaised: boolean;
  lightingPass: boolean;
}

export interface ArmFrameMetrics {
  frameIndex: number;
  timestampMs: number;
  leftArmElevationDeg: number;
  rightArmElevationDeg: number;
  driftAngleDeltaDeg: number;
  normalizedDriftDelta: number;
  biacromialDiameterNorm: number;
  shoulderTiltDeg: number;
  pronatorSagRatio: number;
  driftSide: 'left' | 'right' | 'symmetric';
  driftPercent: number;
  symmetryPercent: number;
  isValid: boolean;
  rejectionReason: ArmRejectionReason | null;
}

export interface ArmAnalysisTypedResult {
  // Primary Clinical Metrics
  analysisQuality: ArmAnalysisQuality;
  medianDriftAngleDeg: number;
  meanDriftAngleDeg: number;
  maxDriftAngleDeg: number;
  driftPercent: number | null;
  motorSymmetryPercent: number | null;
  affectedSide: 'left' | 'right' | 'symmetric';
  driftPattern: ArmDriftPattern;
  driftVelocityDegPerSec: number;

  // Measurement Stability & Quality Statistics
  measurementStabilityMAD: number;
  totalFramesSampled: number;
  validFramesCount: number;
  rejectedFramesCount: number;
  acceptanceRate: number;
  rejectionBreakdown: Record<string, number>;

  // System & Clinical Metadata
  timestamp: string;
  doctorConfirmation: 'normal' | 'possible_drift' | 'abnormal' | 'unable_to_assess';
  doctorNotes: string;
  modelName: string;
  modelVersion: string;
}
