"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import styles from "./Navbar.module.css";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Batches", href: "/#batches" },
  { label: "Features", href: "/#features" },
  { label: "AI Tutor", href: "/#ai" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  const isDark = theme === "dark";

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`} role="banner">
      <nav className={`${styles.nav} container`} aria-label="Primary navigation">
        <a href="/" className={styles.brand} aria-label="CAIE-BIOLOGY home">
          <div className={styles.logoBox} aria-hidden="true">
            <i className="ti ti-dna" />
          </div>
          <span className={styles.brandText}>
            <span className={styles.brandFirst}>CAIE-</span>
            <span className={styles.brandSecond}>BIOLOGY</span>
          </span>
        </a>

        {/* Desktop links */}
        <ul className={styles.navLinks} role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={styles.navLink}>{link.label}</a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className={styles.navActions}>
          <button
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={styles.themeToggle}
            onClick={toggleTheme}
            id="theme-toggle-btn"
          >
            <span className={`${styles.themeIconWrap} ${isDark ? styles.themeIconDark : ""}`}>
              {/* Sun icon */}
              <svg
                className={styles.themeSun}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              {/* Moon icon */}
              <svg
                className={styles.themeMoon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          </button>
          <Link href="/login" className={`btn btn-secondary-on-dark ${styles.signInBtn}`}>Sign In</Link>
          <Link href="/signup" className={`btn btn-primary ${styles.getStartedBtn}`}>Get Started</Link>
          <button
            className={styles.hamburger}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.h1 : ""}`} />
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.h2 : ""}`} />
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.h3 : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}
        role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <ul role="list">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>{l.label}</a>
            </li>
          ))}
          <li>
            <button
              className={styles.drawerThemeToggle}
              onClick={toggleTheme}
            >
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </li>
          <li><Link href="/login" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>Sign in</Link></li>
          <li><Link href="/signup" className={`btn btn-primary ${styles.drawerBtn}`} onClick={() => setMenuOpen(false)}>Get Started</Link></li>
        </ul>
      </div>
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />}
    </header>
  );
}
