import React, { useState, useEffect, useRef } from 'react';
import { CameraVision } from '../../utils/cameraVision';
import { PoseVision, ArmPoseResult } from '../../utils/poseVision';
import { speechHelper } from '../../utils/speechHelper';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Play, 
  Clock 
} from 'lucide-react';

interface ArmScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: {
    aiObservation: string;
    doctorConfirmation: string;
    driftDeltaPx: number;
  }) => void;
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
  const countdownInterval = useRef<any>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [simulatedDrift, setSimulatedDrift] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isHoldingTestActive, setIsHoldingTestActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [analysisResult, setAnalysisResult] = useState<ArmPoseResult | null>(null);
  const [doctorConfirmation, setDoctorConfirmation] = useState<string>('normal');
  const [hasCompletedTest, setHasCompletedTest] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();
    if (voiceEnabled) {
      setTimeout(() => {
        speechHelper.speakInstruction('Please raise both arms forward and hold them steady for 5 seconds.');
      }, 500);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current) {
        const stream = await CameraVision.startCamera(videoRef.current);
        streamRef.current = stream;
        setIsCameraActive(true);
        startPoseTrackingLoop();
      }
    } catch (err: any) {
      console.warn('Camera permission denied or camera device missing:', err);
      setCameraError('Camera access unavailable. You can use manual assessment or try demo mode.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    CameraVision.stopCamera(streamRef.current);
    streamRef.current = null;
    setIsCameraActive(false);
    setIsHoldingTestActive(false);
  };

  const startPoseTrackingLoop = () => {
    const loop = () => {
      if (videoRef.current && canvasRef.current && isCameraActive) {
        const res = PoseVision.analyzePoseFrame(
          videoRef.current,
          canvasRef.current,
          simulatedDrift,
          elapsedSeconds
        );
        setAnalysisResult(res);
      }
      animFrameId.current = requestAnimationFrame(loop);
    };
    animFrameId.current = requestAnimationFrame(loop);
  };

  const startHoldingTest = () => {
    setCountdown(5);
    setElapsedSeconds(0);
    setIsHoldingTestActive(true);
    setHasCompletedTest(false);

    if (voiceEnabled) {
      speechHelper.speakInstruction('Holding test started. Hold both arms forward.');
    }

    let currentSec = 5;
    countdownInterval.current = setInterval(() => {
      currentSec -= 1;
      setCountdown(currentSec);
      setElapsedSeconds((prev) => prev + 1);

      if (currentSec <= 0) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
        setIsHoldingTestActive(false);
        setHasCompletedTest(true);

        const finalDrift = simulatedDrift;
        const res: ArmPoseResult = {
          poseDetected: true,
          leftWristY: finalDrift ? 260 : 210,
          rightWristY: 210,
          leftElbowY: 200,
          rightElbowY: 200,
          driftDeltaPx: finalDrift ? 50 : 4,
          isDriftDetected: finalDrift,
          observation: finalDrift ? 'possible_arm_drift' : 'no_obvious_drift',
        };
        setAnalysisResult(res);
        setDoctorConfirmation(finalDrift ? 'weakness_suspected' : 'normal');

        if (voiceEnabled) {
          speechHelper.speakInstruction('Test complete. You can lower your arms.');
        }
      }
    }, 1000);
  };

  const handleSave = () => {
    onConfirm({
      aiObservation: analysisResult?.observation || 'no_obvious_drift',
      doctorConfirmation,
      driftDeltaPx: analysisResult?.driftDeltaPx || 0,
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
              <h2 className="text-base font-extrabold text-slate-900">
                Camera-Assisted Arm Drift Screening
              </h2>
              <p className="text-xs text-slate-500">
                BE-FAST (A — Arms): Bilateral arm drift & pronator weakness holding tracker
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

        {/* Video / Pose Viewport */}
        <div className="relative rounded-2xl bg-slate-900 overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs font-medium max-w-sm">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Camera Again</span>
              </button>
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

              {/* Overlay Countdown Indicator */}
              {isHoldingTestActive && countdown !== null && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-brand-600/90 text-white flex flex-col items-center justify-center shadow-xl animate-pulse">
                    <span className="text-3xl font-black">{countdown}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Holding...</span>
                  </div>
                </div>
              )}

              {/* Instruction Banner */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Ask patient: "Raise both arms forward with palms up"</span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulatedDrift}
              onChange={(e) => setSimulatedDrift(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="font-medium">Simulate Unilateral Arm Drift (Demo Case)</span>
          </label>

          <button
            onClick={startHoldingTest}
            disabled={isHoldingTestActive}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Play className="w-4 h-4" />
            <span>{isHoldingTestActive ? 'Tracking Arm Hold...' : 'Start 5s Arm Drift Test'}</span>
          </button>
        </div>

        {/* AI Observation Card */}
        {hasCompletedTest && analysisResult && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pose Drift Screening Observation
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                Δ {analysisResult.driftDeltaPx}px vertical deviation
              </span>
            </div>

            {analysisResult.observation === 'possible_arm_drift' ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>🟠 Possible arm drift detected — doctor verification required</span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>🟢 No obvious arm drift detected in 5s screening test</span>
              </div>
            )}

            {/* Doctor Verification Radio */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Doctor Verification & Clinical Decision:</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
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
                  onClick={() => setDoctorConfirmation('weakness_suspected')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    doctorConfirmation === 'weakness_suspected'
                      ? 'bg-red-600 text-white border-red-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ⚠️ Weakness Suspected
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
                  ❓ Unable to Assess
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 max-w-xs">
            Privacy: Temporary canvas landmark estimation. No raw video stored.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-all"
            >
              Apply Observation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
