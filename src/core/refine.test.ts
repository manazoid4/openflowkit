import { describe, expect, it } from "vitest";
import { deterministicRefine } from "./refine";
import type { DictationContext, TranscriptionResult } from "./types";

const baseContext: DictationContext = {
  mode: "dictate",
  privacyMode: true,
  snippets: {
    "ship note": "Build passes before deployment.",
  },
};

const transcript = (text: string): TranscriptionResult => ({
  provider: "test",
  rawText: text,
  segments: [],
  latencyMs: 1,
});

describe("deterministicRefine", () => {
  it("removes fillers and punctuates", () => {
    const result = deterministicRefine(transcript("um write this in snake case"), {
      ...baseContext,
      mode: "code",
    });
    expect(result.text).toContain("snake_case");
    expect(result.actions).toContain("removed fillers");
    expect(result.actions).toContain("applied developer formatting");
  });

  it("expands snippets", () => {
    const result = deterministicRefine(transcript("add ship note"), baseContext);
    expect(result.text).toContain("Build passes before deployment");
    expect(result.actions).toContain("expanded snippet: ship note");
  });

  it("resolves spoken self-corrections", () => {
    const result = deterministicRefine(
      transcript("the auth middleware is failing no wait the session refresh path is failing"),
      baseContext,
    );
    expect(result.text.toLowerCase()).not.toContain("auth middleware");
    expect(result.text.toLowerCase()).toContain("session refresh path");
    expect(result.actions).toContain("resolved spoken correction");
  });

  it("deduplicates repeated words", () => {
    const result = deterministicRefine(transcript("this this is a test"), baseContext);
    expect(result.text).not.toContain("this this");
    expect(result.actions).toContain("deduplicated words");
  });

  it("applies message style for short messages", () => {
    const result = deterministicRefine(transcript("Hello there"), {
      ...baseContext,
      mode: "message",
    });
    expect(result.text.startsWith("h")).toBe(true);
    expect(result.actions).toContain("applied message style");
  });

  it("applies formal style contractions", () => {
    const result = deterministicRefine(transcript("I don't think we can't do this"), {
      ...baseContext,
      style: "formal",
    });
    expect(result.text).toContain("do not");
    expect(result.text).toContain("cannot");
    expect(result.actions).toContain("applied formal style");
  });

  it("applies concise style phrases", () => {
    const result = deterministicRefine(transcript("In order to proceed due to the fact that we are ready"), {
      ...baseContext,
      style: "concise",
    });
    expect(result.text.toLowerCase()).toContain("to proceed");
    expect(result.text.toLowerCase()).toContain("because");
    expect(result.actions).toContain("applied concise style");
  });

  it("applies document formatting", () => {
    const result = deterministicRefine(transcript("intro new paragraph bullet point first item numbered list second item"), {
      ...baseContext,
      mode: "document",
    });
    expect(result.text).toContain("\n\n");
    expect(result.text).toContain("\n- ");
    expect(result.text).toContain("\n1. ");
    expect(result.actions).toContain("applied document formatting");
  });

  it("capitalises first letter of sentences", () => {
    const result = deterministicRefine(transcript("hello world. how are you"), baseContext);
    expect(result.text).toContain("Hello world");
    expect(result.text).toContain("How are you");
  });
});
