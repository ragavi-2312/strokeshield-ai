/**
 * StrokeShield AI — Speech Screening & Acoustic Dysarthria Configuration
 *
 * Defines standardized clinical phonetic phrases, acoustic analysis parameters,
 * voice activity detection (VAD) thresholds, and scoring weights.
 */

export const SPEECH_ANALYSIS_CONFIG = {
  // Standardized Clinical Phonetic Phrases (Cincinnati / NIHSS / BE-FAST protocols)
  TEST_PHRASES: [
    {
      id: 'old_dog',
      phrase: 'You cannot teach an old dog new tricks.',
      targetSyllables: 11,
      targetDurationSec: 2.8,
      phoneticFocus: 'Lingual, labial, and dental consonant transitions (t, d, g, k, n)',
    },
    {
      id: 'early_bird',
      phrase: 'The early bird catches the worm.',
      targetSyllables: 9,
      targetDurationSec: 2.4,
      phoneticFocus: 'Phonetic blends, vowel articulation, and sibilants (b, d, ch, s)',
    },
    {
      id: 'mama_papa',
      phrase: 'Fifty-fifty, mama, papa, tip-top.',
      targetSyllables: 12,
      targetDurationSec: 3.0,
      phoneticFocus: 'Diadochokinetic alternating syllable rate (p-t-k oral motor agility)',
    },
  ],

  // Web Audio Acoustic Processing Parameters
  ACOUSTICS: {
    FFT_SIZE: 2048,
    SMOOTHING_TIME_CONSTANT: 0.8,
    MIN_DECIBELS: -90,
    MAX_DECIBELS: -10,
    VAD_ENERGY_THRESHOLD: 0.015,     // RMS energy floor for Voice Activity Detection
    MIN_PAUSE_DURATION_MS: 300,      // Minimum silence gap to register as hesitation/pause
    HEALTHY_MAX_PAUSE_RATIO: 0.35,   // Pauses should take <= 35% of recording time
    MIN_RECORDING_DURATION_MS: 1200, // Minimum valid test duration
    MAX_RECORDING_DURATION_MS: 12000,// Auto-stop timeout
  },

  // Syllable Rate & Fluency Baselines
  FLUENCY: {
    HEALTHY_MIN_SYLLABLES_PER_SEC: 2.8,  // Normal speech speed
    HEALTHY_MAX_SYLLABLES_PER_SEC: 5.5,
    DYSARTHRIC_SLOW_RATE_THRESHOLD: 2.0, // Slow articulation indicative of motor dysarthria
  },

  // Articulation Scoring Weights
  WEIGHTS: {
    PHONETIC_ACCURACY: 0.50, // 50% from word match & Levenshtein similarity
    PAUSE_RATIO: 0.30,       // 30% from fluent continuity (low pause gap)
    SPEAKING_RATE: 0.20,     // 20% from natural cadence & syllable speed
  },
} as const;
