"use client";

import { useEffect, useRef } from "react";
import styles from "./ParentsCorner.module.css";

const features = [
  {
    icon: "ti-chart-line",
    title: "Live Progress Reports",
    desc: "Weekly grade snapshots & attendance — at a glance.",
    svgColor: "#43A047",
  },
  {
    icon: "ti-message-circle",
    title: "Direct Messaging",
    desc: "Reach the instructor anytime through the parent portal.",
    svgColor: "#1976D2",
  },
  {
    icon: "ti-bell",
    title: "Instant Alerts",
    desc: "Missed class, low score, or assignment due — you're notified first.",
    svgColor: "#F57C00",
  },
  {
    icon: "ti-lock",
    title: "Safe & Private",
    desc: "GDPR compliant. No third-party data sharing. Ever.",
    svgColor: "#A51212",
  },
];

function PhoneMockup() {
  return (
    <svg viewBox="0 0 240 460" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "100%", height: "auto" }}>
      {/* Phone frame */}
      <rect x="10" y="10" width="220" height="440" rx="32" fill="#0A0A0A" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
      <rect x="18" y="18" width="204" height="424" rx="26" fill="#111111"/>
      {/* Notch */}
      <rect x="88" y="22" width="64" height="20" rx="10" fill="#0A0A0A"/>
      {/* Screen */}
      <rect x="18" y="48" width="204" height="388" rx="2" fill="#F5F2EE"/>

      {/* Status bar */}
      <rect x="18" y="48" width="204" height="28" fill="#0A0A0A"/>
      <text x="32" y="67" fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="system-ui">9:41</text>
      <text x="185" y="67" fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="system-ui">100%</text>

      {/* App header */}
      <rect x="18" y="76" width="204" height="44" fill="#0A0A0A"/>
      <text x="120" y="102" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="system-ui">Parent Portal</text>
      <circle cx="200" cy="98" r="12" fill="#A51212"/>
      <text x="200" y="102" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="system-ui">PK</text>

      {/* Greeting */}
      <text x="32" y="142" fontSize="11" fill="#0A0A0A" fontWeight="600" fontFamily="system-ui">Hello, Mrs. Khan 👋</text>
      <text x="32" y="158" fontSize="9" fill="#767676" fontFamily="system-ui">Your child&apos;s weekly summary</text>

      {/* Grade card */}
      <rect x="26" y="168" width="188" height="68" rx="10" fill="#0A0A0A" stroke="rgba(196,31,31,0.3)" strokeWidth="1"/>
      <text x="40" y="189" fontSize="9" fill="rgba(255,255,255,0.4)" letterSpacing="1" fontFamily="system-ui">OVERALL GRADE</text>
      <text x="40" y="215" fontSize="28" fontWeight="800" fill="white" fontFamily="system-ui">A</text>
      <text x="68" y="215" fontSize="14" fill="#D94040" fontFamily="system-ui">+</text>
      <text x="160" y="189" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">Rank</text>
      <text x="160" y="210" fontSize="18" fontWeight="700" fill="white" fontFamily="system-ui">#3</text>
      <text x="160" y="225" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="system-ui">of 18</text>

      {/* Attendance */}
      <text x="32" y="256" fontSize="10" fill="#444444" fontWeight="600" fontFamily="system-ui">Attendance this month</text>
      <rect x="32" y="263" width="172" height="8" rx="4" fill="#E0E0E0"/>
      <rect x="32" y="263" width="155" height="8" rx="4" fill="#43A047">
        <animate attributeName="width" from="0" to="155" dur="1.5s" fill="freeze"/>
      </rect>
      <text x="208" y="271" fontSize="8" fill="#43A047" fontWeight="600" fontFamily="system-ui">90%</text>

      {/* Notification alerts */}
      {[
        { icon: "✅", msg: "Quiz submitted — 18/20", t: "2h ago", color: "#E8F5E9", border: "#C8E6C9" },
        { icon: "⏰", msg: "Class tomorrow at 4:00 PM", t: "1d ago", color: "#FFFBF0", border: "#FDE68A" },
      ].map((n, i) => (
        <g key={i}>
          <rect x="26" y={290 + i * 52} width="188" height="44" rx="8" fill={n.color} stroke={n.border} strokeWidth="1"/>
          <text x="40" y={311 + i * 52} fontSize="11" fontFamily="system-ui">{n.icon}</text>
          <text x="58" y={309 + i * 52} fontSize="9" fontWeight="500" fill="#0A0A0A" fontFamily="system-ui">{n.msg}</text>
          <text x="58" y={323 + i * 52} fontSize="8" fill="#767676" fontFamily="system-ui">{n.t}</text>
        </g>
      ))}

      {/* Message button */}
      <rect x="26" y="402" width="188" height="32" rx="8" fill="#0A0A0A"/>
      <text x="120" y="422" textAnchor="middle" fontSize="11" fontWeight="600" fill="white" fontFamily="system-ui">💬  Message Instructor</text>

      {/* Bottom home indicator */}
      <rect x="100" y="442" width="40" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
    </svg>
  );
}

export default function ParentsCorner() {
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add(styles.cardVisible), i * 90);
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
    });
  }, []);

  return (
    <section className={styles.section} id="parents" aria-labelledby="parents-headline">
      <div className="container">
        <div className={styles.inner}>
          {/* Left: text + feature grid */}
          <div className={styles.contentCol}>
            <span className="section-label">For Parents</span>
            <h2 id="parents-headline" className={styles.headline}>
              Always in the
              <br />
              <span className={styles.accent}>loop.</span>
            </h2>

            <p className={styles.sub}>
              Full visibility into your child&apos;s biology journey — from your phone.
            </p>

            <div className={styles.featureGrid}>
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className={styles.featureCard}
                  ref={(el) => { if (el) cardRefs.current[i] = el; }}
                >
                  <div className={styles.featureIcon} style={{ background: `${f.svgColor}18`, borderColor: `${f.svgColor}30` }}>
                    <i className={`ti ${f.icon}`} aria-hidden="true" style={{ color: f.svgColor }} />
                  </div>
                  <div>
                    <p className={styles.featureTitle}>{f.title}</p>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a href="#signup" className="btn btn-primary" id="parents-cta">
              <i className="ti ti-users" aria-hidden="true" />
              Create Parent Account
            </a>
          </div>

          {/* Right: phone mockup */}
          <div className={styles.phoneCol} aria-hidden="true">
            <div className={styles.phoneWrap}>
              <div className={styles.phoneGlow} />
              <PhoneMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
