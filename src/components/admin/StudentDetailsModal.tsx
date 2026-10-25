"use client";

import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import styles from "./StudentDetailsModal.module.css";

// Superset of every field a student record can carry. Callers (the students
// table, the dashboard) may pass a partial object — anything missing renders
// as an em dash rather than breaking the layout.
export type StudentDetails = {
  id: string;
  name: string;
  studentId?: string;
  class?: string;
  batchLabel?: string;
  email?: string;
  mobile?: string;
  password?: string;
  mothersName?: string;
  mothersPhone?: string;
  fathersName?: string;
  fathersPhone?: string;
  address?: string;
  school?: string;
  createdAt?: Timestamp | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

// Location is the first word of the batch's location, which is the tail of the
// stored "time — location" label.
function locationFromBatch(batchLabel?: string) {
  if (!batchLabel) return "";
  const idx = batchLabel.lastIndexOf("—");
  const tail = idx >= 0 ? batchLabel.slice(idx + 1) : batchLabel;
  return tail.trim().split(/\s+/)[0] ?? "";
}

function formatDate(ts?: Timestamp | null) {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Row({ label, value }: { label: string; value?: string }) {
  const shown = value && value.trim() ? value : "—";
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{shown}</span>
    </div>
  );
}

export default function StudentDetailsModal({
  student,
  onClose,
}: {
  student: StudentDetails;
  onClose: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Escape closes, matching the rest of the panel's dialogs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${student.name} details`}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.avatar} aria-hidden="true">
            {initials(student.name)}
          </span>
          <div className={styles.headText}>
            <h3 className={styles.name}>{student.name}</h3>
            <p className={styles.sub}>
              {student.class ? `Class ${student.class}` : "No class"}
              {student.studentId ? ` · ID ${student.studentId}` : ""}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close details"
            onClick={onClose}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Academic</h4>
            <Row label="Class" value={student.class ? `Class ${student.class}` : ""} />
            <Row label="Location" value={locationFromBatch(student.batchLabel)} />
            <Row label="Batch" value={student.batchLabel} />
            <Row label="Student ID" value={student.studentId} />
            <Row label="Enrolled" value={formatDate(student.createdAt)} />
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Contact</h4>
            <Row label="Email" value={student.email} />
            <Row label="Mobile" value={student.mobile} />
            <Row label="Address" value={student.address} />
            <Row label="School" value={student.school} />
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Guardians</h4>
            <Row label="Father's name" value={student.fathersName} />
            <Row label="Father's phone" value={student.fathersPhone} />
            <Row label="Mother's name" value={student.mothersName} />
            <Row label="Mother's phone" value={student.mothersPhone} />
          </section>

          {student.password !== undefined && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Account</h4>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Password</span>
                <span className={styles.passwordValue}>
                  <code>{showPassword ? student.password || "—" : "••••••••"}</code>
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <i
                      className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`}
                      aria-hidden="true"
                    />
                  </button>
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
