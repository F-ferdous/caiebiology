"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage, isFirebaseConfigured } from "@/lib/firebase";
import {
  DEFAULT_ASSISTANT_PERMISSIONS,
  subscribeAssistantPermissions,
} from "@/lib/assistantPermissions";
import type { PanelRole } from "@/lib/panelRole";
import { computeDueEntries, currentMonthIndex } from "@/lib/dues";
import styles from "./AssistantsManager.module.css";
import paymentStyles from "./PaymentsManager.module.css";

type Payment = {
  id: string;
  studentId: string;
  uid: string;
  studentName: string;
  studentCode: string;
  class: string;
  batchId: string;
  batchLabel: string;
  month: string;
  amount: number;
  status: string;
  receiptPath: string | null;
  receiptUrl: string | null;
  createdAt: Timestamp | null;
};

type StudentOption = {
  id: string;
  name: string;
  studentId: string;
  class: string;
  batchId: string;
  batchLabel: string;
  createdAt: Timestamp | null;
};

type BatchOption = {
  id: string;
  class: string;
  time: string;
  location: string;
};

type ModalState =
  | { status: "closed" }
  | { status: "form" }
  | { status: "busy"; title: string; text: string }
  | { status: "success"; title: string; text: string }
  | { status: "error"; message: string }
  | { status: "confirm"; payment: Payment }
  | { status: "receipt"; payment: Payment }
  | { status: "details"; payment: Payment };

