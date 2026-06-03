export type Plan = "free" | "pro" | "teams" | "enterprise";

export type DictationMode = "dictate" | "command" | "code" | "message" | "document";

export type DictationStatus =
  | "idle"
  | "capturing"
  | "transcribing"
  | "refining"
  | "injecting"
  | "completed"
  | "error";

export interface DictationContext {
  activeApp?: string;
  language?: string;
  mode: DictationMode;
  privacyMode: boolean;
  selectedText?: string;
  nearbyText?: string;
  dictionary?: string[];
  snippets?: Record<string, string>;
  style?: "plain" | "concise" | "formal" | "friendly" | "developer";
}

export interface TranscriptSegment {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface TranscriptionResult {
  provider: string;
  rawText: string;
  segments: TranscriptSegment[];
  latencyMs: number;
}

export interface RefinementResult {
  provider: string;
  text: string;
  actions: string[];
}

export interface DictationResult {
  id: string;
  rawTranscript: string;
  refinedText: string;
  language: string;
  mode: DictationMode;
  providerRoute: string;
  latencyMs: number;
  confidence: number;
  privacyMode: boolean;
  appContext?: string;
  status: DictationStatus;
  actions: string[];
  createdAt: string;
}

export interface SpeechToTextProvider {
  id: string;
  label: string;
  locality: "local" | "cloud" | "hybrid";
  transcribe(input: Blob | ArrayBuffer, context: DictationContext): Promise<TranscriptionResult>;
}

export interface TextRefinementProvider {
  id: string;
  label: string;
  refine(transcript: TranscriptionResult, context: DictationContext): Promise<RefinementResult>;
}

export interface Integration {
  id: string;
  name: string;
  category: "llm" | "stt" | "ide" | "work" | "browser" | "desktop";
  status: "ready" | "planned" | "community";
  plan: Plan;
  summary: string;
}

export interface CaptureState {
  status: DictationStatus;
  interimText: string;
  finalText: string;
  error?: string;
  recordingStartMs?: number;
}

export interface TerminalBridgeMessage {
  type: "dictation" | "command" | "ping" | "pong";
  payload: string;
  timestamp: number;
  id: string;
}
