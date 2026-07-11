import Link from "next/link";
import type { AdminSection } from "@/lib/adminNav";
import styles from "./SectionPlaceholder.module.css";

export default function SectionPlaceholder({
  section,
  basePath = "/admin",
}: {
  section: AdminSection;
  basePath?: string;
}) {
  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{section.label}</h1>
          <p className={styles.pageSubtitle}>{section.description}</p>
        </div>
      </header>

      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <i className={`ti ${section.icon}`} />
        </div>
        <h2 className={styles.emptyTitle}>{section.label} is coming soon</h2>
        <p className={styles.emptyText}>
          This module hasn&apos;t been built yet. It will live at{" "}
          <code className={styles.code}>{basePath}/{section.slug}</code>.
        </p>
        <Link href={basePath} className="btn btn-secondary">
          <i className="ti ti-arrow-left" aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
