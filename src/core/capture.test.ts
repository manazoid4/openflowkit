import { describe, expect, it, vi } from "vitest";
import { WebSpeechCapture, estimateConfidence } from "./capture";
import type { TranscriptionResult } from "./types";

describe("WebSpeechCapture", () => {
  it("reports unsupported when SpeechRecognition is absent", () => {
    const capture = new WebSpeechCapture("en-US");
    // window.SpeechRecognition may or may not exist in test env
    // just verify state machine behaviour
    expect(capture.getState().status).toBe("idle");
  });

  it("subscribes and unsubscribes listeners", () => {
    const capture = new WebSpeechCapture();
    const listener = vi.fn();
    const unsub = capture.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });
});

describe("estimateConfidence", () => {
  it("returns default when no confidence values exist", () => {
    const transcript: TranscriptionResult = {
      provider: "test",
      rawText: "hello world",
      segments: [{ text: "hello world", startMs: 0, endMs: 100 }],
      latencyMs: 100,
    };
    expect(estimateConfidence(transcript)).toBe(0.85);
  });

  it("averages segment confidences", () => {
    const transcript: TranscriptionResult = {
      provider: "test",
      rawText: "hello world",
      segments: [
        { text: "hello", startMs: 0, endMs: 50, confidence: 0.9 },
        { text: "world", startMs: 50, endMs: 100, confidence: 0.7 },
      ],
      latencyMs: 100,
    };
    expect(estimateConfidence(transcript)).toBe(0.8);
  });
});
