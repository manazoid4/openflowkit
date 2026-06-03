import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Landing } from "./components/Landing";
import { DictationLab } from "./components/DictationLab";
import "./styles/main.css";

type View = "landing" | "lab" | "share";

function decodeShareText(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/[?&]t=([^&]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(atob(match[1]));
  } catch {
    return null;
  }
}

function getInitialView(): View {
  const hash = window.location.hash;
  if (hash.startsWith("#share")) return "share";
  if (hash === "#lab") return "lab";
  return "landing";
}

function SharedSnippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="shareView">
      <div className="shareCard">
        <p className="eyebrow">Shared snippet</p>
        <h1 className="shareHeadline">Open Flow</h1>
        <div className="shareText">{text}</div>
        <div className="shareActions">
          <button className="button" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy text"}
          </button>
          <a className="button secondary" href="/">Open in my lab →</a>
        </div>
        <p className="shareNoticeSmall">
          Shared via Open Flow. No account or install needed.
        </p>
      </div>
    </main>
  );
}

function App() {
  const [view, setView] = useState<View>(getInitialView);
  const sharedText = view === "share" ? decodeShareText() : null;

  useEffect(() => {
    const handler = () => setView(getInitialView());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const goToLab = () => {
    window.location.hash = "#lab";
    setView("lab");
  };

  const goToLanding = () => {
    window.location.hash = "";
    setView("landing");
  };

  if (view === "share") {
    return sharedText ? (
      <SharedSnippet text={sharedText} />
    ) : (
      <main className="shareView">
        <div className="shareCard">
          <p>Invalid or expired share link.</p>
          <a className="button" href="/">Go home</a>
        </div>
      </main>
    );
  }

  if (view === "lab") {
    return <DictationLab onBack={goToLanding} />;
  }

  return <Landing onOpenLab={goToLab} />;
}

createRoot(document.getElementById("root")!).render(<App />);
