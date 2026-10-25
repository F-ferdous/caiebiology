"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { phoneMatches, setParentSession, type ParentKind } from "@/lib/parentAuth";
import formStyles from "../AuthForm.module.css";
import styles from "../admin/AdminLogin.module.css";

type StudentDoc = {
  studentId?: string;
  mothersPhone?: string;
  fathersPhone?: string;
};

export default function ParentLogin() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError("Sign-in is temporarily unavailable — please try again later.");
      return;
    }

    const data = new FormData(e.currentTarget);
    const studentId = String(data.get("studentId") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();

    if (!studentId || !phone) {
      setError("Enter your child's Student ID and your phone number.");
      return;
    }

    setBusy(true);
    try {
      const db = getFirebaseDb();
      // Match the child by their admin-assigned Student ID…
      const snap = await getDocs(
        query(collection(db, "Students"), where("studentId", "==", studentId))
      );
      if (snap.empty) {
        setError("No student found with that ID. Check the ID on your child's profile, or ask the teacher.");
        setBusy(false);
        return;
      }

      // …then verify the phone against a parent number on any matching record.
      for (const docSnap of snap.docs) {
        const s = docSnap.data() as StudentDoc;
        let parent: ParentKind | null = null;
        if (phoneMatches(phone, s.mothersPhone)) parent = "mother";
        else if (phoneMatches(phone, s.fathersPhone)) parent = "father";
        if (parent) {
          setParentSession({ childId: docSnap.id, parent });
          router.replace("/parent");
          return;
        }
      }

      setError("That phone number doesn't match a parent on this student's record.");
      setBusy(false);
    } catch (err) {
      setError(`Could not sign in. (${(err as Error).message})`);
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
              <i className="ti ti-users" aria-hidden="true" /> Parent Portal
            </span>
            <h1 className={styles.title}>
              CAIE-<em>BIOLOGY</em>
            </h1>
            <p className={styles.headerNote}>
              Track your child&apos;s classes, tests, and payments.
            </p>
          </div>

          <form className={`${formStyles.form} ${styles.form}`} onSubmit={handleSubmit} noValidate>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="studentId">Student ID</label>
              <input
                className={formStyles.input}
                id="studentId"
                name="studentId"
                type="text"
                autoComplete="off"
                placeholder="Your child's Student ID"
                required
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="phone">Your Phone Number</label>
              <input
                className={formStyles.input}
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="The mother's or father's phone on file"
                required
              />
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
