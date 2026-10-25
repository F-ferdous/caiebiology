"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { adminSections } from "@/lib/adminNav";
import StudentDetailsModal, { type StudentDetails } from "./StudentDetailsModal";
import InstallGuide from "../pwa/InstallGuide";
import styles from "./AdminDashboard.module.css";

// Recent-enrollment rows carry the full record so the details modal can show
// everything without a second fetch.
type RecentStudent = StudentDetails & {
  class?: string;
  batchLabel?: string;
  createdAt?: Timestamp | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

function formatDate(ts?: Timestamp | null) {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [batchCount, setBatchCount] = useState(0);
  const [assistantCount, setAssistantCount] = useState(0);
  const [feesCollected, setFeesCollected] = useState(0);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [selectedStudent, setSelectedStudent] = useState<RecentStudent | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const db = getFirebaseDb();

    const unsubs = [
      onSnapshot(collection(db, "Students"), (snap) => {
        setStudentCount(snap.size);
      }),
      onSnapshot(collection(db, "Batches"), (snap) => {
        setBatchCount(snap.size);
      }),
      onSnapshot(collection(db, "Assistants"), (snap) => {
        setAssistantCount(snap.size);
      }),
      onSnapshot(collection(db, "Payments"), (snap) => {
        setFeesCollected(
          snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0)
        );
      }),
      onSnapshot(
        query(collection(db, "Students"), orderBy("createdAt", "desc"), limit(5)),
        (snap) => {
          setRecentStudents(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecentStudent, "id">) }))
          );
          setLoading(false);
        },
        () => setLoading(false)
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const stats = [
    { icon: "ti-users", label: "Total Students", value: String(studentCount) },
    { icon: "ti-stack-2", label: "Active Batches", value: String(batchCount) },
    { icon: "ti-user-check", label: "Assistants", value: String(assistantCount) },
    { icon: "ti-credit-card", label: "Fees Collected", value: `৳ ${feesCollected.toLocaleString()}` },
  ];

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome back — here&apos;s what&apos;s happening across the platform.
          </p>
        </div>
        <Link href="/admin/students" className="btn btn-primary">
          <i className="ti ti-plus" aria-hidden="true" /> Add Student
        </Link>
      </header>

      <InstallGuide owner={{ role: "admin", name: "admin" }} />

      {/* Stat cards */}
      <div className={styles.statGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} aria-hidden="true">
              <i className={`ti ${s.icon}`} />
            </div>
            <div>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panels}>
        {/* Recent enrollments */}
        <section className={styles.panel} aria-labelledby="recent-title">
          <div className={styles.panelHeader}>
            <h2 id="recent-title" className={styles.panelTitle}>Recent Enrollments</h2>
            <Link href="/admin/students" className={styles.panelAction}>
              View all <i className="ti ti-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Batch</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>Loading…</td>
                  </tr>
                ) : recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>No students enrolled yet.</td>
                  </tr>
                ) : (
                  recentStudents.map((s) => (
                    <tr
                      key={s.id}
                      className={styles.clickableRow}
                      onClick={() => setSelectedStudent(s)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${s.name}'s details`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedStudent(s);
                        }
                      }}
                    >
                      <td>
                        <span className={styles.studentCell}>
                          <span className={styles.tableAvatar} aria-hidden="true">
                            {initials(s.name)}
                          </span>
                          {s.name}
                        </span>
                      </td>
                      <td>{s.class ? `Class ${s.class}` : "—"}</td>
                      <td>{s.batchLabel || "—"}</td>
                      <td>{formatDate(s.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions — one per admin section */}
        <section className={styles.panel} aria-labelledby="quick-title">
          <div className={styles.panelHeader}>
            <h2 id="quick-title" className={styles.panelTitle}>Quick Actions</h2>
          </div>
          <div className={styles.quickGrid}>
            {adminSections.map((s) => (
              <Link key={s.slug} href={`/admin/${s.slug}`} className={styles.quickLink}>
                <i className={`ti ${s.icon}`} aria-hidden="true" />
                <span>{s.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
