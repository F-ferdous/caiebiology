import Link from "next/link";
import { adminSections } from "@/lib/adminNav";
import styles from "./AdminDashboard.module.css";

const stats = [
  { icon: "ti-users", label: "Total Students", value: "248", trend: "+12 this month" },
  { icon: "ti-stack-2", label: "Active Batches", value: "6", trend: "2 starting soon" },
  { icon: "ti-books", label: "Resources", value: "132", trend: "+8 this week" },
  { icon: "ti-credit-card", label: "Fees Collected", value: "৳ 84,500", trend: "July 2026" },
];

const recentStudents = [
  { name: "Nusrat Jahan", batch: "AS Level — Batch A", date: "Jul 8, 2026", status: "Paid" },
  { name: "Rafiul Hasan", batch: "A2 Level — Batch B", date: "Jul 7, 2026", status: "Pending" },
  { name: "Tasnim Akter", batch: "IGCSE — Batch C", date: "Jul 6, 2026", status: "Paid" },
  { name: "Sadman Sakib", batch: "AS Level — Batch A", date: "Jul 5, 2026", status: "Paid" },
  { name: "Maliha Rahman", batch: "A2 Level — Batch B", date: "Jul 4, 2026", status: "Due" },
];

const statusVariant: Record<string, string> = {
  Paid: styles.statusPaid,
  Pending: styles.statusPending,
  Due: styles.statusDue,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export default function AdminDashboard() {
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
              <p className={styles.statTrend}>{s.trend}</p>
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
                  <th>Batch</th>
                  <th>Enrolled</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s) => (
                  <tr key={s.name}>
                    <td>
                      <span className={styles.studentCell}>
                        <span className={styles.tableAvatar} aria-hidden="true">
                          {initials(s.name)}
                        </span>
                        {s.name}
                      </span>
                    </td>
                    <td>{s.batch}</td>
                    <td>{s.date}</td>
                    <td>
                      <span className={`${styles.status} ${statusVariant[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
