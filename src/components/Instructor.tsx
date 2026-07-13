"use client";

import { useEffect, useRef } from "react";
import styles from "./Instructor.module.css";

const credentials = [
  { icon: "ti-award", text: "BSc, MS in Microbiology" },
  { icon: "ti-calendar", text: "15 years teaching O and A Level Biology" },
  { icon: "ti-certificate", text: "Cambridge trained and certified" },
  { icon: "ti-school", text: "Senior A Level Biology Faculty, Scholastica Limited, Mirpur" },
  { icon: "ti-trophy", text: "Several country and world highest in Biology" },
];

const stats = [
  { val: "15+", label: "Years Teaching" },
  { val: "4000+", label: "Students Taught" },
  { val: "World", label: "Highest in Biology" },
];

export default function Instructor() {
  const ref = useRef<HTMLElement>(null);
  const credRefs = useRef<HTMLLIElement[]>([]);

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
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    credRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add(styles.credVisible), i * 100);
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
    });
  }, []);

  return (
    <section
      ref={ref}
      className={styles.section}
      id="instructor"
      aria-labelledby="instructor-headline"
    >
      <div className="container">
        <div className={styles.inner}>
          {/* Left: instructor card */}
          <div className={styles.profileCol}>
            {/* Avatar illustration */}
            <div className={styles.avatarWrap}>
              <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.avatarSvg} aria-hidden="true">
                <defs>
                  <radialGradient id="avatarBg" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#2D2D2D"/>
                    <stop offset="100%" stopColor="#0A0A0A"/>
                  </radialGradient>
                </defs>
                {/* Background circle */}
                <circle cx="140" cy="140" r="130" fill="url(#avatarBg)" stroke="rgba(196,31,31,0.2)" strokeWidth="1.5"/>
                {/* Subtle ring */}
                <circle cx="140" cy="140" r="118" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="8 6"/>
                {/* Body / torso */}
                <ellipse cx="140" cy="220" rx="65" ry="40" fill="rgba(196,31,31,0.15)" stroke="rgba(196,31,31,0.3)" strokeWidth="1.5"/>
                <rect x="100" y="190" width="80" height="50" rx="8" fill="rgba(10,10,10,0.9)" stroke="rgba(196,31,31,0.25)" strokeWidth="1"/>
                {/* Collar */}
                <path d="M120 190 L140 210 L160 190" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none"/>
                {/* Head */}
                <ellipse cx="140" cy="148" rx="40" ry="44" fill="#C9956A"/>
                {/* Hair */}
                <ellipse cx="140" cy="114" rx="40" ry="20" fill="#1A1A1A"/>
                <rect x="100" y="110" width="10" height="24" rx="5" fill="#1A1A1A"/>
                <rect x="170" y="110" width="10" height="24" rx="5" fill="#1A1A1A"/>
                {/* Eyes */}
                <ellipse cx="126" cy="148" rx="5" ry="5.5" fill="#1A1A1A"/>
                <ellipse cx="154" cy="148" rx="5" ry="5.5" fill="#1A1A1A"/>
                <circle cx="128" cy="146" r="1.5" fill="white"/>
                <circle cx="156" cy="146" r="1.5" fill="white"/>
                {/* Glasses */}
                <rect x="116" y="143" width="18" height="12" rx="3" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                <rect x="146" y="143" width="18" height="12" rx="3" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                <line x1="134" y1="149" x2="146" y2="149" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                {/* Smile */}
                <path d="M128 162 Q140 170 152 162" stroke="#8B5E3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                {/* Badge / lanyard */}
                <rect x="126" y="196" width="28" height="20" rx="4" fill="rgba(196,31,31,0.25)" stroke="rgba(196,31,31,0.5)" strokeWidth="1"/>
                <text x="140" y="209" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.7)" fontFamily="system-ui">TEACHER</text>
                {/* Sparkle accents */}
                <circle cx="60" cy="70" r="3" fill="rgba(196,31,31,0.5)">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="220" cy="80" r="2" fill="rgba(196,31,31,0.4)">
                  <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="230" cy="200" r="2.5" fill="rgba(196,31,31,0.35)">
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite"/>
                </circle>
              </svg>

              {/* Live badge */}
              <div className={styles.liveBadge}>
                <span className={styles.liveDot} />
                Available for Q&amp;A
              </div>
            </div>

            {/* Name card */}
            <div className={styles.nameCard}>
              <p className={styles.name}>Abul Hayat Bin Azad (Mr. Tulan)</p>
              <p className={styles.nameRole}>Senior A Level Biology Faculty — Scholastica Limited, Mirpur</p>
              {/* Stat row */}
              <div className={styles.statRow}>
                {stats.map((s) => (
                  <div key={s.label} className={styles.stat}>
                    <span className={styles.statVal}>{s.val}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: credentials + quote */}
          <div className={styles.contentCol}>
            <span className="section-label">Your Instructor</span>
            <h2 id="instructor-headline" className={styles.headline}>
              Learn from an
              <br />
              <span className={styles.accent}>expert examiner</span>
            </h2>

            <ul className={styles.credList} role="list">
              {credentials.map((c, i) => (
                <li
                  key={c.text}
                  className={styles.credItem}
                  ref={(el) => { if (el) credRefs.current[i] = el; }}
                >
                  <div className={styles.credIcon}>
                    <i className={`ti ${c.icon}`} aria-hidden="true" />
                  </div>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>

            {/* Pull quote */}
            <blockquote className={styles.quote}>
              <i className="ti ti-quote" aria-hidden="true" />
              <p>
                &ldquo;Biology isn&apos;t memorisation. It&apos;s understanding the story of life — and I&apos;m here to help you tell it in every exam.&rdquo;
              </p>
            </blockquote>

            <a href="#signup" className="btn btn-primary" id="instructor-cta">
              <i className="ti ti-user-plus" aria-hidden="true" />
              Join a Batch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
