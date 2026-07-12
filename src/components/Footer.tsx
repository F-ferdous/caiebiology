import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.inner}`}>
        {/* Brand + tagline */}
        <div className={styles.brand}>
          <a href="/" className={styles.logo} aria-label="CAIE-BIOLOGY home">
            <div className={styles.logoBox} aria-hidden="true">
              <i className="ti ti-dna" />
            </div>
            <span className={styles.logoText}>
              <span className={styles.logoBio}>CAIE-</span>
              <span className={styles.logoEdu}>BIOLOGY</span>
            </span>
          </a>
          <p className={styles.tagline}>
            CAIE-BIOLOGY is a dedicated biology learning platform for Cambridge
            (CAIE) students — IGCSE, AS &amp; A Level. Join live batches taught in
            small groups, access curated notes and past-paper resources, and get
            instant help from an AI tutor trained on the CAIE syllabus.
          </p>
          <div className={styles.social}>
            {[
              { icon: "ti-brand-twitter", label: "Twitter" },
              { icon: "ti-brand-instagram", label: "Instagram" },
              { icon: "ti-brand-youtube", label: "YouTube" },
            ].map((s) => (
              <a key={s.label} href="#" className={styles.socialLink} aria-label={s.label}>
                <i className={`ti ${s.icon}`} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <nav className={styles.links} aria-label="Footer navigation">
          <div>
            <h3 className={styles.groupTitle}>Platform</h3>
            <ul role="list">
              {[
                { label: "Home", href: "/" },
                { label: "Features", href: "/features" },
                { label: "Batches", href: "/batches" },
                { label: "AI Tutor", href: "/#ai" },
              ].map((l) => (
                <li key={l.label}><Link href={l.href} className={styles.link}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={styles.groupTitle}>Account</h3>
            <ul role="list">
              <li><Link href="/login" className={styles.link}>Sign In</Link></li>
              <li><Link href="/signup" className={styles.link}>Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h3 className={styles.groupTitle}>Company</h3>
            <ul role="list">
              {["About", "Blog", "Privacy", "Terms"].map((l) => (
                <li key={l}><a href="#" className={styles.link}>{l}</a></li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Bottom bar — from design system reference */}
      <div className={`container ${styles.bottom}`}>
        <p className={styles.copyright}>© {new Date().getFullYear()} CAIE-BIOLOGY. All rights reserved.</p>
        <div className={styles.certBadges}>
          <span className={styles.certBadge}><i className="ti ti-certificate" aria-hidden="true" />CAIE Aligned</span>
          <span className={styles.certBadge}><i className="ti ti-shield-check" aria-hidden="true" />GDPR Compliant</span>
        </div>
      </div>
    </footer>
  );
}
