"use client";

import { useEffect, useRef } from "react";
import styles from "./AISection.module.css";

export default function AISection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add(styles.visible); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="ai" aria-labelledby="ai-headline">
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        {/* Left: very short copy */}
        <div className={styles.content}>
          <span className="section-label" style={{ color: "var(--red-200)" }}>AI-Powered</span>

          <h2 id="ai-headline" className={styles.headline}>
            Your 24/7<br />
            <span className={styles.accent}>biology tutor</span>
          </h2>

          <p className={styles.sub}>
            CAIE-aligned AI that speaks exam language.
          </p>

          {/* 3 feature pills — no paragraphs */}
          <div className={styles.pillRow}>
            {["Q&A on any topic", "Lecture summaries", "Quiz generator", "Smart search"].map((p) => (
              <span key={p} className={styles.featurePill}>
                <i className="ti ti-check" aria-hidden="true" />
                {p}
              </span>
            ))}
          </div>

          <a href="#signup" className="btn btn-ghost btn-lg" id="ai-cta" style={{ marginTop: "8px" }}>
            <i className="ti ti-sparkles" aria-hidden="true" />
            Try Free
          </a>
        </div>

        {/* Right: Chat UI */}
        <div className={styles.chatDemo} aria-hidden="true">
          <div className={styles.chatHeader}>
            <div className={styles.chatBadge}>
              <i className="ti ti-sparkles" />
              <span>CAIE-BIOLOGY AI</span>
            </div>
            <div className={styles.chatDots}>
              <span /><span /><span />
            </div>
          </div>

          <div className={styles.chatMessages}>
            <div className={`${styles.chatMsg} ${styles.chatMsgUser}`}>
              <p>Explain ATP synthase in oxidative phosphorylation</p>
            </div>

            <div className={`${styles.chatMsg} ${styles.chatMsgAI}`}>
              <p>
                ATP synthase (Complex V) uses the <span className={styles.highlight}>proton gradient</span> from
                the electron transport chain to synthesise ATP via chemiosmosis.
              </p>
              <div className={styles.chatMsgMeta}>
                <i className="ti ti-check" /> CAIE A-Level · Unit 7
              </div>
            </div>

            <div className={`${styles.chatMsg} ${styles.chatMsgUser}`}>
              <p>Generate a quiz on this?</p>
            </div>

            <div className={styles.chatTyping}>
              <span /><span /><span />
            </div>
          </div>

          <div className={styles.chatInput}>
            <span className={styles.chatPlaceholder}>Ask anything...</span>
            <button className={styles.chatSend} aria-label="Send">
              <i className="ti ti-send" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
