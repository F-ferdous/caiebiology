"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ASSISTANT_EMAIL_DOMAIN,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  isFirebaseConfigured,
} from "@/lib/firebase";
import type { PanelRole } from "@/lib/panelRole";
import { queueNotification } from "@/lib/notify";
import styles from "./AssistantsManager.module.css";
import announceStyles from "./AnnouncementsManager.module.css";
import resourceStyles from "./ResourcesManager.module.css";

/** A resource targets students the same way announcements do, plus by location. */
type ResourceTarget = "all" | "class" | "batch" | "location";
type ResourceType = "pdf" | "notes" | "video" | "link";

type ResourceRecord = {
  id: string;
  title: string;
  type: ResourceType;
  description: string;
  /** External URL or the download URL of an uploaded file. */
  link: string;
  /** Storage path when a file was uploaded — kept so delete can remove it. */
  filePath: string | null;
  target: ResourceTarget;
  class: string | null;
  batchId: string | null;
  batchLabel: string | null;
  location: string | null;
  createdBy: string;
  createdByRole: "admin" | "assistant" | "system";
  createdAt: Timestamp | null;
};

type BatchOption = { id: string; class: string; time: string; location: string };

type ModalState =
  | { status: "closed" }
  | { status: "busy"; title: string; text: string }
  | { status: "success"; title: string; text: string }
  | { status: "error"; message: string }
  | { status: "confirm"; resource: ResourceRecord };

const classOptions = ["IX", "X", "XI", "XII"];

const typeOptions: { key: ResourceType; label: string; icon: string }[] = [
  { key: "pdf", label: "PDF", icon: "ti-file-type-pdf" },
  { key: "notes", label: "Notes", icon: "ti-notes" },
  { key: "video", label: "Video", icon: "ti-video" },
  { key: "link", label: "Link", icon: "ti-link" },
];

const typeIcon = (type: string) =>
  typeOptions.find((t) => t.key === type)?.icon ?? "ti-file-text";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

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

function audienceLabel(r: ResourceRecord) {
  switch (r.target) {
    case "all":
      return "All students";
    case "class":
      return r.class ? `Class ${r.class}` : "A class";
    case "batch":
      return r.batchLabel ? `Batch · ${r.batchLabel}` : "A batch";
    case "location":
      return r.location ? `Location · ${r.location}` : "A location";
    default:
      return "Students";
  }
}

