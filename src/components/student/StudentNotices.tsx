"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  notificationAudience,
  notificationMatchesStudent,
  notifyTypeMeta,
  type NotifyRecord,
} from "@/lib/notify";
import { useStudent } from "./StudentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentPortal.module.css";

function formatWhen(ts: Timestamp | null) {
  if (!ts) return "";
  return ts.toDate().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentNotices() {
  const student = useStudent();
  const [notices, setNotices] = useState<NotifyRecord[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Notifications"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        setNotices(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotifyRecord, "id">) }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const visible = notices.filter((n) =>
    notificationMatchesStudent(n, {
      id: student.id,
      class: student.class,
      batchId: student.batchId,
    })
  );

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Notices</h1>
          <p className={adminStyles.pageSubtitle}>
            Announcements, new resources, tests, and results from your teacher.
          </p>
        </div>
      </header>

      <section className={adminStyles.panel} aria-labelledby="notices-title">
        <div className={adminStyles.panelHeader}>
          <h2 id="notices-title" className={adminStyles.panelTitle}>All Notices</h2>
        </div>

        {loading ? (
          <div className={styles.empty}>
            <i className="ti ti-loader" aria-hidden="true" />
            <p className={styles.emptyText}>Loading notices…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-bell" aria-hidden="true" />
            <p className={styles.emptyText}>
              No notices yet — announcements, resources, tests, and results from your teacher will
              appear here.
            </p>
          </div>
        ) : (
          <ul className={styles.itemList} role="list">
            {visible.map((n) => {
              const meta = notifyTypeMeta(n.type);
              return (
                <li key={n.id} className={styles.item}>
                  <div className={styles.itemIcon} aria-hidden="true">
                    <i className={`ti ${meta.icon}`} />
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>
                      <Link href={n.url || meta.url} className={styles.itemLink}>
                        {n.title}
                      </Link>
                    </div>
                    <div className={styles.itemMeta} style={{ whiteSpace: "pre-wrap" }}>
                      {n.body}
                    </div>
                  </div>
                  <div className={styles.itemAside}>
                    <span className={styles.itemDate}>
                      <i className="ti ti-clock" aria-hidden="true" />
                      {formatWhen(n.createdAt)}
                    </span>
                    <span>{meta.label} · {notificationAudience(n)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
