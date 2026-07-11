"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { assistantEmail, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import formStyles from "../AuthForm.module.css";
import styles from "../admin/AdminLogin.module.css";

const loginErrorMessages: Record<string, string> = {
  "auth/invalid-credential": "Invalid username or password.",
  "auth/user-not-found": "Invalid username or password.",
  "auth/wrong-password": "Invalid username or password.",
  "auth/too-many-requests": "Too many attempts — try again in a few minutes.",
  "auth/network-request-failed": "Network error — check your connection and try again.",
};

export default function AssistantLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError("Firebase is not configured — contact the administrator.");
      return;
    }

    const data = new FormData(e.currentTarget);
    const username = String(data.get("username") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), assistantEmail(username), password);
      router.replace("/assistant");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(loginErrorMessages[code] ?? `Could not sign in. (${code})`);
      setBusy(false);
    }
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
              <i className="ti ti-user-cog" aria-hidden="true" /> Assistant Portal
            </span>
            <h1 className={styles.title}>
              CAIE-<em>BIOLOGY</em>
            </h1>
            <p className={styles.headerNote}>Sign in with the credentials the admin gave you.</p>
          </div>

          <form className={`${formStyles.form} ${styles.form}`} onSubmit={handleSubmit} noValidate>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="username">Username</label>
              <input
                className={formStyles.input}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Your username"
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

            <button
              type="submit"
              className={`btn btn-primary btn-lg ${formStyles.submitBtn}`}
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign In"}
              {!busy && <i className="ti ti-arrow-right" aria-hidden="true" />}
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
