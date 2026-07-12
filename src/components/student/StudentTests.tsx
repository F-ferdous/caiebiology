"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { useStudent } from "./StudentShell";
import {
  type TestRecord,
  formatDate,
  isUpcoming,
  testSyllabus,
  testTitle,
  toJsDate,
} from "./studentData";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentPortal.module.css";

function TestList({ tests, emptyText }: { tests: TestRecord[]; emptyText: string }) {
  if (tests.length === 0) {
    return (
      <div className={styles.empty}>
        <i className="ti ti-clipboard-check" aria-hidden="true" />
        <p className={styles.emptyText}>{emptyText}</p>
      </div>
    );
  }
  return (
    <ul className={styles.itemList} role="list">
      {tests.map((t) => (
        <li key={t.id} className={styles.item}>
          <div className={styles.itemIcon} aria-hidden="true">
            <i className="ti ti-clipboard-check" />
          </div>
          <div className={styles.itemBody}>
            <div className={styles.itemTitle}>{testTitle(t)}</div>
            <div className={styles.itemMeta}>
              {[t.type, testSyllabus(t), t.totalMarks != null ? `${t.totalMarks} marks` : ""]
                .filter(Boolean)
                .join(" · ") || "Details to follow"}
            </div>
          </div>
          <div className={styles.itemAside}>
            <span className={styles.itemDate}>
              <i className="ti ti-calendar-event" aria-hidden="true" />
              {formatDate(t.date)}
            </span>
            {t.time && <span>{t.time}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StudentTests() {
  const student = useStudent();
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(
      collection(getFirebaseDb(), "Tests"),
      (snap) => {
        setTests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TestRecord, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const classTests = tests.filter((t) => !t.class || t.class === student.class);
  const byDateAsc = (a: TestRecord, b: TestRecord) =>
    (toJsDate(a.date)?.getTime() ?? 0) - (toJsDate(b.date)?.getTime() ?? 0);

  const upcoming = classTests.filter((t) => isUpcoming(t.date)).sort(byDateAsc);
  const past = classTests.filter((t) => !isUpcoming(t.date)).sort((a, b) => byDateAsc(b, a));

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Tests &amp; Quizzes</h1>
          <p className={adminStyles.pageSubtitle}>
            Scheduled and past assessments for Class {student.class}.
          </p>
        </div>
      </header>

      <section className={adminStyles.panel} aria-labelledby="upcoming-title">
        <div className={adminStyles.panelHeader}>
          <h2 id="upcoming-title" className={adminStyles.panelTitle}>Upcoming</h2>
          <span className="badge badge-default">{upcoming.length}</span>
        </div>
        {loading ? (
          <p className={styles.emptyText}>Loading tests…</p>
        ) : (
          <TestList
            tests={upcoming}
            emptyText="No upcoming tests scheduled — you'll see them here as soon as your teacher announces one."
          />
        )}
      </section>

      <section className={adminStyles.panel} aria-labelledby="past-title">
        <div className={adminStyles.panelHeader}>
          <h2 id="past-title" className={adminStyles.panelTitle}>Past Tests</h2>
          <span className="badge badge-default">{past.length}</span>
        </div>
        {loading ? (
          <p className={styles.emptyText}>Loading tests…</p>
        ) : (
          <TestList tests={past} emptyText="No past tests yet." />
        )}
      </section>
    </div>
  );
}
