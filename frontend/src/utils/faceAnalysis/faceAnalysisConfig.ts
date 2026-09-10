/**
 * StrokeShield AI — Facial Asymmetry Analysis Configuration
 * 
 * Centralized, configurable parameters for:
 * 1. Landmark Pairs (Bilateral left/right corresponding MediaPipe Face Mesh indices)
 * 2. Head-Pose Normalization & Rejection Thresholds
 * 3. Quality & Lighting Gating
 * 4. Geometric Normalization & Display Scaling
 * 5. Multi-Frame Sampling & Stability Settings
 * 
 * IMPORTANT MEDICAL SAFETY:
 * - This configuration controls geometric facial asymmetry measurement.
 * - DISPLAY_NORMALIZATION_R is a display calibration constant, NOT a clinical diagnostic threshold.
 */

export interface LandmarkPair {
  name: string;
  leftIndex: number;  // MediaPipe Face Mesh left-side anatomical landmark index
  rightIndex: number; // MediaPipe Face Mesh right-side anatomical landmark index
  weight?: number;
}

export const FACE_ANALYSIS_CONFIG = {
  // Model Metadata & Provenance
  MODEL_NAME: 'MediaPipe Face Landmarker',
  MODEL_VERSION: 'v0.10.14-tasks-vision',
  WASM_CDN_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  MODEL_ASSET_PATH: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',

  // 1. ANATOMICALLY CORRESPONDING BILATERAL LANDMARK PAIRS (MediaPipe 478 Mesh)
  LANDMARK_PAIRS: {
    // EYES: Pupils, Canthi, Upper & Lower Eyelids, Orbital Rims
    eyes: [
      { name: 'pupil_center', leftIndex: 468, rightIndex: 473, weight: 1.5 },
      { name: 'outer_canthus', leftIndex: 263, rightIndex: 33, weight: 1.2 },
      { name: 'inner_canthus', leftIndex: 362, rightIndex: 133, weight: 1.0 },
      { name: 'superior_eyelid', leftIndex: 386, rightIndex: 159, weight: 1.2 },
      { name: 'inferior_eyelid', leftIndex: 374, rightIndex: 145, weight: 1.2 },
      { name: 'upper_orbital_mid', leftIndex: 385, rightIndex: 158, weight: 0.8 },
      { name: 'lower_orbital_mid', leftIndex: 380, rightIndex: 153, weight: 0.8 },
    ] as LandmarkPair[],

    // EYEBROWS: Inner Head, Superior Peak, Outer Tail, Lower & Upper Arches
    eyebrows: [
      { name: 'brow_inner_head', leftIndex: 285, rightIndex: 55, weight: 1.2 },
      { name: 'brow_superior_peak', leftIndex: 282, rightIndex: 52, weight: 1.5 },
      { name: 'brow_outer_tail', leftIndex: 300, rightIndex: 70, weight: 1.0 },
      { name: 'brow_lower_arch', leftIndex: 295, rightIndex: 65, weight: 0.9 },
      { name: 'brow_upper_arch', leftIndex: 293, rightIndex: 63, weight: 0.9 },
    ] as LandmarkPair[],

    // CHEEKS: Zygomatic Prominence, Sub-orbital, Lateral Arch, Infraorbital
    cheeks: [
      { name: 'zygomatic_prominence', leftIndex: 425, rightIndex: 205, weight: 1.4 },
      { name: 'sub_orbital_cheek', leftIndex: 280, rightIndex: 50, weight: 1.0 },
      { name: 'lateral_zygomatic_arch', leftIndex: 436, rightIndex: 216, weight: 1.0 },
      { name: 'infraorbital_medial', leftIndex: 346, rightIndex: 117, weight: 0.9 },
    ] as LandmarkPair[],

    // MOUTH: Cheilions (corners), Upper/Lower Vermilion, Philtrum, Nasolabial Folds
    mouth: [
      { name: 'cheilion_corner', leftIndex: 291, rightIndex: 61, weight: 2.0 },
      { name: 'upper_lip_lateral', leftIndex: 267, rightIndex: 37, weight: 1.2 },
      { name: 'upper_lip_philtrum', leftIndex: 312, rightIndex: 82, weight: 1.0 },
      { name: 'lower_lip_lateral', leftIndex: 314, rightIndex: 84, weight: 1.2 },
      { name: 'lower_lip_midpoint', leftIndex: 317, rightIndex: 87, weight: 1.0 },
      { name: 'nasolabial_fold_upper', leftIndex: 345, rightIndex: 116, weight: 1.3 },
      { name: 'nasolabial_fold_mid', leftIndex: 432, rightIndex: 212, weight: 1.3 },
    ] as LandmarkPair[],

    // JAW / LOWER FACE: Gonion (Angle), Pre-gonion, Mandibular Body, Lateral Chin
    jaw: [
      { name: 'mandibular_gonion_angle', leftIndex: 365, rightIndex: 136, weight: 1.4 },
      { name: 'mandibular_pre_gonion', leftIndex: 397, rightIndex: 172, weight: 1.1 },
      { name: 'mid_mandibular_body', leftIndex: 377, rightIndex: 148, weight: 1.0 },
      { name: 'anterior_mandibular_line', leftIndex: 400, rightIndex: 176, weight: 0.9 },
      { name: 'lateral_chin_boundary', leftIndex: 378, rightIndex: 149, weight: 1.0 },
    ] as LandmarkPair[],
  },

  // 2. MIDLINE SYMMETRY AXIS ANCHOR INDICES
  MIDLINE_ANCHORS: {
    sellion: 168,      // Nose bridge / glabella root (Superior midline anchor)
    subnasale: 2,      // Nasal spine base (Mid-face midline anchor)
    menton: 152,       // Chin tip / lowest mandibular point (Inferior midline anchor)
    forehead: 10,      // Upper frontal bone
    upperLipCenter: 0, // Upper vermilion midline
    lowerLipCenter: 17,// Lower vermilion midline
  },

  // 3. HEAD POSE NORMALIZATION BOUNDARIES (degrees)
  // Frames outside these acceptable ranges are rejected as FACE_NOT_FRONTAL
  MAX_YAW_DEG: 15.0,    // Horizontal rotation (turning left/right)
  MAX_PITCH_DEG: 15.0,  // Vertical tilt (looking up/down)
  MAX_ROLL_DEG: 12.0,   // In-plane tilt (head tilted sideways)

  // 4. IMAGE QUALITY & LIGHTING BOUNDARIES (0-255 luminance range)
  MIN_LUMINANCE: 30,    // Below this is POOR_LIGHTING (Too Dark)
  MAX_LUMINANCE: 235,   // Above this is POOR_LIGHTING (Overexposed)
  MIN_LANDMARK_CONFIDENCE: 0.65,

  // 5. FACE SCALE IN FRAME (relative to canvas width)
  MIN_FACE_WIDTH_RATIO: 0.20, // Face too small / too far away
  MAX_FACE_WIDTH_RATIO: 0.90, // Face too close / cropped

  // 6. VIDEO SAMPLING & TIMING SETTINGS
  FRAME_SAMPLING_INTERVAL_MS: 100,  // Sample 1 frame every 100ms (~10 fps)
  TARGET_RECORDING_DURATION_MS: 5000, // 5 seconds duration
  TARGET_TOTAL_FRAMES: 50,          // Target ~50 candidate frames
  MIN_VALID_FRAMES_HIGH_QUALITY: 30, // >= 30 valid frames for HIGH quality (60%)
  MIN_VALID_FRAMES_MEDIUM_QUALITY: 15, // >= 15 valid frames for MEDIUM quality (30%)
  // Fewer than 15 valid frames yields LOW quality -> prompts retry

  // 7. TEMPORAL STABILITY THRESHOLDS (Dispersion / Standard Deviation / MAD)
  MAX_DISPERSION_HIGH_QUALITY: 6.0,  // Std dev or MAD <= 6.0% indicates stable hold
  MAX_DISPERSION_MEDIUM_QUALITY: 12.0,

  // 8. REGION WEIGHTING MODEL (sums to 1.0)
  // Higher weight on Mouth/Cheilions as facial droop in acute neurological deficit most commonly presents in lower face
  REGION_WEIGHTS: {
    mouth: 0.40,    // 40%
    eyes: 0.20,     // 20%
    eyebrows: 0.15, // 15%
    cheeks: 0.15,   // 15%
    jaw: 0.10,      // 10%
  },

  /**
   * 9. DISPLAY PERCENTAGE CALIBRATION CONSTANT (R)
   * 
   * Display normalization parameter only.
   * Not a clinical diagnostic threshold.
   * Must be calibrated using validation data before clinical interpretation.
   * 
   * Maps a dimensionless raw normalized asymmetry error (e_raw = d / IOD) into a 0 - 100% display score:
   * display_percentage = 100 * clamp(raw_error / DISPLAY_NORMALIZATION_R, 0, 1)
   * 
   * R is set to 0.22 (i.e. a raw bilateral reflection error equal to 22% of inter-ocular distance corresponds to 100% asymmetry).
   * In healthy physiological baselines, micro-asymmetry is ~0.015 - 0.025 IOD units (~6-11% display asymmetry).
   */
  DISPLAY_NORMALIZATION_R: 0.22,

  // Regional display scaling constants (allow fine-tuning per anatomical zone)
  REGIONAL_NORMALIZATION_R: {
    mouth: 0.20,
    eyes: 0.22,
    eyebrows: 0.22,
    cheeks: 0.24,
    jaw: 0.25,
  }
} as const;
