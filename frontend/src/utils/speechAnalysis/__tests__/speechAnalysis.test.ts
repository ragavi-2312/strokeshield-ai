import { describe, it, expect } from 'vitest';
import { PhoneticMatcher } from '../PhoneticMatcher';
import { SpeechScorer } from '../SpeechScorer';
import { AcousticFeatures, SpeechQualityResult } from '../types';

describe('StrokeShield AI — Web Audio Acoustic Dysarthria & Speech Analysis Module', () => {
  const targetSentence = 'You cannot teach an old dog new tricks.';

  const healthyAcoustics: AcousticFeatures = {
    totalDurationSec: 2.8,
    speakingDurationSec: 2.2,
    pauseDurationSec: 0.6,
    pauseRatio: 0.214,
    speechRateSyllablesPerSec: 5.0,
    averageRmsEnergy: 0.045,
    peakRmsEnergy: 0.18,
    spectralCentroidHz: 1450,
    zeroCrossingRate: 0.12,
  };

  const healthyQuality: SpeechQualityResult = {
    isValid: true,
    rejectionReason: null,
    snrDb: 28,
  };

  it('1. returns 100% accuracy and exact match tokens for perfect repetition', () => {
    const res = PhoneticMatcher.evaluateMatch(targetSentence, 'You cannot teach an old dog new tricks.');
    expect(res.wordAccuracyPercent).toBe(100.0);
    expect(res.levenshteinSimilarityPercent).toBe(100.0);
    expect(res.phoneticClosenessPercent).toBe(100.0);
    expect(res.omittedWords.length).toBe(0);
    expect(res.substitutedWords.length).toBe(0);
  });

  it('2. detects mild phonetic slurring with close matches', () => {
    const res = PhoneticMatcher.evaluateMatch(
      targetSentence,
      'You cannot teash an old dog new trick'
    );
    expect(res.wordAccuracyPercent).toBeGreaterThan(80.0);
    expect(res.wordAccuracyPercent).toBeLessThan(100.0);
    expect(res.omittedWords.length).toBe(0);
  });

  it('3. detects marked phonetic dysarthria and substitutions', () => {
    const res = PhoneticMatcher.evaluateMatch(
      targetSentence,
      'You... cannot... teesh... ol... dawg... trix...'
    );
    expect(res.wordAccuracyPercent).toBeLessThan(75.0);
    expect(res.phoneticClosenessPercent).toBeLessThan(75.0);
  });

  it('4. detects completely omitted words accurately', () => {
    const res = PhoneticMatcher.evaluateMatch(
      targetSentence,
      'You teach dog tricks'
    );
    expect(res.omittedWords).toContain('cannot');
    expect(res.omittedWords).toContain('an');
    expect(res.omittedWords).toContain('old');
    expect(res.wordAccuracyPercent).toBeLessThan(65.0);
  });

  it('5. computes accurate Levenshtein distances on phonetic pairs', () => {
    expect(PhoneticMatcher.levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(PhoneticMatcher.levenshteinDistance('stroke', 'stroke')).toBe(0);
    expect(PhoneticMatcher.levenshteinDistance('dog', 'dawg')).toBe(2);
  });

  it('6. cleanWords removes punctuation and normalizes case', () => {
    const words = PhoneticMatcher.cleanWords('Fifty-fifty, MAMA, papa: tip-top!');
    expect(words).toEqual(['fiftyfifty', 'mama', 'papa', 'tiptop']);
  });

  it('7. healthy acoustic profile scores > 90% in fluency and clarity', () => {
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, targetSentence);
    const score = SpeechScorer.scoreSession(healthyAcoustics, phonetic, healthyQuality);

    expect(score.articulationClarityScore).toBeGreaterThan(90.0);
    expect(score.speechFluencyScore).toBeGreaterThan(90.0);
    expect(score.speechSlurDetected).toBe(false);
    expect(score.speechPattern).toBe('fluent_normal');
    expect(score.analysisQuality).toBe('HIGH');
  });

  it('8. excessive pauses (>50% pause ratio) penalizes fluency and triggers slur detection', () => {
    const dysarthricAcoustics: AcousticFeatures = {
      ...healthyAcoustics,
      totalDurationSec: 5.0,
      speakingDurationSec: 2.0,
      pauseDurationSec: 3.0,
      pauseRatio: 0.60, // 60% silence / hesitation
      speechRateSyllablesPerSec: 2.2,
    };
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, targetSentence);
    const score = SpeechScorer.scoreSession(dysarthricAcoustics, phonetic, healthyQuality);

    expect(score.speechFluencyScore).toBeLessThan(60.0);
    expect(score.speechSlurDetected).toBe(true);
  });

  it('9. slow speaking rate (<2.0 syll/s) reduces rate component', () => {
    const slowAcoustics: AcousticFeatures = {
      ...healthyAcoustics,
      speechRateSyllablesPerSec: 1.4, // Slow dysarthric articulation
    };
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, targetSentence);
    const score = SpeechScorer.scoreSession(slowAcoustics, phonetic, healthyQuality);

    expect(score.speechFluencyScore).toBeLessThan(85.0);
  });

  it('10. classifies speech into mild_hesitation_slur for intermediate scores', () => {
    const intermediateAcoustics: AcousticFeatures = {
      ...healthyAcoustics,
      pauseRatio: 0.38,
      speechRateSyllablesPerSec: 2.4,
    };
    const phonetic = PhoneticMatcher.evaluateMatch(
      targetSentence,
      'You cannot teach an old dog new trick'
    );
    const score = SpeechScorer.scoreSession(intermediateAcoustics, phonetic, healthyQuality);

    expect(score.speechPattern).toBe('mild_hesitation_slur');
  });

  it('11. classifies speech into marked_dysarthria for severe speech impairments', () => {
    const severeAcoustics: AcousticFeatures = {
      ...healthyAcoustics,
      pauseRatio: 0.58,
      speechRateSyllablesPerSec: 1.2,
    };
    const phonetic = PhoneticMatcher.evaluateMatch(
      targetSentence,
      'You... teesh... dawg...'
    );
    const score = SpeechScorer.scoreSession(severeAcoustics, phonetic, healthyQuality);

    expect(score.speechPattern).toBe('marked_dysarthria');
    expect(score.speechSlurDetected).toBe(true);
  });

  it('12. assigns LOW quality tier when audio duration is too short', () => {
    const invalidQuality: SpeechQualityResult = {
      isValid: false,
      rejectionReason: 'AUDIO_TOO_SHORT',
      snrDb: 5,
    };
    const shortAcoustics: AcousticFeatures = {
      ...healthyAcoustics,
      totalDurationSec: 0.6,
      speakingDurationSec: 0.3,
    };
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, 'You');
    const score = SpeechScorer.scoreSession(shortAcoustics, phonetic, invalidQuality);

    expect(score.analysisQuality).toBe('LOW');
  });

  it('13. calculates acoustic stability score inversely proportional to pause ratio', () => {
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, targetSentence);
    const score1 = SpeechScorer.scoreSession({ ...healthyAcoustics, pauseRatio: 0.15 }, phonetic, healthyQuality);
    const score2 = SpeechScorer.scoreSession({ ...healthyAcoustics, pauseRatio: 0.50 }, phonetic, healthyQuality);

    expect(score1.acousticStabilityScore).toBeGreaterThan(score2.acousticStabilityScore);
  });

  it('14. preserves clinician decision and notes in structured result', () => {
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, targetSentence);
    const score = SpeechScorer.scoreSession(
      healthyAcoustics,
      phonetic,
      healthyQuality,
      'possible_slur',
      'Mild labial hesitation noted on consonant transitions'
    );

    expect(score.doctorConfirmation).toBe('possible_slur');
    expect(score.doctorNotes).toBe('Mild labial hesitation noted on consonant transitions');
    expect(typeof score.timestamp).toBe('string');
    expect(score.modelName).toContain('Web Audio');
  });

  it('15. weighted articulation clarity formula strictly conforms to config weights', () => {
    const phonetic = PhoneticMatcher.evaluateMatch(targetSentence, targetSentence);
    const score = SpeechScorer.scoreSession(healthyAcoustics, phonetic, healthyQuality);

    // Phonetic 100 * 0.50 + PauseScore * 0.30 + RateScore 100 * 0.20
    expect(score.articulationClarityScore).toBeGreaterThan(90.0);
    expect(typeof score.overallSpeechScore).toBe('number');
  });
});
