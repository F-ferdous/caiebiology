"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import styles from "./Batches.module.css";

type Batch = {
  id: string;
  class: string;
  time: string;
  location: string;
  details: string;
  seats: number;
  classType: string;
  createdAt: Timestamp | null;
};

const classTypeConfig: Record<string, { color: string; bg: string; border: string }> = {
  Online: { color: "#2E7D32", bg: "#E8F5E9", border: "#C8E6C9" },
  "Offline(Physical)": { color: "#92400E", bg: "#FFFBF0", border: "#FDE68A" },
  Hybrid: { color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
};

const fallbackType = { color: "#374151", bg: "#F3F4F6", border: "#E5E7EB" };

function BatchCard({ batch, index }: { batch: Batch; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add(styles.cardVisible), (index % 4) * 100);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [index]);

  const type = classTypeConfig[batch.classType] ?? fallbackType;

  return (
    <div className={styles.card} ref={ref}>
      {/* Top row */}
      <div className={styles.cardTop}>
        <span className={styles.levelBadge}>Class {batch.class}</span>
        <span
          className={styles.statusBadge}
          style={{ color: type.color, background: type.bg, borderColor: type.border }}
        >
          {batch.classType === "Online" && <span className={styles.openDot} />}
          {batch.classType || "TBA"}
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
              fill={col === index % 5 && row === 0 ? "rgba(196,31,31,0.7)" : "rgba(0,0,0,0.06)"}
            />
          )))}
        </svg>
      </div>

      <h3 className={styles.cardName}>Class {batch.class} — Biology</h3>
      <p className={styles.cardTime}>
        <i className="ti ti-clock" aria-hidden="true" />
        {batch.time}
      </p>
      <p className={styles.cardStart}>
        <i className="ti ti-map-pin" aria-hidden="true" />
        {batch.location}
      </p>

      {batch.details && <p className={styles.cardDetails}>{batch.details}</p>}

      <p className={styles.seatsLine}>
        <i className="ti ti-users" aria-hidden="true" />
        {batch.seats} seats
      </p>

      {/* CTA */}
      <Link href="/signup" className={`btn btn-primary ${styles.cardBtn}`} id={`batch-cta-${index}`}>
        <i className="ti ti-user-plus" aria-hidden="true" />
        Enrol Now
      </Link>
    </div>
  );
}

export default function Batches({ showAll = false }: { showAll?: boolean }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Batch, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  const visible = showAll ? batches : batches.slice(0, 4);

  return (
    <section
      className={`${styles.section} ${showAll ? styles.standalone : ""}`}
      id="batches"
      aria-labelledby="batches-headline"
    >
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className="section-label">Enrol Now</span>
            <h2 id="batches-headline" className={styles.title}>
              {showAll ? <>All <span className={styles.accent}>Batches</span></> : <>Current <span className={styles.accent}>Batches</span></>}
            </h2>
          </div>
          <p className={styles.sub}>Small groups. Real results.</p>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading batches…</p>
        ) : visible.length === 0 ? (
          <p className={styles.emptyState}>
            No batches are open right now — new batches are announced here first. Check back soon.
          </p>
        ) : (
          <div className={styles.grid}>
            {visible.map((batch, i) => (
              <BatchCard key={batch.id} batch={batch} index={i} />
            ))}
          </div>
        )}

        {!showAll && !loading && batches.length > 4 && (
          <div className={styles.viewAllRow}>
            <Link href="/batches" className="btn btn-secondary btn-lg">
              View All Batches
              <i className="ti ti-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
