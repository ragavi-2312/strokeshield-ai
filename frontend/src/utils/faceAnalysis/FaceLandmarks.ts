/**
 * StrokeShield AI — MediaPipe Face Landmarker Integration
 * 
 * Uses @mediapipe/tasks-vision to extract 478 3D facial landmarks from browser video frames.
 * Maps raw landmark indices into standardized anatomical keypoints and facial symmetry axis.
 */

import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { FACE_ANALYSIS_CONFIG } from './faceAnalysisConfig';
import { FaceKeypoints, NormalizedLandmark, Point2D, SymmetryAxis } from './types';

export class FaceLandmarkService {
  private static landmarkerInstance: FaceLandmarker | null = null;
  private static isInitializing = false;
  private static initPromise: Promise<FaceLandmarker | null> | null = null;

  /**
   * Initialize MediaPipe Face Landmarker singleton.
   */
  public static async getInstance(): Promise<FaceLandmarker | null> {
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
          FACE_ANALYSIS_CONFIG.WASM_CDN_URL
        );

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: FACE_ANALYSIS_CONFIG.MODEL_ASSET_PATH,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 2, // Detect up to 2 to check for MULTIPLE_FACES rejection
          minFaceDetectionConfidence: FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE,
          minFacePresenceConfidence: FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE,
          minTrackingConfidence: FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE,
        });

        this.landmarkerInstance = landmarker;
        return landmarker;
      } catch (err) {
        console.warn('MediaPipe Face Landmarker GPU initialization failed, attempting CPU delegate fallback:', err);
        try {
          const filesetResolver = await FilesetResolver.forVisionTasks(
            FACE_ANALYSIS_CONFIG.WASM_CDN_URL
          );
          const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: FACE_ANALYSIS_CONFIG.MODEL_ASSET_PATH,
              delegate: 'CPU',
            },
            outputFaceBlendshapes: true,
            runningMode: 'VIDEO',
            numFaces: 2,
            minFaceDetectionConfidence: FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE,
            minFacePresenceConfidence: FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE,
            minTrackingConfidence: FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE,
          });
          this.landmarkerInstance = landmarker;
          return landmarker;
        } catch (cpuErr) {
          console.error('MediaPipe Face Landmarker failed to initialize:', cpuErr);
          return null;
        }
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Run inference on a single video frame.
   */
  public static async processVideoFrame(
    video: HTMLVideoElement,
    timestampMs: number,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<{
    rawResult: FaceLandmarkerResult | null;
    keypoints: FaceKeypoints | null;
    faceCount: number;
  }> {
    const landmarker = await this.getInstance();
    if (!landmarker || video.readyState < 2) {
      return { rawResult: null, keypoints: null, faceCount: 0 };
    }

    try {
      const result = landmarker.detectForVideo(video, timestampMs);
      const faceCount = result.faceLandmarks ? result.faceLandmarks.length : 0;

      if (faceCount === 0 || !result.faceLandmarks[0]) {
        return { rawResult: result, keypoints: null, faceCount: 0 };
      }

      const rawLandmarks = result.faceLandmarks[0];
      const keypoints = this.extractSemanticKeypoints(rawLandmarks, canvasWidth, canvasHeight);

      return { rawResult: result, keypoints, faceCount };
    } catch (err) {
      console.error('Error during MediaPipe Face Landmarker inference:', err);
      return { rawResult: null, keypoints: null, faceCount: 0 };
    }
  }

  /**
   * Map 478 MediaPipe landmark indices into standardized anatomical keypoints.
   * Scales normalized coordinates [0, 1] to canvas pixel coordinates.
   */
  public static extractSemanticKeypoints(
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
  ): FaceKeypoints {
    const pt = (idx: number): Point2D => {
      const lm = landmarks[idx] || { x: 0.5, y: 0.5 };
      return {
        x: lm.x * width,
        y: lm.y * height,
      };
    };

    // Pupils / Eye Centers (468 Left Iris, 473 Right Iris)
    const leftPupil = landmarks[468] ? pt(468) : {
      x: (pt(362).x + pt(263).x) / 2,
      y: (pt(386).y + pt(374).y) / 2,
    };
    const rightPupil = landmarks[473] ? pt(473) : {
      x: (pt(33).x + pt(133).x) / 2,
      y: (pt(159).y + pt(145).y) / 2,
    };

    // Inter-Ocular Distance (IOD) — Primary anatomical scale reference unit S
    const interOcularDistance = Math.sqrt(
      Math.pow(leftPupil.x - rightPupil.x, 2) + Math.pow(leftPupil.y - rightPupil.y, 2)
    ) || 1.0;

    // Lateral face boundaries (454 right, 234 left, 10 forehead, 152 chin)
    const leftTragus = pt(234);
    const rightTragus = pt(454);
    const forehead = pt(10);
    const chin = pt(152);
    const sellion = pt(168);

    const faceWidth = Math.sqrt(
      Math.pow(rightTragus.x - leftTragus.x, 2) + Math.pow(rightTragus.y - leftTragus.y, 2)
    ) || interOcularDistance * 2.1;

    const faceHeight = Math.abs(chin.y - forehead.y) || interOcularDistance * 2.6;

    const faceCenter: Point2D = {
      x: (leftTragus.x + rightTragus.x) / 2,
      y: (forehead.y + chin.y) / 2,
    };

    // Construct Symmetry Axis passing through Sellion (168) and Menton/Chin (152)
    // Line equation: (y2 - y1)x - (x2 - x1)y + (x2*y1 - y2*x1) = 0 -> Ax + By + C = 0
    const A = chin.y - sellion.y;
    const B = -(chin.x - sellion.x);
    const C = chin.x * sellion.y - chin.y * sellion.x;
    const angleRad = Math.atan2(chin.y - sellion.y, chin.x - sellion.x);
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1));

    const symmetryAxis: SymmetryAxis = {
      start: sellion,
      end: chin,
      angleDeg,
      A,
      B,
      C,
    };

    return {
      midline: {
        forehead: pt(10),
        sellion: pt(168),       // Nose bridge / Glabella
        noseTip: pt(1),
        subnasale: pt(2),
        upperLipCenter: pt(0),
        lowerLipCenter: pt(17),
        chin: pt(152),
      },
      eyes: {
        leftPupil,
        rightPupil,
        leftOuterCanthus: pt(263),
        leftInnerCanthus: pt(362),
        leftUpperLid: pt(386),
        leftLowerLid: pt(374),
        rightOuterCanthus: pt(33),
        rightInnerCanthus: pt(133),
        rightUpperLid: pt(159),
        rightLowerLid: pt(145),
      },
      eyebrows: {
        leftInner: pt(285),
        leftPeak: pt(282),
        leftOuter: pt(300),
        rightInner: pt(55),
        rightPeak: pt(52),
        rightOuter: pt(70),
      },
      mouth: {
        leftCheilion: pt(291),   // Left mouth corner
        rightCheilion: pt(61),   // Right mouth corner
        leftUpperLip: pt(267),
        rightUpperLip: pt(37),
        leftLowerLip: pt(314),
        rightLowerLip: pt(84),
        leftNasolabial: pt(345),
        rightNasolabial: pt(116),
      },
      cheeks: {
        leftCheek: pt(425),
        rightCheek: pt(205),
      },
      jaw: {
        leftGonion: pt(365),
        rightGonion: pt(136),
        leftJawline: pt(377),
        rightJawline: pt(148),
      },
      interOcularDistance,
      faceWidth,
      faceHeight,
      faceCenter,
      symmetryAxis,
      rawLandmarks: landmarks,
    };
  }

  /**
   * Dispose landmarker instance to release GPU/WASM memory.
   */
  public static dispose(): void {
    if (this.landmarkerInstance) {
      try {
        this.landmarkerInstance.close();
      } catch (e) {
        console.warn('Error closing MediaPipe landmarker:', e);
      }
      this.landmarkerInstance = null;
    }
  }
}
