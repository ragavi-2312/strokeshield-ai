import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaceLandmarkService,
  FaceQualityChecker,
  FaceAsymmetryCalculator,
  FrameAggregator,
  FACE_ANALYSIS_CONFIG,
  FaceKeypoints,
  SingleFrameAsymmetryResult,
  MultiFrameAggregatedResult,
  FaceAnalysisState
} from '../../utils/faceAnalysis';
import { SpeechHelper } from '../../utils/speechHelper';
import { 
  Camera, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw, 
  Activity, 
  Eye, 
  ChevronDown,
  ChevronUp,
  Terminal,
  Layers,
  ArrowRight,
  Sun,
  Smile,
  Info
} from 'lucide-react';

export interface FaceScreeningResultPayload {
  facial_asymmetry_score: number;
  facial_symmetry_score: number;
  facial_measurement_quality: number;
  analysis_quality_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  mouth_asymmetry_score: number;
  eye_asymmetry_score: number;
  eyebrow_asymmetry_score: number;
  cheek_asymmetry_score: number;
  jaw_asymmetry_score: number;
  highest_asymmetry_region: string;
  frame_count: number;
  valid_frame_count: number;
  rejected_frame_count: number;
  median_score: number;
  mean_score: number;
  standard_deviation: number;
  head_yaw: number;
  head_pitch: number;
  head_roll: number;
  ai_face_observation: string;
  doctor_face_confirmation: string;
  doctor_face_notes: string;
  model_name: string;
  model_version: string;
  screening_timestamp: string;
}

interface FaceScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmResult: (data: FaceScreeningResultPayload) => void;
}

