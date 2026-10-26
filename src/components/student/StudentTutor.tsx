"use client";

import { useEffect, useRef, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  askTutor,
  subscribeTutorHistory,
  tutorLevelLabel,
  type TutorMessage,
} from "@/lib/tutor";
import { useStudent } from "./StudentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentTutor.module.css";

const MAX_CHARS = 400;

const STARTERS = [
  "Explain the role of ATP synthase",
  "What's the difference between mitosis and meiosis?",
  "Why is water important to living organisms?",
];

export default function StudentTutor() {
  const student = useStudent();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const level = tutorLevelLabel(student.class);

  // Live-follow this student's saved chat (the function writes every exchange).
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribeTutorHistory(
      student.id,
      (msgs) => {
        setMessages(msgs);
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsub;
  }, [student.id]);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || sending) return;
    setError(null);
    setSending(true);
    setDraft("");
    try {
      await askTutor(student.id, q, messages);
      // The answer arrives via the Firestore subscription — no manual append.
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setDraft(q); // give the question back so they don't retype it
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  const empty = loaded && messages.length === 0;

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>AI Tutor</h1>
          <p className={adminStyles.pageSubtitle}>
            Ask anything about your biology topics
            {level ? ` — grounded in your ${level} syllabus.` : "."}
          </p>
        </div>
      </header>

      <section className={styles.chat} aria-label="AI tutor conversation">
        <div className={styles.messages} ref={scrollRef}>
          {!loaded && <p className={styles.hint}>Loading your conversation…</p>}

          {empty && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon} aria-hidden="true">
                <i className="ti ti-sparkles" />
              </div>
              <p className={styles.welcomeTitle}>Stuck on a topic?</p>
              <p className={styles.welcomeText}>
                Ask your question in plain words. Try one of these to start:
              </p>
              <div className={styles.starters}>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.starter}
                    onClick={() => void send(s)}
                    disabled={sending}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.msg} ${m.role === "user" ? styles.msgUser : styles.msgAI}`}
            >
              {m.role === "assistant" && (
                <span className={styles.msgBadge} aria-hidden="true">
                  <i className="ti ti-sparkles" />
                </span>
              )}
              <div className={styles.msgBubble}>{m.content}</div>
            </div>
          ))}

          {sending && (
            <div className={`${styles.msg} ${styles.msgAI}`}>
              <span className={styles.msgBadge} aria-hidden="true">
                <i className="ti ti-sparkles" />
              </span>
              <div className={`${styles.msgBubble} ${styles.typing}`}>
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" /> {error}
          </p>
        )}

        <form className={styles.inputRow} onSubmit={onSubmit}>
          <input
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Ask a biology question…"
            maxLength={MAX_CHARS}
            disabled={sending}
            aria-label="Your question"
          />
          <button
            type="submit"
            className={styles.send}
            disabled={sending || !draft.trim()}
            aria-label="Send question"
          >
            <i className={`ti ${sending ? "ti-loader-2" : "ti-send"} ${sending ? styles.spin : ""}`} />
          </button>
        </form>
      </section>
    </div>
  );
}
