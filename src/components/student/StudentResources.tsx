"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { useStudent } from "./StudentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentPortal.module.css";

/** Resources are authored in the (upcoming) admin Resources section — read tolerantly. */
type ResourceRecord = {
  id: string;
  title?: string;
  name?: string;
  class?: string;
  type?: string;
  description?: string;
  link?: string;
  url?: string;
};

const typeIcons: Record<string, string> = {
  pdf: "ti-file-type-pdf",
  video: "ti-video",
  notes: "ti-notes",
  link: "ti-link",
};

export default function StudentResources() {
  const student = useStudent();
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(
      collection(getFirebaseDb(), "Resources"),
      (snap) => {
        setResources(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResourceRecord, "id">) }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  // Resources without a class are shared with everyone
  const visible = resources.filter((r) => !r.class || r.class === student.class);

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Resources</h1>
          <p className={adminStyles.pageSubtitle}>
            Notes, PDFs, videos, and study material shared for Class {student.class}.
          </p>
        </div>
      </header>

      <section className={adminStyles.panel} aria-labelledby="resources-title">
        <div className={adminStyles.panelHeader}>
          <h2 id="resources-title" className={adminStyles.panelTitle}>Study Material</h2>
          <span className="badge badge-default">{visible.length}</span>
        </div>

        {loading ? (
          <p className={styles.emptyText}>Loading resources…</p>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-books" aria-hidden="true" />
            <p className={styles.emptyText}>
              No resources shared yet — notes and study material for your class will show up here.
            </p>
          </div>
        ) : (
          <ul className={styles.itemList} role="list">
            {visible.map((r) => {
              const href = r.link || r.url;
              const icon = typeIcons[(r.type ?? "").toLowerCase()] ?? "ti-file-text";
              const body = (
                <>
                  <div className={styles.itemIcon} aria-hidden="true">
                    <i className={`ti ${icon}`} />
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{r.title || r.name || "Untitled resource"}</div>
                    <div className={styles.itemMeta}>
                      {[r.type, r.description].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {href && (
                    <div className={styles.itemAside}>
                      <span className={styles.itemDate}>
                        Open <i className="ti ti-external-link" aria-hidden="true" />
                      </span>
                    </div>
                  )}
                </>
              );
              return (
                <li key={r.id}>
                  {href ? (
                    <a
                      className={styles.item}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className={styles.item}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
