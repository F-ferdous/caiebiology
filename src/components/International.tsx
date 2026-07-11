"use client";

import { useEffect, useRef } from "react";
import styles from "./International.module.css";

const regions = [
  { name: "UK", flag: "🇬🇧", timezone: "GMT / BST", label: "Cambridge HQ", top: "12%", left: "46%" },
  { name: "UAE", flag: "🇦🇪", timezone: "GST +4", label: "Middle East", top: "35%", left: "60%" },
  { name: "Bangladesh", flag: "🇧🇩", timezone: "BST +6", label: "South Asia", top: "38%", left: "70%" },
  { name: "Nigeria", flag: "🇳🇬", timezone: "WAT +1", label: "West Africa", top: "45%", left: "48%" },
  { name: "Malaysia", flag: "🇲🇾", timezone: "MYT +8", label: "Southeast Asia", top: "48%", left: "77%" },
  { name: "Pakistan", flag: "🇵🇰", timezone: "PKT +5", label: "South Asia", top: "33%", left: "65%" },
];

const perks = [
  { icon: "ti-video", text: "Live + recorded sessions for all timezones" },
  { icon: "ti-translate", text: "Multilingual support coming soon" },
  { icon: "ti-file-certificate", text: "CAIE curriculum — globally recognised" },
  { icon: "ti-device-laptop", text: "Study from any device, anywhere" },
];

function GlobeSVG() {
  return (
    <svg viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "100%", height: "auto" }}>
      <defs>
        <radialGradient id="globeBg" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgba(196,31,31,0.12)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>

      {/* Outer ambient glow */}
      <circle cx="210" cy="210" r="190" fill="url(#globeBg)"/>

      {/* Globe outline */}
      <circle cx="210" cy="210" r="160" stroke="rgba(196,31,31,0.2)" strokeWidth="1.5" fill="none"/>
      <circle cx="210" cy="210" r="160" stroke="rgba(255,255,255,0.04)" strokeWidth="32" fill="none"/>

      {/* Latitude lines */}
      {[-90, -60, -30, 0, 30, 60, 90].map((lat, i) => {
        const y = 210 + (lat / 90) * 160;
        const hw = Math.sqrt(Math.max(0, 160 * 160 - (y - 210) ** 2));
        return hw > 5 ? (
          <ellipse key={i} cx="210" cy={y} rx={hw} ry={hw * 0.22} stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none"/>
        ) : null;
      })}

      {/* Longitude lines */}
      {[0, 30, 60, 90, 120, 150].map((deg, i) => (
        <ellipse key={i} cx="210" cy="210" rx={160 * Math.abs(Math.cos((deg * Math.PI) / 180))} ry="160"
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none"
          transform={`rotate(${deg}, 210, 210)`}
        />
      ))}

      {/* Major land masses — simplified outlines */}
      {/* Europe/Africa blob */}
      <ellipse cx="215" cy="200" rx="28" ry="38" fill="rgba(196,31,31,0.18)" stroke="rgba(196,31,31,0.35)" strokeWidth="1"/>
      {/* Asia blob */}
      <ellipse cx="268" cy="195" rx="40" ry="30" fill="rgba(196,31,31,0.14)" stroke="rgba(196,31,31,0.28)" strokeWidth="1"/>
      {/* Americas blob */}
      <ellipse cx="148" cy="200" rx="22" ry="34" fill="rgba(196,31,31,0.10)" stroke="rgba(196,31,31,0.22)" strokeWidth="1"/>
      {/* Oceania blob */}
      <ellipse cx="300" cy="255" rx="18" ry="12" fill="rgba(196,31,31,0.10)" stroke="rgba(196,31,31,0.22)" strokeWidth="1"/>

      {/* Connection lines from center to regions */}
      {[
        { x2: 240, y2: 120, opacity: 0.3 }, // UK
        { x2: 290, y2: 210, opacity: 0.25 }, // UAE
        { x2: 310, y2: 220, opacity: 0.25 }, // BD
        { x2: 220, y2: 240, opacity: 0.2 },  // Nigeria
        { x2: 320, y2: 245, opacity: 0.2 },  // Malaysia
        { x2: 300, y2: 195, opacity: 0.25 }, // Pakistan
      ].map((l, i) => (
        <line key={i} x1="210" y1="210" x2={l.x2} y2={l.y2}
          stroke={`rgba(196,31,31,${l.opacity})`} strokeWidth="1" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="14" dur={`${2 + i * 0.5}s`} repeatCount="indefinite"/>
        </line>
      ))}

      {/* Region dots */}
      {[
        { cx: 240, cy: 120 }, { cx: 290, cy: 210 }, { cx: 310, cy: 220 },
        { cx: 220, cy: 240 }, { cx: 320, cy: 245 }, { cx: 300, cy: 195 },
      ].map((d, i) => (
        <g key={i}>
          <circle cx={d.cx} cy={d.cy} r="8" fill="rgba(196,31,31,0.15)" stroke="rgba(196,31,31,0.5)" strokeWidth="1">
            <animate attributeName="r" values="8;11;8" dur={`${2 + i * 0.4}s`} repeatCount="indefinite"/>
          </circle>
          <circle cx={d.cx} cy={d.cy} r="4" fill="rgba(196,31,31,0.9)"/>
        </g>
      ))}

      {/* Centre dot (Cambridge) */}
      <circle cx="210" cy="210" r="10" fill="rgba(196,31,31,0.2)" stroke="rgba(196,31,31,0.6)" strokeWidth="1.5">
        <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="210" cy="210" r="5" fill="#C41F1F"/>
    </svg>
  );
}

