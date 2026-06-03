import { describe, expect, it } from "vitest";
import { deterministicRefine } from "./refine";
import type { DictationContext, TranscriptionResult } from "./types";

const context: DictationContext = {
  mode: "code",
  privacyMode: true,
  snippets: {
    "ship note": "Build passes before deployment.",
  },
};

const transcript: TranscriptionResult = {
  provider: "test",
  rawText: "um write this in snake case new line then add ship note",
  segments: [],
  latencyMs: 1,
};

describe("deterministicRefine", () => {
  it("removes filler, applies developer formatting, expands snippets, and punctuates", () => {
    const result = deterministicRefine(transcript, context);

    expect(result.text).toBe("write this in snake_case \n then add Build passes before deployment.");
    expect(result.actions).toContain("removed fillers");
    expect(result.actions).toContain("applied developer formatting");
    expect(result.actions).toContain("expanded snippet: ship note");
  });
});
