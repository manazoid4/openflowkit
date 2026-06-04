import React from "react";
import type { WritingMode } from "../core/writingModes";
import { writingModeLabels, writingModeDescriptions } from "../core/writingModes";

interface Props {
  mode: WritingMode;
  onClose: () => void;
}

export function UpgradePrompt({ mode, onClose }: Props) {
  return (
    <div className="upgradeOverlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
      <div className="upgradeCard" onClick={(e) => e.stopPropagation()}>
        <button className="upgradeClose" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <p className="eyebrow">Pro feature</p>
        <h2 className="upgradeTitle">
          {writingModeLabels[mode]} mode is on Pro
        </h2>
        <p className="upgradeDesc">
          {writingModeDescriptions[mode]} — unlock this and 2 more modes with Pro.
        </p>
        <div className="upgradePerks">
          <div className="upgradePerk">
            <span className="upgradePerkIcon">✓</span>
            <span>All 6 writing modes</span>
          </div>
          <div className="upgradePerk">
            <span className="upgradePerkIcon">✓</span>
            <span>Unlimited history</span>
          </div>
          <div className="upgradePerk">
            <span className="upgradePerkIcon">✓</span>
            <span>Speak-to-Share links</span>
          </div>
          <div className="upgradePerk">
            <span className="upgradePerkIcon">✓</span>
            <span>Personal snippet library</span>
          </div>
        </div>
        <div className="upgradePrice">
          <strong>£9</strong> <span>/ month</span>
        </div>
        <button className="button upgradeCta" onClick={() => {}}>
          Start free trial
        </button>
        <p className="upgradeFine">No credit card required. Cancel anytime.</p>
      </div>
    </div>
  );
}