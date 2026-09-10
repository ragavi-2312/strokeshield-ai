/**
 * StrokeShield AI — Landmark-Based Arm Drift Analysis Configuration
 *
 * Defines MediaPipe Pose landmark indices, anatomical normalization parameters,
 * quality gating thresholds, and sampling intervals.
 */

export const ARM_ANALYSIS_CONFIG = {
  // MediaPipe Tasks-Vision Pose Landmarker Assets
  MODEL_ASSET_PATH: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  WASM_LOADER_PATH: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',

  // MediaPipe Pose Landmark Indices (33 total)
  LANDMARKS: {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
  },

  // Hold Test & Sampling Parameters
  SAMPLING: {
    HOLD_TEST_DURATION_MS: 5000,   // 5-second standardized hold test
    SAMPLE_INTERVAL_MS: 100,        // 10 fps sampling rate
    TARGET_TOTAL_FRAMES: 50,        // Target candidate frames
    MIN_VALID_FRAMES_HIGH: 30,     // Frames required for HIGH quality tier
    MIN_VALID_FRAMES_MED: 15,      // Frames required for MEDIUM quality tier
  },

  // Posture & Quality Thresholds
  QUALITY: {
    MIN_LANDMARK_VISIBILITY: 0.50,  // Minimum visibility score for shoulders & wrists
    MIN_SHOULDER_WIDTH_NORM: 0.12,  // Shoulder width must be at least 12% of frame width
    MAX_SHOULDER_WIDTH_NORM: 0.85,  // Shoulder width must be at most 85% of frame width
    MIN_LUMINANCE: 30,              // Frame brightness min (0-255)
    MAX_LUMINANCE: 235,             // Frame brightness max (0-255)
    MAX_BODY_ROLL_DEG: 18.0,        // Max shoulder tilt angle relative to horizontal
    MIN_ARM_ELEVATION_DEG: 20.0,    // Arms must be raised at least 20° above torso vertical
  },

  // Geometric Measurement Calibration
  CALIBRATION: {
    MAX_DRIFT_ANGLE_SCALE_DEG: 40.0, // 40 degrees drift maps to 100% asymmetry scale
    DRIFT_DETECTION_THRESHOLD_DEG: 7.5, // Drift angle threshold for positive observation (>7.5°)
    PRONATOR_DRIFT_THRESHOLD_NORM: 0.08, // Vertical wrist sag relative to elbow
    DOWNWARD_VELOCITY_THRESHOLD: 1.2,    // Degrees per second rate indicating progressive motor sag
    STABILITY_MAD_MAX_HIGH: 5.0,    // Max Median Absolute Deviation for HIGH stability
  },
} as const;
