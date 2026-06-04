import type { DictationContext, DictationResult, DictationStatus, TranscriptionResult } from "./types";
import { deterministicRefine } from "./refine";
import { estimateConfidence, WebSpeechCapture } from "./capture";

export interface DictationPipelineOptions {
  context: DictationContext;
  onStatusChange?: (status: DictationStatus) => void;
  onInterim?: (text: string) => void;
}

export class DictationPipeline {
  private capture: WebSpeechCapture;
  private currentStatus: DictationStatus = "idle";

  constructor(private options: DictationPipelineOptions) {
    this.capture = new WebSpeechCapture(this.context.language ?? "en-US");
  }

  get context(): DictationContext {
    return this.options.context;
  }

  private setStatus(status: DictationStatus): void {
    this.currentStatus = status;
    this.options.onStatusChange?.(status);
  }

  async start(): Promise<boolean> {
    this.setStatus("capturing");
    const started = this.capture.start();
    if (!started) {
      this.setStatus("error");
    }
    return started;
  }

  subscribeToCapture(listener: (interim: string, final: string) => void): () => void {
    return this.capture.subscribe((state) => {
      if (state.interimText || state.finalText) {
        listener(state.interimText, state.finalText);
        this.options.onInterim?.(state.interimText || state.finalText);
      }
    });
  }

  async stop(): Promise<DictationResult | null> {
    this.setStatus("transcribing");
    const transcript = this.capture.stop();
    if (!transcript) {
      this.setStatus("idle");
      return null;
    }

    this.setStatus("refining");
    const refinement = deterministicRefine(transcript, this.context);

    const totalLatency = transcript.latencyMs + 15; // approximate refinement latency
    const confidence = estimateConfidence(transcript);

    const result: DictationResult = {
      id: generateId(),
      rawTranscript: transcript.rawText,
      refinedText: refinement.text,
      language: this.context.language ?? "en",
      mode: this.context.mode,
      providerRoute: `${transcript.provider} → ${refinement.provider}`,
      latencyMs: totalLatency,
      confidence,
      privacyMode: this.context.privacyMode,
      appContext: this.context.activeApp,
      status: "completed",
      actions: refinement.actions,
      createdAt: new Date().toISOString(),
    };

    this.setStatus("completed");
    return result;
  }

  abort(): void {
    this.capture.stop();
    this.setStatus("idle");
  }

  getStatus(): DictationStatus {
    return this.currentStatus;
  }
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDictationResult(
  transcript: TranscriptionResult,
  context: DictationContext,
): DictationResult {
  const refinement = deterministicRefine(transcript, context);
  return {
    id: generateId(),
    rawTranscript: transcript.rawText,
    refinedText: refinement.text,
    language: context.language ?? "en",
    mode: context.mode,
    providerRoute: `${transcript.provider} → ${refinement.provider}`,
    latencyMs: transcript.latencyMs + 15,
    confidence: estimateConfidence(transcript),
    privacyMode: context.privacyMode,
    appContext: context.activeApp,
    status: "completed",
    actions: refinement.actions,
    createdAt: new Date().toISOString(),
  };
}
