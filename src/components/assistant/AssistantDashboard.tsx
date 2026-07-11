"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ASSISTANT_EMAIL_DOMAIN, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { adminSections } from "@/lib/adminNav";
import styles from "../admin/AdminDashboard.module.css";

const assistantSections = adminSections.filter((s) => s.slug !== "assistants");

export default function AssistantDashboard() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const email = getFirebaseAuth().currentUser?.email;
    if (email?.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`)) {
      setUsername(email.split("@")[0]);
    }
  }, []);

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Welcome{username ? `, ${username}` : ""}
          </h1>
          <p className={styles.pageSubtitle}>
            Here&apos;s everything you can manage as a teaching assistant.
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="sections-title">
        <div className={styles.panelHeader}>
          <h2 id="sections-title" className={styles.panelTitle}>Your Sections</h2>
        </div>
        <div className={styles.quickGrid}>
          {assistantSections.map((s) => (
            <Link key={s.slug} href={`/assistant/${s.slug}`} className={styles.quickLink}>
              <i className={`ti ${s.icon}`} aria-hidden="true" />
              <span>{s.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
