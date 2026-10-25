"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { useStudent } from "../student/studentContext";
import {
  type BatchRecord,
  type PaymentRecord,
  type TestRecord,
  formatDate,
  isUpcoming,
  testSyllabus,
  testTitle,
  toJsDate,
} from "../student/studentData";
import { computeDueEntries, currentMonthIndex, labelFromMonthIndex } from "@/lib/dues";
import { useParentKind } from "./ParentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "../student/StudentPortal.module.css";

function firstName(name: string) {
  return name.split(" ")[0] || name;
}

const parentLabel: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  guardian: "Guardian",
};

export default function ParentDashboard() {
  const child = useStudent();
  const parent = useParentKind();
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured || !child.batchId) return;
    getDoc(doc(getFirebaseDb(), "Batches", child.batchId))
      .then((snap) => {
        if (snap.exists()) setBatch({ id: snap.id, ...(snap.data() as Omit<BatchRecord, "id">) });
      })
      .catch(() => setBatch(null));
  }, [child.batchId]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(collection(getFirebaseDb(), "Tests"), (snap) => {
      setTests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TestRecord, "id">) })));
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Payments"), where("studentId", "==", child.id));
    return onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentRecord, "id">) })));
    });
  }, [child.id]);

  const upcomingTests = tests
    .filter((t) => (!t.class || t.class === child.class) && isUpcoming(t.date))
    .sort((a, b) => (toJsDate(a.date)?.getTime() ?? 0) - (toJsDate(b.date)?.getTime() ?? 0));

  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        (toJsDate(b.date)?.getTime() ?? b.createdAt?.toMillis() ?? 0) -
        (toJsDate(a.date)?.getTime() ?? a.createdAt?.toMillis() ?? 0)
    )
    .slice(0, 4);

  // Outstanding dues for this one child.
  const dueMonths =
    computeDueEntries(
      [{ id: child.id, createdAt: child.createdAt }],
      payments.map((p) => ({ studentId: p.studentId ?? "", month: p.month ?? "" })),
      currentMonthIndex()
    )[0]?.dueMonths ?? [];

  const stats = [
    { icon: "ti-school", label: "Class", value: child.class ? `Class ${child.class}` : "—" },
    { icon: "ti-clock", label: "Batch Time", value: batch?.time ?? child.batchLabel ?? "—" },
    { icon: "ti-map-pin", label: "Location", value: batch?.location ?? "—" },
    {
      icon: "ti-cash",
      label: "Dues",
      value: dueMonths.length === 0 ? "Paid up" : `${dueMonths.length} month${dueMonths.length === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>
            {parentLabel[parent] ?? "Guardian"} of {firstName(child.name)}
          </h1>
          <p className={adminStyles.pageSubtitle}>
            Keep track of {firstName(child.name)}&apos;s batch, payments, and upcoming tests.
          </p>
        </div>
        <span className="badge badge-black">Class {child.class}</span>
      </header>

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

      {dueMonths.length > 0 && (
        <div className={styles.empty} role="alert" style={{ borderColor: "var(--red-200)" }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <p className={styles.emptyText}>
            {dueMonths.length} month{dueMonths.length === 1 ? "" : "s"} outstanding:{" "}
            {dueMonths.map(labelFromMonthIndex).join(", ")}.{" "}
            <Link href="/parent/payments">View payment details</Link>
          </p>
        </div>
      )}

      <div className={adminStyles.panels}>
        <div className={styles.panelColumn}>
          <section className={adminStyles.panel} aria-labelledby="upcoming-tests-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="upcoming-tests-title" className={adminStyles.panelTitle}>Upcoming Tests</h2>
              <Link href="/parent/tests" className={adminStyles.panelAction}>
                View all <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            {upcomingTests.length === 0 ? (
              <div className={styles.empty}>
                <i className="ti ti-clipboard-check" aria-hidden="true" />
                <p className={styles.emptyText}>
                  No upcoming tests scheduled — they&apos;ll appear here once the teacher announces one.
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
              <h2 id="payments-title" className={adminStyles.panelTitle}>Recent Payments</h2>
              <Link href="/parent/payments" className={adminStyles.panelAction}>
                View all <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className={styles.empty}>
                <i className="ti ti-credit-card" aria-hidden="true" />
                <p className={styles.emptyText}>
                  No payment records yet — fee history will appear here once payments are logged.
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

        <div className={styles.panelColumn}>
          <section className={adminStyles.panel} aria-labelledby="batch-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="batch-title" className={adminStyles.panelTitle}>Batch Details</h2>
            </div>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Batch</dt>
                <dd className={styles.infoValue}>{child.batchLabel || "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Class</dt>
                <dd className={styles.infoValue}>{child.class ? `Class ${child.class}` : "—"}</dd>
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
            </dl>
          </section>

          <section className={adminStyles.panel} aria-labelledby="child-title">
            <div className={adminStyles.panelHeader}>
              <h2 id="child-title" className={adminStyles.panelTitle}>Student Info</h2>
              <Link href="/parent/profile" className={adminStyles.panelAction}>
                Full profile <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Name</dt>
                <dd className={styles.infoValue}>{child.name}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Student ID</dt>
                <dd className={styles.infoValue}>{child.studentId || "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>School</dt>
                <dd className={styles.infoValue}>{child.school || "—"}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Mobile</dt>
                <dd className={styles.infoValue}>{child.mobile || "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
