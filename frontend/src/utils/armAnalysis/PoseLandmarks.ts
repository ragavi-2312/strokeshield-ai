/**
 * StrokeShield AI — MediaPipe Pose Landmarker Integration
 * 
 * Uses @mediapipe/tasks-vision to extract 33 3D skeletal landmarks from browser video frames.
 * Maps key anatomical landmarks (shoulders, elbows, wrists, hips) for arm drift analysis.
 */

import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { ARM_ANALYSIS_CONFIG } from './armAnalysisConfig';
import { PosePoint3D } from './types';

export class PoseLandmarkService {
  private static landmarkerInstance: PoseLandmarker | null = null;
  private static isInitializing = false;
  private static initPromise: Promise<PoseLandmarker | null> | null = null;

  /**
   * Initialize MediaPipe Pose Landmarker singleton.
   */
  public static async getInstance(): Promise<PoseLandmarker | null> {
    if (this.landmarkerInstance) {
      return this.landmarkerInstance;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          ARM_ANALYSIS_CONFIG.WASM_LOADER_PATH
        );

        const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: ARM_ANALYSIS_CONFIG.MODEL_ASSET_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 2, // Check for multiple people
          minPoseDetectionConfidence: ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY,
          minPosePresenceConfidence: ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY,
          minTrackingConfidence: ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY,
        });

        this.landmarkerInstance = landmarker;
        return landmarker;
      } catch (err) {
        console.warn('MediaPipe Pose Landmarker GPU initialization failed, attempting CPU delegate fallback:', err);
        try {
          const filesetResolver = await FilesetResolver.forVisionTasks(
            ARM_ANALYSIS_CONFIG.WASM_LOADER_PATH
          );
          const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: ARM_ANALYSIS_CONFIG.MODEL_ASSET_PATH,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 2,
            minPoseDetectionConfidence: ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY,
            minPosePresenceConfidence: ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY,
            minTrackingConfidence: ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY,
          });
          this.landmarkerInstance = landmarker;
          return landmarker;
        } catch (cpuErr) {
          console.error('MediaPipe Pose Landmarker CPU fallback also failed:', cpuErr);
          return null;
        }
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Process a single video frame and return detected landmarks.
   */
  public static detectPose(
    landmarker: PoseLandmarker,
    videoElement: HTMLVideoElement,
    timestampMs: number
  ): PoseLandmarkerResult | null {
    try {
      if (!videoElement || videoElement.readyState < 2) {
        return null;
      }
      return landmarker.detectForVideo(videoElement, timestampMs);
    } catch (err) {
      console.warn('Pose detection error on frame:', err);
      return null;
    }
  }

  /**
   * Map raw pose landmark array to structured keypoints.
   */
  public static extractKeypoints(landmarks: PosePoint3D[]) {
    const idx = ARM_ANALYSIS_CONFIG.LANDMARKS;
    return {
      leftShoulder: landmarks[idx.LEFT_SHOULDER] || { x: 0, y: 0, z: 0, visibility: 0 },
      rightShoulder: landmarks[idx.RIGHT_SHOULDER] || { x: 0, y: 0, z: 0, visibility: 0 },
      leftElbow: landmarks[idx.LEFT_ELBOW] || { x: 0, y: 0, z: 0, visibility: 0 },
      rightElbow: landmarks[idx.RIGHT_ELBOW] || { x: 0, y: 0, z: 0, visibility: 0 },
      leftWrist: landmarks[idx.LEFT_WRIST] || { x: 0, y: 0, z: 0, visibility: 0 },
      rightWrist: landmarks[idx.RIGHT_WRIST] || { x: 0, y: 0, z: 0, visibility: 0 },
      leftHip: landmarks[idx.LEFT_HIP] || { x: 0, y: 0, z: 0, visibility: 0 },
      rightHip: landmarks[idx.RIGHT_HIP] || { x: 0, y: 0, z: 0, visibility: 0 },
    };
  }
}
