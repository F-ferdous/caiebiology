"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  ASSISTANT_EMAIL_DOMAIN,
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from "@/lib/firebase";
import type { PanelRole } from "@/lib/panelRole";
import {
  notificationAudience,
  queueNotification,
  type NotifyRecord,
  type NotifyTarget,
} from "@/lib/notify";
import styles from "./AssistantsManager.module.css";
import announceStyles from "./AnnouncementsManager.module.css";

type BatchOption = {
  id: string;
  class: string;
  time: string;
  location: string;
};

type ModalState =
  | { status: "closed" }
  | { status: "busy"; title: string; text: string }
  | { status: "success"; title: string; text: string }
  | { status: "error"; message: string }
  | { status: "confirm"; announcement: NotifyRecord };

const classOptions = ["IX", "X", "XI", "XII"];

function batchLabelOf(b: BatchOption) {
  return `${b.time} — ${b.location}`;
}

function formatWhen(ts: Timestamp | null) {
  if (!ts) return "Just now";
  return ts.toDate().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Who's posting — "admin", or the assistant's username. */
function currentAuthor(role: PanelRole): string {
  if (role === "admin") return "admin";
  const email = getFirebaseAuth().currentUser?.email ?? "";
  return email.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`) ? email.split("@")[0] : "assistant";
}

export default function AnnouncementsManager({ role = "admin" }: { role?: PanelRole }) {
  const [announcements, setAnnouncements] = useState<NotifyRecord[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  const [modal, setModal] = useState<ModalState>({ status: "closed" });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<NotifyTarget>("all");
  const [formClass, setFormClass] = useState("");
  const [formBatchId, setFormBatchId] = useState("");

  // Live notice feed
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    // The Announcements section shows the announcement-type notifications; other
    // types (resources, tests, marks) are posted from their own sections.
    const q = query(collection(getFirebaseDb(), "Notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAnnouncements(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<NotifyRecord, "id">) }))
            .filter((n) => n.type === "announcement")
        );
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return unsub;
  }, []);

  // Batches feed the cascading target dropdown
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BatchOption, "id">) })));
    });
  }, []);

  const classBatches = batches.filter((b) => b.class === formClass);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setTarget("all");
    setFormClass("");
    setFormBatchId("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return;

    if ((target === "class" || target === "batch") && !formClass) {
      setModal({ status: "error", message: "Choose a class for this notice." });
      return;
    }
    if (target === "batch" && !formBatchId) {
      setModal({ status: "error", message: "Choose a batch for this notice." });
      return;
    }

    const batch = batches.find((b) => b.id === formBatchId);

    setModal({ status: "busy", title: "Posting…", text: "Sending the notice to students." });
    try {
      await queueNotification({
        type: "announcement",
        title: trimmedTitle,
        body: trimmedBody,
        target,
        class: formClass,
        batchId: formBatchId,
        batchLabel: batch ? batchLabelOf(batch) : null,
        createdBy: currentAuthor(role),
        createdByRole: role,
      });
      resetForm();
      setModal({
        status: "success",
        title: "Notice posted",
        text: "Students with notifications on will be alerted on their devices.",
      });
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      setModal({ status: "error", message: `Could not post the notice. (${code})` });
    }
  };

  const handleDelete = async (a: NotifyRecord) => {
    setModal({ status: "busy", title: "Deleting…", text: "Removing the notice." });
    try {
      await deleteDoc(doc(getFirebaseDb(), "Notifications", a.id));
      setModal({ status: "success", title: "Notice deleted", text: `“${a.title}” was removed.` });
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      setModal({ status: "error", message: `Could not delete the notice. (${code})` });
    }
  };

  const canSubmit =
    isFirebaseConfigured &&
    title.trim() &&
    body.trim() &&
    (target === "all" || (formClass && (target === "class" || formBatchId)));

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Announcements</h1>
          <p className={styles.pageSubtitle}>
            Post a notice to everyone, a class, or a single batch — students get a push
            notification on their devices.
          </p>
        </div>
      </header>

      {!isFirebaseConfigured && (
        <div className={styles.configWarning} role="alert">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <div>
            <strong>Firebase is not configured.</strong>
            <p>
              Add your Firebase web app keys to <code>.env.local</code> and restart the dev server.
            </p>
          </div>
        </div>
      )}

      {/* ---- Composer ---- */}
      <section className={styles.panel} aria-labelledby="compose-title">
        <div className={styles.panelHeader}>
          <h2 id="compose-title" className={styles.panelTitle}>New Notice</h2>
        </div>

        <form className={announceStyles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-title">Title</label>
            <input
              className={styles.input}
              id="ann-title"
              type="text"
              placeholder="e.g. Class cancelled tomorrow"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isFirebaseConfigured}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-body">Message</label>
            <textarea
              className={`${styles.input} ${announceStyles.textarea}`}
              id="ann-body"
              placeholder="Write the notice students will see…"
              value={body}
              maxLength={500}
              rows={4}
              onChange={(e) => setBody(e.target.value)}
              disabled={!isFirebaseConfigured}
              required
            />
            <p className={styles.hint}>{body.length}/500</p>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Send to</span>
            <div className={announceStyles.segmented} role="group" aria-label="Audience">
              {(
                [
                  { key: "all" as const, label: "All students", icon: "ti-users" },
                  { key: "class" as const, label: "By class", icon: "ti-school" },
                  { key: "batch" as const, label: "By batch", icon: "ti-stack-2" },
                ]
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`${announceStyles.segment} ${target === opt.key ? announceStyles.segmentOn : ""}`}
                  aria-pressed={target === opt.key}
                  onClick={() => {
                    setTarget(opt.key);
                    if (opt.key === "all") {
                      setFormClass("");
                      setFormBatchId("");
                    }
                    if (opt.key === "class") setFormBatchId("");
                  }}
                >
                  <i className={`ti ${opt.icon}`} aria-hidden="true" /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(target === "class" || target === "batch") && (
            <div className={announceStyles.cascade}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ann-class">Class</label>
                <select
                  className={styles.input}
                  id="ann-class"
                  value={formClass}
                  onChange={(e) => {
                    setFormClass(e.target.value);
                    setFormBatchId("");
                  }}
                  required
                >
                  <option value="">Select a class…</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {target === "batch" && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ann-batch">Batch</label>
                  <select
                    className={styles.input}
                    id="ann-batch"
                    value={formBatchId}
                    onChange={(e) => setFormBatchId(e.target.value)}
                    disabled={!formClass}
                    required
                  >
                    <option value="">{formClass ? "Select a batch…" : "Select a class first"}</option>
                    {classBatches.map((b) => (
                      <option key={b.id} value={b.id}>{batchLabelOf(b)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            <i className="ti ti-send" aria-hidden="true" /> Post Notice
          </button>
        </form>
      </section>

      {/* ---- Posted notices ---- */}
      <section className={styles.panel} aria-labelledby="posted-title">
        <div className={styles.panelHeader}>
          <h2 id="posted-title" className={styles.panelTitle}>Posted Notices</h2>
          <span className="badge badge-default">{announcements.length}</span>
        </div>

        {loadingList ? (
          <p className={styles.emptyText}>Loading notices…</p>
        ) : announcements.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-speakerphone" aria-hidden="true" />
            <p className={styles.emptyText}>
              No notices yet — post your first one above.
            </p>
          </div>
        ) : (
          <ul className={announceStyles.feed} role="list">
            {announcements.map((a) => (
              <li key={a.id} className={announceStyles.feedItem}>
                <div className={announceStyles.feedMain}>
                  <div className={announceStyles.feedTop}>
                    <span className={announceStyles.feedTitle}>{a.title}</span>
                    <span className={announceStyles.chip}>
                      <i className="ti ti-target-arrow" aria-hidden="true" />
                      {notificationAudience(a)}
                    </span>
                  </div>
                  <p className={announceStyles.feedBody}>{a.body}</p>
                  <div className={announceStyles.feedMeta}>
                    <span><i className="ti ti-clock" aria-hidden="true" /> {formatWhen(a.createdAt)}</span>
                    {a.createdBy && <span><i className="ti ti-user" aria-hidden="true" /> {a.createdBy}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  aria-label={`Delete ${a.title}`}
                  onClick={() => setModal({ status: "confirm", announcement: a })}
                >
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Modal ---- */}
      {modal.status !== "closed" && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Notice dialog">
          {modal.status === "confirm" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete notice?</h3>
              <p className={styles.modalText}>
                <strong>{modal.announcement.title}</strong> will be removed from the students&apos;
                feed. This can&apos;t be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`} onClick={() => handleDelete(modal.announcement)}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.modal}>
              {modal.status === "busy" && (
                <>
                  <div className={styles.spinner} aria-hidden="true" />
                  <h3 className={styles.modalTitle}>{modal.title}</h3>
                  <p className={styles.modalText}>{modal.text}</p>
                </>
              )}
              {modal.status === "success" && (
                <>
                  <div className={`${styles.modalIcon} ${styles.modalIconSuccess}`} aria-hidden="true">
                    <i className="ti ti-circle-check" />
                  </div>
                  <h3 className={styles.modalTitle}>{modal.title}</h3>
                  <p className={styles.modalText}>{modal.text}</p>
                  <button className="btn btn-primary" onClick={() => setModal({ status: "closed" })}>
                    Done
                  </button>
                </>
              )}
              {modal.status === "error" && (
                <>
                  <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                    <i className="ti ti-alert-circle" />
                  </div>
                  <h3 className={styles.modalTitle}>Something went wrong</h3>
                  <p className={styles.modalText}>{modal.message}</p>
                  <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                    Close
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
