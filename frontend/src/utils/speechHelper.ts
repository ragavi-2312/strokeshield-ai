/**
 * StrokeShield AI - Voice Guidance & Speech Recognition Utilities
 * Uses standard Browser Web Speech Synthesis and Web Speech Recognition APIs.
 */

export class SpeechHelper {
  private static isVoiceEnabledStatic: boolean = true;
  private isVoiceEnabledInstance: boolean = true;

  public static setVoiceEnabled(enabled: boolean) {
    this.isVoiceEnabledStatic = enabled;
    if (!enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public static getVoiceEnabled(): boolean {
    return this.isVoiceEnabledStatic;
  }

  public static cancel() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public static speak(text: string) {
    if (!this.isVoiceEnabledStatic || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis unavailable:', err);
    }
  }

  public static speakInstruction(text: string) {
    this.speak(text);
  }

  public static getSpeechRecognizer(): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    return recognition;
  }

  public static calculateMatchScore(expected: string, actual: string): {
    score: number;
    isMismatch: boolean;
  } {
    const cleanExp = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
    const cleanAct = actual.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');

    let matchedWords = 0;
    cleanExp.forEach((w) => {
      if (cleanAct.includes(w)) matchedWords++;
    });

    const ratio = matchedWords / Math.max(cleanExp.length, 1);
    const score = Math.round(ratio * 100);
    return {
      score,
      isMismatch: score < 75,
    };
  }

  // Instance methods for compatibility
  public setVoiceEnabled(enabled: boolean) {
    SpeechHelper.setVoiceEnabled(enabled);
    this.isVoiceEnabledInstance = enabled;
  }

  public getVoiceEnabled(): boolean {
    return SpeechHelper.getVoiceEnabled();
  }

  public speakInstruction(text: string) {
    SpeechHelper.speak(text);
  }

  public getSpeechRecognizer(): any {
    return SpeechHelper.getSpeechRecognizer();
  }

  public calculateMatchScore(expected: string, actual: string) {
    return SpeechHelper.calculateMatchScore(expected, actual);
  }
}

export const speechHelper = new SpeechHelper();
