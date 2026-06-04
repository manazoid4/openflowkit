import type { DictationContext, DictationMode } from "./types";

export type WritingMode = Extract<DictationMode, "email" | "slack" | "code" | "formal" | "casual" | "dictate">;

export const WRITING_MODES: WritingMode[] = ["email", "slack", "code", "formal", "casual", "dictate"];

export const writingModeLabels: Record<WritingMode, string> = {
  email: "Email",
  slack: "Slack",
  code: "Code",
  formal: "Formal",
  casual: "Casual",
  dictate: "Raw",
};

export const writingModeDescriptions: Record<WritingMode, string> = {
  email: "Professional tone, full sentences, ready to send",
  slack: "Conversational, short, no formal greeting",
  code: "snake_case, camelCase, newlines, terminal commands",
  formal: "Structured paragraphs, no contractions, professional",
  casual: "Relaxed, natural, fragments OK",
  dictate: "Minimal cleanup — fillers removed only",
};

export type Tier = "free" | "pro";

export const modeTier: Record<WritingMode, Tier> = {
  email: "free",
  casual: "free",
  dictate: "free",
  slack: "pro",
  code: "pro",
  formal: "pro",
};

export const FREE_MODES: WritingMode[] = WRITING_MODES.filter((m) => modeTier[m] === "free");
export const PRO_MODES: WritingMode[] = WRITING_MODES.filter((m) => modeTier[m] === "pro");

export function isProMode(mode: WritingMode): boolean {
  return modeTier[mode] === "pro";
}

export function writingModeToContext(mode: WritingMode, privacyMode: boolean): DictationContext {
  return {
    mode,
    privacyMode,
    style: modeToStyle(mode),
  };
}

function modeToStyle(mode: WritingMode): DictationContext["style"] {
  switch (mode) {
    case "email":   return "friendly";
    case "slack":   return "friendly";
    case "code":    return "developer";
    case "formal":  return "formal";
    case "casual":  return "plain";
    case "dictate": return "plain";
  }
}
