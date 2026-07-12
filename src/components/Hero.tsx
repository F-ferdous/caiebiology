"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./Hero.module.css";
import BioIllustration from "@/components/BioIllustration";

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    words.forEach((word, i) => {
      word.style.transitionDelay = `${i * 90}ms`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        word.classList.add(styles.wordVisible);
      }));
    });
  }, []);

  return (
    <section className={styles.hero} id="home" aria-labelledby="hero-headline">
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      {/* Decorative rings — matching design system inspiration */}
      <div className={styles.ring1} aria-hidden="true" />
      <div className={styles.ring2} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        {/* Left: headline + CTAs */}
        <div className={styles.left}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            <span>
              <span style={{ color: "var(--theme-dark-text)" }}>Learn. Practice. </span>
              Excel.
            </span>
          </div>

          <h1 id="hero-headline" className={styles.headline} ref={headlineRef}>
            <span data-word className={styles.word} style={{ whiteSpace: "nowrap" }}>Master Biology.</span>
            <br />
            <span data-word className={`${styles.word} ${styles.wordSmall}`}>Powered by </span>
            <span data-word className={`${styles.word} ${styles.wordAccent}`} style={{ whiteSpace: "nowrap" }}>Knowledge and AI.</span>
          </h1>

          <p className={styles.sub}>
            Biology education built for CAIE — resources, live classes &amp; AI tutoring in one place.
          </p>

          <div className={styles.ctaRow}>
            <Link href="/signup" className="btn btn-primary btn-lg" id="hero-cta-primary">
              <i className="ti ti-books" aria-hidden="true" />
              Join a Batch
            </Link>
            <Link href="/features" className={`btn btn-lg ${styles.ctaGhost}`} id="hero-cta-secondary">
              See Features
              <i className="ti ti-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          {/* Compact pill badges — from design system inspiration */}
          <div className={styles.pills}>
            {["Biology · EdTech", "Teacher + Student", "AI-Powered", "CAIE Aligned"].map((p) => (
              <span key={p} className={styles.pill}>{p}</span>
            ))}
          </div>
        </div>

        {/* Right: animated SVG illustration */}
        <div className={styles.right} aria-hidden="true">
          <BioIllustration />
        </div>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
