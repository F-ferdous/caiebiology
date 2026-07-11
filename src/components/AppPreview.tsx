"use client";

import { useEffect, useRef } from "react";
import styles from "./AppPreview.module.css";

/* Inline SVG dashboard mockup */
function DashboardMock() {
  return (
    <svg viewBox="0 0 900 540" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "100%", height: "auto" }}>
      <defs>
        <clipPath id="screenClip">
          <rect x="0" y="0" width="900" height="540" rx="14"/>
        </clipPath>
      </defs>

      {/* Window frame */}
      <rect x="0" y="0" width="900" height="540" rx="14" fill="#111111" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>

      {/* Title bar */}
      <rect x="0" y="0" width="900" height="38" rx="14" fill="#0A0A0A"/>
      <rect x="0" y="24" width="900" height="14" fill="#0A0A0A"/>
      <circle cx="18" cy="19" r="6" fill="#FF5F57"/>
      <circle cx="36" cy="19" r="6" fill="#FFBD2E"/>
      <circle cx="54" cy="19" r="6" fill="#28C840"/>
      <rect x="320" y="10" width="260" height="18" rx="9" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="450" y="23" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)" fontFamily="system-ui">caiebiology.app/dashboard</text>

      {/* Nav bar */}
      <rect x="0" y="38" width="900" height="46" fill="#0F0F0F" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <rect x="24" y="49" width="24" height="24" rx="6" fill="#D94040"/>
      <path d="M30 55a3 3 0 1 0-4-4a3 3 0 0 0 4 4zm0 0l3 3a1.5 1.5 0 0 0 2-2l-3-3m-4-4l-3-3a1.5 1.5 0 1 0-2 2l3 3" stroke="white" strokeWidth="1" fill="none"/>
      <text x="56" y="66" fontSize="13" fontWeight="800" fill="white" fontFamily="system-ui">CAIE-<tspan fill="#D94040">BIOLOGY</tspan></text>
      {["Dashboard","Resources","Students","Classes","AI Tutor"].map((label, i) => (
        <g key={label}>
          <rect x={130 + i * 96} y="50" width="88" height="22" rx="6" fill={i === 0 ? "rgba(255,255,255,0.10)" : "transparent"}/>
          <text x={174 + i * 96} y="65" textAnchor="middle" fontSize="11" fill={i === 0 ? "white" : "rgba(255,255,255,0.45)"} fontFamily="system-ui">{label}</text>
        </g>
      ))}
      <circle cx="870" cy="61" r="14" fill="#A51212"/>
      <text x="870" y="65" textAnchor="middle" fontSize="10" fontWeight="600" fill="white" fontFamily="system-ui">MR</text>

      {/* Sidebar */}
      <rect x="0" y="84" width="210" height="456" fill="#0A0A0A" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {[
        { icon: "⊞", label: "Dashboard", active: true },
        { icon: "📚", label: "Resources", active: false },
        { icon: "👥", label: "Students", active: false },
        { icon: "📅", label: "Classes", active: false },
        { icon: "✦", label: "AI Tutor", active: false },
      ].map((item, i) => (
        <g key={item.label}>
          <rect x="12" y={100 + i * 40} width="186" height="30" rx="7" fill={item.active ? "rgba(255,255,255,0.08)" : "transparent"}/>
          <text x="34" y={119 + i * 40} fontSize="11" fill={item.active ? "white" : "rgba(255,255,255,0.4)"} fontFamily="system-ui">{item.icon}</text>
          <text x="52" y={119 + i * 40} fontSize="11" fill={item.active ? "white" : "rgba(255,255,255,0.4)"} fontFamily="system-ui">{item.label}</text>
        </g>
      ))}

      {/* Main content area */}
      <rect x="210" y="84" width="690" height="456" fill="#F5F2EE"/>

      {/* Page title */}
      <text x="232" y="118" fontSize="18" fontWeight="700" fill="#0A0A0A" fontFamily="system-ui">Dashboard</text>
      <text x="232" y="134" fontSize="11" fill="#767676" fontFamily="system-ui">Welcome back, Mr. Rahman</text>

      {/* Stat cards */}
      {[
        { label: "Total Students", val: "124", color: "#0A0A0A" },
        { label: "Resources", val: "48", color: "#0A0A0A" },
        { label: "Pass Rate", val: "98%", color: "#A51212" },
        { label: "Avg. Grade", val: "A−", color: "#0A0A0A" },
      ].map((s, i) => (
        <g key={s.label}>
          <rect x={232 + i * 160} y="146" width="148" height="70" rx="10" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
          <text x={240 + i * 160} y="170" fontSize="9" fill="#999999" fontFamily="system-ui" letterSpacing="1">{s.label.toUpperCase()}</text>
          <text x={240 + i * 160} y="196" fontSize="22" fontWeight="800" fill={s.color} fontFamily="system-ui">{s.val}</text>
        </g>
      ))}

      {/* Resource table */}
      <rect x="232" y="232" width="420" height="290" rx="10" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
      <text x="248" y="256" fontSize="12" fontWeight="600" fill="#0A0A0A" fontFamily="system-ui">Recent Resources</text>
      <rect x="232" y="264" width="420" height="1" fill="#E0E0E0"/>
      {["Photosynthesis Notes","Cell Division Quiz","Ecology — Unit 5","Genetics Summary"].map((name, i) => (
        <g key={name}>
          <rect x="232" y={268 + i * 56} width="420" height="55" fill={i % 2 === 0 ? "#FAFAFA" : "white"}/>
          <rect x="248" y={280 + i * 56} width="28" height="28" rx="6" fill={i % 2 === 0 ? "#FBE8E8" : "#F4F4F4"}/>
          <text x="262" textAnchor="middle" fontSize="14" fill={i % 2 === 0 ? "#A51212" : "#767676"} y={297 + i * 56} fontFamily="system-ui">{i % 2 === 0 ? "📄" : "✏"}</text>
          <text x="286" y={293 + i * 56} fontSize="12" fontWeight="500" fill="#0A0A0A" fontFamily="system-ui">{name}</text>
          <text x="286" y={308 + i * 56} fontSize="10" fill="#999999" fontFamily="system-ui">Unit {i + 2} · Class 10B</text>
          <rect x="582" y={282 + i * 56} width="52" height="20" rx="10" fill={i === 0 ? "#E8F5E9" : "#F4F4F4"} stroke={i === 0 ? "#C8E6C9" : "#E0E0E0"} strokeWidth="1"/>
          <text x="608" y={295 + i * 56} textAnchor="middle" fontSize="9" fill={i === 0 ? "#2E7D32" : "#767676"} fontFamily="system-ui">{i === 0 ? "New" : "PDF"}</text>
        </g>
      ))}

      {/* AI Card */}
      <rect x="668" y="232" width="216" height="290" rx="10" fill="#0A0A0A" stroke="rgba(196,31,31,0.30)" strokeWidth="1"/>
      <rect x="680" y="248" width="88" height="22" rx="11" fill="rgba(196,31,31,0.2)" stroke="rgba(196,31,31,0.3)" strokeWidth="1"/>
      <text x="724" y="263" textAnchor="middle" fontSize="10" fill="#E87272" fontFamily="system-ui">✦ AI Tutor</text>
      <text x="680" y="292" fontSize="14" fontWeight="700" fill="white" fontFamily="system-ui">Need help</text>
      <text x="680" y="308" fontSize="14" fontWeight="700" fill="white" fontFamily="system-ui">with biology?</text>
      <rect x="680" y="322" width="192" height="40" rx="7" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="688" y="344" fontSize="10" fill="rgba(255,255,255,0.5)" fontFamily="system-ui,monospace">Ask: "Explain ATP synthesis..."</text>
      {/* Small dots */}
      {[0,1,2].map(i => (
        <circle key={i} cx={688 + i * 14} cy={382} r="4" fill={`rgba(196,31,31,${0.4 + i*0.2})`}>
          <animate attributeName="cy" values="382;378;382" dur="1.2s" begin={`${i*0.3}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <rect x="680" y="396" width="192" height="30" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <text x="688" y="415" fontSize="10" fill="rgba(255,255,255,0.2)" fontFamily="system-ui">Ask anything...</text>
      <rect x="852" y="398" width="26" height="26" rx="5" fill="#A51212"/>
      <text x="865" y="414" textAnchor="middle" fontSize="12" fill="white" fontFamily="system-ui">➤</text>
    </svg>
  );
}

export default function AppPreview() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add(styles.visible);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className={styles.section} aria-label="Platform preview">
      <div className="container">
        <div className={styles.header}>
          <span className="section-label">Platform Preview</span>
          <h2 className={styles.title}>See it in action</h2>
        </div>

        <div ref={ref} className={styles.mockWrap}>
          <DashboardMock />

          {/* Floating label chips */}
          <div className={`${styles.chip} ${styles.chipA}`}>
            <i className="ti ti-users" aria-hidden="true" />
            <span>Student Roster</span>
          </div>
          <div className={`${styles.chip} ${styles.chipB}`}>
            <i className="ti ti-sparkles" aria-hidden="true" />
            <span>AI Tutor</span>
          </div>
          <div className={`${styles.chip} ${styles.chipC}`}>
            <i className="ti ti-chart-bar" aria-hidden="true" />
            <span>Live Analytics</span>
          </div>
        </div>
      </div>
    </section>
  );
}
