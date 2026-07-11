"use client";

import { useEffect, useRef } from "react";
import styles from "./Features.module.css";

/* Inline SVGs for each feature — large, bold, single-color */
const ResourceSVG = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect x="12" y="10" width="36" height="46" rx="4" fill="rgba(196,31,31,0.15)" stroke="rgba(196,31,31,0.5)" strokeWidth="1.5"/>
    <rect x="20" y="18" width="20" height="2.5" rx="1.25" fill="rgba(196,31,31,0.6)"/>
    <rect x="20" y="24" width="14" height="2.5" rx="1.25" fill="rgba(196,31,31,0.4)"/>
    <rect x="20" y="30" width="18" height="2.5" rx="1.25" fill="rgba(196,31,31,0.3)"/>
    <rect x="20" y="36" width="12" height="2.5" rx="1.25" fill="rgba(196,31,31,0.2)"/>
    <rect x="28" y="20" width="36" height="46" rx="4" fill="rgba(10,10,10,0.8)" stroke="rgba(196,31,31,0.35)" strokeWidth="1.5"/>
    <rect x="36" y="28" width="20" height="2.5" rx="1.25" fill="rgba(255,255,255,0.6)"/>
    <rect x="36" y="34" width="14" height="2.5" rx="1.25" fill="rgba(255,255,255,0.35)"/>
    <rect x="36" y="40" width="18" height="2.5" rx="1.25" fill="rgba(255,255,255,0.25)"/>
    <rect x="36" y="46" width="10" height="2.5" rx="1.25" fill="rgba(255,255,255,0.15)"/>
    <circle cx="57" cy="57" r="14" fill="rgba(196,31,31,0.9)" stroke="rgba(196,31,31,0.5)" strokeWidth="1">
      <animate attributeName="r" values="14;15.5;14" dur="2s" repeatCount="indefinite"/>
    </circle>
    <path d="M53 57 L56 60 L62 54" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClassSVG = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect x="8" y="16" width="64" height="42" rx="6" fill="rgba(10,10,10,0.9)" stroke="rgba(196,31,31,0.4)" strokeWidth="1.5"/>
    <rect x="14" y="22" width="52" height="30" rx="3" fill="rgba(196,31,31,0.08)"/>
    {/* Play button */}
    <circle cx="40" cy="37" r="12" fill="rgba(196,31,31,0.85)" stroke="rgba(196,31,31,0.4)" strokeWidth="1">
      <animate attributeName="r" values="12;13.5;12" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <polygon points="37,32 37,42 47,37" fill="white"/>
    {/* Live dot */}
    <circle cx="58" cy="26" r="4" fill="var(--red-400)">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <rect x="16" y="62" width="16" height="3" rx="1.5" fill="rgba(196,31,31,0.5)"/>
    <rect x="36" y="62" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
  </svg>
);

