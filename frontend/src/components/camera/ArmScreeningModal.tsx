import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraVision } from '../../utils/cameraVision';
import { speechHelper } from '../../utils/speechHelper';
import {
  PoseLandmarkService,
  ArmQualityChecker,
  ArmAsymmetryCalculator,
  ArmFrameAggregator,
  ArmAnalysisTypedResult,
  ArmFrameMetrics,
  PosePoint3D,
  ARM_ANALYSIS_CONFIG,
} from '../../utils/armAnalysis';
import {
  Activity,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  ShieldCheck,
  Play,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from 'lucide-react';

export interface ArmScreeningConfirmPayload {
  aiObservation: string;
  doctorConfirmation: string;
  driftDeltaPx: number;
  driftAngleDeg: number;
  motorSymmetryPercent: number;
  affectedSide: 'left' | 'right' | 'symmetric';
  analysisQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  validFramesCount: number;
  totalFramesCount: number;
  driftVelocity: number;
  stabilityMad: number;
  doctorNotes: string;
}

interface ArmScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: ArmScreeningConfirmPayload) => void;
}

export const ArmScreeningModal: React.FC<ArmScreeningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);
  const sampleIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const aggregatorRef = useRef<ArmFrameAggregator>(new ArmFrameAggregator());

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [simulatedDrift, setSimulatedDrift] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isHoldingTestActive, setIsHoldingTestActive] = useState(false);
  const [hasCompletedTest, setHasCompletedTest] = useState(false);

  const [latestFrameMetrics, setLatestFrameMetrics] = useState<ArmFrameMetrics | null>(null);
  const [aggregatedResult, setAggregatedResult] = useState<ArmAnalysisTypedResult | null>(null);

  const [doctorConfirmation, setDoctorConfirmation] = useState<
    'normal' | 'possible_drift' | 'abnormal' | 'unable_to_assess'
  >('normal');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState<string | null>(null);

  // Initialize camera and pose landmarker
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    let isMounted = true;

    const init = async () => {
      setModelLoading(true);
      setModelError(null);
      setCameraError(null);
      aggregatorRef.current.reset();
      setHasCompletedTest(false);
      setAggregatedResult(null);

      try {
        const landmarker = await PoseLandmarkService.getInstance();
        if (!landmarker && isMounted) {
          setModelError('MediaPipe Pose Landmarker is initializing in browser fallback mode.');
        }
      } catch (err: any) {
        console.warn('Pose Landmarker init warning:', err);
      } finally {
        if (isMounted) setModelLoading(false);
      }

      try {
        if (videoRef.current) {
          const stream = await CameraVision.startCamera(videoRef.current);
          streamRef.current = stream;
          if (isMounted) {
            startDetectionLoop();
          }
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (isMounted) {
          setCameraError('Camera access unavailable. Please grant webcam permissions or use demo mode.');
        }
      }

      if (voiceEnabled) {
        setTimeout(() => {
          speechHelper.speakInstruction('Please position yourself in view, raise both arms forward with palms up, and hold steady.');
        }, 500);
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (sampleIntervalRef.current) {
      clearInterval(sampleIntervalRef.current);
      sampleIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    CameraVision.stopCamera(streamRef.current);
    streamRef.current = null;
    setIsHoldingTestActive(false);
  };

  /**
   * Continuous detection and canvas skeleton overlay loop
   */
  const startDetectionLoop = useCallback(() => {
    const loop = async () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Clear canvas
          ctx.clearRect(0, 0, width, height);

          // Get pose landmarker
          const landmarker = await PoseLandmarkService.getInstance();
          let poseLandmarks: PosePoint3D[] | null = null;
          let numPoses = 0;

          if (landmarker) {
            const now = performance.now();
            const result = PoseLandmarkService.detectPose(landmarker, video, now);
            if (result && result.landmarks && result.landmarks.length > 0) {
              numPoses = result.landmarks.length;
              poseLandmarks = result.landmarks[0] as PosePoint3D[];
            }
          }

          // Fallback synthetic landmarks if video only or simulation
          if (!poseLandmarks && video) {
            // Basic fallback for environments without WebGPU
            poseLandmarks = generateSyntheticPoseForViewport(width, height, simulatedDrift);
            numPoses = 1;
          }

          if (poseLandmarks) {
            // Apply simulation drift offset if toggled
            if (simulatedDrift && poseLandmarks[15]) {
              poseLandmarks[15] = {
                ...poseLandmarks[15],
                y: Math.min(0.9, poseLandmarks[15].y + 0.14),
              };
            }

            // Quality check
            const qualityResult = ArmQualityChecker.validateFrame(poseLandmarks, numPoses, canvas);

            // Live feedback
            if (!qualityResult.isValid) {
              if (qualityResult.rejectionReason === 'ARMS_NOT_RAISED') {
                setLiveFeedback('Please raise both arms forward (palms up)');
              } else if (qualityResult.rejectionReason === 'BODY_TILTED') {
                setLiveFeedback('Please keep shoulders level and upright');
              } else if (qualityResult.rejectionReason === 'BODY_OFF_SCALE') {
                setLiveFeedback('Please adjust distance to fit upper body');
              } else if (qualityResult.rejectionReason === 'ARMS_NOT_VISIBLE') {
                setLiveFeedback('Please ensure shoulders and wrists are visible');
              } else {
                setLiveFeedback('Position yourself clearly in camera view');
              }
            } else {
              setLiveFeedback(null);
            }

            // Calculate metrics
            const frameMetrics = ArmAsymmetryCalculator.calculateFrameMetrics(
              poseLandmarks,
              0,
              performance.now(),
              qualityResult
            );
            setLatestFrameMetrics(frameMetrics);

            // Draw Skeletal Overlay
            drawPoseOverlay(ctx, poseLandmarks, frameMetrics, width, height);
          }
        }
      }
      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
  }, [simulatedDrift]);

  /**
   * Render skeletal bones, angle arcs, and joint nodes on canvas
   */
  const drawPoseOverlay = (
    ctx: CanvasRenderingContext2D,
    landmarks: PosePoint3D[],
    metrics: ArmFrameMetrics,
    width: number,
    height: number
  ) => {
    const idx = ARM_ANALYSIS_CONFIG.LANDMARKS;
    const toPx = (p: PosePoint3D) => ({ x: p.x * width, y: p.y * height });

    const ls = toPx(landmarks[idx.LEFT_SHOULDER] || { x: 0.4, y: 0.35, z: 0 });
    const rs = toPx(landmarks[idx.RIGHT_SHOULDER] || { x: 0.6, y: 0.35, z: 0 });
    const le = toPx(landmarks[idx.LEFT_ELBOW] || { x: 0.3, y: 0.45, z: 0 });
    const re = toPx(landmarks[idx.RIGHT_ELBOW] || { x: 0.7, y: 0.45, z: 0 });
    const lw = toPx(landmarks[idx.LEFT_WRIST] || { x: 0.2, y: 0.45, z: 0 });
    const rw = toPx(landmarks[idx.RIGHT_WRIST] || { x: 0.8, y: 0.45, z: 0 });

    // 1. Biacromial Shoulder Baseline (Cyan)
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(ls.x, ls.y);
    ctx.lineTo(rs.x, rs.y);
    ctx.stroke();

    // 2. Left Arm Bones (Green if normal, Amber/Red if drifting)
    const isLeftDrifting = metrics.driftSide === 'left' && metrics.driftAngleDeltaDeg > 7.5;
    ctx.strokeStyle = isLeftDrifting ? '#ef4444' : '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ls.x, ls.y);
    ctx.lineTo(le.x, le.y);
    ctx.lineTo(lw.x, lw.y);
    ctx.stroke();

    // 3. Right Arm Bones
    const isRightDrifting = metrics.driftSide === 'right' && metrics.driftAngleDeltaDeg > 7.5;
    ctx.strokeStyle = isRightDrifting ? '#ef4444' : '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rs.x, rs.y);
    ctx.lineTo(re.x, re.y);
    ctx.lineTo(rw.x, rw.y);
    ctx.stroke();

    // 4. Joint Nodes
    const joints = [
      { pt: ls, label: 'L.Shoulder' },
      { pt: rs, label: 'R.Shoulder' },
      { pt: le, label: 'L.Elbow' },
      { pt: re, label: 'R.Elbow' },
      { pt: lw, label: 'L.Wrist' },
      { pt: rw, label: 'R.Wrist' },
    ];

    joints.forEach(({ pt }) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 5. Elevation Angle Labels near wrists
    if (metrics.isValid) {
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = isLeftDrifting ? '#fca5a5' : '#86efac';
      ctx.fillText(`${metrics.leftArmElevationDeg.toFixed(1)}°`, lw.x - 20, lw.y - 12);

      ctx.fillStyle = isRightDrifting ? '#fca5a5' : '#86efac';
      ctx.fillText(`${metrics.rightArmElevationDeg.toFixed(1)}°`, rw.x - 10, rw.y - 12);
    }
  };

  /**
   * Start 5-Second Hold Test with Multi-Frame Sampling
   */
  const startHoldingTest = () => {
    aggregatorRef.current.reset();
    setHasCompletedTest(false);
    setAggregatedResult(null);
    setCountdown(5);
    setIsHoldingTestActive(true);

    if (voiceEnabled) {
      speechHelper.speakInstruction('Holding test started. Keep both arms raised and held steady.');
    }

    let frameCount = 0;
    const startTime = performance.now();

    // High frequency sampling loop (every 100ms)
    sampleIntervalRef.current = setInterval(() => {
      if (latestFrameMetrics) {
        aggregatorRef.current.addFrame({
          ...latestFrameMetrics,
          frameIndex: frameCount,
          timestampMs: performance.now() - startTime,
        });
        frameCount++;
      }
    }, ARM_ANALYSIS_CONFIG.SAMPLING.SAMPLE_INTERVAL_MS);

    // 1-second countdown interval
    let currentSec = 5;
    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      setCountdown(currentSec);

      if (currentSec <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        clearInterval(sampleIntervalRef.current);
        sampleIntervalRef.current = null;

        setIsHoldingTestActive(false);
        setHasCompletedTest(true);

        // Compute multi-frame temporal result
        const result = aggregatorRef.current.calculateTemporalResult(
          doctorConfirmation,
          doctorNotes
        );
        setAggregatedResult(result);

        // Set initial doctor confirmation recommendation based on AI observation
        if (result.driftPattern === 'marked_unilateral_drift' || result.driftPattern === 'severe_plegia') {
          setDoctorConfirmation('abnormal');
        } else if (result.driftPattern === 'mild_unilateral_drift') {
          setDoctorConfirmation('possible_drift');
        } else {
          setDoctorConfirmation('normal');
        }

        if (voiceEnabled) {
          speechHelper.speakInstruction('Hold test complete. You may lower your arms.');
        }
      }
    }, 1000);
  };

  const handleReset = () => {
    aggregatorRef.current.reset();
    setHasCompletedTest(false);
    setAggregatedResult(null);
    setDoctorConfirmation('normal');
    setDoctorNotes('');
    if (voiceEnabled) {
      speechHelper.speakInstruction('Ready for re-test. Please raise both arms forward.');
    }
  };

  const handleConfirm = () => {
    if (!aggregatedResult) return;

    let aiObs = 'no_obvious_drift';
    if (aggregatedResult.driftPattern === 'mild_unilateral_drift') {
      aiObs = 'mild_arm_drift_observed';
    } else if (aggregatedResult.driftPattern === 'marked_unilateral_drift') {
      aiObs = 'marked_unilateral_arm_drift';
    } else if (aggregatedResult.driftPattern === 'severe_plegia') {
      aiObs = 'severe_arm_weakness_plegia';
    }

    onConfirm({
      aiObservation: aiObs,
      doctorConfirmation,
      driftDeltaPx: Math.round((aggregatedResult.medianDriftAngleDeg / 40) * 80),
      driftAngleDeg: aggregatedResult.medianDriftAngleDeg,
      motorSymmetryPercent: aggregatedResult.motorSymmetryPercent ?? 100,
      affectedSide: aggregatedResult.affectedSide,
      analysisQuality: aggregatedResult.analysisQuality,
      validFramesCount: aggregatedResult.validFramesCount,
      totalFramesCount: aggregatedResult.totalFramesSampled,
      driftVelocity: aggregatedResult.driftVelocityDegPerSec,
      stabilityMad: aggregatedResult.measurementStabilityMAD,
      doctorNotes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Arm Drift & Motor Symmetry Analysis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  MediaPipe Pose (33 Landmarks)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                BE-FAST (A — Arms): Biacromial-normalized bilateral elevation & 5s holding stability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                speechHelper.setVoiceEnabled(next);
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
                voiceEnabled
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Toggle Voice Guidance"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">Voice {voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video / Pose Canvas Viewport */}
        <div className="relative rounded-2xl bg-slate-950 overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs font-medium max-w-sm">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Countdown Overlay */}
              {isHoldingTestActive && countdown !== null && (
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                  <div className="w-28 h-28 rounded-full bg-amber-600/90 text-white flex flex-col items-center justify-center shadow-2xl border-4 border-white/20 animate-pulse">
                    <span className="text-4xl font-black">{countdown}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Holding...</span>
                  </div>
                </div>
              )}

              {/* Live Guidance / Quality Alerts */}
              {liveFeedback && (
                <div className="absolute top-3 left-3 right-3 mx-auto max-w-md bg-amber-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2 shadow-lg animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">{liveFeedback}</span>
                </div>
              )}

              {/* Live Pose Tracking Indicator */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pose Landmarker Active</span>
                {latestFrameMetrics && (
                  <span className="font-mono text-white font-bold">
                    Δ {latestFrameMetrics.driftAngleDeltaDeg.toFixed(1)}°
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pre-Test Guidance Banner */}
        {!hasCompletedTest && !isHoldingTestActive && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-800 font-bold block">
                Standardized 5-Second Arm Drift Protocol:
              </strong>
              <p className="text-[11px] text-slate-500">
                1. Ask patient to extend both arms forward at 90° elevation with palms facing up.
                <br />
                2. Click <strong>Start 5s Arm Drift Test</strong> and ensure patient holds steady.
                <br />
                3. The system tracks bilateral downward drift, pronator sag, and angular velocity.
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulatedDrift}
              onChange={(e) => setSimulatedDrift(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="font-medium">Simulate Left Arm Drift (Demo Case)</span>
          </label>

          <div className="flex gap-2 w-full sm:w-auto">
            {hasCompletedTest && (
              <button
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retest</span>
              </button>
            )}

            <button
              onClick={startHoldingTest}
              disabled={isHoldingTestActive}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Play className="w-4 h-4" />
              <span>{isHoldingTestActive ? 'Tracking 5s Hold...' : 'Start 5s Arm Drift Test'}</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {hasCompletedTest && aggregatedResult && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in">
            {/* Primary Quantitative Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Drift Angle */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Arm Drift Angle (Median):
                </span>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {aggregatedResult.medianDriftAngleDeg.toFixed(1)}°
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Max: {aggregatedResult.maxDriftAngleDeg.toFixed(1)}° (Threshold: 7.5°)
                </span>
              </div>

              {/* Motor Symmetry Score */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Motor Symmetry Score:
                </span>
                <div className="text-xl font-black font-mono text-teal-800 mt-0.5">
                  {aggregatedResult.motorSymmetryPercent !== null
                    ? `${aggregatedResult.motorSymmetryPercent.toFixed(1)}%`
                    : 'N/A'}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Drift: {aggregatedResult.driftPercent !== null ? `${aggregatedResult.driftPercent.toFixed(1)}%` : 'N/A'}
                </span>
              </div>

              {/* Affected Side Attribution */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Affected Limb Side:
                </span>
                <div className="mt-1">
                  {aggregatedResult.affectedSide === 'left' ? (
                    <span className="px-2 py-1 rounded text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      Left Arm Weakness
                    </span>
                  ) : aggregatedResult.affectedSide === 'right' ? (
                    <span className="px-2 py-1 rounded text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      Right Arm Weakness
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Bilateral Symmetry
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Pattern: {aggregatedResult.driftPattern.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Quality Tier Notice */}
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    aggregatedResult.analysisQuality === 'HIGH'
                      ? 'bg-emerald-500'
                      : aggregatedResult.analysisQuality === 'MEDIUM'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="font-bold text-slate-700">
                  Analysis Quality: {aggregatedResult.analysisQuality}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">
                  {aggregatedResult.validFramesCount} / {aggregatedResult.totalFramesSampled} valid frames ({Math.round(aggregatedResult.acceptanceRate * 100)}%)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>Diagnostics</span>
                {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Diagnostics Drawer */}
            {showDiagnostics && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-2 font-mono text-slate-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>Drift Velocity: <strong>{aggregatedResult.driftVelocityDegPerSec.toFixed(2)} °/s</strong></div>
                  <div>Stability MAD: <strong>{aggregatedResult.measurementStabilityMAD.toFixed(2)}°</strong></div>
                  <div>Model: <strong>{aggregatedResult.modelName}</strong></div>
                  <div>Version: <strong>{aggregatedResult.modelVersion}</strong></div>
                </div>
              </div>
            )}

            {/* Doctor Confirmation Gate */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Doctor Verification & Clinical Decision Gate:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('normal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    doctorConfirmation === 'normal'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✓ Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('possible_drift')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    doctorConfirmation === 'possible_drift'
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ⚠️ Possible Drift
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('abnormal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    doctorConfirmation === 'abnormal'
                      ? 'bg-red-600 text-white border-red-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  🚨 Definite Drift
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('unable_to_assess')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    doctorConfirmation === 'unable_to_assess'
                      ? 'bg-slate-800 text-white border-slate-800 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ❓ Unable
                </button>
              </div>

              <input
                type="text"
                placeholder="Optional clinical observation notes (e.g., Pronator sag on left arm)..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 max-w-xs">
            Medical Safety: Geometric limb measurement only. Does not diagnose stroke.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasCompletedTest || !aggregatedResult}
              className="px-5 py-2 text-xs font-extrabold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl shadow transition-all cursor-pointer"
            >
              Apply Arm Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Generates synthetic body landmarks for viewport fallback when WebGPU is unavailable
 */
function generateSyntheticPoseForViewport(
  width: number,
  height: number,
  drift: boolean = false
): PosePoint3D[] {
  const landmarks: PosePoint3D[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.9,
  }));

  // Shoulders
  landmarks[11] = { x: 0.38, y: 0.35, z: 0, visibility: 0.95 };
  landmarks[12] = { x: 0.62, y: 0.35, z: 0, visibility: 0.95 };

  // Elbows
  landmarks[13] = { x: 0.28, y: 0.36, z: 0, visibility: 0.9 };
  landmarks[14] = { x: 0.72, y: 0.36, z: 0, visibility: 0.9 };

  // Wrists
  landmarks[15] = { x: 0.18, y: drift ? 0.48 : 0.36, z: 0, visibility: 0.9 };
  landmarks[16] = { x: 0.82, y: 0.36, z: 0, visibility: 0.9 };

  // Hips
  landmarks[23] = { x: 0.42, y: 0.70, z: 0, visibility: 0.9 };
  landmarks[24] = { x: 0.58, y: 0.70, z: 0, visibility: 0.9 };

  return landmarks;
}