export const FaceScreeningModal: React.FC<FaceScreeningModalProps> = ({
  isOpen,
  onClose,
  onConfirmResult,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const samplingIntervalRef = useRef<any>(null);

  // Workflow State Machine
  const [analysisState, setAnalysisState] = useState<FaceAnalysisState>('WAITING');

  // Real-time Frame Analysis State
  const [currentKeypoints, setCurrentKeypoints] = useState<FaceKeypoints | null>(null);
  const [currentFrameResult, setCurrentFrameResult] = useState<SingleFrameAsymmetryResult | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<SingleFrameAsymmetryResult[]>([]);
  const [aggregatedResult, setAggregatedResult] = useState<MultiFrameAggregatedResult | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Settings & Toggles
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showTechnicalPanel, setShowTechnicalPanel] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Doctor Verification & Override Gate
  const [doctorConfirmation, setDoctorConfirmation] = useState<'Normal' | 'Possible Asymmetry' | 'Abnormal' | 'Unable to Assess'>('Normal');
  const [doctorNotes, setDoctorNotes] = useState('');

  // 1. Initialize Camera Stream & Pre-load Landmarker
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const init = async () => {
      setCameraError(null);
      setIsModelLoading(true);

      // Pre-warm MediaPipe Face Landmarker
      try {
        await FaceLandmarkService.getInstance();
      } catch (err) {
        console.warn('MediaPipe pre-initialization note:', err);
      } finally {
        if (mounted) setIsModelLoading(false);
      }

      // Start WebCam
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 }, 
              frameRate: { ideal: 30 } 
            },
            audio: false,
          });

          if (mounted && videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            streamRef.current = stream;
            setAnalysisState('WAITING');
            if (isVoiceEnabled) {
              SpeechHelper.speak('Please face the camera directly to prepare for facial asymmetry screening.');
            }
          }
        } else {
          throw new Error('Camera API is not supported in this browser.');
        }
      } catch (err: any) {
        if (mounted) {
          setCameraError(err.message || 'Camera permission denied or camera device unavailable.');
          setAnalysisState('ERROR');
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (samplingIntervalRef.current) clearInterval(samplingIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      SpeechHelper.cancel();
    };
  }, [isOpen]);

  // 2. Real-time Landmark Detection & Canvas Rendering Loop
  useEffect(() => {
    if (!isOpen || !videoRef.current || !canvasRef.current) return;
    let isRunning = true;

    const renderLoop = async () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, w, h);

          // Run MediaPipe Face Landmarker inference
          const nowMs = performance.now();
          const { keypoints, faceCount } = await FaceLandmarkService.processVideoFrame(video, nowMs, w, h);

          // Evaluate quality & head pose
          const quality = FaceQualityChecker.checkFrameQuality(keypoints, faceCount, canvas);

          if (keypoints) {
            setCurrentKeypoints(keypoints);
            const frameRes = FaceAsymmetryCalculator.calculateFacialAsymmetry(keypoints, quality);
            setCurrentFrameResult(frameRes);

            // Draw Visual Landmark Overlay (Explainable AI)
            if (showLandmarks) {
              // 1. Draw Position Guide Oval
              ctx.strokeStyle = quality.headPose.isFrontal ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([8, 6]);
              ctx.beginPath();
              ctx.ellipse(w / 2, h / 2, keypoints.faceWidth * 0.58, keypoints.faceHeight * 0.56, 0, 0, 2 * Math.PI);
              ctx.stroke();
              ctx.setLineDash([]);

              // 2. Draw Facial Midline Vector (Sellion -> Chin)
              ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; // Cyan
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(keypoints.midline.sellion.x, keypoints.midline.sellion.y - 15);
              ctx.lineTo(keypoints.midline.chin.x, keypoints.midline.chin.y + 10);
              ctx.stroke();

              // 3. Draw Mouth Level Bilateral Horizontal Line
              ctx.strokeStyle = frameRes.regionalScores.mouth > 25 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.85)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(keypoints.mouth.leftCheilion.x - 12, keypoints.mouth.leftCheilion.y);
              ctx.lineTo(keypoints.mouth.rightCheilion.x + 12, keypoints.mouth.rightCheilion.y);
              ctx.stroke();

              // 4. Draw Inter-Ocular Reference Line
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(keypoints.eyes.leftPupil.x, keypoints.eyes.leftPupil.y);
              ctx.lineTo(keypoints.eyes.rightPupil.x, keypoints.eyes.rightPupil.y);
              ctx.stroke();

              // 5. Draw Key Landmark Nodes
              const primaryPoints = [
                keypoints.eyes.leftPupil, keypoints.eyes.rightPupil,
                keypoints.eyebrows.leftPeak, keypoints.eyebrows.rightPeak,
                keypoints.midline.sellion, keypoints.midline.noseTip,
                keypoints.cheeks.leftCheek, keypoints.cheeks.rightCheek,
                keypoints.jaw.leftGonion, keypoints.jaw.rightGonion,
                keypoints.midline.chin
              ];

              ctx.fillStyle = '#06b6d4'; // Cyan
              primaryPoints.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
                ctx.fill();
              });

              // Highlight Mouth Corners (Cheilions)
              ctx.fillStyle = frameRes.regionalScores.mouth > 25 ? '#ef4444' : '#10b981';
              [keypoints.mouth.leftCheilion, keypoints.mouth.rightCheilion].forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
                ctx.fill();
              });
            }
          } else {
            setCurrentKeypoints(null);
            setCurrentFrameResult(null);
          }
        }
      }

      if (isRunning) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isOpen, showLandmarks]);

  // 3. Multi-Frame Sampling Controller (5 Seconds ~ 50 Samples at 10 fps)
  const handleStartRecording = useCallback(() => {
    setAnalysisState('ANALYZING');
    setCapturedFrames([]);
    setRecordingProgress(0);
    setAggregatedResult(null);

    if (isVoiceEnabled) {
      SpeechHelper.speak('Starting 5-second facial screening. Please keep your face still.');
    }

    const startTime = Date.now();
    const duration = FACE_ANALYSIS_CONFIG.TARGET_RECORDING_DURATION_MS;
    const intervalMs = FACE_ANALYSIS_CONFIG.FRAME_SAMPLING_INTERVAL_MS;
    const frameBuffer: SingleFrameAsymmetryResult[] = [];

    samplingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setRecordingProgress(progress);

      // Snapshot current frame result
      if (currentFrameResult) {
        frameBuffer.push({ ...currentFrameResult, frameIndex: frameBuffer.length });
        setCapturedFrames([...frameBuffer]);
      }

      // Completed 5 seconds
      if (elapsed >= duration) {
        clearInterval(samplingIntervalRef.current);
        samplingIntervalRef.current = null;

        // Run Multi-Frame Aggregator
        const aggregated = FrameAggregator.aggregateFrames(frameBuffer);
        setAggregatedResult(aggregated);

        if (aggregated.analysisQuality === 'LOW') {
          setAnalysisState('RETRY_REQUIRED');
          if (isVoiceEnabled) {
            SpeechHelper.speak('Image quality was low. Please keep your face straight and try again.');
          }
        } else {
          setAnalysisState('COMPLETED');

          // Auto-suggest clinical verification radio based on measured asymmetry
          if (aggregated.medianOverallAsymmetryPercent > 35.0 || aggregated.medianRegionalScores.mouth > 45.0) {
            setDoctorConfirmation('Abnormal');
          } else if (aggregated.medianOverallAsymmetryPercent > 18.0 || aggregated.medianRegionalScores.mouth > 25.0) {
            setDoctorConfirmation('Possible Asymmetry');
          } else {
            setDoctorConfirmation('Normal');
          }

          if (isVoiceEnabled) {
            SpeechHelper.speak(`Facial screening complete. Measured facial asymmetry: ${aggregated.medianOverallAsymmetryPercent} percent.`);
          }
        }
      }
    }, intervalMs);
  }, [currentFrameResult, isVoiceEnabled]);

  // 4. Retry Handler
  const handleRetry = () => {
    if (samplingIntervalRef.current) {
      clearInterval(samplingIntervalRef.current);
      samplingIntervalRef.current = null;
    }
    setAnalysisState('WAITING');
    setCapturedFrames([]);
    setRecordingProgress(0);
    setAggregatedResult(null);
    if (isVoiceEnabled) {
      SpeechHelper.speak('Test reset. Position your face in the center.');
    }
  };

  // 5. Confirm & Transmit Structured Result
  const handleConfirmAndSave = () => {
    if (!aggregatedResult) return;

    // Formulate descriptive AI observation
    let aiObservation = 'Symmetric geometric facial landmarks observed';
    if (aggregatedResult.medianOverallAsymmetryPercent > 35.0 || aggregatedResult.highestAsymmetryRegionScore > 45.0) {
      aiObservation = `Significant geometric facial asymmetry observed (Asymmetry: ${aggregatedResult.medianOverallAsymmetryPercent}%, Highest: ${aggregatedResult.highestAsymmetryRegion} ${aggregatedResult.highestAsymmetryRegionScore}%) — marked unilateral deviation — doctor verification required`;
    } else if (aggregatedResult.medianOverallAsymmetryPercent > 18.0 || aggregatedResult.highestAsymmetryRegionScore > 25.0) {
      aiObservation = `Possible geometric facial asymmetry observed (Asymmetry: ${aggregatedResult.medianOverallAsymmetryPercent}%, Highest: ${aggregatedResult.highestAsymmetryRegion} ${aggregatedResult.highestAsymmetryRegionScore}%) — mild/moderate unilateral deviation — doctor verification required`;
    } else {
      aiObservation = `Low geometric facial asymmetry observed (Asymmetry: ${aggregatedResult.medianOverallAsymmetryPercent}%, Symmetry: ${aggregatedResult.medianSymmetryPercent}%) — bilaterally balanced landmarks`;
    }

    onConfirmResult({
      facial_asymmetry_score: aggregatedResult.medianOverallAsymmetryPercent,
      facial_symmetry_score: aggregatedResult.medianSymmetryPercent,
      facial_measurement_quality: aggregatedResult.analysisQuality === 'HIGH' ? 95 : aggregatedResult.analysisQuality === 'MEDIUM' ? 75 : 40,
      analysis_quality_tier: aggregatedResult.analysisQuality,
      mouth_asymmetry_score: aggregatedResult.medianRegionalScores.mouth,
      eye_asymmetry_score: aggregatedResult.medianRegionalScores.eyes,
      eyebrow_asymmetry_score: aggregatedResult.medianRegionalScores.eyebrows,
      cheek_asymmetry_score: aggregatedResult.medianRegionalScores.cheeks,
      jaw_asymmetry_score: aggregatedResult.medianRegionalScores.jaw,
      highest_asymmetry_region: aggregatedResult.highestAsymmetryRegion,
      frame_count: aggregatedResult.totalFrames,
      valid_frame_count: aggregatedResult.validFramesCount,
      rejected_frame_count: aggregatedResult.rejectedFramesCount,
      median_score: aggregatedResult.medianOverallAsymmetryPercent,
      mean_score: aggregatedResult.meanOverallAsymmetryPercent,
      standard_deviation: aggregatedResult.standardDeviation,
      head_yaw: aggregatedResult.averageHeadPose.yaw,
      head_pitch: aggregatedResult.averageHeadPose.pitch,
      head_roll: aggregatedResult.averageHeadPose.roll,
      ai_face_observation: aiObservation,
      doctor_face_confirmation: doctorConfirmation,
      doctor_face_notes: doctorNotes,
      model_name: aggregatedResult.modelName,
      model_version: aggregatedResult.modelVersion,
      screening_timestamp: aggregatedResult.timestamp,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150 max-h-[96vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                BE-FAST • Facial Asymmetry Screening
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                {FACE_ANALYSIS_CONFIG.MODEL_NAME}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-700" />
              <span>Quantitative Facial Asymmetry Analysis</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
              title={isVoiceEnabled ? 'Mute Voice' : 'Enable Voice'}
            >
              {isVoiceEnabled ? <Volume2 className="w-5 h-5 text-teal-700" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera / Model Error Banner */}
        {cameraError && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-1">
            <strong>Camera Unavailable:</strong>
            <p>{cameraError}</p>
          </div>
        )}

        {/* User Guidance Instructions Card (Pre-Recording) */}
        {analysisState === 'WAITING' && (
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-teal-900">
              <Info className="w-4 h-4 text-teal-700" />
              <span>User Guidance for Reliable Facial Screening</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-teal-950 font-medium pt-1">
              <div className="bg-white/80 p-2 rounded-xl border border-teal-100 text-center">
                1. Face camera directly
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-teal-100 text-center">
                2. Keep head straight
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-teal-100 text-center">
                3. Keep face in oval
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-teal-100 text-center">
                4. Use good lighting
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-teal-100 text-center">
                5. Keep face still (5s)
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Camera Viewport + Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left 7 Cols: Video & Mesh Canvas */}
          <div className="md:col-span-7 space-y-3">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-10 pointer-events-none"
              />

              {/* Step / Progress Floating Pill */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none text-xs">
                <span className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-slate-700 shadow">
                  {analysisState === 'WAITING' && 'Position Face in Center'}
                  {analysisState === 'ANALYZING' && `Analyzing Facial Landmarks... ${recordingProgress}%`}
                  {analysisState === 'COMPLETED' && '5-Second Screening Completed'}
                  {analysisState === 'RETRY_REQUIRED' && 'Low Quality — Please Repeat'}
                  {analysisState === 'ERROR' && 'Camera Error'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="bg-slate-900/85 backdrop-blur-md text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                    {currentKeypoints ? '● Landmarks Detected' : 'Detecting Face...'}
                  </span>
                </div>
              </div>

              {/* Dynamic Head Pose & Quality Warnings */}
              {currentFrameResult && !currentFrameResult.quality.isValid && (
                <div className="absolute bottom-3 inset-x-4 z-20 text-center pointer-events-none animate-pulse">
                  <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                    ⚠️ {currentFrameResult.headPose.statusMessage}
                  </span>
                </div>
              )}
            </div>

            {/* Recording Progress Bar during Active Sampling */}
            {analysisState === 'ANALYZING' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold text-slate-600">
                  <span>Sampling Video Frames...</span>
                  <span>{capturedFrames.length} / {FACE_ANALYSIS_CONFIG.TARGET_TOTAL_FRAMES} frames ({recordingProgress}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="bg-teal-600 h-full transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${recordingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Bar & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                    showLandmarks ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  <span>Overlay: {showLandmarks ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {analysisState === 'WAITING' && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={!currentFrameResult?.quality.isValid}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>[ Start 5s Facial Analysis ]</span>
                </button>
              )}

              {analysisState === 'RETRY_REQUIRED' && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>[ Repeat Facial Analysis ]</span>
                </button>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Results, Regional Breakdown & Doctor Gate */}
          <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
            
            {/* Primary Facial Asymmetry & Symmetry Cards */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                
                {/* Asymmetry % */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Facial Asymmetry
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                    {aggregatedResult
                      ? `${aggregatedResult.medianOverallAsymmetryPercent}%`
                      : currentFrameResult
                      ? `${currentFrameResult.overallAsymmetryPercent}%`
                      : '0.0%'}
                  </div>
                </div>

                {/* Symmetry % */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-teal-700 block">
                    Facial Symmetry
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-teal-800">
                    {aggregatedResult
                      ? `${aggregatedResult.medianSymmetryPercent}%`
                      : currentFrameResult
                      ? `${currentFrameResult.symmetryPercent}%`
                      : '100.0%'}
                  </div>
                </div>
              </div>

              {/* Analysis Quality Tier Badge */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">Analysis Quality:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                  aggregatedResult?.analysisQuality === 'HIGH'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : aggregatedResult?.analysisQuality === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {aggregatedResult ? `${aggregatedResult.analysisQuality} (${aggregatedResult.validFramesCount}/${aggregatedResult.totalFrames} frames)` : 'Ready'}
                </span>
              </div>

              {/* Regional Breakdown Bars */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Regional Asymmetry Breakdown
                  </span>
                  {aggregatedResult && (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      Highest: {aggregatedResult.highestAsymmetryRegion} ({aggregatedResult.highestAsymmetryRegionScore}%)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Mouth / Lower Face (40%)', score: aggregatedResult?.medianRegionalScores.mouth ?? currentFrameResult?.regionalScores.mouth ?? 0 },
                    { label: 'Eyes / Palpebral (20%)', score: aggregatedResult?.medianRegionalScores.eyes ?? currentFrameResult?.regionalScores.eyes ?? 0 },
                    { label: 'Eyebrows (15%)', score: aggregatedResult?.medianRegionalScores.eyebrows ?? currentFrameResult?.regionalScores.eyebrows ?? 0 },
                    { label: 'Cheeks / Zygoma (15%)', score: aggregatedResult?.medianRegionalScores.cheeks ?? currentFrameResult?.regionalScores.cheeks ?? 0 },
                    { label: 'Jaw / Mandible (10%)', score: aggregatedResult?.medianRegionalScores.jaw ?? currentFrameResult?.regionalScores.jaw ?? 0 },
                  ].map((r, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">{r.label}</span>
                        <strong className="font-mono text-slate-900">{r.score.toFixed(1)}%</strong>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.score > 35 ? 'bg-red-500' : r.score > 20 ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(100, r.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctor Verification & Clinical Confirmation Gate */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                Doctor Clinical Confirmation
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'Possible Asymmetry', label: 'Possible Asymmetry' },
                  { value: 'Abnormal', label: 'Abnormal' },
                  { value: 'Unable to Assess', label: 'Unable to Assess' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`p-2 rounded-xl border cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                      doctorConfirmation === opt.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="doctor_face_confirmation"
                      value={opt.value}
                      checked={doctorConfirmation === opt.value}
                      onChange={() => setDoctorConfirmation(opt.value as any)}
                      className="sr-only"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Doctor Notes: e.g. Unilateral right nasolabial flattening observed..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technical Transparency & Model Provenance Panel */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 text-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setShowTechnicalPanel(!showTechnicalPanel)}
            className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold flex items-center justify-between text-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span>Computer Vision Diagnostics & Quality Panel</span>
            </div>
            {showTechnicalPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTechnicalPanel && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] bg-slate-950 text-slate-300">
              <div>
                <span className="text-slate-500 block">Model Name:</span>
                <strong className="text-teal-400">{FACE_ANALYSIS_CONFIG.MODEL_NAME}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Model Version:</span>
                <strong className="text-teal-400">{FACE_ANALYSIS_CONFIG.MODEL_VERSION}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Valid Frame Count:</span>
                <strong className="text-emerald-400">{aggregatedResult ? `${aggregatedResult.validFramesCount} / ${aggregatedResult.totalFrames}` : '—'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Std Dev (Dispersion):</span>
                <strong className={aggregatedResult?.isStableMeasurement ? 'text-emerald-400' : 'text-amber-400'}>
                  ±{aggregatedResult?.standardDeviation || '0.0'}%
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Average Head Pose:</span>
                <strong className="text-slate-300">
                  Yaw: {aggregatedResult?.averageHeadPose.yaw ?? currentFrameResult?.headPose.yawDeg ?? 0}° • Roll: {aggregatedResult?.averageHeadPose.roll ?? currentFrameResult?.headPose.rollDeg ?? 0}°
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Rejected Frames:</span>
                <strong className="text-amber-400">{aggregatedResult?.rejectedFramesCount ?? 0}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Sampling Duration:</span>
                <strong className="text-teal-400">5.0s (10 fps)</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Normalization Base:</span>
                <strong className="text-teal-400">Inter-Ocular (IOD)</strong>
              </div>
            </div>
          )}
        </div>

        {/* Medical Safety Disclaimer */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Screening Notice:</strong> Facial asymmetry is a screening measurement, not a stroke diagnosis. Results must be interpreted by a qualified healthcare professional.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[ Repeat Facial Analysis ]</span>
          </button>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl w-full sm:w-auto cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={analysisState !== 'COMPLETED' || !aggregatedResult}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md shadow-teal-700/20 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>[ Confirm & Save to Assessment ]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
