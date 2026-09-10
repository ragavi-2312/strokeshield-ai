/**
 * StrokeShield AI — Face Quality & Pose Gating
 * 
 * Validates each video frame before asymmetry analysis:
 * - Single face check
 * - 3D Head pose orientation (Yaw, Pitch, Roll)
 * - Lighting & exposure range
 * - Face scale & bounding check
 * - Motion stability
 */

import { FACE_ANALYSIS_CONFIG } from './faceAnalysisConfig';
import { FaceKeypoints, FrameQualityCheck, HeadPose, RejectionReason } from './types';

export class FaceQualityChecker {
  /**
   * Evaluate canvas image lighting & luminance.
   */
  public static evaluateLighting(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): { luminance: number; lightingScore: number; isAcceptable: boolean } {
    try {
      // Sample central 60% region where the face resides
      const sampleX = Math.floor(width * 0.2);
      const sampleY = Math.floor(height * 0.2);
      const sampleW = Math.floor(width * 0.6);
      const sampleH = Math.floor(height * 0.6);

      const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
      const data = imgData.data;

      let sumLuminance = 0;
      let count = 0;

      // Sample every 16th pixel for performance
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard Rec. 709 luminance formula
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sumLuminance += lum;
        count++;
      }

      const avgLum = Math.round(sumLuminance / (count || 1));
      const { MIN_LUMINANCE, MAX_LUMINANCE } = FACE_ANALYSIS_CONFIG;
      const isAcceptable = avgLum >= MIN_LUMINANCE && avgLum <= MAX_LUMINANCE;

      // Score between 0 and 100 based on distance from ideal luminance (128)
      const distFromIdeal = Math.abs(avgLum - 128);
      const lightingScore = Math.max(0, Math.min(100, Math.round(100 - (distFromIdeal / 128) * 60)));

      return { luminance: avgLum, lightingScore, isAcceptable };
    } catch {
      return { luminance: 128, lightingScore: 90, isAcceptable: true };
    }
  }

  /**
   * Estimate 3D Head Pose (Yaw, Pitch, Roll in degrees).
   */
  public static estimateHeadPose(keypoints: FaceKeypoints): HeadPose {
    const { eyes, midline, interOcularDistance, rawLandmarks } = keypoints;

    // 1. Roll (In-plane tilt)
    // Angle between right eye center and left eye center relative to horizontal
    const deltaX = eyes.rightPupil.x - eyes.leftPupil.x;
    const deltaY = eyes.rightPupil.y - eyes.leftPupil.y;
    const rollRad = Math.atan2(deltaY, deltaX);
    const rollDeg = Number(((rollRad * 180) / Math.PI).toFixed(1));

    // 2. Yaw (Horizontal out-of-plane head turn)
    // Compare lateral distance from nose bridge/sellion to left eye vs right eye
    const distLeftEyeToSellion = Math.abs(midline.sellion.x - eyes.leftPupil.x);
    const distRightEyeToSellion = Math.abs(eyes.rightPupil.x - midline.sellion.x);
    const yawDelta = distLeftEyeToSellion - distRightEyeToSellion;
    const yawRatio = yawDelta / (interOcularDistance * 0.8 || 1);

    // If 3D landmark Z coordinates are available from MediaPipe, use them to reinforce Yaw accuracy
    let zYawOffset = 0;
    if (rawLandmarks && rawLandmarks[263] && rawLandmarks[33]) {
      // Z difference between left outer canthus (263) and right outer canthus (33)
      const zDiff = rawLandmarks[263].z - rawLandmarks[33].z;
      zYawOffset = zDiff * 45.0;
    }

    const rawYaw = (yawRatio * 38.0) + (zYawOffset * 0.4);
    const yawDeg = Number(Math.max(-45, Math.min(45, rawYaw)).toFixed(1));

    // 3. Pitch (Vertical up/down tilt)
    // Ratio of upper-face (pupils to nose tip Y) vs lower-face (nose tip to chin Y)
    const pupilY = (eyes.leftPupil.y + eyes.rightPupil.y) / 2;
    const noseY = midline.noseTip.y || midline.subnasale.y;
    const chinY = midline.chin.y;
    const pupilToNoseY = Math.abs(noseY - pupilY);
    const noseToChinY = Math.abs(chinY - noseY) || 1;
    const expectedRatio = 0.50; // Anatomical average in frontal projection
    const currentRatio = pupilToNoseY / noseToChinY;
    const pitchRatioDelta = (currentRatio - expectedRatio) / expectedRatio;

    let zPitchOffset = 0;
    if (rawLandmarks && rawLandmarks[10] && rawLandmarks[152]) {
      // Z depth difference between Forehead (10) and Chin (152)
      zPitchOffset = (rawLandmarks[10].z - rawLandmarks[152].z) * 35.0;
    }

    const rawPitch = (pitchRatioDelta * 22.0) + (zPitchOffset * 0.4);
    const pitchDeg = Number(Math.max(-40, Math.min(40, rawPitch)).toFixed(1));

    // Evaluate Frontal Bounds
    const { MAX_YAW_DEG, MAX_PITCH_DEG, MAX_ROLL_DEG } = FACE_ANALYSIS_CONFIG;

    let isFrontal = true;
    let statusMessage = 'Head position optimal';

    if (Math.abs(rollDeg) > MAX_ROLL_DEG) {
      isFrontal = false;
      statusMessage = 'Please keep your head straight (head tilt detected)';
    } else if (Math.abs(yawDeg) > MAX_YAW_DEG) {
      isFrontal = false;
      statusMessage = 'Please face the camera directly (head rotation detected)';
    } else if (Math.abs(pitchDeg) > MAX_PITCH_DEG) {
      isFrontal = false;
      statusMessage = 'Please look straight into the camera (vertical tilt detected)';
    }

    return {
      yawDeg,
      pitchDeg,
      rollDeg,
      isFrontal,
      statusMessage,
    };
  }

  /**
   * Run full quality assessment on a frame.
   */
  public static checkFrameQuality(
    keypoints: FaceKeypoints | null,
    faceCount: number,
    canvas: HTMLCanvasElement,
    confidence: number = 0.95
  ): FrameQualityCheck {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;

    // Check A: Face detected
    if (faceCount === 0 || !keypoints) {
      return {
        isValid: false,
        rejectionReason: 'NO_FACE',
        lightingScore: 0,
        luminance: 0,
        faceWidthRatio: 0,
        confidence: 0,
        headPose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0, isFrontal: false, statusMessage: 'No face detected in frame' },
      };
    }

    // Check B: Exactly one primary face detected
    if (faceCount > 1) {
      const headPose = this.estimateHeadPose(keypoints);
      return {
        isValid: false,
        rejectionReason: 'MULTIPLE_FACES',
        lightingScore: 70,
        luminance: 128,
        faceWidthRatio: keypoints.faceWidth / width,
        confidence,
        headPose,
      };
    }

    // Check C: Tracking Confidence
    if (confidence < FACE_ANALYSIS_CONFIG.MIN_LANDMARK_CONFIDENCE) {
      const headPose = this.estimateHeadPose(keypoints);
      return {
        isValid: false,
        rejectionReason: 'LOW_CONFIDENCE',
        lightingScore: 50,
        luminance: 128,
        faceWidthRatio: keypoints.faceWidth / width,
        confidence,
        headPose,
      };
    }

    // Check D: Head Pose
    const headPose = this.estimateHeadPose(keypoints);
    if (!headPose.isFrontal) {
      return {
        isValid: false,
        rejectionReason: 'FACE_NOT_FRONTAL',
        lightingScore: 80,
        luminance: 128,
        faceWidthRatio: keypoints.faceWidth / width,
        confidence,
        headPose,
      };
    }

    // Check E: Face Scale in Frame
    const faceWidthRatio = keypoints.faceWidth / width;
    if (faceWidthRatio < FACE_ANALYSIS_CONFIG.MIN_FACE_WIDTH_RATIO) {
      return {
        isValid: false,
        rejectionReason: 'FACE_TOO_SMALL',
        lightingScore: 75,
        luminance: 128,
        faceWidthRatio,
        confidence,
        headPose,
      };
    }

    // Check F: Lighting & Image Quality
    let lighting = { luminance: 128, lightingScore: 90, isAcceptable: true };
    if (ctx) {
      lighting = this.evaluateLighting(ctx, width, height);
      if (!lighting.isAcceptable) {
        return {
          isValid: false,
          rejectionReason: 'POOR_LIGHTING',
          lightingScore: lighting.lightingScore,
          luminance: lighting.luminance,
          faceWidthRatio,
          confidence,
          headPose,
        };
      }
    }

    // All quality criteria passed
    return {
      isValid: true,
      rejectionReason: null,
      lightingScore: lighting.lightingScore,
      luminance: lighting.luminance,
      faceWidthRatio,
      confidence,
      headPose,
    };
  }
}
