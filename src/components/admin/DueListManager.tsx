"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import type { PanelRole } from "@/lib/panelRole";
import {
  MONTHS,
  computeDueEntries,
  currentMonthIndex,
  labelFromMonthIndex,
} from "@/lib/dues";
import styles from "./AssistantsManager.module.css";
import paymentStyles from "./PaymentsManager.module.css";

type Student = {
  id: string;
  name: string;
  studentId: string;
  class: string;
  batchId: string;
  batchLabel: string;
  email: string;
  mobile: string;
  createdAt: Timestamp | null;
};

type PaymentRow = { id: string; studentId: string; month: string };

type BatchOption = { id: string; class: string; time: string; location: string };

type DueEntry = { student: Student; dueMonths: number[] };

const classOptions = ["IX", "X", "XI", "XII"];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function batchLabelOf(b: BatchOption) {
  return `${b.time} — ${b.location}`;
}

export default function DueListManager({ role = "admin" }: { role?: PanelRole }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [selected, setSelected] = useState<DueEntry | null>(null);

  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterBatchId, setFilterBatchId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(collection(getFirebaseDb(), "Students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) })));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(collection(getFirebaseDb(), "Payments"), (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentRow, "id">) })));
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BatchOption, "id">) })));
    });
  }, []);

  const now = new Date();
  const classBatches = batches.filter((b) => b.class === filterClass);

  const dueEntries = useMemo(
    () => computeDueEntries(students, payments, currentMonthIndex()),
    [students, payments]
  );

  const filteredDue = useMemo(() => {
    const monthNum = filterMonth ? MONTHS.indexOf(filterMonth) : -1;
    const yearNum = filterYear ? Number(filterYear) : null;
    const term = search.trim().toLowerCase();
    return dueEntries
      .map(({ student, dueMonths }) => {
        let months = dueMonths;
        if (monthNum >= 0) months = months.filter((idx) => idx % 12 === monthNum);
        if (yearNum != null) months = months.filter((idx) => Math.floor(idx / 12) === yearNum);
        return { student, dueMonths: months };
      })
      .filter(({ student, dueMonths }) => {
        if (dueMonths.length === 0) return false;
        if (filterClass && student.class !== filterClass) return false;
        if (filterBatchId && student.batchId !== filterBatchId) return false;
        if (
          term &&
          !student.name.toLowerCase().includes(term) &&
          !(student.studentId ?? "").toLowerCase().includes(term)
        ) {
          return false;
        }
        return true;
      });
  }, [dueEntries, filterMonth, filterYear, filterClass, filterBatchId, search]);

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Due List</h1>
          <p className={styles.pageSubtitle}>
            Students with an unrecorded payment for a past month.
          </p>
        </div>
        <Link className="btn btn-secondary" href={`/${role}/payments`}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> Back to Payments
        </Link>
      </header>

      {!isFirebaseConfigured && (
        <div className={styles.configWarning} role="alert">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <div>
            <strong>Firebase is not configured.</strong>
            <p>Add your Firebase web app keys to <code>.env.local</code> and restart the dev server.</p>
          </div>
        </div>
      )}

      <section className={styles.panel} aria-labelledby="due-list-title">
        <div className={styles.panelHeader}>
          <h2 id="due-list-title" className={styles.panelTitle}>Outstanding Dues</h2>
          <span className="badge badge-default">{dueEntries.length}</span>
        </div>

        <div className={paymentStyles.dueFilters}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="due-month">Month</label>
            <select className={styles.input} id="due-month" value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="">All months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="due-year">Year</label>
            <select className={styles.input} id="due-year" value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All years</option>
              {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="due-class">Class</label>
            <select className={styles.input} id="due-class" value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterBatchId("");
              }}>
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="due-batch">Batch</label>
            <select className={styles.input} id="due-batch" value={filterBatchId}
              onChange={(e) => setFilterBatchId(e.target.value)} disabled={!filterClass}>
              <option value="">{filterClass ? "All batches" : "Select a class first"}</option>
              {classBatches.map((b) => (
                <option key={b.id} value={b.id}>{batchLabelOf(b)}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.field} ${paymentStyles.spanFull}`}>
            <label className={styles.label} htmlFor="due-search">Search</label>
            <input className={styles.input} id="due-search" type="search"
              placeholder="Search by name or student ID…" autoComplete="off"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <p className={styles.emptyText}>Loading dues…</p>
        ) : filteredDue.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-circle-check" aria-hidden="true" />
            <p className={styles.emptyText}>
              No due students match — everyone here is paid up.
            </p>
          </div>
        ) : (
          <div className={paymentStyles.dueList} role="list">
            {filteredDue.map(({ student, dueMonths }) => (
              <button key={student.id} type="button" role="listitem"
                className={paymentStyles.dueRow}
                onClick={() => setSelected({ student, dueMonths })}>
                <span className={styles.avatar} aria-hidden="true">{initials(student.name)}</span>
                <span className={paymentStyles.dueRowText}>
                  <span className={paymentStyles.resultName}>{student.name}</span>
                  <span className={paymentStyles.resultMeta}>
                    Class {student.class} · {student.batchLabel}
                  </span>
                </span>
                <span className={paymentStyles.dueBadge}>
                  {dueMonths.length} {dueMonths.length === 1 ? "month" : "months"} due
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true"
          aria-label="Due details">
          <div className={`${styles.modal} ${styles.modalWide}`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Due Details</h3>
              <button type="button" className={styles.iconBtn} aria-label="Close dialog"
                onClick={() => setSelected(null)}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <dl className={paymentStyles.detailList}>
              <div className={paymentStyles.detailRow}>
                <dt className={paymentStyles.detailLabel}>Student</dt>
                <dd className={paymentStyles.detailValue}>{selected.student.name}</dd>
              </div>
              {selected.student.studentId ? (
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Student ID</dt>
                  <dd className={paymentStyles.detailValue}>{selected.student.studentId}</dd>
                </div>
              ) : null}
              <div className={paymentStyles.detailRow}>
                <dt className={paymentStyles.detailLabel}>Class</dt>
                <dd className={paymentStyles.detailValue}>Class {selected.student.class}</dd>
              </div>
              <div className={paymentStyles.detailRow}>
                <dt className={paymentStyles.detailLabel}>Batch</dt>
                <dd className={paymentStyles.detailValue}>{selected.student.batchLabel}</dd>
              </div>
              {selected.student.email ? (
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Email</dt>
                  <dd className={paymentStyles.detailValue}>{selected.student.email}</dd>
                </div>
              ) : null}
              {selected.student.mobile ? (
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Mobile</dt>
                  <dd className={paymentStyles.detailValue}>{selected.student.mobile}</dd>
                </div>
              ) : null}
              {selected.student.createdAt ? (
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Joined</dt>
                  <dd className={paymentStyles.detailValue}>
                    {selected.student.createdAt.toDate().toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </dd>
                </div>
              ) : null}
              <div className={paymentStyles.detailRow}>
                <dt className={paymentStyles.detailLabel}>Months Due</dt>
                <dd className={paymentStyles.detailValue}>
                  <span className={paymentStyles.dueMonthList}>
                    {selected.dueMonths.map((idx) => (
                      <span key={idx} className={paymentStyles.dueMonthChip}>
                        {labelFromMonthIndex(idx)}
                      </span>
                    ))}
                  </span>
                </dd>
              </div>
            </dl>
            <button type="button" className={`btn btn-primary ${paymentStyles.spanFull}`}
              onClick={() => setSelected(null)}>
              <i className="ti ti-check" aria-hidden="true" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
