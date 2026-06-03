import React from "react";

const MOATS = [
  {
    title: "Works offline",
    body: "The core flow never touches the internet. Your words stay on your device.",
  },
  {
    title: "Six writing modes",
    body: "Email, Slack, Code, Formal, Casual, Raw — each shapes the output differently, automatically.",
  },
  {
    title: "Private by design",
    body: "Nothing leaves your device without explicit consent. No silent routing.",
  },
  {
    title: "Team vocabulary",
    body: "Shared snippet libraries and dictionaries make every team member's output consistent.",
  },
  {
    title: "Developer aware",
    body: "camelCase, snake_case, file paths, terminal commands — formatted right, every time.",
  },
  {
    title: "Speak-to-Share",
    body: "Record once, share anywhere. A URL for any snippet — no app install required.",
  },
];

const STEPS = [
  { num: "1", title: "Hold to speak", body: "Press Record or tap Space. Speak naturally." },
  { num: "2", title: "Choose your mode", body: "Email, Slack, Code — pick what you're writing." },
  { num: "3", title: "Copy or share", body: "Polished text is ready. Copy it or send a link." },
];

const PRICING = [
  {
    plan: "Free",
    price: "£0",
    period: "forever",
    features: [
      "Voice capture in any browser",
      "3 writing modes",
      "Offline processing",
      "Basic snippet history",
      "Privacy mode",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    plan: "Pro",
    price: "£9",
    period: "per month",
    features: [
      "All 6 writing modes",
      "Unlimited history",
      "Speak-to-Share links",
      "Personal snippet library",
      "10 languages",
      "Priority speed",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    plan: "Teams",
    price: "£7",
    period: "per seat / month",
    features: [
      "Everything in Pro",
      "Shared team vocabulary",
      "Shared snippet library",
      "Admin controls",
      "Usage analytics",
      "Central billing",
    ],
    cta: "Start team trial",
    highlight: false,
  },
  {
    plan: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Private deployment",
      "SSO / SAML / SCIM",
      "Audit logs",
      "Data retention controls",
      "Custom model routing",
      "Dedicated support",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

interface Props {
  onOpenLab: () => void;
}

export function Landing({ onOpenLab }: Props) {
  return (
    <main>
      <nav className="nav" aria-label="Primary">
        <a className="brand" href="#top">Open Flow</a>
        <div>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a
            className="button ghost"
            href="https://github.com/manazoid4/openflowkit"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <button className="button" onClick={onOpenLab}>Try it free</button>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Local-first voice dictation</p>
          <h1>Your words, instantly polished.</h1>
          <p>
            Speak naturally. Get clean, ready-to-send text. Works in any browser,
            offline, in six writing modes — and shares as a link.
          </p>
          <div className="actions">
            <button className="button" onClick={onOpenLab}>Open the lab</button>
            <a className="button secondary" href="#how-it-works">How it works</a>
          </div>
        </div>
        <div className="heroDemo" aria-label="Before and after example">
          <div className="demoBefore">
            <span className="demoTag">You said</span>
            <p>
              um hey so I was thinking about the meeting and like we should probably
              move it to Thursday at two PM actually Friday works better
            </p>
          </div>
          <div className="demoArrow" aria-hidden="true">↓</div>
          <div className="demoAfter">
            <span className="demoTag polished">Polished · Email</span>
            <p>
              Hey, I was thinking about the meeting — Friday works better than Thursday.
              Can we move it to 2 PM?
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <h2>Three steps to clean text</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.num}>
              <span className="stepNum">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <div className="labCta">
          <button className="button large" onClick={onOpenLab}>
            Try the lab now →
          </button>
        </div>
      </section>

      <section className="section alt">
        <div className="sectionIntro">
          <div>
            <h2>Built on six real advantages</h2>
            <p className="sectionLead">
              Not features for the sake of it. Each one is a reason to stay.
            </p>
          </div>
        </div>
        <div className="grid three moatsGrid">
          {MOATS.map((m) => (
            <article className="card moatCard" key={m.title}>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Six modes. One voice.</h2>
        <p className="sectionLead">
          Pick the context. Open Flow shapes the output to match.
        </p>
        <div className="modesGrid">
          {[
            { label: "Email", desc: "Professional, full sentences, ready to send." },
            { label: "Slack", desc: "Conversational, short, no formal sign-off." },
            { label: "Code", desc: "snake_case, camelCase, newlines, commands." },
            { label: "Formal", desc: "No contractions, structured paragraphs." },
            { label: "Casual", desc: "Natural tone, fragments are fine." },
            { label: "Raw", desc: "Fillers removed, nothing else changed." },
          ].map((m) => (
            <div className="modeCard" key={m.label}>
              <span className="modeName">{m.label}</span>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="section alt">
        <div className="sectionIntro">
          <div>
            <h2>Pricing</h2>
            <p className="sectionLead">
              Free core. Paid convenience. Never locked out of basic dictation.
            </p>
          </div>
        </div>
        <div className="pricingGrid">
          {PRICING.map((p) => (
            <article className={`priceCard${p.highlight ? " featured" : ""}`} key={p.plan}>
              {p.highlight && <span className="featuredBadge">Most popular</span>}
              <span className="planName">{p.plan}</span>
              <div className="planPrice">
                <strong>{p.price}</strong>
                {p.period && <span> {p.period}</span>}
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className={`button${p.highlight ? "" : " secondary"} planCta`}
                onClick={
                  p.plan !== "Enterprise" ? onOpenLab : undefined
                }
              >
                {p.cta}
              </button>
            </article>
          ))}
        </div>
        <p className="pricingNote">All prices ex VAT. Cancel any time. No lock-in.</p>
      </section>

      <section className="section ctaSection">
        <h2>Start speaking.</h2>
        <p>No download. No account. Works in your browser right now.</p>
        <button className="button large" onClick={onOpenLab}>
          Open the lab →
        </button>
      </section>

      <footer className="footer">
        <span className="brand">Open Flow</span>
        <div>
          <a href="https://github.com/manazoid4/openflowkit" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="#pricing">Pricing</a>
        </div>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
