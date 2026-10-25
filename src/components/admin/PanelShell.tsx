"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../ThemeProvider";
import PushToaster from "../pwa/PushToaster";
import styles from "./AdminShell.module.css";

export type PanelNavItem = { href: string; label: string; icon: string };

type Props = {
  homeHref: string;
  navItems: PanelNavItem[];
  badgeLabel: string;
  avatarInitial: string;
  sectionsLabel?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

export default function PanelShell({
  homeHref,
  navItems,
  badgeLabel,
  avatarInitial,
  sectionsLabel = "Manage",
  onLogout,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Close the mobile drawer on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === homeHref ? pathname === homeHref : pathname.startsWith(href);

  const [dashboard, ...sections] = navItems;

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <Link href={homeHref} className={styles.brand} aria-label="Dashboard home">
          <div className={styles.logoBox} aria-hidden="true">
            <i className="ti ti-dna" />
          </div>
          <span className={styles.brandText}>
            <span className={styles.brandFirst}>CAIE-</span>
            <span className={styles.brandSecond}>BIOLOGY</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label={`${badgeLabel} navigation`}>
          <span className={styles.navGroupLabel}>Overview</span>
          <Link
            href={dashboard.href}
            className={`${styles.navLink} ${isActive(dashboard.href) ? styles.navLinkActive : ""}`}
          >
            <i className={`ti ${dashboard.icon}`} aria-hidden="true" />
            <span className={styles.navLabel}>{dashboard.label}</span>
          </Link>

          <span className={styles.navGroupLabel}>{sectionsLabel}</span>
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`${styles.navLink} ${isActive(s.href) ? styles.navLinkActive : ""}`}
            >
              <i className={`ti ${s.icon}`} aria-hidden="true" />
              <span className={styles.navLabel}>{s.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={onLogout}>
            <i className="ti ti-logout" aria-hidden="true" />
            <span className={styles.navLabel}>Log out</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Main column */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.hamburger}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className="ti ti-menu-2" aria-hidden="true" />
          </button>

          <div className={styles.topbarRight}>
            <button
              className={styles.themeToggle}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              <i className={`ti ${isDark ? "ti-sun" : "ti-moon"}`} aria-hidden="true" />
            </button>
            <span className="badge badge-black">{badgeLabel}</span>
            <div className={styles.avatar} aria-hidden="true">{avatarInitial}</div>
          </div>
        </header>

        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>

      <PushToaster />
    </div>
  );
}