/** Who's posting — "admin", or the assistant's username. */
function currentAuthor(role: PanelRole): string {
  if (role === "admin") return "admin";
  const email = getFirebaseAuth().currentUser?.email ?? "";
  return email.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`) ? email.split("@")[0] : "assistant";
}

export default function ResourcesManager({ role = "admin" }: { role?: PanelRole }) {
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  const [modal, setModal] = useState<ModalState>({ status: "closed" });

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("pdf");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<"upload" | "link">("upload");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [target, setTarget] = useState<ResourceTarget>("all");
  const [formClass, setFormClass] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const [formLocation, setFormLocation] = useState("");

  // Live resources feed
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Resources"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setResources(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResourceRecord, "id">) }))
        );
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return unsub;
  }, []);

  // Batches feed the class→batch cascade and the location list
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BatchOption, "id">) })));
    });
  }, []);

  const classBatches = batches.filter((b) => b.class === formClass);
  const locations = Array.from(new Set(batches.map((b) => b.location).filter(Boolean))).sort();

  const resetForm = () => {
    setTitle("");
    setType("pdf");
    setDescription("");
    setSource("upload");
    setLinkUrl("");
    setFile(null);
    setTarget("all");
    setFormClass("");
    setFormBatchId("");
    setFormLocation("");
  };

  const pickFile = (f: File | null) => {
    if (f && f.size > MAX_FILE_BYTES) {
      setModal({ status: "error", message: "That file is over 25 MB — please upload a smaller file or share a link instead." });
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const trimmedLink = linkUrl.trim();
    if (source === "link" && !trimmedLink) {
      setModal({ status: "error", message: "Add the resource link, or switch to uploading a file." });
      return;
    }
    if (source === "upload" && !file) {
      setModal({ status: "error", message: "Choose a file to upload, or switch to sharing a link." });
      return;
    }
    if ((target === "class" || target === "batch") && !formClass) {
      setModal({ status: "error", message: "Choose a class for this resource." });
      return;
    }
    if (target === "batch" && !formBatchId) {
      setModal({ status: "error", message: "Choose a batch for this resource." });
      return;
    }
    if (target === "location" && !formLocation) {
      setModal({ status: "error", message: "Choose a location for this resource." });
      return;
    }

    const batch = batches.find((b) => b.id === formBatchId);

    setModal({ status: "busy", title: "Publishing…", text: "Sharing the resource with students." });
    try {
      let link = trimmedLink;
      let filePath: string | null = null;
      if (source === "upload" && file) {
        filePath = `resources/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const storageRef = ref(getFirebaseStorage(), filePath);
        await uploadBytes(storageRef, file, { contentType: file.type || undefined });
        link = await getDownloadURL(storageRef);
      }

      await addDoc(collection(getFirebaseDb(), "Resources"), {
        title: trimmedTitle,
        type,
        description: description.trim(),
        link,
        filePath,
        target,
        class: target === "class" || target === "batch" ? formClass : null,
        batchId: target === "batch" ? formBatchId : null,
        batchLabel: target === "batch" && batch ? batchLabelOf(batch) : null,
        location: target === "location" ? formLocation : null,
        createdBy: currentAuthor(role),
        createdByRole: role,
        createdAt: serverTimestamp(),
      });

      // Push + Notices feed. The notification engine targets all/class/batch;
      // location-only resources still appear in the student Resources tab.
      if (target !== "location") {
        await queueNotification({
          type: "resource",
          title: `New resource: ${trimmedTitle}`,
          body: description.trim() || "New study material has been shared.",
          target,
          class: formClass,
          batchId: formBatchId,
          batchLabel: batch ? batchLabelOf(batch) : null,
          createdBy: currentAuthor(role),
          createdByRole: role,
        });
      }

      resetForm();
      setModal({
        status: "success",
        title: "Resource published",
        text: "Students can now open it from their Resources tab.",
      });
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      setModal({ status: "error", message: `Could not publish the resource. (${code})` });
    }
  };

  const handleDelete = async (r: ResourceRecord) => {
    setModal({ status: "busy", title: "Deleting…", text: "Removing the resource." });
    try {
      if (r.filePath) {
        await deleteObject(ref(getFirebaseStorage(), r.filePath)).catch(() => {});
      }
      await deleteDoc(doc(getFirebaseDb(), "Resources", r.id));
      setModal({ status: "success", title: "Resource deleted", text: `“${r.title}” was removed.` });
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      setModal({ status: "error", message: `Could not delete the resource. (${code})` });
    }
  };

  const canSubmit =
    isFirebaseConfigured &&
    !!title.trim() &&
    (source === "link" ? !!linkUrl.trim() : !!file) &&
    (target === "all" ||
      (target === "class" && !!formClass) ||
      (target === "batch" && !!formClass && !!formBatchId) ||
      (target === "location" && !!formLocation));

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Resources</h1>
          <p className={styles.pageSubtitle}>
            Share notes, PDFs, videos, and links with everyone, a class, a batch, or a location.
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
          <h2 id="compose-title" className={styles.panelTitle}>New Resource</h2>
        </div>

        <form className={announceStyles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="res-title">Title</label>
            <input
              className={styles.input}
              id="res-title"
              type="text"
              placeholder="e.g. Chapter 5 — Cell Division notes"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isFirebaseConfigured}
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Type</span>
            <div className={resourceStyles.typePicker} role="group" aria-label="Resource type">
              {typeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`${announceStyles.segment} ${type === opt.key ? announceStyles.segmentOn : ""}`}
                  aria-pressed={type === opt.key}
                  onClick={() => setType(opt.key)}
                >
                  <i className={`ti ${opt.icon}`} aria-hidden="true" /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="res-desc">Description <span className={styles.hint}>(optional)</span></label>
            <textarea
              className={`${styles.input} ${announceStyles.textarea}`}
              id="res-desc"
              placeholder="A short note about this material…"
              value={description}
              maxLength={300}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isFirebaseConfigured}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Source</span>
            <div className={resourceStyles.sourceToggle} role="group" aria-label="Resource source">
              {([
                { key: "upload" as const, label: "Upload file", icon: "ti-upload" },
                { key: "link" as const, label: "Share link", icon: "ti-link" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`${resourceStyles.sourceOption} ${source === opt.key ? resourceStyles.sourceOptionOn : ""}`}
                  aria-pressed={source === opt.key}
                  onClick={() => setSource(opt.key)}
                >
                  <i className={`ti ${opt.icon}`} aria-hidden="true" /> {opt.label}
                </button>
              ))}
            </div>

            {source === "upload" ? (
              <>
                <input
                  className={styles.input}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*,video/*"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  disabled={!isFirebaseConfigured}
                  style={{ marginTop: "var(--space-2)" }}
                />
                {file && (
                  <div className={resourceStyles.fileChip}>
                    <i className="ti ti-paperclip" aria-hidden="true" />
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className={resourceStyles.fileChipClear}
                      aria-label="Remove file"
                      onClick={() => setFile(null)}
                    >
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <p className={styles.hint}>PDFs, documents, images or video — up to 25 MB.</p>
              </>
            ) : (
              <input
                className={styles.input}
                type="url"
                placeholder="https://… (YouTube, Google Drive, etc.)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={!isFirebaseConfigured}
                style={{ marginTop: "var(--space-2)" }}
              />
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Share with</span>
            <div className={announceStyles.segmented} role="group" aria-label="Audience">
              {([
                { key: "all" as const, label: "All students", icon: "ti-users" },
                { key: "class" as const, label: "By class", icon: "ti-school" },
                { key: "batch" as const, label: "By batch", icon: "ti-stack-2" },
                { key: "location" as const, label: "By location", icon: "ti-map-pin" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`${announceStyles.segment} ${target === opt.key ? announceStyles.segmentOn : ""}`}
                  aria-pressed={target === opt.key}
                  onClick={() => {
                    setTarget(opt.key);
                    if (opt.key === "all" || opt.key === "location") {
                      setFormClass("");
                      setFormBatchId("");
                    }
                    if (opt.key !== "location") setFormLocation("");
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
                <label className={styles.label} htmlFor="res-class">Class</label>
                <select
                  className={styles.input}
                  id="res-class"
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
                  <label className={styles.label} htmlFor="res-batch">Batch</label>
                  <select
                    className={styles.input}
                    id="res-batch"
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

          {target === "location" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="res-location">Location</label>
              <select
                className={styles.input}
                id="res-location"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                required
              >
                <option value="">{locations.length ? "Select a location…" : "No batch locations yet"}</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            <i className="ti ti-cloud-upload" aria-hidden="true" /> Publish Resource
          </button>
        </form>
      </section>

      {/* ---- Published resources ---- */}
      <section className={styles.panel} aria-labelledby="published-title">
        <div className={styles.panelHeader}>
          <h2 id="published-title" className={styles.panelTitle}>Published Resources</h2>
          <span className="badge badge-default">{resources.length}</span>
        </div>

        {loadingList ? (
          <p className={styles.emptyText}>Loading resources…</p>
        ) : resources.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-books" aria-hidden="true" />
            <p className={styles.emptyText}>
              No resources yet — publish your first one above.
            </p>
          </div>
        ) : (
          <ul className={announceStyles.feed} role="list">
            {resources.map((r) => (
              <li key={r.id} className={announceStyles.feedItem}>
                <div className={announceStyles.feedMain}>
                  <div className={announceStyles.feedTop}>
                    <span className={announceStyles.feedTitle}>
                      <i className={`ti ${typeIcon(r.type)}`} aria-hidden="true" /> {r.title}
                    </span>
                    <span className={announceStyles.chip}>
                      <i className="ti ti-target-arrow" aria-hidden="true" />
                      {audienceLabel(r)}
                    </span>
                  </div>
                  {r.description && <p className={announceStyles.feedBody}>{r.description}</p>}
                  <div className={announceStyles.feedMeta}>
                    <span><i className="ti ti-clock" aria-hidden="true" /> {formatWhen(r.createdAt)}</span>
                    {r.createdBy && <span><i className="ti ti-user" aria-hidden="true" /> {r.createdBy}</span>}
                    {r.link && (
                      <span>
                        <a href={r.link} target="_blank" rel="noopener noreferrer" className={resourceStyles.link}>
                          <i className="ti ti-external-link" aria-hidden="true" /> Open
                        </a>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  aria-label={`Delete ${r.title}`}
                  onClick={() => setModal({ status: "confirm", resource: r })}
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
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Resource dialog">
          {modal.status === "confirm" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete resource?</h3>
              <p className={styles.modalText}>
                <strong>{modal.resource.title}</strong> will be removed for students. This can&apos;t
                be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`} onClick={() => handleDelete(modal.resource)}>
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
