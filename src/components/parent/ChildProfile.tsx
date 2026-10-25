"use client";

import { useStudent } from "../student/studentContext";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "../student/StudentPortal.module.css";

type Row = { label: string; value: string };

export default function ChildProfile() {
  const child = useStudent();

  const academic: Row[] = [
    { label: "Student ID", value: child.studentId || "—" },
    { label: "Class", value: child.class ? `Class ${child.class}` : "—" },
    { label: "Batch", value: child.batchLabel || "—" },
    { label: "School", value: child.school || "—" },
  ];

  const contact: Row[] = [
    { label: "Email", value: child.email || "—" },
    { label: "Mobile", value: child.mobile || "—" },
    { label: "Address", value: child.address || "—" },
  ];

  const guardians: Row[] = [
    { label: "Father's Name", value: child.fathersName || "—" },
    { label: "Father's Phone", value: child.fathersPhone || "—" },
    { label: "Mother's Name", value: child.mothersName || "—" },
    { label: "Mother's Phone", value: child.mothersPhone || "—" },
  ];

  const section = (title: string, rows: Row[]) => (
    <section className={adminStyles.panel} aria-label={title}>
      <div className={adminStyles.panelHeader}>
        <h2 className={adminStyles.panelTitle}>{title}</h2>
      </div>
      <dl className={styles.infoList}>
        {rows.map((r) => (
          <div key={r.label} className={styles.infoRow}>
            <dt className={styles.infoLabel}>{r.label}</dt>
            <dd className={styles.infoValue}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>{child.name}</h1>
          <p className={adminStyles.pageSubtitle}>
            Your child&apos;s enrolment details, as recorded by the teacher.
          </p>
        </div>
        <span className="badge badge-black">Class {child.class}</span>
      </header>

      <div className={adminStyles.panels}>
        <div className={styles.panelColumn}>
          {section("Academic", academic)}
          {section("Contact", contact)}
        </div>
        <div className={styles.panelColumn}>{section("Guardians", guardians)}</div>
      </div>
    </div>
  );
}
