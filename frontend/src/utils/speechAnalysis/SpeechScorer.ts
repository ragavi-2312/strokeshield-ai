/**
 * StrokeShield AI — Multi-Modal Speech & Articulation Scorer
 *
 * Synthesizes acoustic timing (VAD, pause ratio, speaking rate) with phonetic
 * transcription accuracy to produce objective Articulation Clarity and Fluency scores.
 */

import { SPEECH_ANALYSIS_CONFIG } from './speechAnalysisConfig';
import {
  AcousticFeatures,
  PhoneticMatchResult,
  SpeechAnalysisQuality,
  SpeechAnalysisTypedResult,
  SpeechPattern,
  SpeechQualityResult,
} from './types';

export class SpeechScorer {
  /**
   * Score a complete speech screening session.
   */
  public static scoreSession(
    acoustic: AcousticFeatures,
    phonetic: PhoneticMatchResult,
    quality: SpeechQualityResult,
    doctorConfirmation: 'normal' | 'possible_slur' | 'abnormal' | 'unable_to_assess' = 'normal',
    doctorNotes: string = ''
  ): SpeechAnalysisTypedResult {
    // Quality Tiering
    let analysisQuality: SpeechAnalysisQuality = 'LOW';
    if (quality.isValid && acoustic.totalDurationSec >= 1.5 && acoustic.speakingDurationSec >= 0.8) {
      analysisQuality = 'HIGH';
    } else if (quality.isValid) {
      analysisQuality = 'MEDIUM';
    } else {
      analysisQuality = 'LOW';
    }

    // 1. Phonetic Component Score (0-100)
    const phoneticScore = phonetic.phoneticClosenessPercent;

    // 2. Pause & Continuity Component Score (0-100)
    // Healthy pause ratio is <= 0.25 (score 90-100). Higher pauses scale down.
    let pauseScore = 100;
    if (acoustic.pauseRatio <= 0.25) {
      pauseScore = Math.round(100 - (acoustic.pauseRatio / 0.25) * 10);
    } else {
      pauseScore = Math.max(0, Math.round(90 - ((acoustic.pauseRatio - 0.25) / 0.45) * 90));
    }

    // 3. Speaking Rate Component Score (0-100)
    let rateScore = 100;
    const rate = acoustic.speechRateSyllablesPerSec;
    if (rate > 0) {
      if (rate >= 2.8 && rate <= 5.5) {
        rateScore = 100;
      } else if (rate < 2.8) {
        // Slow dysarthric rate
        rateScore = Math.max(20, Math.round((rate / 2.8) * 100));
      } else {
        // Unusually rapid / pressured speech
        rateScore = Math.max(60, Math.round(100 - (rate - 5.5) * 15));
      }
    } else {
      rateScore = 30;
    }

    // 4. Weighted Articulation Clarity Score
    const weights = SPEECH_ANALYSIS_CONFIG.WEIGHTS;
    const articulationClarityScore = parseFloat(
      (
        weights.PHONETIC_ACCURACY * phoneticScore +
        weights.PAUSE_RATIO * pauseScore +
        weights.SPEAKING_RATE * rateScore
      ).toFixed(1)
    );

    // 5. Speech Fluency Score (timing & flow)
    const speechFluencyScore = parseFloat(
      (0.60 * pauseScore + 0.40 * rateScore).toFixed(1)
    );

    // 6. Acoustic Stability Score
    const acousticStabilityScore = Math.max(
      20,
      Math.min(100, Math.round(100 - acoustic.pauseRatio * 60))
    );

    // 7. Overall Synthesis Score
    const overallSpeechScore = parseFloat(
      (0.60 * articulationClarityScore + 0.40 * speechFluencyScore).toFixed(1)
    );

    // 8. Slur / Deficit Detection
    const speechSlurDetected =
      articulationClarityScore < 85.0 ||
      phonetic.wordAccuracyPercent < 80.0 ||
      acoustic.pauseRatio > 0.35 ||
      (acoustic.speechRateSyllablesPerSec > 0 && acoustic.speechRateSyllablesPerSec < 2.5);

    // 9. Speech Pattern Categorization
    let speechPattern: SpeechPattern = 'fluent_normal';
    if (!speechSlurDetected && articulationClarityScore >= 85.0) {
      speechPattern = 'fluent_normal';
    } else if (articulationClarityScore >= 60.0) {
      speechPattern = 'mild_hesitation_slur';
    } else if (articulationClarityScore >= 20.0) {
      speechPattern = 'marked_dysarthria';
    } else {
      speechPattern = 'aphasic_fragmentation';
    }

    return {
      articulationClarityScore,
      speechFluencyScore,
      acousticStabilityScore,
      overallSpeechScore,
      speechSlurDetected,
      speechPattern,
      analysisQuality,
      acousticFeatures: acoustic,
      phoneticMatch: phonetic,
      doctorConfirmation,
      doctorNotes,
      timestamp: new Date().toISOString(),
      modelName: 'StrokeShield Web Audio Acoustic & Levenshtein Dysarthria Engine',
      modelVersion: 'v1.0.0-acoustic-vad',
    };
  }
}
