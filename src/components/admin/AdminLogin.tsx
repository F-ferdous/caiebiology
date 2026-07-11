"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY, verifyAdmin } from "@/lib/adminAuth";
import formStyles from "../AuthForm.module.css";
import styles from "./AdminLogin.module.css";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const id = String(data.get("adminId") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!verifyAdmin(id, password)) {
      setError("Invalid admin ID or password.");
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    router.replace("/admin");
  };

  return (
    <section className={styles.section}>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.headerGlow} aria-hidden="true" />
            <div className={styles.logoBox} aria-hidden="true">
              <i className="ti ti-dna" />
            </div>
            <span className={styles.headerBadge}>
              <i className="ti ti-lock" aria-hidden="true" /> Admin Console
            </span>
            <h1 className={styles.title}>
              CAIE-<em>BIOLOGY</em>
            </h1>
            <p className={styles.headerNote}>Restricted area — authorized staff only.</p>
          </div>

          <form className={`${formStyles.form} ${styles.form}`} onSubmit={handleSubmit} noValidate>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="adminId">Admin ID</label>
              <input
                className={formStyles.input}
                id="adminId"
                name="adminId"
                type="text"
                autoComplete="username"
                placeholder="Your admin ID"
                required
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="password">Password</label>
              <div className={formStyles.passwordWrap}>
                <input
                  className={formStyles.input}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  className={formStyles.eyeBtn}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {error && (
              <div className={formStyles.error} role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            <button type="submit" className={`btn btn-primary btn-lg ${formStyles.submitBtn}`}>
              Sign In to Console
              <i className="ti ti-arrow-right" aria-hidden="true" />
            </button>
          </form>

          <p className={styles.backLine}>
            <Link href="/" className={styles.backLink}>
              <i className="ti ti-arrow-left" aria-hidden="true" /> Back to site
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
