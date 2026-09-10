/**
 * StrokeShield AI — Phonetic String & Levenshtein Articulation Matcher
 *
 * Compares transcribed speech against clinical reference phrases using Levenshtein
 * edit distance, token-by-token alignment, omission tracking, and phonetic similarity.
 */

import { PhoneticMatchResult, PhoneticWordToken } from './types';

export class PhoneticMatcher {
  /**
   * Compute normalized Levenshtein Edit Distance between two strings.
   */
  public static levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Clean string into lowercased alpha-numeric word array.
   */
  public static cleanWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }

  /**
   * Perform comprehensive phonetic alignment and accuracy evaluation.
   */
  public static evaluateMatch(targetSentence: string, transcribedText: string): PhoneticMatchResult {
    const targetWords = this.cleanWords(targetSentence);
    const transWords = this.cleanWords(transcribedText);

    const wordTokens: PhoneticWordToken[] = [];
    const omittedWords: string[] = [];
    const substitutedWords: string[] = [];

    let totalScore = 0;

    targetWords.forEach((targetWord) => {
      // Find best matching word in transcription
      let bestMatch: string | null = null;
      let minDistance = Infinity;

      transWords.forEach((tw) => {
        const dist = this.levenshteinDistance(targetWord, tw);
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = tw;
        }
      });

      const maxLen = Math.max(targetWord.length, bestMatch ? bestMatch.length : 1);
      const similarityPercent = bestMatch
        ? Math.max(0, Math.round((1 - minDistance / maxLen) * 100))
        : 0;

      if (similarityPercent === 100) {
        wordTokens.push({
          targetWord,
          transcribedWord: bestMatch,
          status: 'exact_match',
          similarityPercent: 100,
        });
        totalScore += 100;
      } else if (similarityPercent >= 65) {
        wordTokens.push({
          targetWord,
          transcribedWord: bestMatch,
          status: 'close_match',
          similarityPercent,
        });
        totalScore += similarityPercent * 0.85;
      } else if (similarityPercent >= 40 && bestMatch) {
        wordTokens.push({
          targetWord,
          transcribedWord: bestMatch,
          status: 'substituted',
          similarityPercent,
        });
        substitutedWords.push(`${targetWord} -> ${bestMatch}`);
        totalScore += similarityPercent * 0.4;
      } else {
        wordTokens.push({
          targetWord,
          transcribedWord: null,
          status: 'omitted',
          similarityPercent: 0,
        });
        omittedWords.push(targetWord);
      }
    });

    const wordAccuracyPercent = targetWords.length > 0
      ? parseFloat((totalScore / (targetWords.length * 100) * 100).toFixed(1))
      : 0;

    // String-level similarity
    const cleanTarget = targetWords.join(' ');
    const cleanTrans = transWords.join(' ');
    const stringDistance = this.levenshteinDistance(cleanTarget, cleanTrans);
    const maxStringLen = Math.max(cleanTarget.length, cleanTrans.length, 1);
    const levenshteinSimilarityPercent = parseFloat(
      (Math.max(0, 1 - stringDistance / maxStringLen) * 100).toFixed(1)
    );

    const phoneticClosenessPercent = parseFloat(
      (0.60 * wordAccuracyPercent + 0.40 * levenshteinSimilarityPercent).toFixed(1)
    );

    return {
      targetSentence,
      transcribedText,
      wordAccuracyPercent,
      levenshteinSimilarityPercent,
      phoneticClosenessPercent,
      wordTokens,
      omittedWords,
      substitutedWords,
    };
  }
}
