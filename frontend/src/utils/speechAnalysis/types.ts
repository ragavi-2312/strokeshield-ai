/**
 * StrokeShield AI — Type Definitions for Speech & Acoustic Dysarthria Analysis
 */

export type SpeechRejectionReason =
  | 'AUDIO_TOO_SHORT'
  | 'NO_VOICE_DETECTED'
  | 'BACKGROUND_NOISE_EXCESSIVE'
  | 'CLIPPED_AUDIO';

export type SpeechAnalysisQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export type SpeechPattern =
  | 'fluent_normal'
  | 'mild_hesitation_slur'
  | 'marked_dysarthria'
  | 'aphasic_fragmentation';

export interface AcousticFeatures {
  totalDurationSec: number;
  speakingDurationSec: number;
  pauseDurationSec: number;
  pauseRatio: number;
  speechRateSyllablesPerSec: number;
  averageRmsEnergy: number;
  peakRmsEnergy: number;
  spectralCentroidHz: number;
  zeroCrossingRate: number;
}

export interface PhoneticWordToken {
  targetWord: string;
  transcribedWord: string | null;
  status: 'exact_match' | 'close_match' | 'substituted' | 'omitted';
  similarityPercent: number;
}

export interface PhoneticMatchResult {
  targetSentence: string;
  transcribedText: string;
  wordAccuracyPercent: number;
  levenshteinSimilarityPercent: number;
  phoneticClosenessPercent: number;
  wordTokens: PhoneticWordToken[];
  omittedWords: string[];
  substitutedWords: string[];
}

export interface SpeechQualityResult {
  isValid: boolean;
  rejectionReason: SpeechRejectionReason | null;
  snrDb: number;
}

export interface SpeechAnalysisTypedResult {
  // Primary Clinical Articulation Metrics
  articulationClarityScore: number;
  speechFluencyScore: number;
  acousticStabilityScore: number;
  overallSpeechScore: number;
  speechSlurDetected: boolean;
  speechPattern: SpeechPattern;
  analysisQuality: SpeechAnalysisQuality;

  // Sub-component Detail Records
  acousticFeatures: AcousticFeatures;
  phoneticMatch: PhoneticMatchResult;

  // Clinician & Metadata
  doctorConfirmation: 'normal' | 'possible_slur' | 'abnormal' | 'unable_to_assess';
  doctorNotes: string;
  timestamp: string;
  modelName: string;
  modelVersion: string;
}
