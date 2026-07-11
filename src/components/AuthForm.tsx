"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import styles from "./AuthForm.module.css";

type Mode = "login" | "signup";

const copy = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to continue your biology journey — your resources, classes, and AI tutor are waiting.",
    submit: "Sign In",
    switchPrompt: "New to CAIE-BIOLOGY?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Join CAIE-BIOLOGY to access curated resources, live classes, and AI-powered tutoring.",
    submit: "Create Account",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/login",
  },
} as const;

const panelPoints = [
  { icon: "ti-books", text: "Curated CAIE resources" },
  { icon: "ti-video", text: "Live & recorded classes" },
  { icon: "ti-sparkles", text: "AI tutor, available 24/7" },
];

export default function AuthForm({ mode }: { mode: Mode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const c = copy[mode];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (mode === "signup" && password !== String(data.get("confirmPassword") ?? "")) {
      setError("Passwords do not match.");
      return;
    }

    // No backend yet — acknowledge the submission locally
    setSubmitted(true);
  };

  return (
    <section className={styles.authSection}>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          {/* Brand side panel (desktop) */}
          <aside className={styles.panel} aria-hidden="true">
            <div className={styles.panelGlow} />
            <span className={styles.panelBadge}>
              <i className="ti ti-dna" /> CAIE-BIOLOGY
            </span>
            <h2 className={styles.panelTitle}>
              Biology, taught <em>properly.</em>
            </h2>
            <ul className={styles.panelList} role="list">
              {panelPoints.map((p) => (
                <li key={p.text}>
                  <i className={`ti ${p.icon}`} />
                  {p.text}
                </li>
              ))}
            </ul>
          </aside>

          {/* Form side */}
          <div className={styles.formSide}>
            <h1 className={styles.title}>{c.title}</h1>
            <p className={styles.subtitle}>{c.subtitle}</p>

            {submitted ? (
              <div className={styles.success} role="status">
                <i className="ti ti-circle-check" aria-hidden="true" />
                <div>
                  <strong>{mode === "login" ? "Signed in!" : "Account created!"}</strong>
                  <p>
                    {mode === "login"
                      ? "Redirecting you to your dashboard…"
                      : "Check your email to verify your account."}
                  </p>
                </div>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {mode === "signup" && (
                  <>
                    <div className={styles.field}>
                      <span className={styles.label}>I am a</span>
                      <div className={`${styles.roleBtn} ${styles.roleActive} ${styles.roleStatic}`}>
                        <i className="ti ti-school" aria-hidden="true" />
                        Student
                      </div>
                      <p className={styles.roleNote}>
                        Only students can register — teacher accounts are created by the admin.
                      </p>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="name">Full Name</label>
                      <input
                        className={styles.input}
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="e.g. Fahim Ferdous"
                        required
                      />
                    </div>
                  </>
                )}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">Email Address</label>
                  <input
                    className={styles.input}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="password">Password</label>
                    {mode === "login" && (
                      <a href="#" className={styles.forgot}>Forgot password?</a>
                    )}
                  </div>
                  <div className={styles.passwordWrap}>
                    <input
                      className={styles.input}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      className={styles.input}
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      required
                      minLength={8}
                    />
                  </div>
                )}

                {mode === "login" ? (
                  <label className={styles.checkboxRow}>
                    <input type="checkbox" name="remember" className={styles.checkbox} />
                    <span>Keep me signed in</span>
                  </label>
                ) : (
                  <label className={styles.checkboxRow}>
                    <input type="checkbox" name="terms" className={styles.checkbox} required />
                    <span>
                      I agree to the <a href="#" className={styles.inlineLink}>Terms</a> and{" "}
                      <a href="#" className={styles.inlineLink}>Privacy Policy</a>
                    </span>
                  </label>
                )}

                {error && (
                  <div className={styles.error} role="alert">
                    <i className="ti ti-alert-circle" aria-hidden="true" />
                    {error}
                  </div>
                )}

                <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`}>
                  {c.submit}
                  <i className="ti ti-arrow-right" aria-hidden="true" />
                </button>
              </form>
            )}

            <p className={styles.switchLine}>
              {c.switchPrompt}{" "}
              <Link href={c.switchHref} className={styles.switchLink}>{c.switchLabel}</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
