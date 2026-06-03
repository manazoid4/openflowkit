import type { Plan } from "./types";

export const planCapabilities: Record<Plan, string[]> = {
  free: [
    "Local transcription",
    "BYOK LLM refinement",
    "Personal dictionary",
    "Local snippets",
  ],
  pro: [
    "Managed fast STT",
    "Managed LLM cleanup",
    "Cloud sync",
    "Advanced writing styles",
    "App-specific profiles",
  ],
  teams: [
    "Shared dictionary",
    "Shared snippets",
    "Usage dashboard",
    "Admin policies",
    "Central billing",
  ],
  enterprise: [
    "Private deployment",
    "SSO/SAML/SCIM",
    "Audit logs",
    "Data retention controls",
    "Custom model routing",
  ],
};

export function canUseCapability(plan: Plan, capability: string): boolean {
  const order: Plan[] = ["free", "pro", "teams", "enterprise"];
  const planIndex = order.indexOf(plan);
  return order.slice(0, planIndex + 1).some((tier) => planCapabilities[tier].includes(capability));
}
