/**
 * Speech Recognition and Speech Synthesis Utilities for Zubair AI
 */

// Check if browser supports Web Speech API
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
};

// Create Speech Recognition instance
export const createSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
) => {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (final) {
      onResult(final, true);
    } else if (interim) {
      onResult(interim, false);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    onError(event.error === 'not-allowed' ? 'Microphone permission denied.' : event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
};

// Speech Synthesis (TTS) Helper
class SpeechSynthesisManager {
  private utterance: SpeechSynthesisUtterance | null = null;
  private currentText: string = '';
  private onStateChange: ((isSpeaking: boolean, isPaused: boolean) => void) | null = null;

  public getVoices(): SpeechSynthesisVoice[] {
    if (!isSpeechSynthesisSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  public speak(
    text: string,
    options: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onStateChange?: (isSpeaking: boolean, isPaused: boolean) => void;
    } = {}
  ) {
    if (!isSpeechSynthesisSupported()) {
      options.onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    this.currentText = text;
    this.onStateChange = options.onStateChange || null;

    // Clean markdown formatting before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#>[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.utterance = utterance;

    const voices = this.getVoices();
    if (options.voiceName && voices.length > 0) {
      const selectedVoice = voices.find((v) => v.name === options.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else if (voices.length > 0) {
      // Pick first English voice or default
      const defaultEn = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      if (defaultEn) utterance.voice = defaultEn;
    }

    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    utterance.onstart = () => {
      this.onStateChange?.(true, false);
    };

    utterance.onpause = () => {
      this.onStateChange?.(true, true);
    };

    utterance.onresume = () => {
      this.onStateChange?.(true, false);
    };

    utterance.onend = () => {
      this.onStateChange?.(false, false);
      options.onEnd?.();
      this.utterance = null;
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.onStateChange?.(false, false);
      options.onEnd?.();
      this.utterance = null;
    };

    // Chrome bug workaround: resume if speech is paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.onStateChange?.(true, true);
    }
  }

  public resume() {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.onStateChange?.(true, false);
    }
  }

  public stop() {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.onStateChange?.(false, false);
      this.utterance = null;
    }
  }

  public isSpeaking(): boolean {
    return isSpeechSynthesisSupported() ? window.speechSynthesis.speaking : false;
  }

  public isPaused(): boolean {
    return isSpeechSynthesisSupported() ? window.speechSynthesis.paused : false;
  }
}

export const speechManager = new SpeechSynthesisManager();
