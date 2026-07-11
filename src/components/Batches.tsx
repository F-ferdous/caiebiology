"use client";

import { useEffect, useRef } from "react";
import styles from "./Batches.module.css";

const batches = [
  {
    name: "AS Level — Batch A",
    time: "Sat & Mon · 4:00 PM",
    seats: 18,
    filled: 15,
    level: "AS Level",
    topics: ["Cell Biology", "Biological Molecules", "Enzymes"],
    status: "filling",
    startDate: "Jul 5, 2026",
  },
  {
    name: "A2 Level — Batch B",
    time: "Sun & Tue · 6:00 PM",
    seats: 20,
    filled: 20,
    level: "A2 Level",
    topics: ["Genetics", "Respiration", "Ecology"],
    status: "full",
    startDate: "Jul 6, 2026",
  },
  {
    name: "IGCSE — Batch C",
    time: "Wed & Fri · 5:00 PM",
    seats: 24,
    filled: 11,
    level: "IGCSE",
    topics: ["Cell Structure", "Nutrition", "Transport"],
    status: "open",
    startDate: "Jul 9, 2026",
  },
  {
    name: "Crash Course — Exam Prep",
    time: "Daily · 7:00 AM",
    seats: 30,
    filled: 8,
    level: "All Levels",
    topics: ["Past Papers", "Mark Schemes", "Exam Technique"],
    status: "open",
    startDate: "Aug 1, 2026",
  },
];

const statusConfig = {
  open: { label: "Open", color: "#2E7D32", bg: "#E8F5E9", border: "#C8E6C9" },
  filling: { label: "Filling Fast", color: "#92400E", bg: "#FFFBF0", border: "#FDE68A" },
  full: { label: "Full", color: "#7E0B0B", bg: "#FBE8E8", border: "#F4B3B3" },
};

function SeatBar({ filled, seats }: { filled: number; seats: number }) {
  const pct = Math.round((filled / seats) * 100);
  const color = pct >= 100 ? "#A51212" : pct >= 70 ? "#F57C00" : "#43A047";
  return (
    <div className={styles.seatBar}>
      <div className={styles.seatTrack}>
        <div className={styles.seatFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.seatText}>{filled}/{seats} seats</span>
    </div>
  );
}

export default function Batches() {
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add(styles.cardVisible), i * 100);
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
    });
  }, []);

  return (
    <section className={styles.section} id="batches" aria-labelledby="batches-headline">
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className="section-label">Enrol Now</span>
            <h2 id="batches-headline" className={styles.title}>
              Current <span className={styles.accent}>Batches</span>
            </h2>
          </div>
          <p className={styles.sub}>Small groups. Real results.</p>
        </div>

        {/* Batch grid */}
        <div className={styles.grid}>
          {batches.map((batch, i) => {
            const status = statusConfig[batch.status as keyof typeof statusConfig];
            return (
              <div
                key={batch.name}
                className={styles.card}
                ref={(el) => { if (el) cardRefs.current[i] = el; }}
              >
                {/* Top row */}
                <div className={styles.cardTop}>
                  {/* Level badge */}
                  <span className={styles.levelBadge}>{batch.level}</span>
                  {/* Status badge */}
                  <span
                    className={styles.statusBadge}
                    style={{ color: status.color, background: status.bg, borderColor: status.border }}
                  >
                    {batch.status === "open" && <span className={styles.openDot} />}
                    {status.label}
                  </span>
                </div>

                {/* SVG schedule icon */}
                <div className={styles.scheduleIcon} aria-hidden="true">
                  <svg viewBox="0 0 56 56" fill="none" width="56" height="56">
                    <rect x="4" y="8" width="48" height="42" rx="8" fill="rgba(196,31,31,0.08)" stroke="rgba(196,31,31,0.2)" strokeWidth="1.5"/>
                    <rect x="4" y="8" width="48" height="14" rx="8" fill="rgba(196,31,31,0.15)"/>
                    <rect x="4" y="16" width="48" height="6" fill="rgba(196,31,31,0.15)"/>
                    <circle cx="18" cy="6" r="4" fill="var(--red-400)" stroke="white" strokeWidth="1.5"/>
                    <circle cx="38" cy="6" r="4" fill="var(--red-400)" stroke="white" strokeWidth="1.5"/>
                    {[0,1,2,3,4].map(col => [0,1,2].map(row => (
                      <rect key={`${col}-${row}`}
                        x={10 + col * 9} y={30 + row * 7}
                        width="6" height="5" rx="1"
                        fill={col === i % 5 && row === 0 ? "rgba(196,31,31,0.7)" : "rgba(0,0,0,0.06)"}
                      />
                    )))}
                  </svg>
                </div>

                <h3 className={styles.cardName}>{batch.name}</h3>
                <p className={styles.cardTime}>
                  <i className="ti ti-clock" aria-hidden="true" />
                  {batch.time}
                </p>
                <p className={styles.cardStart}>
                  <i className="ti ti-calendar-event" aria-hidden="true" />
                  Starts {batch.startDate}
                </p>

                {/* Topics */}
                <div className={styles.topics}>
                  {batch.topics.map((t) => (
                    <span key={t} className={styles.topic}>{t}</span>
                  ))}
                </div>

                {/* Seat bar */}
                <SeatBar filled={batch.filled} seats={batch.seats} />

                {/* CTA */}
                <a
                  href="#signup"
                  className={`btn ${batch.status === "full" ? styles.btnFull : "btn-primary"} ${styles.cardBtn}`}
                  id={`batch-cta-${i}`}
                  aria-disabled={batch.status === "full"}
                >
                  {batch.status === "full" ? (
                    <>
                      <i className="ti ti-clock" aria-hidden="true" />
                      Join Waitlist
                    </>
                  ) : (
                    <>
                      <i className="ti ti-user-plus" aria-hidden="true" />
                      Enrol Now
                    </>
                  )}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
