"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { setStudentSession } from "@/lib/studentAuth";
import styles from "./AuthForm.module.css";

type Mode = "login" | "signup";

const classOptions = ["IX", "X", "XI", "XII"];

type BatchOption = {
  id: string;
  class: string;
  time: string;
  location: string;
};

const batchLabelOf = (b: BatchOption) => `${b.time} — ${b.location}`;

// Everything a signup captures — mirrors the admin "Add Student" form so the
// pending record can be approved without re-keying anything.
type SignupRecord = {
  name: string;
  class: string;
  batchId: string;
  batchLabel: string;
  email: string;
  mobile: string;
  password: string;
  fathersName: string;
  fathersPhone: string;
  mothersName: string;
  mothersPhone: string;
  address: string;
  school: string;
};

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
  const [busy, setBusy] = useState(false);
  // Signup enrollment fields — class drives the cascading batch dropdown.
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [formClass, setFormClass] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const router = useRouter();
  const c = copy[mode];

  // Batches feed the signup batch picker, just like the admin form.
  useEffect(() => {
    if (mode !== "signup" || !isFirebaseConfigured) return;
    const qy = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    return onSnapshot(qy, (snap) => {
      setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BatchOption, "id">) })));
    });
  }, [mode]);

  const classBatches = batches.filter((b) => b.class === formClass);

  const handleLogin = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      setError("Sign-in is temporarily unavailable — please try again later.");
      return;
    }
    setBusy(true);
    try {
      const db = getFirebaseDb();
      // Students authenticate against the Firestore "Students" collection —
      // match the email, then check the stored password. (Staff use the
      // /admin and /assistant portals, which sign in with Firebase Auth.)
      const snap = await getDocs(
        query(collection(db, "Students"), where("email", "==", email))
      );

      if (snap.empty) {
        // A pending (not-yet-approved) signup has no student record yet
        const pending = await getDocs(
          query(collection(db, "PendingStudents"), where("email", "==", email))
        );
        setError(
          pending.empty
            ? "No student account found for this email. Contact your teacher to get enrolled."
            : "Your account is awaiting approval. You can sign in once a teacher approves it."
        );
        setBusy(false);
        return;
      }

      const student = snap.docs[0];
      if ((student.data() as { password?: string }).password !== password) {
        setError("Incorrect email or password.");
        setBusy(false);
        return;
      }

      setStudentSession(student.id);
      setSubmitted(true);
      router.replace("/student");
    } catch (err) {
      setError(`Could not sign in. (${(err as Error).message})`);
      setBusy(false);
    }
  };

  const handleSignup = async (record: SignupRecord) => {
    if (!isFirebaseConfigured) {
      setError("Signup is temporarily unavailable — please try again later.");
      return;
    }
    setBusy(true);
    try {
      const db = getFirebaseDb();
      const [studentSnap, pendingSnap] = await Promise.all([
        getDocs(query(collection(db, "Students"), where("email", "==", record.email))),
        getDocs(query(collection(db, "PendingStudents"), where("email", "==", record.email))),
      ]);
      if (!studentSnap.empty) {
        setError("An account with this email already exists — try signing in instead.");
        setBusy(false);
        return;
      }
      if (!pendingSnap.empty) {
        setError("A signup with this email is already awaiting approval.");
        setBusy(false);
        return;
      }

      // No auth account yet — the student stays pending, with all their details,
      // until a teacher approves and their record moves to "Students".
      await addDoc(collection(db, "PendingStudents"), {
        ...record,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(`Could not submit your signup. (${code || (err as Error).message})`);
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (mode === "login") {
      if (!password) {
        setError("Enter your password.");
        return;
      }
      void handleLogin(email, password);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== String(data.get("confirmPassword") ?? "")) {
      setError("Passwords do not match.");
      return;
    }

    const name = String(data.get("name") ?? "").trim();
    if (!name) {
      setError("Enter your full name.");
      return;
    }
    const mobile = String(data.get("mobile") ?? "").trim();
    if (!mobile) {
      setError("Enter your mobile number.");
      return;
    }
    if (!formClass) {
      setError("Select your class.");
      return;
    }
    const batch = batches.find((b) => b.id === formBatchId);
    if (!batch) {
      setError("Select your batch.");
      return;
    }

    void handleSignup({
      name,
      class: formClass,
      batchId: batch.id,
      batchLabel: batchLabelOf(batch),
      email,
      mobile,
      password,
      fathersName: String(data.get("fathersName") ?? "").trim(),
      fathersPhone: String(data.get("fathersPhone") ?? "").trim(),
      mothersName: String(data.get("mothersName") ?? "").trim(),
      mothersPhone: String(data.get("mothersPhone") ?? "").trim(),
      address: String(data.get("address") ?? "").trim(),
      school: String(data.get("school") ?? "").trim(),
    });
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
                  <strong>{mode === "login" ? "Signed in!" : "Signup submitted!"}</strong>
                  <p>
                    {mode === "login"
                      ? "Redirecting you to your dashboard…"
                      : "Your account is awaiting approval — you'll be able to sign in once a teacher approves it."}
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

                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="mobile">Mobile Number</label>
                        <input
                          className={styles.input}
                          id="mobile"
                          name="mobile"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+880 1XXX-XXXXXX"
                          required
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="class">Class</label>
                        <select
                          className={styles.input}
                          id="class"
                          name="class"
                          required
                          value={formClass}
                          onChange={(e) => {
                            setFormClass(e.target.value);
                            setFormBatchId("");
                          }}
                        >
                          <option value="" disabled>Select a class</option>
                          {classOptions.map((cl) => (
                            <option key={cl} value={cl}>{cl}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="batch">Batch</label>
                      <select
                        className={styles.input}
                        id="batch"
                        name="batch"
                        required
                        value={formBatchId}
                        onChange={(e) => setFormBatchId(e.target.value)}
                        disabled={!formClass}
                      >
                        <option value="" disabled>
                          {formClass ? "Select a batch" : "Select a class first"}
                        </option>
                        {classBatches.map((b) => (
                          <option key={b.id} value={b.id}>{batchLabelOf(b)}</option>
                        ))}
                      </select>
                      {formClass && classBatches.length === 0 && (
                        <p className={styles.roleNote}>
                          No batches for Class {formClass} yet — please contact your teacher.
                        </p>
                      )}
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
                  <>
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

                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="fathersName">
                          Father&apos;s Name <span className={styles.optional}>(Optional)</span>
                        </label>
                        <input className={styles.input} id="fathersName" name="fathersName"
                          type="text" autoComplete="off" placeholder="Father's full name" />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="fathersPhone">
                          Father&apos;s Phone <span className={styles.optional}>(Optional)</span>
                        </label>
                        <input className={styles.input} id="fathersPhone" name="fathersPhone"
                          type="tel" autoComplete="off" placeholder="+880 1XXX-XXXXXX" />
                      </div>
                    </div>

                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="mothersName">
                          Mother&apos;s Name <span className={styles.optional}>(Optional)</span>
                        </label>
                        <input className={styles.input} id="mothersName" name="mothersName"
                          type="text" autoComplete="off" placeholder="Mother's full name" />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="mothersPhone">
                          Mother&apos;s Phone <span className={styles.optional}>(Optional)</span>
                        </label>
                        <input className={styles.input} id="mothersPhone" name="mothersPhone"
                          type="tel" autoComplete="off" placeholder="+880 1XXX-XXXXXX" />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="address">
                        Address <span className={styles.optional}>(Optional)</span>
                      </label>
                      <input className={styles.input} id="address" name="address"
                        type="text" autoComplete="off" placeholder="Street, city" />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="school">
                        School <span className={styles.optional}>(Optional)</span>
                      </label>
                      <input className={styles.input} id="school" name="school"
                        type="text" autoComplete="off" placeholder="Current school" />
                    </div>
                  </>
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

                <button
                  type="submit"
                  className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                  disabled={busy}
                >
                  {busy ? (mode === "login" ? "Signing in…" : "Submitting…") : c.submit}
                  <i className="ti ti-arrow-right" aria-hidden="true" />
                </button>
              </form>
            )}

            <p className={styles.switchLine}>
              {c.switchPrompt}{" "}
              <Link href={c.switchHref} className={styles.switchLink}>{c.switchLabel}</Link>
            </p>
            {mode === "login" && (
              <p className={styles.switchLine}>
                Are you a parent?{" "}
                <Link href="/parent/login" className={styles.switchLink}>
                  Sign in with your child&apos;s ID
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
