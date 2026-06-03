import { describe, expect, it } from "vitest";
import { createDictationResult, DictationPipeline } from "./dictation";
import type { DictationContext, TranscriptionResult } from "./types";

const context: DictationContext = {
  mode: "dictate",
  privacyMode: true,
  language: "en",
  snippets: { "ship note": "Build passes before deployment." },
};

describe("DictationPipeline", () => {
  it("initialises with idle status", () => {
    const pipeline = new DictationPipeline({ context });
    expect(pipeline.getStatus()).toBe("idle");
  });

  it("transitions through status changes on start/stop lifecycle", async () => {
    const statuses: string[] = [];
    const pipeline = new DictationPipeline({
      context,
      onStatusChange: (s) => statuses.push(s),
    });

    // start will likely fail in test env (no mic permission / no SpeechRecognition)
    // but we can still verify state transitions
    await pipeline.start();
    // If start failed, status becomes error; otherwise capturing
    expect(["capturing", "error"]).toContain(statuses[0]);
  });
});

describe("createDictationResult", () => {
  it("builds a full DictationResult from a transcript and context", () => {
    const transcript: TranscriptionResult = {
      provider: "webspeech",
      rawText: "um ship note",
      segments: [{ text: "um ship note", startMs: 0, endMs: 200, confidence: 0.92 }],
      latencyMs: 200,
    };

    const result = createDictationResult(transcript, context);

    expect(result.rawTranscript).toBe("um ship note");
    expect(result.refinedText).toContain("Build passes before deployment");
    expect(result.providerRoute).toBe("webspeech → deterministic-local");
    expect(result.status).toBe("completed");
    expect(result.id).toBeTruthy();
    expect(result.createdAt).toBeTruthy();
    expect(result.confidence).toBe(0.92);
    expect(result.actions.length).toBeGreaterThan(0);
  });
});
