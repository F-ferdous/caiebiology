"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  deleteUser,
  signOut,
} from "firebase/auth";
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
import {
  assistantEmail,
  getFirebaseDb,
  getSecondaryAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  AssistantPermissions,
  DEFAULT_ASSISTANT_PERMISSIONS,
  setAssistantPermissions,
  subscribeAssistantPermissions,
} from "@/lib/assistantPermissions";
import styles from "./AssistantsManager.module.css";

type Assistant = {
  id: string;
  uid: string;
  name: string;
  address: string;
  phone: string;
  username: string;
  password: string;
  email: string;
  createdAt: Timestamp | null;
};

type ModalState =
  | { status: "closed" }
  | { status: "form"; editing?: Assistant }
  | { status: "busy"; title: string; text: string }
  | { status: "success"; title: string; text: string }
  | { status: "error"; message: string }
  | { status: "confirm"; assistant: Assistant };

const firebaseErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "This username is already taken — choose another one.",
  "auth/weak-password": "Password is too weak — use at least 6 characters.",
  "auth/invalid-email": "Username contains invalid characters.",
  "auth/invalid-credential": "Stored credentials no longer match the account.",
  "auth/network-request-failed": "Network error — check your connection and try again.",
};

function errorMessage(err: unknown, fallback: string) {
  const code = (err as { code?: string }).code ?? "";
  return firebaseErrorMessages[code] ?? `${fallback} (${code || (err as Error).message})`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function AssistantsManager() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  const [modal, setModal] = useState<ModalState>({ status: "closed" });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [permissions, setPermissions] = useState<AssistantPermissions>(
    DEFAULT_ASSISTANT_PERMISSIONS
  );
  const [savingPermission, setSavingPermission] = useState<keyof AssistantPermissions | null>(null);

  // Live assistant list from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Assistants"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAssistants(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assistant, "id">) }))
        );
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return unsubscribe;
  }, []);

  // Live permission flags for the toggles below
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeAssistantPermissions(setPermissions);
  }, []);

  const togglePermission = async (key: keyof AssistantPermissions) => {
    const next = !permissions[key];
    // Optimistic — the snapshot listener reconciles, and reverts on failure
    setPermissions((prev) => ({ ...prev, [key]: next }));
    setSavingPermission(key);
    try {
      await setAssistantPermissions({ [key]: next });
    } catch {
      setPermissions((prev) => ({ ...prev, [key]: !next }));
    } finally {
      setSavingPermission(null);
    }
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openForm = (editing?: Assistant) => {
    setShowFormPassword(false);
    setModal({ status: "form", editing });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, editing?: Assistant) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const username = editing
      ? editing.username
      : String(data.get("username") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (!editing && !/^[a-z0-9._-]+$/.test(username)) {
      setModal({
        status: "error",
        message: "Username can only contain letters, numbers, dots, hyphens, and underscores.",
      });
      return;
    }

    const db = getFirebaseDb();

    if (editing) {
      setModal({ status: "busy", title: "Saving…", text: "Updating the assistant's details." });
      try {
        // Password change requires re-authenticating as the assistant
        if (password !== editing.password) {
          const secondaryAuth = getSecondaryAuth();
          const cred = await signInWithEmailAndPassword(
            secondaryAuth,
            editing.email,
            editing.password
          );
          await updatePassword(cred.user, password);
          await signOut(secondaryAuth);
        }
        await updateDoc(doc(db, "Assistants", editing.id), { name, address, phone, password });
        setModal({
          status: "success",
          title: "Assistant updated",
          text: `${name}'s details have been saved.`,
        });
      } catch (err) {
        setModal({ status: "error", message: errorMessage(err, "Could not update the assistant.") });
      }
      return;
    }

    setModal({
      status: "busy",
      title: "Creating…",
      text: "Setting up the account and saving the assistant's details.",
    });
    try {
      const email = assistantEmail(username);
      const secondaryAuth = getSecondaryAuth();

      // 1. Create the Firebase Auth user (email & password)
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

      // 2. Store the assistant record in Firestore
      await addDoc(collection(db, "Assistants"), {
        uid: credential.user.uid,
        name,
        address,
        phone,
        username,
        password,
        email,
        role: "assistant",
        createdAt: serverTimestamp(),
      });

      // The secondary app is now signed in as the new assistant — clean up
      await signOut(secondaryAuth);

      setModal({
        status: "success",
        title: "Assistant created",
        text: `${name} can now sign in with their username and password.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not create the assistant.") });
    }
  };

  const handleDelete = async (a: Assistant) => {
    setModal({ status: "busy", title: "Deleting…", text: `Removing ${a.name}'s account and data.` });
    try {
      // Remove the Auth account — requires signing in as the assistant.
      // If credentials are stale this fails; the Firestore record is removed regardless.
      try {
        const secondaryAuth = getSecondaryAuth();
        const cred = await signInWithEmailAndPassword(secondaryAuth, a.email, a.password);
        await deleteUser(cred.user);
      } catch {
        // Auth account left behind — surfaced in the console for manual cleanup
        console.warn(`Could not delete auth account for ${a.email}; remove it in Firebase Console.`);
      }
      await deleteDoc(doc(getFirebaseDb(), "Assistants", a.id));
      setModal({
        status: "success",
        title: "Assistant deleted",
        text: `${a.name} has been removed.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not delete the assistant.") });
    }
  };

  const editing = modal.status === "form" ? modal.editing : undefined;

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assistants</h1>
          <p className={styles.pageSubtitle}>
            Add teaching assistants and manage their accounts.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openForm()}
          disabled={!isFirebaseConfigured}
        >
          <i className="ti ti-plus" aria-hidden="true" /> Add Assistants
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

      {/* ---- Assistant permissions ---- */}
      <section className={styles.panel} aria-labelledby="perms-title">
        <div className={styles.panelHeader}>
          <h2 id="perms-title" className={styles.panelTitle}>Permissions</h2>
        </div>
        <p className={styles.permsIntro}>
          Control what assistants can do from their dashboard. Changes apply
          immediately — no need for them to sign in again.
        </p>

        <ul className={styles.permsList}>
          {([
            {
              key: "canDeleteStudents" as const,
              label: "Delete students",
              hint: "Remove student accounts and reject pending signup requests.",
            },
            {
              key: "canDeletePayments" as const,
              label: "Delete payment history",
              hint: "Remove recorded payments and their receipts.",
            },
          ]).map(({ key, label, hint }) => {
            const on = permissions[key];
            return (
              <li key={key} className={styles.permRow}>
                <div className={styles.permText}>
                  <span className={styles.permLabel}>{label}</span>
                  <span className={styles.permHint}>{hint}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Allow assistants to ${label.toLowerCase()}`}
                  className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
                  disabled={!isFirebaseConfigured || savingPermission === key}
                  onClick={() => togglePermission(key)}
                >
                  <span className={styles.toggleThumb} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---- Assistant list ---- */}
      <section className={styles.panel} aria-labelledby="list-title">
        <div className={styles.panelHeader}>
          <h2 id="list-title" className={styles.panelTitle}>All Assistants</h2>
          <span className="badge badge-default">{assistants.length}</span>
        </div>

        {loadingList ? (
          <p className={styles.emptyText}>Loading assistants…</p>
        ) : assistants.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-user-cog" aria-hidden="true" />
            <p className={styles.emptyText}>
              No assistants yet — click “Add Assistants” to create the first one.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th className={styles.actionsHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map((a) => {
                  const visible = visiblePasswords.has(a.id);
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className={styles.nameCell}>
                          <span className={styles.avatar} aria-hidden="true">{initials(a.name)}</span>
                          {a.name}
                        </span>
                      </td>
                      <td>{a.phone}</td>
                      <td><code className={styles.username}>{a.username}</code></td>
                      <td>
                        <span className={styles.passwordCell}>
                          <code className={styles.passwordValue}>
                            {visible ? a.password : "••••••••"}
                          </code>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label={visible ? "Hide password" : "Show password"}
                            onClick={() => togglePassword(a.id)}
                          >
                            <i className={`ti ${visible ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
                          </button>
                        </span>
                      </td>
                      <td>
                        <span className={styles.actions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label={`Edit ${a.name}`}
                            onClick={() => openForm(a)}
                          >
                            <i className="ti ti-pencil" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            aria-label={`Delete ${a.name}`}
                            onClick={() => setModal({ status: "confirm", assistant: a })}
                          >
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Modal ---- */}
      {modal.status !== "closed" && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true"
          aria-label="Assistant dialog">
          {modal.status === "form" ? (
            <div className={`${styles.modal} ${styles.modalWide}`}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editing ? "Edit Assistant" : "Add Assistant"}
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
                  <label className={styles.label} htmlFor="name">Name</label>
                  <input className={styles.input} id="name" name="name" type="text"
                    placeholder="Assistant's full name" required autoComplete="off"
                    defaultValue={editing?.name} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="address">Address</label>
                  <input className={styles.input} id="address" name="address" type="text"
                    placeholder="Street, city" required autoComplete="off"
                    defaultValue={editing?.address} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="phone">Phone Number</label>
                  <input className={styles.input} id="phone" name="phone" type="tel"
                    placeholder="+880 1XXX-XXXXXX" required autoComplete="off"
                    defaultValue={editing?.phone} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="username">Username</label>
                  <input className={styles.input} id="username" name="username" type="text"
                    placeholder="e.g. rakib.hasan" required autoComplete="off"
                    pattern="[A-Za-z0-9._\-]+"
                    defaultValue={editing?.username} disabled={!!editing} />
                  <p className={styles.hint}>
                    {editing
                      ? "Username can't be changed."
                      : "Used to sign in — letters, numbers, dots, hyphens."}
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="password">Password</label>
                  <div className={styles.passwordWrap}>
                    <input className={styles.input} id="password" name="password"
                      type={showFormPassword ? "text" : "password"}
                      placeholder="At least 6 characters" required minLength={6}
                      autoComplete="new-password" defaultValue={editing?.password} />
                    <button type="button" className={styles.eyeBtn}
                      aria-label={showFormPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowFormPassword((v) => !v)}>
                      <i className={`ti ${showFormPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  <i className={`ti ${editing ? "ti-device-floppy" : "ti-user-plus"}`} aria-hidden="true" />
                  {editing ? "Save Changes" : "Save Assistant"}
                </button>
              </form>
            </div>
          ) : modal.status === "confirm" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete assistant?</h3>
              <p className={styles.modalText}>
                <strong>{modal.assistant.name}</strong> ({modal.assistant.username}) will lose
                access and their record will be removed. This can&apos;t be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`} onClick={() => handleDelete(modal.assistant)}>
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
