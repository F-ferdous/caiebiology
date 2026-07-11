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
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import styles from "./AssistantsManager.module.css";

type Batch = {
  id: string;
  class: string;
  time: string;
  location: string;
  details: string;
  seats: number;
  classType: string;
  createdAt: Timestamp | null;
};

type ModalState =
  | { status: "closed" }
  | { status: "form"; editing?: Batch }
  | { status: "busy"; title: string; text: string }
  | { status: "success"; title: string; text: string }
  | { status: "error"; message: string }
  | { status: "confirm"; batch: Batch };

const classOptions = ["IX", "X", "XI", "XII"];
const classTypeOptions = ["Online", "Offline(Physical)", "Hybrid"];

function errorMessage(err: unknown, fallback: string) {
  const code = (err as { code?: string }).code ?? "";
  return code ? `${fallback} (${code})` : `${fallback} (${(err as Error).message})`;
}

export default function BatchesManager() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  const [modal, setModal] = useState<ModalState>({ status: "closed" });

  // Live batch list from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Batch, "id">) })));
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, editing?: Batch) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const batchClass = String(data.get("class") ?? "").trim();
    const time = String(data.get("time") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const details = String(data.get("details") ?? "").trim();
    const seats = Number(data.get("seats") ?? 0);
    const classType = String(data.get("classType") ?? "").trim();

    const db = getFirebaseDb();

    if (editing) {
      setModal({ status: "busy", title: "Saving…", text: "Updating the batch details." });
      try {
        await updateDoc(doc(db, "Batches", editing.id), {
          class: batchClass,
          time,
          location,
          details,
          seats,
          classType,
        });
        setModal({
          status: "success",
          title: "Batch updated",
          text: `The Class ${batchClass} batch has been saved.`,
        });
      } catch (err) {
        setModal({ status: "error", message: errorMessage(err, "Could not update the batch.") });
      }
      return;
    }

    setModal({ status: "busy", title: "Creating…", text: "Saving the new batch." });
    try {
      await addDoc(collection(db, "Batches"), {
        class: batchClass,
        time,
        location,
        details,
        seats,
        classType,
        createdAt: serverTimestamp(),
      });
      setModal({
        status: "success",
        title: "Batch created",
        text: `The Class ${batchClass} batch has been added.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not create the batch.") });
    }
  };

  const handleDelete = async (b: Batch) => {
    setModal({ status: "busy", title: "Deleting…", text: "Removing the batch." });
    try {
      await deleteDoc(doc(getFirebaseDb(), "Batches", b.id));
      setModal({
        status: "success",
        title: "Batch deleted",
        text: `The Class ${b.class} batch has been removed.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not delete the batch.") });
    }
  };

  const editing = modal.status === "form" ? modal.editing : undefined;

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Batches</h1>
          <p className={styles.pageSubtitle}>
            Organize student batches, schedules, and locations.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModal({ status: "form" })}
          disabled={!isFirebaseConfigured}
        >
          <i className="ti ti-plus" aria-hidden="true" /> Add Batch
        </button>
      </header>

      {!isFirebaseConfigured && (
        <div className={styles.configWarning} role="alert">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <div>
            <strong>Firebase is not configured.</strong>
            <p>
              Add your Firebase web app keys to <code>.env.local</code> and restart the dev
              server. Until then, saving is disabled.
            </p>
          </div>
        </div>
      )}

      {/* ---- Batch list ---- */}
      <section className={styles.panel} aria-labelledby="batch-list-title">
        <div className={styles.panelHeader}>
          <h2 id="batch-list-title" className={styles.panelTitle}>All Batches</h2>
          <span className="badge badge-default">{batches.length}</span>
        </div>

        {loadingList ? (
          <p className={styles.emptyText}>Loading batches…</p>
        ) : batches.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-stack-2" aria-hidden="true" />
            <p className={styles.emptyText}>
              No batches yet — click “Add Batch” to create the first one.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Seats</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th className={styles.actionsHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="badge badge-default">Class {b.class}</span>
                    </td>
                    <td>{b.time}</td>
                    <td>{b.location}</td>
                    <td>{b.seats}</td>
                    <td>{b.classType}</td>
                    <td>{b.details}</td>
                    <td>
                      <span className={styles.actions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label={`Edit Class ${b.class} batch`}
                          onClick={() => setModal({ status: "form", editing: b })}
                        >
                          <i className="ti ti-pencil" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          aria-label={`Delete Class ${b.class} batch`}
                          onClick={() => setModal({ status: "confirm", batch: b })}
                        >
                          <i className="ti ti-trash" aria-hidden="true" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Modal ---- */}
      {modal.status !== "closed" && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true"
          aria-label="Batch dialog">
          {modal.status === "form" ? (
            <div className={`${styles.modal} ${styles.modalWide}`}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editing ? "Edit Batch" : "Add Batch"}
                </h3>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Close dialog"
                  onClick={() => setModal({ status: "closed" })}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>

              <form
                key={editing?.id ?? "new"}
                className={styles.form}
                onSubmit={(e) => handleSubmit(e, editing)}
              >
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="batch-class">Class</label>
                  <select className={styles.input} id="batch-class" name="class"
                    required defaultValue={editing?.class ?? ""}>
                    <option value="" disabled>Select a class</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="batch-time">Time</label>
                  <input className={styles.input} id="batch-time" name="time" type="text"
                    placeholder="e.g. Sat & Tue, 5:00 PM – 6:30 PM" required autoComplete="off"
                    defaultValue={editing?.time} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="batch-location">Location</label>
                  <input className={styles.input} id="batch-location" name="location" type="text"
                    placeholder="e.g. Dhanmondi campus, Room 3" required autoComplete="off"
                    defaultValue={editing?.location} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="batch-seats">Number of Seats</label>
                  <input className={styles.input} id="batch-seats" name="seats" type="number"
                    placeholder="e.g. 30" required min={1} autoComplete="off"
                    defaultValue={editing?.seats} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="batch-class-type">Class Type</label>
                  <select className={styles.input} id="batch-class-type" name="classType"
                    required defaultValue={editing?.classType ?? ""}>
                    <option value="" disabled>Select a class type</option>
                    {classTypeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="batch-details">Details</label>
                  <input className={styles.input} id="batch-details" name="details" type="text"
                    placeholder="Anything students should know" autoComplete="off"
                    defaultValue={editing?.details} />
                </div>

                <button type="submit" className="btn btn-primary">
                  <i className={`ti ${editing ? "ti-device-floppy" : "ti-plus"}`} aria-hidden="true" />
                  {editing ? "Save Changes" : "Save Batch"}
                </button>
              </form>
            </div>
          ) : modal.status === "confirm" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete batch?</h3>
              <p className={styles.modalText}>
                The <strong>Class {modal.batch.class}</strong> batch ({modal.batch.time}) will be
                removed. This can&apos;t be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`} onClick={() => handleDelete(modal.batch)}>
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
