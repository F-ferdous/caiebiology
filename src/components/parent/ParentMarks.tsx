"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { useStudent } from "../student/studentContext";
import { formatDate, toJsDate } from "../student/studentData";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "../student/StudentPortal.module.css";

/** Results are authored in the (upcoming) admin Marks/Tests section — read
 *  tolerantly so field-name variants all render. */
type MarkRecord = {
  id: string;
  studentId?: string;
  title?: string;
  testTitle?: string;
  name?: string;
  type?: string;
  obtained?: number;
  marks?: number;
  score?: number;
  total?: number;
  totalMarks?: number;
  outOf?: number;
  grade?: string;
  remarks?: string;
  date?: Timestamp | string;
  createdAt?: Timestamp | null;
};

const markTitle = (m: MarkRecord) => m.title || m.testTitle || m.name || "Test result";
const obtainedOf = (m: MarkRecord) => m.obtained ?? m.marks ?? m.score;
const totalOf = (m: MarkRecord) => m.total ?? m.totalMarks ?? m.outOf;

export default function ParentMarks() {
  const child = useStudent();
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Marks"), where("studentId", "==", child.id));
    return onSnapshot(
      q,
      (snap) => {
        setMarks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MarkRecord, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [child.id]);

  const sorted = [...marks].sort(
    (a, b) =>
      (toJsDate(b.date)?.getTime() ?? b.createdAt?.toMillis() ?? 0) -
      (toJsDate(a.date)?.getTime() ?? a.createdAt?.toMillis() ?? 0)
  );

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Marks</h1>
          <p className={adminStyles.pageSubtitle}>
            Test and quiz results for {child.name}, as recorded by the teacher.
          </p>
        </div>
        <span className="badge badge-black">Class {child.class}</span>
      </header>

      <section className={adminStyles.panel} aria-labelledby="marks-title">
        <div className={adminStyles.panelHeader}>
          <h2 id="marks-title" className={adminStyles.panelTitle}>Results</h2>
          <span className="badge badge-default">{sorted.length}</span>
        </div>

        {loading ? (
          <p className={styles.emptyText}>Loading results…</p>
        ) : sorted.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-report-analytics" aria-hidden="true" />
            <p className={styles.emptyText}>
              No results published yet — test and quiz marks will appear here once the teacher
              records them.
            </p>
          </div>
        ) : (
          <ul className={styles.itemList} role="list">
            {sorted.map((m) => {
              const obtained = obtainedOf(m);
              const total = totalOf(m);
              return (
                <li key={m.id} className={styles.item}>
                  <div className={styles.itemIcon} aria-hidden="true">
                    <i className="ti ti-report-analytics" />
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{markTitle(m)}</div>
                    <div className={styles.itemMeta}>
                      {[m.type, m.remarks, formatDate(m.date ?? m.createdAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className={styles.itemAside}>
                    {obtained != null && (
                      <strong>
                        {obtained}
                        {total != null ? ` / ${total}` : ""}
                      </strong>
                    )}
                    {m.grade && <span>{m.grade}</span>}
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
