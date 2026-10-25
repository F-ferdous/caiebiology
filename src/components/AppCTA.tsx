"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./AppCTA.module.css";

// Promotes installing the site as a PWA + enabling push notifications. The
// actual install/enable flow lives in the signed-in dashboard (InstallGuide),
// so this landing section drives people to sign up / log in.
const perks = [
  {
    icon: "ti-device-mobile-down",
    title: "Install like a real app",
    text: "Add CAIE-BIOLOGY to your home screen — full-screen, fast, no App Store needed.",
  },
  {
    icon: "ti-bell-ringing",
    title: "Instant notifications",
    text: "Get alerted the moment your teacher posts a notice for your class or batch.",
  },
  {
    icon: "ti-bolt",
    title: "Always up to date",
    text: "Classes, resources, payments, and notices — all in your pocket, in sync.",
  },
];

function PhoneMock() {
  return (
    <svg
      className={styles.phone}
      viewBox="0 0 300 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body */}
      <rect x="8" y="8" width="284" height="584" rx="44" fill="#0A0A0A" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
      {/* Screen */}
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="300" y2="600" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5C0808" />
          <stop offset="0.55" stopColor="#1A0202" />
          <stop offset="1" stopColor="#0A0A0A" />
        </linearGradient>
        <clipPath id="screen">
          <rect x="20" y="20" width="260" height="560" rx="34" />
        </clipPath>
      </defs>
      <rect x="20" y="20" width="260" height="560" rx="34" fill="url(#wall)" />

      <g clipPath="url(#screen)">
        {/* Notch */}
        <rect x="110" y="20" width="80" height="24" rx="12" fill="#0A0A0A" />

        {/* Lock-screen clock */}
        <text x="150" y="110" textAnchor="middle" fontSize="15" fill="rgba(255,255,255,0.65)" fontFamily="system-ui" letterSpacing="1">
          Thursday, 24 Oct
        </text>
        <text x="150" y="168" textAnchor="middle" fontSize="60" fontWeight="300" fill="#fff" fontFamily="system-ui" letterSpacing="-1">
          9:41
        </text>

        {/* Notification card 1 */}
        <g>
          <rect x="34" y="210" width="232" height="86" rx="18" fill="rgba(255,255,255,0.94)" />
          <rect x="48" y="224" width="30" height="30" rx="8" fill="#A51212" />
          {/* brand glyph */}
          <g transform="translate(55 231) scale(0.62)" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z" />
            <path d="M14.828 14.828l3.586 3.586a2 2 0 0 0 2.828 -2.828l-3.586 -3.586" />
            <path d="M9.172 9.172l-3.586 -3.586a2 2 0 1 0 -2.828 2.828l3.586 3.586" />
          </g>
          <text x="86" y="236" fontSize="11" fontWeight="700" fill="#0A0A0A" fontFamily="system-ui">CAIE-BIOLOGY</text>
          <text x="252" y="236" textAnchor="end" fontSize="10" fill="#767676" fontFamily="system-ui">now</text>
          <text x="48" y="276" fontSize="11.5" fontWeight="600" fill="#1A1A1A" fontFamily="system-ui">Class cancelled tomorrow</text>
          <text x="48" y="290" fontSize="10.5" fill="#5C5C5C" fontFamily="system-ui">Tap for the full notice · Class XI</text>
        </g>

        {/* Notification card 2 (peeking) */}
        <g opacity="0.82">
          <rect x="44" y="306" width="212" height="70" rx="16" fill="rgba(255,255,255,0.82)" />
          <rect x="58" y="318" width="26" height="26" rx="7" fill="#A51212" />
          <g transform="translate(64 324) scale(0.54)" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z" />
            <path d="M14.828 14.828l3.586 3.586a2 2 0 0 0 2.828 -2.828l-3.586 -3.586" />
            <path d="M9.172 9.172l-3.586 -3.586a2 2 0 1 0 -2.828 2.828l3.586 3.586" />
          </g>
          <text x="92" y="330" fontSize="10" fontWeight="700" fill="#0A0A0A" fontFamily="system-ui">CAIE-BIOLOGY</text>
          <text x="92" y="346" fontSize="10" fill="#5C5C5C" fontFamily="system-ui">New resource added for you</text>
        </g>

        {/* Bottom bar */}
        <rect x="110" y="556" width="80" height="5" rx="2.5" fill="rgba(255,255,255,0.6)" />
      </g>
    </svg>
  );
}

export default function AppCTA() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.section} aria-labelledby="appcta-headline">
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        {/* Copy */}
        <div className={styles.content}>
          <span className="section-label">Mobile app</span>
          <h2 id="appcta-headline" className={styles.headline}>
            Keep class in your pocket —<br />
            <span className={styles.accent}>never miss a notice.</span>
          </h2>
          <p className={styles.lead}>
            Install CAIE-BIOLOGY straight to your phone&apos;s home screen and turn on
            notifications. The instant your teacher posts an announcement for your class or
            batch, it lands on your device — even when the app is closed.
          </p>

          <ul className={styles.perks}>
            {perks.map((p) => (
              <li key={p.title} className={styles.perk}>
                <span className={styles.perkIcon} aria-hidden="true">
                  <i className={`ti ${p.icon}`} />
                </span>
                <div>
                  <span className={styles.perkTitle}>{p.title}</span>
                  <span className={styles.perkText}>{p.text}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              <i className="ti ti-download" aria-hidden="true" />
              Get the app
            </Link>
            <Link href="/login" className={`btn btn-lg ${styles.secondaryBtn}`}>
              <i className="ti ti-login-2" aria-hidden="true" />
              I already have an account
            </Link>
          </div>
          <p className={styles.footnote}>
            <i className="ti ti-brand-apple" aria-hidden="true" /> iPhone &amp; iPad
            <span className={styles.dot} aria-hidden="true" />
            <i className="ti ti-brand-android" aria-hidden="true" /> Android
            <span className={styles.dot} aria-hidden="true" />
            <i className="ti ti-device-desktop" aria-hidden="true" /> Desktop
          </p>
        </div>

        {/* Phone visual */}
        <div className={styles.visual} aria-hidden="true">
          <PhoneMock />
        </div>
      </div>
    </section>
  );
}