const classOptions = ["IX", "X", "XI", "XII"];
const locationOptions = ["Mirpur", "Gulshan", "Lalmatia"];
const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function errorMessage(err: unknown, fallback: string) {
  const code = (err as { code?: string }).code ?? "";
  return code ? `${fallback} (${code})` : `${fallback} (${(err as Error).message})`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/** Escape user-supplied text before dropping it into the receipt window HTML. */
function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Print a payment as a narrow thermal/ATM-style receipt (80mm roll) rather than
 * an A4 page. We render it in a throwaway popup so only the receipt prints —
 * never the surrounding dashboard — and so the dark theme can't bleed in.
 */
function printReceipt(p: Payment) {
  const recorded = p.createdAt
    ? p.createdAt.toDate().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const printedAt = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const line = (label: string, value: string) =>
    `<div class="row"><span class="lbl">${esc(label)}</span><span class="val">${esc(value)}</span></div>`;

  const rows = [
    line("Student", p.studentName),
    p.studentCode ? line("Student ID", p.studentCode) : "",
    line("Class", `Class ${p.class}`),
    line("Batch", p.batchLabel),
    line("Month", p.month),
    line("Status", p.status),
    line("Recorded", recorded),
  ].join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt — ${esc(p.studentName)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 72mm; }
  body {
    font-family: 'Courier New', ui-monospace, monospace;
    color: #000; background: #fff;
    font-size: 11px; line-height: 1.5;
    padding: 2mm 0;
  }
  .center { text-align: center; }
  .brand { font-size: 15px; font-weight: 700; letter-spacing: 1px; }
  .sub { font-size: 10px; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
  .muted { font-size: 9px; color: #333; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
  .row .lbl { color: #333; white-space: nowrap; }
  .row .val { font-weight: 700; text-align: right; }
  .amount { text-align: center; margin: 8px 0; }
  .amount .k { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #333; }
  .amount .v { font-size: 18px; font-weight: 700; }
  .foot { text-align: center; font-size: 9px; margin-top: 8px; }
</style>
</head>
<body>
  <div class="center">
    <div class="brand">CAIE-BIOLOGY</div>
    <div class="sub">Payment Receipt</div>
  </div>
  <hr />
  ${rows}
  <hr />
  <div class="amount">
    <div class="k">Amount Paid</div>
    <div class="v">&#2547; ${esc(p.amount.toLocaleString())}</div>
  </div>
  <hr />
  <div class="foot">
    <div>Printed ${esc(printedAt)}</div>
    <div class="muted">Thank you.</div>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
    window.onafterprint = function () { window.close(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function batchLabelOf(b: BatchOption) {
  return `${b.time} — ${b.location}`;
}

/** Timestamped path keeps receipt uploads unique per student. */
function newReceiptPath(studentId: string) {
  return `receipts/${Date.now()}-${studentId}.jpg`;
}

/** Downscale + JPEG-compress a receipt photo to keep Storage uploads small. */
async function compressReceipt(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  let quality = 0.75;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 900_000 && quality > 0.3) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > 900_000) {
    throw new Error("The photo is too large even after compression — try a smaller image.");
  }
  return dataUrl;
}

export default function PaymentsManager({ role = "admin" }: { role?: PanelRole }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  const [modal, setModal] = useState<ModalState>({ status: "closed" });
  // Admins always delete; assistants only when the admin has granted it.
  const [canDelete, setCanDelete] = useState(
    role === "admin" ? true : DEFAULT_ASSISTANT_PERMISSIONS.canDeletePayments
  );

  // Form state — month/class/batch/search narrow down to one student
  const currentDate = new Date();
  const [formMonth, setFormMonth] = useState(monthOptions[currentDate.getMonth()]);
  const [formYear, setFormYear] = useState(String(currentDate.getFullYear()));
  const [formClass, setFormClass] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [receipt, setReceipt] = useState<{ name: string; dataUrl: string } | null>(null);

  // Payment-history search, sidebar filters, and pagination
  const [historySearch, setHistorySearch] = useState("");
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterClasses, setFilterClasses] = useState<string[]>([]);
  const [filterBatches, setFilterBatches] = useState<string[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);

  // The batch name carries its location as one of its tokens (e.g.
  // "LALMATIA-BATCH-2-TUESDAY … — LALMATIA"). Scan the label for the first
  // token that matches a known location, case-insensitively, so filtering
  // works regardless of how the name was capitalised or spaced.
  const locationOf = (label: string) => {
    const tokens = label.toLowerCase().split(/[\s—-]+/).filter(Boolean);
    for (const t of tokens) {
      const match = locationOptions.find((o) => o.toLowerCase() === t);
      if (match) return match;
    }
    return "";
  };
  const batchLocationOf = (b: BatchOption) => locationOf(batchLabelOf(b));
  const paymentLocationOf = (p: Payment) => locationOf(p.batchLabel);

  // Location and class are single-select (radio-like): ticking one clears the
  // previous pick; ticking the current one clears it.
  const selectSingle = (
    setter: Dispatch<SetStateAction<string[]>>,
    value: string
  ) => setter((prev) => (prev[0] === value ? [] : [value]));

  // Batches shown in the sidebar are those matching the ticked locations/classes.
  // They appear only once the admin/assistant has started narrowing down.
  const showBatchList = filterLocations.length > 0 || filterClasses.length > 0;
  const visibleBatches = showBatchList
    ? batches.filter(
        (b) =>
          (filterLocations.length === 0 || filterLocations.includes(batchLocationOf(b))) &&
          (filterClasses.length === 0 || filterClasses.includes(b.class))
      )
    : [];

  // Ticked batches still visible under the current location/class picks.
  const activeBatchIds = filterBatches.filter((id) =>
    visibleBatches.some((b) => b.id === id)
  );

  const clearFilters = () => {
    setFilterLocations([]);
    setFilterClasses([]);
    setFilterBatches([]);
  };

  const anyFilterActive =
    filterLocations.length > 0 ||
    filterClasses.length > 0 ||
    filterBatches.length > 0;

  const hq = historySearch.trim().toLowerCase();
  const filteredPayments = payments.filter((p) => {
    if (filterLocations.length && !filterLocations.includes(paymentLocationOf(p))) return false;
    if (filterClasses.length && !filterClasses.includes(p.class)) return false;
    if (activeBatchIds.length && !activeBatchIds.includes(p.batchId)) return false;
    if (hq) {
      const hay = [p.studentName, p.studentCode, p.month, p.batchLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(hq)) return false;
    }
    return true;
  });

  const historyTotalPages = Math.max(1, Math.ceil(filteredPayments.length / historyPageSize));
  const historyCurrentPage = Math.min(historyPage, historyTotalPages);
  const historyStart = (historyCurrentPage - 1) * historyPageSize;
  const pagePayments = filteredPayments.slice(historyStart, historyStart + historyPageSize);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, filterLocations, filterClasses, filterBatches, historyPageSize]);

  // Live payment history
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Payments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, "id">) })));
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return unsubscribe;
  }, []);

  // Students feed the search results; batches feed the cascading dropdown
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onSnapshot(collection(getFirebaseDb(), "Students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudentOption, "id">) })));
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BatchOption, "id">) })));
    });
  }, []);

  // Assistants read the delete permission live so an admin toggle applies at once
  useEffect(() => {
    if (role === "admin" || !isFirebaseConfigured) return;
    return subscribeAssistantPermissions((perms) =>
      setCanDelete(perms.canDeletePayments)
    );
  }, [role]);

  const classBatches = batches.filter((b) => b.class === formClass);

  // Outstanding-due count for the Due List button badge.
  const dueCount = useMemo(
    () => computeDueEntries(students, payments, currentMonthIndex()).length,
    [students, payments]
  );

  // Students are listed only after the admin starts narrowing down
  const hasCriteria = Boolean(formClass || formBatchId || search.trim());
  const matches = hasCriteria
    ? students.filter(
        (s) =>
          (!formClass || s.class === formClass) &&
          (!formBatchId || s.batchId === formBatchId) &&
          (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : [];
  const selected = matches.find((s) => s.id === selectedId);

  const monthLabel = `${formMonth} ${formYear}`;
  const duplicate =
    selected && payments.some((p) => p.studentId === selected.id && p.month === monthLabel);

  const openForm = () => {
    const now = new Date();
    setFormMonth(monthOptions[now.getMonth()]);
    setFormYear(String(now.getFullYear()));
    setFormClass("");
    setFormBatchId("");
    setSearch("");
    setSelectedId("");
    setReceipt(null);
    setModal({ status: "form" });
  };

  const handleReceiptChange = async (file: File | undefined) => {
    if (!file) {
      setReceipt(null);
      return;
    }
    try {
      const dataUrl = await compressReceipt(file);
      setReceipt({ name: file.name, dataUrl });
    } catch (err) {
      setReceipt(null);
      setModal({ status: "error", message: (err as Error).message });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = Number(data.get("amount"));

    if (!selected) {
      setModal({ status: "error", message: "Search and select a student first." });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setModal({ status: "error", message: "Enter a valid payment amount." });
      return;
    }

    setModal({ status: "busy", title: "Saving…", text: "Recording the payment." });
    try {
      const db = getFirebaseDb();
      let receiptPath: string | null = null;
      let receiptUrl: string | null = null;
      if (receipt) {
        receiptPath = newReceiptPath(selected.id);
        const storageRef = ref(getFirebaseStorage(), receiptPath);
        await uploadString(storageRef, receipt.dataUrl, "data_url");
        receiptUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, "Payments"), {
        studentId: selected.id,
        studentName: selected.name,
        studentCode: selected.studentId ?? "",
        class: selected.class,
        batchId: selected.batchId,
        batchLabel: selected.batchLabel,
        month: monthLabel,
        amount,
        status: "Paid",
        receiptPath,
        receiptUrl,
        createdAt: serverTimestamp(),
      });
      setModal({
        status: "success",
        title: "Payment recorded",
        text: `${selected.name}'s ${monthLabel} payment of ৳ ${amount.toLocaleString()} has been saved.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not save the payment.") });
    }
  };

  const handleDelete = async (p: Payment) => {
    setModal({ status: "busy", title: "Deleting…", text: "Removing the payment record." });
    try {
      const db = getFirebaseDb();
      if (p.receiptPath) {
        await deleteObject(ref(getFirebaseStorage(), p.receiptPath)).catch(() => {});
      }
      await deleteDoc(doc(db, "Payments", p.id));
      setModal({
        status: "success",
        title: "Payment deleted",
        text: `${p.studentName}'s ${p.month} payment has been removed.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not delete the payment.") });
    }
  };


  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Payment Details</h1>
          <p className={styles.pageSubtitle}>
            Record monthly fees and browse the full payment history.
          </p>
        </div>
        <div className={paymentStyles.headerActions}>
          <Link
            className={`btn ${paymentStyles.dueBtn}`}
            href={`/${role}/payments/due`}
            aria-disabled={!isFirebaseConfigured}
          >
            <i className="ti ti-alert-triangle" aria-hidden="true" /> Due List
            {dueCount > 0 && (
              <span className={paymentStyles.dueCount}>{dueCount}</span>
            )}
          </Link>
          <button
            className="btn btn-primary"
            onClick={openForm}
            disabled={!isFirebaseConfigured}
          >
            <i className="ti ti-plus" aria-hidden="true" /> Record Payment
          </button>
        </div>
      </header>

      {!isFirebaseConfigured && (
        <div className={styles.configWarning} role="alert">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <div>
            <strong>Firebase is not configured.</strong>
            <p>
              Add your Firebase web app keys to <code>.env.local</code> and restart the dev
              server. Until then, saving is disabled.
            </p>
          </div>
        </div>
      )}

      {/* ---- Payment history ---- */}
      <div className={paymentStyles.layout}>
        {/* Filter sidebar */}
        <aside className={paymentStyles.filterSidebar} aria-label="Payment filters">
          <div className={paymentStyles.filterHead}>
            <h2 className={paymentStyles.filterHeading}>
              <i className="ti ti-filter" aria-hidden="true" /> Filters
            </h2>
            {anyFilterActive && (
              <button
                type="button"
                className={paymentStyles.clearBtn}
                onClick={clearFilters}
              >
                Clear all
              </button>
            )}
          </div>

          <div className={paymentStyles.filterGroup}>
            <span className={paymentStyles.filterGroupTitle}>Location</span>
            <ul className={paymentStyles.checkList}>
              {locationOptions.map((l) => (
                <li key={l}>
                  <label className={paymentStyles.checkItem}>
                    <input
                      type="checkbox"
                      checked={filterLocations.includes(l)}
                      onChange={() => selectSingle(setFilterLocations, l)}
                    />
                    <span>{l}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className={paymentStyles.filterGroup}>
            <span className={paymentStyles.filterGroupTitle}>Class</span>
            <ul className={paymentStyles.checkList}>
              {classOptions.map((c) => (
                <li key={c}>
                  <label className={paymentStyles.checkItem}>
                    <input
                      type="checkbox"
                      checked={filterClasses.includes(c)}
                      onChange={() => selectSingle(setFilterClasses, c)}
                    />
                    <span>Class {c}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className={paymentStyles.filterGroup}>
            <span className={paymentStyles.filterGroupTitle}>Batch</span>
            {!showBatchList ? (
              <p className={paymentStyles.filterHint}>
                Tick a location or class to list its batches.
              </p>
            ) : visibleBatches.length === 0 ? (
              <p className={paymentStyles.filterHint}>
                No batches match the selected location and class.
              </p>
            ) : (
              <ul className={paymentStyles.checkList}>
                {visibleBatches.map((b) => (
                  <li key={b.id}>
                    <label className={paymentStyles.checkItem}>
                      <input
                        type="checkbox"
                        checked={filterBatches.includes(b.id)}
                        onChange={() => selectSingle(setFilterBatches, b.id)}
                      />
                      <span>
                        {batchLabelOf(b)}
                        <br />
                        <small className={paymentStyles.checkSub}>Class {b.class}</small>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className={styles.panel} aria-labelledby="payment-history-title">
          <div className={styles.panelHeader}>
            <h2 id="payment-history-title" className={styles.panelTitle}>Payment History</h2>
            <span className="badge badge-default">{filteredPayments.length}</span>
          </div>

          {/* Search */}
          <div className={paymentStyles.toolbar}>
            <div className={paymentStyles.searchWrap}>
              <i className="ti ti-search" aria-hidden="true" />
              <input
                type="search"
                className={paymentStyles.searchInput}
                placeholder="Search by student, ID, month or batch"
                aria-label="Search payments"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          {loadingList ? (
          <p className={styles.emptyText}>Loading payments…</p>
        ) : payments.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-credit-card" aria-hidden="true" />
            <p className={styles.emptyText}>
              No payments recorded yet — click “Record Payment” to log the first one.
            </p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-search-off" aria-hidden="true" />
            <p className={styles.emptyText}>
              No payments match your search or filters.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Class</th>
                  <th>Batch</th>
                  <th>Recorded</th>
                  <th>Receipt</th>
                  <th className={styles.actionsHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagePayments.map((p) => (
                  <tr
                    key={p.id}
                    className={paymentStyles.clickableRow}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${p.studentName}'s ${p.month} payment details`}
                    onClick={() => setModal({ status: "details", payment: p })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setModal({ status: "details", payment: p });
                      }
                    }}
                  >
                    <td>
                      <span className={styles.nameCell}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initials(p.studentName)}
                        </span>
                        {p.studentName}
                      </span>
                    </td>
                    <td>{p.month}</td>
                    <td>৳ {p.amount.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-default">Class {p.class}</span>
                    </td>
                    <td>{p.batchLabel}</td>
                    <td>
                      {p.createdAt
                        ? p.createdAt.toDate().toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      {p.receiptUrl ? (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label={`View ${p.studentName}'s receipt`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ status: "receipt", payment: p });
                          }}
                        >
                          <i className="ti ti-photo" aria-hidden="true" />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={styles.actions}>
                        {canDelete ? (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            aria-label={`Delete ${p.studentName}'s ${p.month} payment`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ status: "confirm", payment: p });
                            }}
                          >
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loadingList && filteredPayments.length > 0 && (
          <div className={paymentStyles.pagination}>
            <div className={paymentStyles.pageSize}>
              <label htmlFor="history-page-size">Per page</label>
              <select
                id="history-page-size"
                className={paymentStyles.filterSelect}
                value={historyPageSize}
                onChange={(e) => setHistoryPageSize(Number(e.target.value))}
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            <span className={paymentStyles.pageInfo}>
              {historyStart + 1}–{Math.min(historyStart + historyPageSize, filteredPayments.length)} of{" "}
              {filteredPayments.length}
            </span>

            <div className={paymentStyles.pageNav}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Previous page"
                disabled={historyCurrentPage <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              >
                <i className="ti ti-chevron-left" aria-hidden="true" />
              </button>
              <span className={paymentStyles.pageInfo}>
                Page {historyCurrentPage} / {historyTotalPages}
              </span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Next page"
                disabled={historyCurrentPage >= historyTotalPages}
                onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
              >
                <i className="ti ti-chevron-right" aria-hidden="true" />
              </button>
            </div>
            </div>
          )}
        </section>
      </div>

      {/* ---- Modal ---- */}
      {modal.status !== "closed" && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true"
          aria-label="Payment dialog">
          {modal.status === "form" ? (
            <div className={`${styles.modal} ${styles.modalWide} ${paymentStyles.modalWider}`}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Record Payment</h3>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Close dialog"
                  onClick={() => setModal({ status: "closed" })}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>

              <form className={paymentStyles.formGrid} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="payment-month">Month</label>
                  <select className={styles.input} id="payment-month" name="month"
                    value={formMonth} onChange={(e) => setFormMonth(e.target.value)}>
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="payment-year">Year</label>
                  <select className={styles.input} id="payment-year" name="year"
                    value={formYear} onChange={(e) => setFormYear(e.target.value)}>
                    {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1]
                      .map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="payment-class">Class</label>
                  <select className={styles.input} id="payment-class" name="class"
                    value={formClass}
                    onChange={(e) => {
                      setFormClass(e.target.value);
                      setFormBatchId("");
                      setSelectedId("");
                    }}>
                    <option value="">All classes</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="payment-batch">Batch</label>
                  <select className={styles.input} id="payment-batch" name="batch"
                    value={formBatchId}
                    onChange={(e) => {
                      setFormBatchId(e.target.value);
                      setSelectedId("");
                    }}
                    disabled={!formClass}>
                    <option value="">
                      {formClass ? "All batches" : "Select a class first"}
                    </option>
                    {classBatches.map((b) => (
                      <option key={b.id} value={b.id}>{batchLabelOf(b)}</option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.field} ${paymentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="payment-search">Search Student</label>
                  <input className={styles.input} id="payment-search" type="search"
                    placeholder="Type a student's name…" autoComplete="off"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedId("");
                    }} />
                </div>

                <div className={`${styles.field} ${paymentStyles.spanFull}`}>
                  <span className={styles.label}>Select Student</span>
                  <div className={paymentStyles.results} role="listbox"
                    aria-label="Matching students">
                    {!hasCriteria ? (
                      <p className={paymentStyles.resultsEmpty}>
                        No student selected — choose a class or search by name to see students.
                      </p>
                    ) : matches.length === 0 ? (
                      <p className={paymentStyles.resultsEmpty}>
                        No students match — adjust the class, batch, or search.
                      </p>
                    ) : (
                      matches.map((s) => {
                        const active = s.id === selectedId;
                        return (
                          <button key={s.id} type="button" role="option"
                            aria-selected={active}
                            className={`${paymentStyles.resultRow} ${active ? paymentStyles.resultActive : ""}`}
                            onClick={() => setSelectedId(active ? "" : s.id)}>
                            <span className={styles.avatar} aria-hidden="true">
                              {initials(s.name)}
                            </span>
                            <span>
                              <span className={paymentStyles.resultName}>{s.name}</span>
                              <br />
                              <span className={paymentStyles.resultMeta}>
                                Class {s.class} · {s.batchLabel}
                              </span>
                            </span>
                            {active && (
                              <i className={`ti ti-circle-check ${paymentStyles.resultCheck}`}
                                aria-hidden="true" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="payment-amount">Fee Amount (৳)</label>
                  <input className={styles.input} id="payment-amount" name="amount"
                    type="number" min={1} step="any" placeholder="e.g. 3000" required
                    autoComplete="off" />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="payment-receipt">
                    Money Receipt <span className={paymentStyles.resultMeta}>(Optional)</span>
                  </label>
                  <input className={styles.input} id="payment-receipt" type="file"
                    accept="image/*"
                    onChange={(e) => handleReceiptChange(e.target.files?.[0])} />
                </div>

                {receipt && (
                  <div className={`${paymentStyles.receiptPreview} ${paymentStyles.spanFull}`}>
                    {/* Data-URL preview of a just-picked file — next/image adds nothing here */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={paymentStyles.receiptThumb} src={receipt.dataUrl}
                      alt="Receipt preview" />
                    <span className={paymentStyles.receiptName}>{receipt.name}</span>
                    <button type="button" className={styles.iconBtn}
                      aria-label="Remove receipt photo"
                      onClick={() => setReceipt(null)}>
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {duplicate && (
                  <div className={`${paymentStyles.warning} ${paymentStyles.spanFull}`}>
                    <i className="ti ti-alert-triangle" aria-hidden="true" />
                    A {monthLabel} payment is already recorded for {selected?.name} — saving will
                    add another entry.
                  </div>
                )}

                <button type="submit"
                  className={`btn btn-primary ${paymentStyles.spanFull}`}
                  disabled={!selected}>
                  <i className="ti ti-device-floppy" aria-hidden="true" />
                  {selected ? `Save Payment for ${selected.name}` : "Select a student to save"}
                </button>
              </form>
            </div>
          ) : modal.status === "confirm" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete payment?</h3>
              <p className={styles.modalText}>
                <strong>{modal.payment.studentName}</strong>&apos;s {modal.payment.month} payment
                of ৳ {modal.payment.amount.toLocaleString()} will be removed
                {modal.payment.receiptPath ? " along with its receipt photo" : ""}. This
                can&apos;t be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`}
                  onClick={() => handleDelete(modal.payment)}>
                  Delete
                </button>
              </div>
            </div>
          ) : modal.status === "receipt" ? (
            <div className={`${styles.modal} ${styles.modalWide}`}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Receipt — {modal.payment.studentName}, {modal.payment.month}
                </h3>
                <button type="button" className={styles.iconBtn} aria-label="Close dialog"
                  onClick={() => setModal({ status: "closed" })}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>
              {modal.payment.receiptUrl ? (
                /* User-uploaded Storage URL at natural size — next/image adds nothing here */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className={paymentStyles.receiptFull} src={modal.payment.receiptUrl}
                  alt={`Money receipt for ${modal.payment.studentName}, ${modal.payment.month}`} />
              ) : (
                <p className={styles.modalText}>No receipt attached.</p>
              )}
            </div>
          ) : modal.status === "details" ? (
            <div className={`${styles.modal} ${styles.modalWide}`}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Payment Details</h3>
                <button type="button" className={styles.iconBtn} aria-label="Close dialog"
                  onClick={() => setModal({ status: "closed" })}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>
              <dl className={paymentStyles.detailList}>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Student</dt>
                  <dd className={paymentStyles.detailValue}>{modal.payment.studentName}</dd>
                </div>
                {modal.payment.studentCode ? (
                  <div className={paymentStyles.detailRow}>
                    <dt className={paymentStyles.detailLabel}>Student ID</dt>
                    <dd className={paymentStyles.detailValue}>{modal.payment.studentCode}</dd>
                  </div>
                ) : null}
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Class</dt>
                  <dd className={paymentStyles.detailValue}>Class {modal.payment.class}</dd>
                </div>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Batch</dt>
                  <dd className={paymentStyles.detailValue}>{modal.payment.batchLabel}</dd>
                </div>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Month</dt>
                  <dd className={paymentStyles.detailValue}>{modal.payment.month}</dd>
                </div>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Amount</dt>
                  <dd className={paymentStyles.detailValue}>
                    ৳ {modal.payment.amount.toLocaleString()}
                  </dd>
                </div>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Status</dt>
                  <dd className={paymentStyles.detailValue}>
                    <span className="badge badge-default">{modal.payment.status}</span>
                  </dd>
                </div>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Recorded</dt>
                  <dd className={paymentStyles.detailValue}>
                    {modal.payment.createdAt
                      ? modal.payment.createdAt.toDate().toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </dd>
                </div>
                <div className={paymentStyles.detailRow}>
                  <dt className={paymentStyles.detailLabel}>Receipt</dt>
                  <dd className={paymentStyles.detailValue}>
                    {modal.payment.receiptUrl ? (
                      <button type="button" className="btn btn-secondary"
                        onClick={() => setModal({ status: "receipt", payment: modal.payment })}>
                        <i className="ti ti-photo" aria-hidden="true" /> View receipt
                      </button>
                    ) : (
                      "No receipt attached"
                    )}
                  </dd>
                </div>
              </dl>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => printReceipt(modal.payment)}
                >
                  <i className="ti ti-printer" aria-hidden="true" /> Print Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.modal}>
              {modal.status === "busy" && (
                <>
                  <div className={styles.spinner} aria-hidden="true" />
                  <h3 className={styles.modalTitle}>{modal.title}</h3>
                  <p className={styles.modalText}>{modal.text}</p>
                </>
              )}

              {modal.status === "success" && (
                <>
                  <div className={`${styles.modalIcon} ${styles.modalIconSuccess}`} aria-hidden="true">
                    <i className="ti ti-circle-check" />
                  </div>
                  <h3 className={styles.modalTitle}>{modal.title}</h3>
                  <p className={styles.modalText}>{modal.text}</p>
                  <button className="btn btn-primary" onClick={() => setModal({ status: "closed" })}>
                    Done
                  </button>
                </>
              )}

              {modal.status === "error" && (
                <>
                  <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                    <i className="ti ti-alert-circle" />
                  </div>
                  <h3 className={styles.modalTitle}>Something went wrong</h3>
                  <p className={styles.modalText}>{modal.message}</p>
                  <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                    Close
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
