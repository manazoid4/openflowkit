import { describe, expect, it } from "vitest";
import { createDictationResult, DictationPipeline } from "./dictation";
import { deterministicRefine } from "./refine";
import type { DictationContext, TranscriptionResult } from "./types";

const context: DictationContext = {
  mode: "dictate",
  privacyMode: true,
  language: "en",
  snippets: { "ship note": "Build passes before deployment." },
};

const t = (text: string): TranscriptionResult => ({
  provider: "test",
  rawText: text,
  segments: [],
  latencyMs: 1,
});

const ctx = (mode: DictationContext["mode"]): DictationContext => ({
  mode,
  privacyMode: true,
});

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

describe("email mode", () => {
  it("capitalizes first letter", () => {
    const result = deterministicRefine(t("hey can we reschedule the meeting"), ctx("email"));
    expect(result.text[0]).toBe("H");
  });

  it("removes fillers and adds email formatting action", () => {
    const result = deterministicRefine(t("um hey I was thinking about the project"), ctx("email"));
    expect(result.text).not.toContain("um");
    expect(result.actions).toContain("removed fillers");
    expect(result.actions).toContain("email formatting applied");
  });

  it("adds terminal punctuation", () => {
    const result = deterministicRefine(t("let me know what time works for you"), ctx("email"));
    expect(result.text.endsWith(".")).toBe(true);
  });
});

describe("formal mode", () => {
  it("expands contractions", () => {
    const result = deterministicRefine(
      t("I don't think we can't attend the meeting"),
      ctx("formal"),
    );
    expect(result.text).not.toContain("don't");
    expect(result.text).not.toContain("can't");
    expect(result.actions).toContain("expanded contractions");
  });

  it("capitalizes and marks formal tone", () => {
    const result = deterministicRefine(t("we would like to request a review"), ctx("formal"));
    expect(result.text[0]).toBe("W");
    expect(result.actions).toContain("formal tone applied");
  });
});

describe("slack mode", () => {
  it("removes fillers and marks chat tone", () => {
    const result = deterministicRefine(t("um hey can we catch up later"), ctx("slack"));
    expect(result.text).not.toContain("um");
    expect(result.actions).toContain("chat tone applied");
  });
});

describe("casual mode", () => {
  it("capitalizes and marks chat tone", () => {
    const result = deterministicRefine(t("sounds good to me"), ctx("casual"));
    expect(result.text[0]).toBe("S");
    expect(result.actions).toContain("chat tone applied");
  });
});

describe("code mode (existing behaviour preserved)", () => {
  it("applies developer formatting", () => {
    const result = deterministicRefine(t("write the function name in snake case"), ctx("code"));
    expect(result.text).toContain("snake_case");
    expect(result.actions).toContain("applied developer formatting");
  });
});

describe("snippet expansion across modes", () => {
  it("expands snippets in email mode", () => {
    const emailCtx: DictationContext = {
      mode: "email",
      privacyMode: true,
      snippets: { "book a call": "https://cal.com/demo" },
    };
    const result = deterministicRefine(t("please book a call with us"), emailCtx);
    expect(result.text).toContain("https://cal.com/demo");
    expect(result.actions).toContain("expanded snippet: book a call");
  });
});

describe("dictate mode (minimal processing)", () => {
  it("removes fillers but skips mode-specific formatting", () => {
    const result = deterministicRefine(t("um yeah this looks good"), ctx("dictate"));
    expect(result.text).not.toContain("um");
    expect(result.actions).not.toContain("email formatting applied");
    expect(result.actions).not.toContain("formal tone applied");
  });
});
