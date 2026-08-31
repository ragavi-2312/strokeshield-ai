import React, { useState, useEffect, useRef } from 'react';
import { 
  QuantitativeFaceAnalyzer, 
  SingleFrameAnalysis, 
  MultiFrameAnalysisResult,
  Point2D,
  ASYMMETRY_WEIGHTS
} from '../../utils/quantitativeFaceAnalysis';
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
  Sun, 
  Sliders, 
  ChevronDown,
  ChevronUp,
  Terminal,
  Layers,
  Smile
} from 'lucide-react';

interface FaceScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmResult: (data: {
    facial_asymmetry_score: number;
    facial_measurement_quality: number;
    mouth_asymmetry_score: number;
    eye_asymmetry_score: number;
    eyebrow_asymmetry_score: number;
    cheek_asymmetry_score: number;
    smile_asymmetry_score: number;
    frame_count: number;
    median_score: number;
    mean_score: number;
    standard_deviation: number;
    head_yaw: number;
    head_pitch: number;
    head_roll: number;
    ai_face_observation: string;
    doctor_face_confirmation: string;
    doctor_face_notes: string;
    screening_timestamp: string;
  }) => void;
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

  // Workflow Stages: 'neutral_capture' -> 'smile_capture' -> 'analyzing' -> 'completed'
  const [stage, setStage] = useState<'neutral_capture' | 'smile_capture' | 'analyzing' | 'completed'>('neutral_capture');

  // Baseline Neutral Mouth Positions for Smile Delta Tracking (Section 7)
  const [neutralMouth, setNeutralMouth] = useState<{ left: Point2D; right: Point2D } | null>(null);

  // Analysis State
  const [currentFrame, setCurrentFrame] = useState<SingleFrameAnalysis | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<SingleFrameAnalysis[]>([]);
  const [aggregatedResult, setAggregatedResult] = useState<MultiFrameAnalysisResult | null>(null);
  const [captureProgress, setCaptureProgress] = useState(0);

  // Toggles & Settings
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [simulateAsymmetry, setSimulateAsymmetry] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Doctor Verification & Override
  const [doctorConfirmation, setDoctorConfirmation] = useState<'Normal' | 'Possible Asymmetry' | 'Abnormal' | 'Unable to Assess'>('Normal');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const initCamera = async () => {
      setCameraError(null);
      try {
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
            audio: false,
          });
          if (mounted) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            streamRef.current = stream;
            if (isVoiceEnabled) {
              SpeechHelper.speak('Please keep your face relaxed to capture baseline facial symmetry.');
            }
          }
        }
      } catch (err: any) {
        if (mounted) {
          setCameraError(err.message || 'Camera permission denied or camera device unavailable.');
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      SpeechHelper.cancel();
    };
  }, [isOpen]);

  // Frame Processing Loop
  useEffect(() => {
    if (!isOpen || !videoRef.current || !canvasRef.current) return;
    let isRunning = true;

    const loop = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const frameData = QuantitativeFaceAnalyzer.analyzeFrame(
          videoRef.current,
          canvasRef.current,
          neutralMouth,
          simulateAsymmetry,
          stage === 'smile_capture' || stage === 'analyzing'
        );

        setCurrentFrame(frameData);

        // Render Landmark Visual Overlay on Canvas (Section 21)
        if (showLandmarks && frameData.landmarks) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const lm = frameData.landmarks;
            const w = canvasRef.current.width;
            const h = canvasRef.current.height;

            // 1. Draw Position Guide Oval
            ctx.strokeStyle = frameData.headPose.isValidPose ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, frameData.faceWidth * 0.65, frameData.faceHeight * 0.68, 0, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. Draw Facial Midline Vector (Nose Bridge -> Chin)
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)'; // Cyan
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(lm.noseBridge.x, lm.noseBridge.y - 25);
            ctx.lineTo(lm.chin.x, lm.chin.y + 15);
            ctx.stroke();

            // 3. Draw Mouth Level Reference Line
            ctx.strokeStyle = frameData.frameAsymmetryScore > 35 ? '#ef4444' : '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(lm.leftMouthCorner.x - 15, lm.rightMouthCorner.y);
            ctx.lineTo(lm.rightMouthCorner.x + 15, lm.rightMouthCorner.y);
            ctx.stroke();

            // 4. Draw Connecting Structural Mesh
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lm.leftEyeCenter.x, lm.leftEyeCenter.y);
            ctx.lineTo(lm.noseTip.x, lm.noseTip.y);
            ctx.lineTo(lm.rightEyeCenter.x, lm.rightEyeCenter.y);
            ctx.moveTo(lm.leftMouthCorner.x, lm.leftMouthCorner.y);
            ctx.lineTo(lm.upperLipCenter.x, lm.upperLipCenter.y);
            ctx.lineTo(lm.rightMouthCorner.x, lm.rightMouthCorner.y);
            ctx.lineTo(lm.lowerLipCenter.x, lm.lowerLipCenter.y);
            ctx.closePath();
            ctx.stroke();

            // 5. Draw Landmark Nodes
            const points = [
              lm.leftEyeCenter, lm.rightEyeCenter,
              lm.leftEyebrow, lm.rightEyebrow,
              lm.noseBridge, lm.noseTip,
              lm.upperLipCenter, lm.lowerLipCenter,
              lm.leftCheek, lm.rightCheek,
              lm.chin
            ];

            ctx.fillStyle = '#06b6d4';
            points.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI);
              ctx.fill();
            });

            // Highlight Mouth Corners
            ctx.fillStyle = frameData.frameAsymmetryScore > 35 ? '#ef4444' : '#10b981';
            [lm.leftMouthCorner, lm.rightMouthCorner].forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 5.5, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        }

        // Multi-Frame Accumulation during Active Smile Analysis (Section 15)
        if (stage === 'analyzing' && frameData.faceDetected && frameData.headPose.isValidPose) {
          setCapturedFrames((prev) => {
            const next = [...prev, frameData];
            const target = 25; // 25 valid frames ~2.5s
            const progress = Math.min(100, Math.round((next.length / target) * 100));
            setCaptureProgress(progress);

            if (next.length >= target) {
              const multiResult = QuantitativeFaceAnalyzer.aggregateMultiFrameAnalysis(next);
              setAggregatedResult(multiResult);
              setStage('completed');

              // Auto-select suggested physician verification radio based on quantitative score
              if (multiResult.medianAsymmetryScore > 50.0) {
                setDoctorConfirmation('Abnormal');
              } else if (multiResult.medianAsymmetryScore > 25.0) {
                setDoctorConfirmation('Possible Asymmetry');
              } else {
                setDoctorConfirmation('Normal');
              }

              if (isVoiceEnabled) {
                SpeechHelper.speak('Facial asymmetry measurement completed. Please review component scores.');
              }
            }
            return next;
          });
        }
      }

      if (isRunning) {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isOpen, stage, neutralMouth, simulateAsymmetry, showLandmarks, isVoiceEnabled]);

  // Stage 1 -> Capture Neutral Baseline
  const handleCaptureNeutralBaseline = () => {
    if (!currentFrame?.landmarks) return;
    setNeutralMouth({
      left: { ...currentFrame.landmarks.leftMouthCorner },
      right: { ...currentFrame.landmarks.rightMouthCorner },
    });
    setStage('smile_capture');
    if (isVoiceEnabled) {
      SpeechHelper.speak('Baseline captured. Now, please smile naturally and hold.');
    }
  };

  // Stage 2 -> Start Smile Analysis (Capture 25 multi-frames)
  const handleStartSmileAnalysis = () => {
    setStage('analyzing');
    setCapturedFrames([]);
    setCaptureProgress(0);
  };

  // Retest (Section 25)
  const handleRetest = () => {
    setStage('neutral_capture');
    setNeutralMouth(null);
    setCapturedFrames([]);
    setCaptureProgress(0);
    setAggregatedResult(null);
    if (isVoiceEnabled) {
      SpeechHelper.speak('Test reset. Keep your face relaxed.');
    }
  };

  // Confirm & Transmit to Assessment
  const handleConfirmAndSave = () => {
    if (!aggregatedResult) return;

    onConfirmResult({
      facial_asymmetry_score: aggregatedResult.medianAsymmetryScore,
      facial_measurement_quality: aggregatedResult.measurementQuality,
      mouth_asymmetry_score: aggregatedResult.components.mouthAndSmile,
      eye_asymmetry_score: aggregatedResult.components.eyes,
      eyebrow_asymmetry_score: aggregatedResult.components.eyebrows,
      cheek_asymmetry_score: aggregatedResult.components.cheeks,
      smile_asymmetry_score: aggregatedResult.components.mouthAndSmile,
      frame_count: aggregatedResult.validFramesCount,
      median_score: aggregatedResult.medianAsymmetryScore,
      mean_score: aggregatedResult.meanAsymmetryScore,
      standard_deviation: aggregatedResult.standardDeviation,
      head_yaw: aggregatedResult.headPoseAverage.yaw,
      head_pitch: aggregatedResult.headPoseAverage.pitch,
      head_roll: aggregatedResult.headPoseAverage.roll,
      ai_face_observation: aggregatedResult.aiObservation,
      doctor_face_confirmation: doctorConfirmation,
      doctor_face_notes: doctorNotes,
      screening_timestamp: aggregatedResult.screeningTimestamp,
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
              <span className="bg-brand-100 text-brand-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                BE-FAST • Quantitative Facial Asymmetry
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                Geometric Vision Model
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-600" />
              <span>Facial Asymmetry Analysis</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
              title={isVoiceEnabled ? 'Mute Voice' : 'Enable Voice'}
            >
              {isVoiceEnabled ? <Volume2 className="w-5 h-5 text-brand-600" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Error Banner */}
        {cameraError && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-1">
            <strong>Camera Unavailable:</strong>
            <p>{cameraError}</p>
          </div>
        )}

        {/* Main Grid: Viewport + Metrics */}
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
                  {stage === 'neutral_capture' && 'Step 1: Keep Face Relaxed (Neutral)'}
                  {stage === 'smile_capture' && 'Step 2: Smile Naturally & Click Start'}
                  {stage === 'analyzing' && `Analyzing Smile Dynamics... ${captureProgress}%`}
                  {stage === 'completed' && 'Analysis Complete'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="bg-slate-900/85 backdrop-blur-md text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                    Quality: {currentFrame?.measurementQualityScore || 0}%
                  </span>
                </div>
              </div>

              {/* Head Pose Alert */}
              {currentFrame && !currentFrame.headPose.isValidPose && (
                <div className="absolute bottom-3 inset-x-4 z-20 text-center pointer-events-none">
                  <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                    ⚠️ {currentFrame.headPose.poseMessage}
                  </span>
                </div>
              )}
            </div>

            {/* Step Action Buttons & Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                    showLandmarks ? 'bg-brand-50 text-brand-800 border-brand-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  <span>Landmarks: {showLandmarks ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimulateAsymmetry(!simulateAsymmetry)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                    simulateAsymmetry ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Simulate clinical asymmetry for testing"
                >
                  <Sliders className="w-3.5 h-3.5 inline mr-1" />
                  <span>{simulateAsymmetry ? 'Simulated Asymmetry: ON' : 'Simulate Asymmetry'}</span>
                </button>
              </div>

              {stage === 'neutral_capture' && (
                <button
                  type="button"
                  onClick={handleCaptureNeutralBaseline}
                  disabled={!currentFrame?.headPose.isValidPose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black rounded-xl shadow transition-all"
                >
                  <span>1. Set Neutral Baseline</span>
                </button>
              )}

              {stage === 'smile_capture' && (
                <button
                  type="button"
                  onClick={handleStartSmileAnalysis}
                  disabled={!currentFrame?.headPose.isValidPose}
                  className="px-4 py-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Smile className="w-4 h-4 text-amber-300" />
                  <span>2. Start Smile Analysis</span>
                </button>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Exact Quantitative Scores & Doctor Gate */}
          <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Primary Facial Asymmetry Score Card (Section 20) */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Facial Asymmetry Score
                </span>
                <div className="text-4xl font-black font-mono tracking-tight text-slate-900">
                  {stage === 'completed' && aggregatedResult
                    ? aggregatedResult.medianAsymmetryScore.toFixed(1)
                    : currentFrame
                    ? currentFrame.frameAsymmetryScore.toFixed(1)
                    : '0.0'}
                  <span className="text-base text-slate-400 font-normal"> / 100</span>
                </div>

                {/* Gradient Gauge */}
                <div className="pt-2">
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 w-[25%]" />
                    <div className="h-full bg-lime-500 w-[25%]" />
                    <div className="h-full bg-amber-500 w-[25%]" />
                    <div className="h-full bg-red-500 w-[25%]" />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold pt-1">
                    <span>0.0 (Low)</span>
                    <span>25.0</span>
                    <span>50.0</span>
                    <span>100.0 (High)</span>
                  </div>
                </div>
              </div>

              {/* Measurement Quality Badge */}
              <div className="p-2.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Measurement Quality:</span>
                <strong className="font-mono text-brand-700 text-sm">
                  {stage === 'completed' && aggregatedResult
                    ? `${aggregatedResult.measurementQuality} / 100`
                    : `${currentFrame?.measurementQualityScore || 0} / 100`}
                </strong>
              </div>

              {/* Component Analysis Breakdown (Section 22) */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Component Analysis
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-medium">Mouth / Smile asymmetry (50%)</span>
                    <strong className="font-mono text-slate-900">
                      {stage === 'completed' && aggregatedResult
                        ? aggregatedResult.components.mouthAndSmile.toFixed(1)
                        : currentFrame?.components.mouthCompositeScore.toFixed(1) || '0.0'}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-medium">Eye asymmetry (20%)</span>
                    <strong className="font-mono text-slate-900">
                      {stage === 'completed' && aggregatedResult
                        ? aggregatedResult.components.eyes.toFixed(1)
                        : currentFrame?.components.eyeAsymmetryScore.toFixed(1) || '0.0'}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-medium">Eyebrow asymmetry (10%)</span>
                    <strong className="font-mono text-slate-900">
                      {stage === 'completed' && aggregatedResult
                        ? aggregatedResult.components.eyebrows.toFixed(1)
                        : currentFrame?.components.eyebrowAsymmetryScore.toFixed(1) || '0.0'}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-medium">Cheek asymmetry (10%)</span>
                    <strong className="font-mono text-slate-900">
                      {stage === 'completed' && aggregatedResult
                        ? aggregatedResult.components.cheeks.toFixed(1)
                        : currentFrame?.components.cheekAsymmetryScore.toFixed(1) || '0.0'}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-medium">Other landmarks (10%)</span>
                    <strong className="font-mono text-slate-900">
                      {stage === 'completed' && aggregatedResult
                        ? aggregatedResult.components.otherLandmarks.toFixed(1)
                        : currentFrame?.components.otherLandmarksScore.toFixed(1) || '0.0'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Screening Observation */}
            <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-2xl text-xs space-y-1">
              <strong className="font-extrabold text-brand-950 block">AI Observation:</strong>
              <p className="text-brand-900 leading-relaxed font-medium">
                {stage === 'completed' && aggregatedResult
                  ? aggregatedResult.aiObservation
                  : currentFrame?.rawGeometricError
                  ? 'Capturing and analyzing facial landmark alignment...'
                  : 'Align patient face and set neutral baseline to begin.'}
              </p>
            </div>

            {/* Doctor Verification & Override (Section 20) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                Doctor Verification
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
                  placeholder="Doctor Notes: e.g. Moderate right nasolabial flattening observed..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Developer / Demo Transparency Panel (Section 27) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 text-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Computer Vision Details & Transparency Panel</span>
            </div>
            {showDebugPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDebugPanel && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] bg-slate-950 text-slate-300">
              <div>
                <span className="text-slate-500 block">Face Detected:</span>
                <strong className="text-emerald-400">{currentFrame?.faceDetected ? 'YES' : 'NO'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Landmarks Detected:</span>
                <strong className="text-emerald-400">{currentFrame?.landmarks ? 'YES (18 Nodes)' : 'NO'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Head Pose (Yaw/Roll):</span>
                <strong className={currentFrame?.headPose.isValidPose ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentFrame?.headPose.yawDeg}° / {currentFrame?.headPose.rollDeg}°
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Lighting Quality:</span>
                <strong className="text-emerald-400">{currentFrame?.lightingQualityScore || 0}/100 (GOOD)</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Valid Frames Count:</span>
                <strong className="text-cyan-400">{capturedFrames.length} / 25</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Median Score:</span>
                <strong className="text-cyan-400">{aggregatedResult?.medianAsymmetryScore.toFixed(1) || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Score Std Dev (SD):</span>
                <strong className={aggregatedResult?.isStableMeasurement ? 'text-emerald-400' : 'text-amber-400'}>
                  ±{aggregatedResult?.standardDeviation.toFixed(1) || '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Measurement Quality:</span>
                <strong className="text-cyan-400">{aggregatedResult?.measurementQuality || currentFrame?.measurementQualityScore || 0}/100</strong>
              </div>
            </div>
          )}
        </div>

        {/* Medical Safety Disclaimer (Section 14) */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Safety Notice:</strong> Computer-vision geometric asymmetry score. Not a clinically validated stroke severity or probability score. Doctor verification is required.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRetest}
            className="px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[ RETEST ]</span>
          </button>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={!aggregatedResult}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>[ CONFIRM ]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
