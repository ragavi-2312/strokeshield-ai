/**
 * StrokeShield AI — Pose & Upper-Body Quality Gating Module
 *
 * Enforces quality filters to prevent noisy/misleading drift calculations:
 * 1. Single body presence (rejects 0 or >1 bodies)
 * 2. Bilateral shoulder and wrist landmark visibility
 * 3. Body scale / distance from camera
 * 4. Body roll / tilt limits
 * 5. Arms-raised posture check (patient must raise arms for hold test)
 * 6. Video frame lighting
 */

import { ARM_ANALYSIS_CONFIG } from './armAnalysisConfig';
import { ArmQualityResult, ArmRejectionReason, PosePoint3D } from './types';
import { PoseLandmarkService } from './PoseLandmarks';

export class ArmQualityChecker {
  /**
   * Evaluate a single frame's pose landmarks against all clinical quality criteria.
   */
  public static validateFrame(
    landmarks: PosePoint3D[] | null | undefined,
    numPosesDetected: number,
    frameCanvas?: HTMLCanvasElement | null
  ): ArmQualityResult {
    // 1. Check Body Detection
    if (!landmarks || landmarks.length < 25 || numPosesDetected === 0) {
      return {
        isValid: false,
        rejectionReason: 'NO_POSE',
        bodyRollDeg: 0,
        shoulderWidthNorm: 0,
        armsRaised: false,
        lightingPass: true,
      };
    }

    if (numPosesDetected > 1) {
      return {
        isValid: false,
        rejectionReason: 'MULTIPLE_BODIES',
        bodyRollDeg: 0,
        shoulderWidthNorm: 0,
        armsRaised: false,
        lightingPass: true,
      };
    }

    // 2. Extract keypoints
    const kp = PoseLandmarkService.extractKeypoints(landmarks);
    const minVis = ARM_ANALYSIS_CONFIG.QUALITY.MIN_LANDMARK_VISIBILITY;

    const leftShoulderVis = kp.leftShoulder.visibility ?? 1.0;
    const rightShoulderVis = kp.rightShoulder.visibility ?? 1.0;
    const leftWristVis = kp.leftWrist.visibility ?? 1.0;
    const rightWristVis = kp.rightWrist.visibility ?? 1.0;

    if (
      leftShoulderVis < minVis ||
      rightShoulderVis < minVis ||
      leftWristVis < minVis ||
      rightWristVis < minVis
    ) {
      return {
        isValid: false,
        rejectionReason: 'ARMS_NOT_VISIBLE',
        bodyRollDeg: 0,
        shoulderWidthNorm: 0,
        armsRaised: false,
        lightingPass: true,
      };
    }

    // 3. Check Shoulder Width / Body Scale
    const dxShoulders = kp.leftShoulder.x - kp.rightShoulder.x;
    const dyShoulders = kp.leftShoulder.y - kp.rightShoulder.y;
    const shoulderWidth = Math.sqrt(dxShoulders * dxShoulders + dyShoulders * dyShoulders);

    if (
      shoulderWidth < ARM_ANALYSIS_CONFIG.QUALITY.MIN_SHOULDER_WIDTH_NORM ||
      shoulderWidth > ARM_ANALYSIS_CONFIG.QUALITY.MAX_SHOULDER_WIDTH_NORM
    ) {
      return {
        isValid: false,
        rejectionReason: 'BODY_OFF_SCALE',
        bodyRollDeg: 0,
        shoulderWidthNorm: shoulderWidth,
        armsRaised: false,
        lightingPass: true,
      };
    }

    // 4. Check Body Roll / Shoulder Tilt (relative to horizontal)
    const bodyRollDeg = Math.abs(Math.atan2(dyShoulders, Math.abs(dxShoulders)) * (180 / Math.PI));
    if (bodyRollDeg > ARM_ANALYSIS_CONFIG.QUALITY.MAX_BODY_ROLL_DEG) {
      return {
        isValid: false,
        rejectionReason: 'BODY_TILTED',
        bodyRollDeg,
        shoulderWidthNorm: shoulderWidth,
        armsRaised: false,
        lightingPass: true,
      };
    }

    // 5. Check Arms Raised Posture
    // Arms are raised if wrists are elevated above waist / lower torso
    const avgShoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
    const avgHipY = (kp.leftHip.y + kp.rightHip.y) / 2;
    const torsoHeight = Math.max(0.1, avgHipY - avgShoulderY);

    // Arm is elevated if wrist is not hanging down near hip level
    const elevationThresholdY = avgShoulderY + torsoHeight * 0.45;
    const leftWristElevated = kp.leftWrist.y < elevationThresholdY;
    const rightWristElevated = kp.rightWrist.y < elevationThresholdY;

    // At least one arm must be raised for a valid screening frame (if both down, patient is not participating)
    if (!leftWristElevated && !rightWristElevated) {
      return {
        isValid: false,
        rejectionReason: 'ARMS_NOT_RAISED',
        bodyRollDeg,
        shoulderWidthNorm: shoulderWidth,
        armsRaised: false,
        lightingPass: true,
      };
    }

    // 6. Check Lighting (if canvas context available)
    let lightingPass = true;
    if (frameCanvas) {
      lightingPass = this.checkLighting(frameCanvas);
      if (!lightingPass) {
        return {
          isValid: false,
          rejectionReason: 'POOR_LIGHTING',
          bodyRollDeg,
          shoulderWidthNorm: shoulderWidth,
          armsRaised: true,
          lightingPass: false,
        };
      }
    }

    return {
      isValid: true,
      rejectionReason: null,
      bodyRollDeg,
      shoulderWidthNorm: shoulderWidth,
      armsRaised: true,
      lightingPass: true,
    };
  }

  /**
   * Fast luminance check on sampled canvas area.
   */
  private static checkLighting(canvas: HTMLCanvasElement): boolean {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return true;
      const w = Math.min(canvas.width, 160);
      const h = Math.min(canvas.height, 120);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      let totalLum = 0;
      const sampleStep = 8; // Sample every 8th pixel for speed
      let sampleCount = 0;

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;
        sampleCount++;
      }

      const avgLum = sampleCount > 0 ? totalLum / sampleCount : 128;
      return (
        avgLum >= ARM_ANALYSIS_CONFIG.QUALITY.MIN_LUMINANCE &&
        avgLum <= ARM_ANALYSIS_CONFIG.QUALITY.MAX_LUMINANCE
      );
    } catch {
      return true;
    }
  }
}