const AISvg = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect x="8" y="12" width="64" height="44" rx="8" fill="rgba(10,10,10,0.95)" stroke="rgba(196,31,31,0.35)" strokeWidth="1.5"/>
    {/* User bubble */}
    <rect x="36" y="18" width="28" height="10" rx="5" fill="rgba(196,31,31,0.25)" stroke="rgba(196,31,31,0.4)" strokeWidth="1"/>
    <rect x="39" y="21" width="16" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
    {/* AI bubble */}
    <rect x="16" y="32" width="32" height="10" rx="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
    <rect x="19" y="35" width="22" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
    {/* Typing dots */}
    <circle cx="32" cy="48" r="2" fill="rgba(196,31,31,0.7)">
      <animate attributeName="cy" values="48;45;48" dur="1s" repeatCount="indefinite"/>
    </circle>
    <circle cx="39" cy="48" r="2" fill="rgba(196,31,31,0.7)">
      <animate attributeName="cy" values="48;45;48" dur="1s" begin="0.2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="46" cy="48" r="2" fill="rgba(196,31,31,0.7)">
      <animate attributeName="cy" values="48;45;48" dur="1s" begin="0.4s" repeatCount="indefinite"/>
    </circle>
    {/* Sparkle */}
    <path d="M64 14 L65.5 18 L70 18 L66.5 20.5 L68 25 L64 22 L60 25 L61.5 20.5 L58 18 L62.5 18 Z" fill="rgba(196,31,31,0.8)">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
    </path>
    {/* Bottom chat input bar */}
    <rect x="8" y="60" width="64" height="14" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
    <rect x="14" y="65" width="40" height="2" rx="1" fill="rgba(255,255,255,0.12)"/>
    <circle cx="62" cy="67" r="5" fill="rgba(196,31,31,0.8)"/>
    <path d="M59.5 67 L61.5 67 M61.5 67 L64.5 67 M63 65 L64.5 67 L63 69" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsSVG = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect x="8" y="8" width="64" height="64" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
    {/* Bars */}
    <rect x="16" y="44" width="10" height="18" rx="3" fill="rgba(196,31,31,0.35)">
      <animate attributeName="height" values="18;24;18" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="y" values="44;38;44" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="30" y="32" width="10" height="30" rx="3" fill="rgba(196,31,31,0.6)">
      <animate attributeName="height" values="30;20;30" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="y" values="32;42;32" dur="2.5s" repeatCount="indefinite"/>
    </rect>
    <rect x="44" y="22" width="10" height="40" rx="3" fill="rgba(196,31,31,0.9)">
      <animate attributeName="height" values="40;32;40" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y" values="22;30;22" dur="2s" repeatCount="indefinite"/>
    </rect>
    <rect x="58" y="14" width="10" height="48" rx="3" fill="rgba(196,31,31,0.95)">
      <animate attributeName="height" values="48;55;48" dur="3.5s" repeatCount="indefinite"/>
      <animate attributeName="y" values="14;7;14" dur="3.5s" repeatCount="indefinite"/>
    </rect>
    {/* Bottom axis */}
    <line x1="12" y1="64" x2="72" y2="64" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
  </svg>
);

const features = [
  {
    label: "Resources",
    sublabel: "CAIE-aligned notes & past papers",
    icon: <ResourceSVG />,
    bg: "var(--theme-bg-card)",
    border: "var(--theme-border)",
    dark: false,
  },
  {
    label: "Live Classes",
    sublabel: "Join & teach in real time",
    icon: <ClassSVG />,
    bg: "var(--theme-bg-card)",
    border: "var(--theme-border)",
    dark: false,
  },
  {
    label: "AI Tutor",
    sublabel: "Ask anything, anytime",
    icon: <AISvg />,
    bg: "var(--theme-bg-card)",
    border: "var(--theme-border)",
    dark: false,
  },
  {
    label: "Analytics",
    sublabel: "Track every student's progress",
    icon: <AnalyticsSVG />,
    bg: "var(--theme-bg-card)",
    border: "var(--theme-border)",
    dark: false,
  },
];

export default function Features() {
  const refs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add(styles.cardVisible), i * 90);
          obs.disconnect();
        }
      }, { threshold: 0.15 });
      obs.observe(el);
    });
  }, []);

  return (
    <section className={styles.section} id="features" aria-labelledby="features-label">
      <div className="container">
        {/* Minimal header — label only */}
        <div className={styles.header}>
          <span className="section-label" id="features-label">What&apos;s Inside</span>
          <h2 className={styles.title}>
            Four tools.<br />
            <span className={styles.accent}>One platform.</span>
          </h2>
        </div>

        {/* Feature grid — 4 cards with big SVG icon + short label */}
        <div className={styles.grid}>
          {features.map((f, i) => (
            <div
              key={f.label}
              className={styles.card}
              ref={(el) => { if (el) refs.current[i] = el; }}
              style={{
                background: f.bg,
                borderColor: f.border,
              }}
            >
              <div className={styles.iconWrap}>{f.icon}</div>
              <p className={`${styles.cardLabel} ${f.dark ? styles.cardLabelDark : ""}`}>{f.label}</p>
              <p className={`${styles.cardSub} ${f.dark ? styles.cardSubDark : ""}`}>{f.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
