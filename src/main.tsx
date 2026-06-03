import React from "react";
import { createRoot } from "react-dom/client";
import { deterministicRefine } from "./core/refine";
import type { DictationContext, TranscriptionResult } from "./core/types";
import { integrations } from "./data/integrations";
import { planCapabilities } from "./core/plans";
import "./styles/main.css";

const demoTranscript: TranscriptionResult = {
  provider: "demo",
  rawText:
    "um write a pull request comment saying the auth middleware is failing actually the session refresh path is failing and we should add a regression test",
  segments: [],
  latencyMs: 122,
};

const demoContext: DictationContext = {
  mode: "code",
  privacyMode: true,
  activeApp: "Cursor",
  style: "developer",
  snippets: {
    "book a call": "https://cal.com/openflowkit/demo",
  },
};

const refined = deterministicRefine(demoTranscript, demoContext);
const integrationCounts = integrations.reduce<Record<string, number>>((counts, integration) => {
  counts[integration.status] = (counts[integration.status] ?? 0) + 1;
  return counts;
}, {});

const planLabels: Record<string, string> = {
  free: "Free core",
  pro: "Pro speed",
  teams: "Team control",
  enterprise: "Enterprise trust",
};

function App() {
  return (
    <main>
      <nav className="nav" aria-label="Primary">
        <a className="brand" href="#top">OpenFlowKit</a>
        <div>
          <a href="#integrations">Integrations</a>
          <a href="#pricing">Pricing</a>
          <a href="#architecture">Architecture</a>
          <a className="button ghost" href="https://github.com/manazoid4/openflowkit">GitHub</a>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Open-source AI dictation layer</p>
          <h1>Speak anywhere. Route through any model. Keep control.</h1>
          <p>
            A free core for local-first voice input, AI cleanup, developer-aware formatting,
            snippets, dictionaries, and paid team controls.
          </p>
          <div className="actions">
            <a className="button" href="#integrations">View integrations</a>
            <a className="button secondary" href="#pricing">See paid model</a>
          </div>
        </div>
        <div className="demoPanel" aria-label="Refinement demo">
          <div className="panelHeader">
            <span>Privacy Mode On</span>
            <span>{demoTranscript.latencyMs}ms</span>
          </div>
          <label>Raw speech</label>
          <p className="raw">{demoTranscript.rawText}</p>
          <label>Refined output</label>
          <p className="refined">{refined.text}</p>
          <div className="chips">
            {refined.actions.map((action) => <span key={action}>{action}</span>)}
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Built around the actual moat</h2>
        <div className="grid four">
          {[
            ["Universal input", "Native capture and paste injection for any text field."],
            ["LLM agnostic", "OpenAI-compatible routing for Ollama, OpenRouter, vLLM, and cloud models."],
            ["Developer aware", "Syntax, casing, file mentions, and terminal command formatting."],
            ["Paid-ready", "Cloud sync, teams, analytics, policies, and enterprise deployment hooks."],
          ].map(([title, body]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="integrations" className="section alt">
        <div className="sectionIntro">
          <div>
            <h2>Integrations that keep routing open</h2>
            <p className="sectionLead">
              Bring local, cloud, or managed providers without locking dictation into one model stack.
            </p>
          </div>
          <div className="statusSummary" aria-label="Integration status summary">
            {Object.entries(integrationCounts).map(([status, count]) => (
              <span key={status}>
                <strong>{count}</strong> {status}
              </span>
            ))}
          </div>
        </div>
        <div className="integrationGrid">
          {integrations.map((integration) => (
            <article className="integration" key={integration.id}>
              <div className="integrationMeta">
                <span className={`status ${integration.status}`}>{integration.status}</span>
                <span className="plan">{integration.plan}</span>
              </div>
              <span className="category">{integration.category}</span>
              <h3>{integration.name}</h3>
              <p>{integration.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="sectionIntro">
          <div>
            <h2>Paid model</h2>
            <p className="sectionLead">
              Free stays useful for local workflows. Paid tiers unlock managed speed, shared context,
              governance, and deployment control.
            </p>
          </div>
          <p className="paidPrinciple">
            Monetise convenience and control, not basic access.
          </p>
        </div>
        <div className="grid pricing">
          {(Object.keys(planCapabilities) as Array<keyof typeof planCapabilities>).map((plan) => (
            <article className="priceCard" key={plan}>
              <span className="planLabel">{planLabels[plan]}</span>
              <h3>{plan}</h3>
              <ul>
                {planCapabilities[plan].map((capability) => <li key={capability}>{capability}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="architecture" className="section architecture">
        <h2>Architecture</h2>
        <div className="pipeline">
          {["Capture", "Transcribe", "Refine", "Personalize", "Inject", "Sync"].map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
        <p>
          Desktop clients should own capture and injection. The shared core owns provider contracts,
          privacy policy, refinement, snippets, dictionaries, plan gating, and model routing.
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
