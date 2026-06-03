import type { CaptureState, DictationContext, DictationResult, DictationStatus, TranscriptSegment, TranscriptionResult } from "./types";

// Web Speech API types are not included in default TypeScript lib declarations
// These minimal interfaces allow compilation without adding heavy @types packages
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const createSegment = (text: string, startMs: number, endMs: number, confidence?: number): TranscriptSegment => ({
  text,
  startMs,
  endMs,
  confidence,
});

export class WebSpeechCapture {
  private recognition: SpeechRecognition | null = null;
  private state: CaptureState = { status: "idle", interimText: "", finalText: "" };
  private listeners: Array<(state: CaptureState) => void> = [];
  private startTime = 0;
  private segments: TranscriptSegment[] = [];

  constructor(private language = "en-US") {}

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  subscribe(listener: (state: CaptureState) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  getState(): CaptureState {
    return { ...this.state };
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  }

  start(): boolean {
    if (!this.isSupported()) {
      this.setError("SpeechRecognition is not supported in this browser.");
      return false;
    }
    if (this.state.status === "capturing") {
      return true;
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.language;

    this.startTime = performance.now();
    this.segments = [];

    recognition.onstart = () => {
      this.state = { status: "capturing", interimText: "", finalText: "", recordingStartMs: Date.now() };
      this.notify();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + " ";
          this.segments.push(
            createSegment(
              transcript,
              this.startTime,
              performance.now(),
              event.results[i][0].confidence,
            ),
          );
        } else {
          interim += transcript;
        }
      }
      this.state = {
        ...this.state,
        interimText: interim.trim(),
        finalText: (this.state.finalText + final).trim(),
      };
      this.notify();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "audio-capture") {
        // non-fatal; keep listening
        return;
      }
      this.setError(`Recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      // auto-restart if still capturing (browser may stop after pause)
      if (this.state.status === "capturing" && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // ignore restart errors
        }
      }
    };

    this.recognition = recognition;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      this.setError(err instanceof Error ? err.message : "Failed to start recognition");
      return false;
    }
  }

  stop(): TranscriptionResult | null {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }

    const rawText = (this.state.finalText + " " + this.state.interimText).trim();
    const latencyMs = this.startTime ? Math.round(performance.now() - this.startTime) : 0;

    this.state = { status: "idle", interimText: "", finalText: "" };
    this.notify();

    if (!rawText) return null;

    return {
      provider: "webspeech",
      rawText,
      segments: this.segments.length ? this.segments : [createSegment(rawText, 0, latencyMs)],
      latencyMs,
    };
  }

  private setError(message: string): void {
    this.state = { status: "error", interimText: "", finalText: "", error: message };
    this.notify();
  }
}

export function estimateConfidence(transcript: TranscriptionResult): number {
  if (!transcript.segments.length) return 0;
  const confidences = transcript.segments
    .map((s) => s.confidence ?? 0)
    .filter((c) => c > 0);
  if (!confidences.length) return 0.85; // default for Web Speech API when not exposed
  const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  return Math.round(avg * 100) / 100;
}
