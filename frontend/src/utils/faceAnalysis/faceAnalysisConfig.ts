/**
 * StrokeShield AI — Facial Asymmetry Analysis Configuration
 * 
 * Centralized, configurable thresholds for:
 * 1. Head Pose Normalization (Yaw, Pitch, Roll)
 * 2. Quality & Lighting Gating
 * 3. Video Sampling & Multi-Frame Aggregation
 * 4. Regional Weighting Model
 * 5. Model Provenance Metadata
 */

export const FACE_ANALYSIS_CONFIG = {
  // Model Metadata
  MODEL_NAME: 'MediaPipe Face Landmarker',
  MODEL_VERSION: 'v0.10.14-tasks-vision',
  WASM_CDN_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  MODEL_ASSET_PATH: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',

  // Head Pose Limits (degrees) - frames beyond these are marked FACE_NOT_FRONTAL
  MAX_YAW_DEG: 15.0,    // Horizontal rotation (turning left/right)
  MAX_PITCH_DEG: 15.0,  // Vertical tilt (looking up/down)
  MAX_ROLL_DEG: 12.0,   // In-plane tilt (head tilted sideways)

  // Lighting & Image Quality Limits (0-255 luminance range)
  MIN_LUMINANCE: 30,    // Below this is POOR_LIGHTING (Too Dark)
  MAX_LUMINANCE: 235,   // Above this is POOR_LIGHTING (Overexposed)
  MIN_LANDMARK_CONFIDENCE: 0.65,

  // Face Size in Frame (relative to canvas width)
  MIN_FACE_WIDTH_RATIO: 0.20, // Face too small / too far away
  MAX_FACE_WIDTH_RATIO: 0.90, // Face too close / cropped

  // Video Sampling & Timing
  FRAME_SAMPLING_INTERVAL_MS: 100,  // Sample 1 frame every 100ms (~10 fps)
  TARGET_RECORDING_DURATION_MS: 5000, // 5 seconds recording window
  TARGET_TOTAL_FRAMES: 50,          // Target ~50 candidate frames
  MIN_VALID_FRAMES_HIGH_QUALITY: 30, // >= 30 valid frames for HIGH quality (60%)
  MIN_VALID_FRAMES_MEDIUM_QUALITY: 15, // >= 15 valid frames for MEDIUM quality (30%)
  // Under 15 valid frames yields LOW quality -> Prompt user to retry

  // Standard Deviation Threshold for Measurement Stability
  MAX_STD_DEV_HIGH_QUALITY: 6.0,  // Std dev <= 6.0% indicates stable hold
  MAX_STD_DEV_MEDIUM_QUALITY: 12.0,

  // Bilateral Regional Weighting Model (sums to 1.0)
  // Higher weight on Mouth/Cheilions as facial droop most commonly presents around the lower face and nasolabial fold
  REGIONAL_WEIGHTS: {
    mouth: 0.40,    // 40% — Cheilions, nasolabial folds, upper/lower lip
    eyes: 0.20,     // 20% — Canthi, palpebral aperture, pupil level
    eyebrows: 0.15, // 15% — Brow height and lateral symmetry
    cheeks: 0.15,   // 15% — Zygomatic prominence and cheek contour
    jaw: 0.10,      // 10% — Mandibular angle & jawline contour
  },

  // Anthropometric Scaling Factors (converts normalized distance delta into 0-100% asymmetry)
  // Calibrated so healthy baseline micro-asymmetry (~0.01-0.03 IOD units) maps to ~3-8% asymmetry,
  // while clinically evident unilateral palsy (~0.10-0.25 IOD units) maps to 25-60+%
  SCALING_FACTORS: {
    mouth: 450.0,
    eyes: 480.0,
    eyebrows: 450.0,
    cheeks: 420.0,
    jaw: 380.0,
  }
} as const;