export default function International() {
  const regionRefs = useRef<HTMLDivElement[]>([]);
  const perkRefs = useRef<HTMLLIElement[]>([]);

  useEffect(() => {
    [...regionRefs.current, ...perkRefs.current].forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add(styles.itemVisible), i * 80);
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
    });
  }, []);

  return (
    <section className={styles.section} id="international" aria-labelledby="international-headline">
      <div className="container">
        <div className={styles.inner}>
          {/* Left: globe + region chips */}
          <div className={styles.globeCol}>
            <div className={styles.globeWrap} aria-hidden="true">
              <GlobeSVG />

              {/* Floating region chips overlaid on globe */}
              {regions.map((r, i) => (
                <div
                  key={r.name}
                  className={styles.regionChip}
                  ref={(el) => { if (el) regionRefs.current[i] = el; }}
                  style={{ top: r.top, left: r.left }}
                >
                  <span className={styles.regionFlag}>{r.flag}</span>
                  <div>
                    <p className={styles.regionName}>{r.name}</p>
                    <p className={styles.regionTz}>{r.timezone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: copy */}
          <div className={styles.contentCol}>
            <span className="section-label">Global Access</span>
            <h2 id="international-headline" className={styles.headline}>
              Study from
              <br />
              <span className={styles.accent}>anywhere</span>
              <br />
              in the world.
            </h2>

            <ul className={styles.perkList} role="list">
              {perks.map((p, i) => (
                <li
                  key={p.text}
                  className={styles.perkItem}
                  ref={(el) => { if (el) perkRefs.current[i] = el; }}
                >
                  <div className={styles.perkIcon}>
                    <i className={`ti ${p.icon}`} aria-hidden="true" />
                  </div>
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>

            {/* Region flag strip */}
            <div className={styles.flagStrip}>
              {regions.map((r) => (
                <span key={r.name} className={styles.flagItem} title={r.label}>
                  <span className={styles.flagEmoji}>{r.flag}</span>
                  <span className={styles.flagName}>{r.name}</span>
                </span>
              ))}
            </div>

            <a href="#signup" className="btn btn-primary" id="intl-cta">
              <i className="ti ti-world" aria-hidden="true" />
              Join from Anywhere
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
