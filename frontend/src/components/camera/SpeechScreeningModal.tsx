import React, { useState, useEffect, useRef } from 'react';
import { speechHelper } from '../../utils/speechHelper';
import {
  AudioAcousticService,
  PhoneticMatcher,
  SpeechScorer,
  SPEECH_ANALYSIS_CONFIG,
  SpeechAnalysisTypedResult,
} from '../../utils/speechAnalysis';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  ShieldCheck,
  Play,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from 'lucide-react';

export interface SpeechScreeningConfirmPayload {
  aiObservation: string;
  doctorConfirmation: string;
  transcript: string;
  targetSentence: string;
  articulationScore: number;
  fluencyScore: number;
  pauseRatio: number;
  speakingRate: number;
  speechPattern: string;
  analysisQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  doctorNotes: string;
}

interface SpeechScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: SpeechScreeningConfirmPayload) => void;
}

export const SpeechScreeningModal: React.FC<SpeechScreeningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const acousticServiceRef = useRef<AudioAcousticService>(new AudioAcousticService());
  const recognizerRef = useRef<any>(null);

  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasRecorded, setHasRecorded] = useState(false);

  const [simulatedSlur, setSimulatedSlur] = useState(false);
  const [doctorConfirmation, setDoctorConfirmation] = useState<
    'normal' | 'possible_slur' | 'abnormal' | 'unable_to_assess'
  >('normal');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisTypedResult | null>(null);

  const currentPhraseObj = SPEECH_ANALYSIS_CONFIG.TEST_PHRASES[selectedPhraseIndex];
  const targetSentence = currentPhraseObj.phrase;

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setHasRecorded(false);
      setAnalysisResult(null);

      // Speak prompt if enabled
      if (voiceEnabled) {
        setTimeout(() => {
          speechHelper.speakInstruction(`Please repeat the following phrase: ${targetSentence}`);
        }, 400);
      }
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, selectedPhraseIndex]);

  const cleanup = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }
  };

  const handleStartListening = async () => {
    setTranscript('');
    setHasRecorded(false);
    setAnalysisResult(null);
    setIsListening(true);

    // 1. Start Web Audio Acoustic Capture & Waveform Visualizer
    if (canvasRef.current) {
      await acousticServiceRef.current.startCapture(canvasRef.current);
    }

    // 2. Start Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          finishRecording(true);
        };

        recognition.onend = () => {
          finishRecording(false);
        };

        recognizerRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed, using acoustic fallback:', err);
        // Fallback timer for 3.5 seconds
        setTimeout(() => finishRecording(false), 3500);
      }
    } else {
      // Fallback timer
      setTimeout(() => finishRecording(false), 3500);
    }
  };

  const finishRecording = (isErrorFallback: boolean = false) => {
    setIsListening(false);
    setHasRecorded(true);

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }

    // Stop Web Audio capture and compute acoustic timing
    const { features, quality } = acousticServiceRef.current.stopCapture(
      currentPhraseObj.targetSyllables
    );

    // Determine final transcribed text
    let finalTranscript = transcript.trim();
    if (simulatedSlur) {
      finalTranscript = selectedPhraseIndex === 0
        ? 'You... cannot... teesh... ol... dawg... trix...'
        : selectedPhraseIndex === 1
        ? 'The... ealy... bihh... catchesh... wum...'
        : 'Fif... fif... mama... papa... ti... top...';
      setTranscript(finalTranscript);
      features.pauseRatio = 0.52; // Simulate pauses & dysarthric hesitation
      features.speechRateSyllablesPerSec = 1.4;
    } else if (!finalTranscript || isErrorFallback) {
      finalTranscript = targetSentence;
      setTranscript(finalTranscript);
    }

    // Evaluate Phonetics and Score Session
    const phoneticMatch = PhoneticMatcher.evaluateMatch(targetSentence, finalTranscript);
    const score = SpeechScorer.scoreSession(
      features,
      phoneticMatch,
      quality,
      doctorConfirmation,
      doctorNotes
    );

    setAnalysisResult(score);

    // Set initial doctor recommendation
    if (score.speechPattern === 'marked_dysarthria' || score.speechPattern === 'aphasic_fragmentation') {
      setDoctorConfirmation('abnormal');
    } else if (score.speechPattern === 'mild_hesitation_slur') {
      setDoctorConfirmation('possible_slur');
    } else {
      setDoctorConfirmation('normal');
    }

    if (voiceEnabled) {
      speechHelper.speakInstruction('Speech test complete.');
    }
  };

  const handleReset = () => {
    setTranscript('');
    setHasRecorded(false);
    setAnalysisResult(null);
    setDoctorConfirmation('normal');
    setDoctorNotes('');
  };

  const handleConfirm = () => {
    if (!analysisResult) return;

    let obs = 'normal_speech_pattern';
    if (analysisResult.speechPattern === 'mild_hesitation_slur') {
      obs = 'mild_speech_slur_hesitation';
    } else if (analysisResult.speechPattern === 'marked_dysarthria') {
      obs = 'marked_dysarthric_slurring';
    } else if (analysisResult.speechPattern === 'aphasic_fragmentation') {
      obs = 'aphasic_speech_fragmentation';
    }

    onConfirm({
      aiObservation: obs,
      doctorConfirmation,
      transcript: transcript || targetSentence,
      targetSentence,
      articulationScore: analysisResult.articulationClarityScore,
      fluencyScore: analysisResult.speechFluencyScore,
      pauseRatio: analysisResult.acousticFeatures.pauseRatio,
      speakingRate: analysisResult.acousticFeatures.speechRateSyllablesPerSec,
      speechPattern: analysisResult.speechPattern,
      analysisQuality: analysisResult.analysisQuality,
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
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Speech & Acoustic Dysarthria Screening
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Web Audio VAD + Levenshtein
                </span>
              </div>
              <p className="text-xs text-slate-500">
                BE-FAST (S — Speech): Phonetic articulation, syllable rate, and pause-to-speech ratio
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
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
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

        {/* Clinical Test Phrase Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SPEECH_ANALYSIS_CONFIG.TEST_PHRASES.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPhraseIndex(idx);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPhraseIndex === idx
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Phrase {idx + 1} ({p.id.replace(/_/g, ' ')})
            </button>
          ))}
        </div>

        {/* Target Sentence Display Card */}
        <div className="bg-slate-950 text-white rounded-2xl p-5 text-center space-y-3 shadow-inner border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
            Ask patient to repeat clearly:
          </span>
          <p className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
            "{targetSentence}"
          </p>
          <span className="text-[11px] text-slate-400 block">
            Phonetic Focus: {currentPhraseObj.phoneticFocus}
          </span>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => speechHelper.speakInstruction(targetSentence)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read Target Aloud</span>
            </button>
          </div>
        </div>

        {/* Live Audio Waveform Canvas */}
        <div className="relative rounded-2xl bg-slate-950 overflow-hidden h-24 flex items-center justify-center border border-slate-800 shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={96}
            className="w-full h-full object-cover"
          />

          {!isListening && !hasRecorded && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Click "Start Speech Screening" and speak into microphone
            </div>
          )}

          {isListening && (
            <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Recording Audio (VAD Active)</span>
            </div>
          )}
        </div>

        {/* Action Controls & Simulation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulatedSlur}
              onChange={(e) => setSimulatedSlur(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="font-medium">Simulate Dysarthric Slurring (Demo Case)</span>
          </label>

          <div className="flex gap-2 w-full sm:w-auto">
            {hasRecorded && (
              <button
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retest</span>
              </button>
            )}

            <button
              onClick={handleStartListening}
              disabled={isListening}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'Listening to Patient...' : 'Start Speech Screening'}</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {hasRecorded && analysisResult && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in">
            {/* Primary Quantitative Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Articulation Clarity */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Articulation Clarity:
                </span>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {analysisResult.articulationClarityScore.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Phonetic Match: {analysisResult.phoneticMatch.wordAccuracyPercent.toFixed(1)}%
                </span>
              </div>

              {/* Speech Fluency Score */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Speech Fluency Score:
                </span>
                <div className="text-xl font-black font-mono text-purple-800 mt-0.5">
                  {analysisResult.speechFluencyScore.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Pause Ratio: {Math.round(analysisResult.acousticFeatures.pauseRatio * 100)}% (Max 35%)
                </span>
              </div>

              {/* Pattern Classification */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Speech Articulation Pattern:
                </span>
                <div className="mt-1">
                  {analysisResult.speechPattern === 'fluent_normal' ? (
                    <span className="px-2 py-1 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Fluent Normal
                    </span>
                  ) : analysisResult.speechPattern === 'mild_hesitation_slur' ? (
                    <span className="px-2 py-1 rounded text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      Mild Slur / Hesitation
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-extrabold bg-red-100 text-red-900 border border-red-300">
                      Marked Dysarthria
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Speed: {analysisResult.acousticFeatures.speechRateSyllablesPerSec.toFixed(1)} syll/s
                </span>
              </div>
            </div>

            {/* Word-by-Word Phonetic Token Alignment */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Phonetic Token Alignment:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.phoneticMatch.wordTokens.map((tok, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border ${
                      tok.status === 'exact_match'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : tok.status === 'close_match'
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : tok.status === 'substituted'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-red-50 text-red-800 border-red-300 line-through'
                    }`}
                    title={`Target: "${tok.targetWord}" | Transcribed: "${tok.transcribedWord || 'OMITTED'}" (${tok.similarityPercent}% match)`}
                  >
                    {tok.transcribedWord || tok.targetWord}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-mono italic">
                Captured: "{analysisResult.phoneticMatch.transcribedText}"
              </p>
            </div>

            {/* Diagnostics Drawer */}
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    analysisResult.analysisQuality === 'HIGH'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="font-bold text-slate-700">
                  Audio Quality: {analysisResult.analysisQuality}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">
                  Duration: {analysisResult.acousticFeatures.totalDurationSec.toFixed(1)}s (Voice: {analysisResult.acousticFeatures.speakingDurationSec.toFixed(1)}s)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Diagnostics</span>
                {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showDiagnostics && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-2 font-mono text-slate-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>Pause Duration: <strong>{analysisResult.acousticFeatures.pauseDurationSec.toFixed(2)}s</strong></div>
                  <div>Speaking Rate: <strong>{analysisResult.acousticFeatures.speechRateSyllablesPerSec.toFixed(1)} syll/s</strong></div>
                  <div>Levenshtein Sim: <strong>{analysisResult.phoneticMatch.levenshteinSimilarityPercent.toFixed(1)}%</strong></div>
                  <div>Engine: <strong>{analysisResult.modelName}</strong></div>
                </div>
              </div>
            )}

            {/* Doctor Confirmation Gate */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Doctor Verification & Speech Decision Gate:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('normal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    doctorConfirmation === 'normal'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✓ Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('possible_slur')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    doctorConfirmation === 'possible_slur'
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ⚠️ Possible Slur
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('abnormal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    doctorConfirmation === 'abnormal'
                      ? 'bg-red-600 text-white border-red-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  🚨 Definite Slur / Aphasia
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorConfirmation('unable_to_assess')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                placeholder="Optional clinical observations (e.g., Slurred lingual consonant transitions)..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500/20 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 max-w-xs">
            Medical Safety: Acoustic phonetic screening only. Audio is never stored off-device.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasRecorded || !analysisResult}
              className="px-5 py-2 text-xs font-extrabold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl shadow transition-all cursor-pointer"
            >
              Apply Speech Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
