"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { useStudent } from "./StudentShell";
import InstallGuide from "../pwa/InstallGuide";
import {
  type BatchRecord,
  type PaymentRecord,
  type TestRecord,
  formatDate,
  isUpcoming,
  testSyllabus,
  testTitle,
  toJsDate,
} from "./studentData";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentPortal.module.css";

function firstName(name: string) {
  return name.split(" ")[0] || name;
}

export default function StudentDashboard() {
  const student = useStudent();
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Batch details for the student's enrolled batch
  useEffect(() => {
    if (!isFirebaseConfigured || !student.batchId) return;
    getDoc(doc(getFirebaseDb(), "Batches", student.batchId))
      .then((snap) => {
        if (snap.exists()) setBatch({ id: snap.id, ...(snap.data() as Omit<BatchRecord, "id">) });
      })
      .catch(() => setBatch(null));
  }, [student.batchId]);

  // Tests for the student's class — small collection, filtered client-side
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(collection(getFirebaseDb(), "Tests"), (snap) => {
      setTests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TestRecord, "id">) })));
    });
  }, []);

  // Payment records for this student
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Payments"), where("studentId", "==", student.id));
    return onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentRecord, "id">) })));
    });
  }, [student.id]);

  const upcomingTests = tests
    .filter((t) => (!t.class || t.class === student.class) && isUpcoming(t.date))
    .sort((a, b) => (toJsDate(a.date)?.getTime() ?? 0) - (toJsDate(b.date)?.getTime() ?? 0));

  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        (toJsDate(b.date)?.getTime() ?? b.createdAt?.toMillis() ?? 0) -
        (toJsDate(a.date)?.getTime() ?? a.createdAt?.toMillis() ?? 0)
    )
    .slice(0, 4);

  const stats = [
    { icon: "ti-school", label: "Class", value: student.class ? `Class ${student.class}` : "—" },
    { icon: "ti-clock", label: "Batch Time", value: batch?.time ?? student.batchLabel ?? "—" },
    { icon: "ti-map-pin", label: "Location", value: batch?.location ?? "—" },
    { icon: "ti-device-laptop", label: "Class Type", value: batch?.classType ?? "—" },
  ];

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Welcome back, {firstName(student.name)}</h1>
          <p className={adminStyles.pageSubtitle}>
            Here&apos;s an overview of your batch, payments, and upcoming tests.
          </p>
        </div>
        <span className="badge badge-black">Class {student.class}</span>
      </header>

      <InstallGuide
        owner={{
          role: "student",
          studentId: student.id,
          class: student.class,
          batchId: student.batchId,
          name: student.name,
        }}
      />

      {/* ---- Class & batch at a glance ---- */}
      <div className={adminStyles.statGrid}>
        {stats.map((s) => (
          <div key={s.label} className={adminStyles.statCard}>
            <div className={adminStyles.statIcon} aria-hidden="true">
              <i className={`ti ${s.icon}`} />
            </div>
            <div>
              <div className={adminStyles.statValue}>{s.value}</div>
              <div className={adminStyles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={adminStyles.panels}>
        {/* ---- Left column ---- */}
        <div className={styles.panelColumn}>
          <section className={adminStyles.panel} aria-labelledby="upcoming-tests-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="upcoming-tests-title" className={adminStyles.panelTitle}>
                Upcoming Tests
              </h2>
              <Link href="/student/tests" className={adminStyles.panelAction}>
                View all <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            {upcomingTests.length === 0 ? (
              <div className={styles.empty}>
                <i className="ti ti-clipboard-check" aria-hidden="true" />
                <p className={styles.emptyText}>
                  No upcoming tests scheduled — you&apos;ll see them here as soon as your teacher
                  announces one.
                </p>
              </div>
            ) : (
              <ul className={styles.itemList} role="list">
                {upcomingTests.slice(0, 4).map((t) => (
                  <li key={t.id} className={styles.item}>
                    <div className={styles.itemIcon} aria-hidden="true">
                      <i className="ti ti-clipboard-check" />
                    </div>
                    <div className={styles.itemBody}>
                      <div className={styles.itemTitle}>{testTitle(t)}</div>
                      <div className={styles.itemMeta}>
                        {[t.type, testSyllabus(t)].filter(Boolean).join(" · ") || "Details to follow"}
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
            )}
          </section>

          <section className={adminStyles.panel} aria-labelledby="payments-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="payments-title" className={adminStyles.panelTitle}>Payment Details</h2>
              <Link href="/student/payments" className={adminStyles.panelAction}>
                View all <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className={styles.empty}>
                <i className="ti ti-credit-card" aria-hidden="true" />
                <p className={styles.emptyText}>
                  No payment records yet — your fee history will appear here once payments are
                  logged.
                </p>
              </div>
            ) : (
              <ul className={styles.itemList} role="list">
                {recentPayments.map((p) => (
                  <li key={p.id} className={styles.item}>
                    <div className={styles.itemIcon} aria-hidden="true">
                      <i className="ti ti-credit-card" />
                    </div>
                    <div className={styles.itemBody}>
                      <div className={styles.itemTitle}>{p.month ?? "Payment"}</div>
                      <div className={styles.itemMeta}>
                        {[p.method, formatDate(p.date ?? p.createdAt)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className={styles.itemAside}>
                      {p.amount != null && <strong>৳ {p.amount.toLocaleString()}</strong>}
                      {p.status && (
                        <span
                          className={`${adminStyles.status} ${
                            p.status.toLowerCase() === "paid"
                              ? adminStyles.statusPaid
                              : p.status.toLowerCase() === "due"
                                ? adminStyles.statusDue
                                : adminStyles.statusPending
                          }`}
                        >
                          {p.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---- Right column ---- */}
        <div className={styles.panelColumn}>
          <section className={adminStyles.panel} aria-labelledby="batch-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="batch-title" className={adminStyles.panelTitle}>Batch Details</h2>
            </div>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Batch</dt>
                <dd className={styles.infoValue}>{student.batchLabel || "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Class</dt>
                <dd className={styles.infoValue}>{student.class ? `Class ${student.class}` : "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Schedule</dt>
                <dd className={styles.infoValue}>{batch?.time ?? "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Location</dt>
                <dd className={styles.infoValue}>{batch?.location ?? "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Class Type</dt>
                <dd className={styles.infoValue}>{batch?.classType ?? "—"}</dd>
              </div>
              {batch?.details && (
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Details</dt>
                  <dd className={`${styles.infoValue} ${styles.infoValueMuted}`}>{batch.details}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className={adminStyles.panel} aria-labelledby="personal-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="personal-title" className={adminStyles.panelTitle}>Personal Info</h2>
              <Link href="/student/profile" className={adminStyles.panelAction}>
                Full profile <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Name</dt>
                <dd className={styles.infoValue}>{student.name}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Email</dt>
                <dd className={styles.infoValue}>{student.email}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Mobile</dt>
                <dd className={styles.infoValue}>{student.mobile || "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>School</dt>
                <dd className={styles.infoValue}>{student.school || "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
