"use client";

import { useStudent } from "./StudentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentPortal.module.css";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.infoRow}>
      <dt className={styles.infoLabel}>{label}</dt>
      <dd className={`${styles.infoValue} ${!value ? styles.infoValueMuted : ""}`}>
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export default function StudentProfile() {
  const student = useStudent();

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Profile</h1>
          <p className={adminStyles.pageSubtitle}>
            Your enrollment and contact information on record.
          </p>
        </div>
      </header>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar} aria-hidden="true">{initials(student.name)}</div>
        <div>
          <div className={styles.profileName}>{student.name}</div>
          <div className={styles.profileMeta}>
            <span className="badge badge-default">Class {student.class}</span>
            <span>{student.batchLabel}</span>
          </div>
        </div>
      </div>

      <div className={styles.panelGrid}>
        <section className={adminStyles.panel} aria-labelledby="contact-title">
          <div className={adminStyles.panelHeader}>
            <h2 id="contact-title" className={adminStyles.panelTitle}>Contact & School</h2>
          </div>
          <dl className={styles.infoList}>
            <Row label="Email" value={student.email} />
            <Row label="Mobile" value={student.mobile} />
            <Row label="School" value={student.school} />
            <Row label="Address" value={student.address} />
          </dl>
        </section>

        <section className={adminStyles.panel} aria-labelledby="guardian-title">
          <div className={adminStyles.panelHeader}>
            <h2 id="guardian-title" className={adminStyles.panelTitle}>Guardian Info</h2>
          </div>
          <dl className={styles.infoList}>
            <Row label="Mother's Name" value={student.mothersName} />
            <Row label="Mother's Phone" value={student.mothersPhone} />
            <Row label="Father's Name" value={student.fathersName} />
            <Row label="Father's Phone" value={student.fathersPhone} />
          </dl>
        </section>
      </div>

      <p className={styles.note}>
        <i className="ti ti-info-circle" aria-hidden="true" />
        Something out of date? Contact your teacher to have your details updated.
      </p>
    </div>
  );
}
