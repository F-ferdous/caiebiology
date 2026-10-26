"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { askTutor, tutorLevelLabel, type TutorMessage } from "@/lib/tutor";
import { useStudent } from "./StudentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import styles from "./StudentTutor.module.css";

const MAX_CHARS = 400;

const STARTERS = [
  "Explain the role of ATP synthase",
  "What's the difference between mitosis and meiosis?",
  "Why is water important to living organisms?",
];

type Phase = "idle" | "thinking" | "streaming";

// A message in the on-screen chat. `shown` is the progressively-revealed text
// used by the typewriter; falls back to the full `content`.
type ChatMsg = TutorMessage & { localId: string; shown?: string; streaming?: boolean };

const uid = () => Math.random().toString(36).slice(2);

// Turn Markdown into plain prose so text-to-speech doesn't read "asterisk".
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function StudentTutor() {
  const student = useStudent();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typeTimer = useRef<number | null>(null);

  const level = tutorLevelLabel(student.class);
  const busy = phase !== "idle";

  // Each visit opens a fresh conversation — past chats are still saved to
  // Firestore (for teacher review) but aren't replayed to the student here.

  // Keep the newest content in view as it streams in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  // Stop any typing / speech when leaving the page.
  useEffect(
    () => () => {
      if (typeTimer.current) window.clearTimeout(typeTimer.current);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* no-op */
      }
    },
    []
  );

  // Reveal `full` into the message's `shown` text, a few chars per frame, so it
  // always finishes in ~2.5s regardless of length. Honours reduced-motion.
  const typewriter = useCallback((localId: string, full: string) => {
    const finish = () =>
      setMessages((prev) =>
        prev.map((m) => (m.localId === localId ? { ...m, shown: full, streaming: false } : m))
      );

    if (prefersReducedMotion()) {
      finish();
      setPhase("idle");
      return;
    }

    const frames = 150; // ~2.5s at ~60fps
    const step = Math.max(1, Math.ceil(full.length / frames));
    let i = 0;
    const tick = () => {
      i = Math.min(full.length, i + step);
      const slice = full.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.localId === localId ? { ...m, shown: slice } : m))
      );
      if (i < full.length) {
        typeTimer.current = window.setTimeout(tick, 16);
      } else {
        finish();
        setPhase("idle");
      }
    };
    typeTimer.current = window.setTimeout(tick, 16);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || busy) return;
      setError(null);
      setDraft("");

      const userMsg: ChatMsg = { localId: uid(), role: "user", content: q, shown: q };
      const history = messages;
      setMessages((prev) => [...prev, userMsg]);
      setPhase("thinking");

      try {
        const { answer } = await askTutor(student.id, q, history);
        const aId = uid();
        setMessages((prev) => [
          ...prev,
          { localId: aId, role: "assistant", content: answer, shown: "", streaming: true },
        ]);
        setPhase("streaming");
        typewriter(aId, answer);
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Something went wrong. Please try again.";
        setError(message);
        setDraft(q);
        // Drop the optimistic question so a retry doesn't duplicate it.
        setMessages((prev) => prev.filter((m) => m.localId !== userMsg.localId));
        setPhase("idle");
      }
    },
    [busy, messages, student.id, typewriter]
  );

  const speak = useCallback(
    (localId: string, text: string) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) return;
      // Toggle off if this message is already being read.
      if (speakingId === localId) {
        synth.cancel();
        setSpeakingId(null);
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(stripMarkdown(text));
      utter.rate = 1;
      utter.onend = () => setSpeakingId((cur) => (cur === localId ? null : cur));
      utter.onerror = () => setSpeakingId((cur) => (cur === localId ? null : cur));
      setSpeakingId(localId);
      synth.speak(utter);
    },
    [speakingId]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const empty = messages.length === 0;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

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
        <div className={styles.ambientGlow} aria-hidden="true" />

        {/* AI identity bar */}
        <div className={styles.aiBar}>
          <span className={`${styles.orb} ${styles.orbSm} ${busy ? styles.orbActive : ""}`} aria-hidden="true" />
          <div className={styles.aiMeta}>
            <span className={styles.aiName}>CAIE Bio AI</span>
            <span className={styles.aiStatus}>
              <span className={styles.statusDot} />
              {phase === "thinking" ? "Thinking…" : phase === "streaming" ? "Responding…" : "Online"}
            </span>
          </div>
        </div>

        <div className={styles.messages} ref={scrollRef}>
          {empty && (
            <div className={styles.welcome}>
              <div className={styles.welcomeOrb} aria-hidden="true">
                <span className={`${styles.orb} ${styles.orbLg}`} />
              </div>
              <p className={styles.welcomeTitle}>Stuck on a topic?</p>
              <p className={styles.welcomeText}>
                Ask your question in plain words. Try one of these to start:
              </p>
              <div className={styles.starters}>
                {STARTERS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.starter}
                    style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                    onClick={() => void send(s)}
                    disabled={busy}
                  >
                    <i className="ti ti-sparkles" aria-hidden="true" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.localId}
              className={`${styles.msg} ${m.role === "user" ? styles.msgUser : styles.msgAI}`}
            >
              {m.role === "assistant" && (
                <span className={`${styles.orb} ${styles.orbMsg}`} aria-hidden="true" />
              )}
              {m.role === "assistant" ? (
                <div className={styles.msgCol}>
                  <div className={`${styles.msgBubble} ${styles.markdown}`}>
                    <Markdown>{m.shown ?? m.content}</Markdown>
                    {m.streaming && <span className={styles.caret} aria-hidden="true" />}
                  </div>
                  {!m.streaming && canSpeak && (
                    <button
                      type="button"
                      className={`${styles.speakBtn} ${speakingId === m.localId ? styles.speaking : ""}`}
                      onClick={() => speak(m.localId, m.content)}
                      aria-label={speakingId === m.localId ? "Stop reading" : "Read answer aloud"}
                    >
                      <i className={`ti ${speakingId === m.localId ? "ti-player-stop-filled" : "ti-volume"}`} aria-hidden="true" />
                      <span className={styles.waves} aria-hidden="true">
                        <span /><span /><span /><span />
                      </span>
                      {speakingId === m.localId ? "Stop" : "Listen"}
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.msgBubble}>{m.content}</div>
              )}
            </div>
          ))}

          {phase === "thinking" && (
            <div className={`${styles.msg} ${styles.msgAI}`}>
              <span className={`${styles.orb} ${styles.orbMsg} ${styles.orbActive}`} aria-hidden="true" />
              <div className={`${styles.msgBubble} ${styles.thinking}`}>
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
            disabled={busy}
            aria-label="Your question"
          />
          <button
            type="submit"
            className={styles.send}
            disabled={busy || !draft.trim()}
            aria-label="Send question"
          >
            <i className={`ti ${busy ? "ti-loader-2" : "ti-send"} ${busy ? styles.spin : ""}`} />
          </button>
        </form>
      </section>
    </div>
  );
}
