"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./CTASection.module.css";

export default function CTASection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add(styles.visible); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.section} aria-labelledby="cta-headline">
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        {/* Short copy */}
        <div className={styles.content}>
          <span className="section-label" style={{ color: "var(--red-200)" }}>Start today</span>
          <h2 id="cta-headline" className={styles.headline}>
            Biology excellence<br />
            <span className={styles.accent}>starts here.</span>
          </h2>
          <div className={styles.actions}>
            <Link href="/signup" className="btn btn-primary btn-lg" id="cta-student">
              <i className="ti ti-books" aria-hidden="true" />
              Join as Student
            </Link>
          </div>
          <p className={styles.footnote}>
            <i className="ti ti-shield-check" aria-hidden="true" />
            Free to start · No credit card
          </p>
        </div>

        {/* Visual: 3-card stack */}
        <div className={styles.cardStack} aria-hidden="true">
          <div className={`${styles.stackCard} ${styles.stackCardA}`}>
            <i className="ti ti-certificate" />
            <div>
              <p className={styles.stackVal}>98%</p>
              <p className={styles.stackLabel}>Pass Rate</p>
            </div>
          </div>
          <div className={`${styles.stackCard} ${styles.stackCardB}`}>
            <i className="ti ti-users" />
            <div>
              <p className={styles.stackVal}>2,400+</p>
              <p className={styles.stackLabel}>Students</p>
            </div>
          </div>
          <div className={`${styles.stackCard} ${styles.stackCardC}`}>
            <i className="ti ti-star" />
            <div>
              <p className={styles.stackVal}>4.9/5</p>
              <p className={styles.stackLabel}>Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
