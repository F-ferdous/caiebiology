"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { useStudent } from "./StudentShell";
import { type PaymentRecord, formatDate, toJsDate } from "./studentData";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentPortal.module.css";

function statusClass(status?: string) {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
      return adminStyles.statusPaid;
    case "due":
      return adminStyles.statusDue;
    default:
      return adminStyles.statusPending;
  }
}

export default function StudentPayments() {
  const student = useStudent();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Payments"), where("studentId", "==", student.id));
    return onSnapshot(
      q,
      (snap) => {
        setPayments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentRecord, "id">) }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [student.id]);

  const sorted = [...payments].sort(
    (a, b) =>
      (toJsDate(b.date)?.getTime() ?? b.createdAt?.toMillis() ?? 0) -
      (toJsDate(a.date)?.getTime() ?? a.createdAt?.toMillis() ?? 0)
  );

  const totalPaid = sorted
    .filter((p) => (p.status ?? "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const dueCount = sorted.filter((p) => (p.status ?? "").toLowerCase() === "due").length;

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Payment Info</h1>
          <p className={adminStyles.pageSubtitle}>
            Your fee history and payment status, updated by your teacher.
          </p>
        </div>
      </header>

      <div className={adminStyles.statGrid}>
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statIcon} aria-hidden="true">
            <i className="ti ti-receipt" />
          </div>
          <div>
            <div className={adminStyles.statValue}>{sorted.length}</div>
            <div className={adminStyles.statLabel}>Payments Recorded</div>
          </div>
        </div>
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statIcon} aria-hidden="true">
            <i className="ti ti-coin-taka" />
          </div>
          <div>
            <div className={adminStyles.statValue}>৳ {totalPaid.toLocaleString()}</div>
            <div className={adminStyles.statLabel}>Total Paid</div>
          </div>
        </div>
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statIcon} aria-hidden="true">
            <i className="ti ti-alert-circle" />
          </div>
          <div>
            <div className={adminStyles.statValue}>{dueCount}</div>
            <div className={adminStyles.statLabel}>Dues Outstanding</div>
          </div>
        </div>
      </div>

      <section className={adminStyles.panel} aria-labelledby="history-title">
        <div className={adminStyles.panelHeader}>
          <h2 id="history-title" className={adminStyles.panelTitle}>Payment History</h2>
          <span className="badge badge-default">{sorted.length}</span>
        </div>

        {loading ? (
          <p className={styles.emptyText}>Loading payments…</p>
        ) : sorted.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-credit-card" aria-hidden="true" />
            <p className={styles.emptyText}>
              No payment records yet — your fee history will appear here once payments are logged
              by your teacher.
            </p>
          </div>
        ) : (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={p.id}>
                    <td>{p.month ?? "—"}</td>
                    <td>{p.amount != null ? `৳ ${p.amount.toLocaleString()}` : "—"}</td>
                    <td>{formatDate(p.date ?? p.createdAt)}</td>
                    <td>
                      {p.status ? (
                        <span className={`${adminStyles.status} ${statusClass(p.status)}`}>
                          {p.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
