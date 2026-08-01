"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
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
import { deleteObject, ref as storageRef } from "firebase/storage";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  getSecondaryAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import styles from "./AssistantsManager.module.css";
import studentStyles from "./StudentsManager.module.css";

type Student = {
  id: string;
  uid: string;
  name: string;
  class: string;
  batchId: string;
  batchLabel: string;
  email: string;
  mobile: string;
  password: string;
  mothersName: string;
  mothersPhone: string;
  fathersName: string;
  fathersPhone: string;
  address: string;
  school: string;
  createdAt: Timestamp | null;
};

type PendingStudent = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Timestamp | null;
};

type BatchOption = {
  id: string;
  class: string;
  time: string;
  location: string;
};

type ModalState =
  | { status: "closed" }
  | { status: "form"; editing?: Student; pending?: PendingStudent }
  | { status: "busy"; title: string; text: string }
  | { status: "success"; title: string; text: string }
  | { status: "error"; message: string }
  | { status: "confirm"; student: Student }
  | { status: "confirmPending"; pending: PendingStudent };

const classOptions = ["IX", "X", "XI", "XII"];

const firebaseErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password is too weak — use at least 6 characters.",
  "auth/invalid-email": "The email address is not valid.",
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

function batchLabelOf(b: BatchOption) {
  return `${b.time} — ${b.location}`;
}

function requestedOn(t: Timestamp | null) {
  return t ? t.toDate().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function OptionalTag() {
  return <span className={studentStyles.optional}>(Optional)</span>;
}

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  const [modal, setModal] = useState<ModalState>({ status: "closed" });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState(false);
  // Controlled so the Batch dropdown can cascade from the selected class
  const [formClass, setFormClass] = useState("");
  const [formBatchId, setFormBatchId] = useState("");

  // Live student list from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) })));
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return unsubscribe;
  }, []);

  // Signups awaiting approval — they get an auth account only once approved
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "PendingStudents"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPendingStudents(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PendingStudent, "id">) }))
      );
    });
  }, []);

  // Batches feed the cascading Batch dropdown
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(getFirebaseDb(), "Batches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setBatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BatchOption, "id">) })));
    });
  }, []);

  const classBatches = batches.filter((b) => b.class === formClass);

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openForm = (editing?: Student, pending?: PendingStudent) => {
    setShowFormPassword(false);
    setFormClass(editing?.class ?? "");
    setFormBatchId(editing?.batchId ?? "");
    setModal({ status: "form", editing, pending });
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    editing?: Student,
    pending?: PendingStudent
  ) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = editing ? editing.email : String(data.get("email") ?? "").trim().toLowerCase();
    const mobile = String(data.get("mobile") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const mothersName = String(data.get("mothersName") ?? "").trim();
    const mothersPhone = String(data.get("mothersPhone") ?? "").trim();
    const fathersName = String(data.get("fathersName") ?? "").trim();
    const fathersPhone = String(data.get("fathersPhone") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const school = String(data.get("school") ?? "").trim();

    const batch = batches.find((b) => b.id === formBatchId);
    if (!batch) {
      setModal({ status: "error", message: "Select a batch for the chosen class." });
      return;
    }

    const record = {
      name,
      class: formClass,
      batchId: batch.id,
      batchLabel: batchLabelOf(batch),
      mobile,
      password,
      mothersName,
      mothersPhone,
      fathersName,
      fathersPhone,
      address,
      school,
    };

    const db = getFirebaseDb();

    if (editing) {
      setModal({ status: "busy", title: "Saving…", text: "Updating the student's details." });
      try {
        // Password change requires re-authenticating as the student
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
        await updateDoc(doc(db, "Students", editing.id), record);
        setModal({
          status: "success",
          title: "Student updated",
          text: `${name}'s details have been saved.`,
        });
      } catch (err) {
        setModal({ status: "error", message: errorMessage(err, "Could not update the student.") });
      }
      return;
    }

    setModal({
      status: "busy",
      title: "Creating…",
      text: "Setting up the account and saving the student's details.",
    });
    try {
      const secondaryAuth = getSecondaryAuth();

      // 1. Create the Firebase Auth user (email & password)
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

      // 2. Store the student record in Firestore
      await addDoc(collection(db, "Students"), {
        uid: credential.user.uid,
        email,
        ...record,
        role: "student",
        createdAt: serverTimestamp(),
      });

      // The secondary app is now signed in as the new student — clean up
      await signOut(secondaryAuth);

      // Approved signups leave the pending queue
      if (pending) {
        await deleteDoc(doc(db, "PendingStudents", pending.id));
      }

      setModal({
        status: "success",
        title: pending ? "Student approved" : "Student created",
        text: `${name} can now sign in with their email and password.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not create the student.") });
    }
  };

  const handleDelete = async (s: Student) => {
    setModal({ status: "busy", title: "Deleting…", text: `Removing ${s.name}'s account and data.` });
    try {
      // Delete the Auth account server-side via the Admin SDK, keyed on uid —
      // reliable and password-independent. The route authenticates the caller by
      // their Firebase ID token. If this fails we stop here and leave the
      // Firestore record in place so the two never drift out of sync.
      if (s.uid) {
        const currentUser = getFirebaseAuth().currentUser;
        if (!currentUser) throw new Error("Your session has expired — sign in again.");
        const idToken = await currentUser.getIdToken();
        const res = await fetch("/api/students/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid: s.uid }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Auth account deletion failed (${res.status}).`);
        }
      }
      // Profile picture lives at a fixed per-student path; ignore if none was uploaded
      await deleteObject(storageRef(getFirebaseStorage(), `student-avatars/${s.id}`)).catch(() => {});
      await deleteDoc(doc(getFirebaseDb(), "Students", s.id));
      setModal({
        status: "success",
        title: "Student deleted",
        text: `${s.name} has been removed.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not delete the student.") });
    }
  };

  const handleDeletePending = async (p: PendingStudent) => {
    setModal({ status: "busy", title: "Deleting…", text: `Removing ${p.name}'s signup request.` });
    try {
      await deleteDoc(doc(getFirebaseDb(), "PendingStudents", p.id));
      setModal({
        status: "success",
        title: "Request deleted",
        text: `${p.name}'s signup request has been removed.`,
      });
    } catch (err) {
      setModal({ status: "error", message: errorMessage(err, "Could not delete the request.") });
    }
  };

  const editing = modal.status === "form" ? modal.editing : undefined;
  const pending = modal.status === "form" ? modal.pending : undefined;

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Students</h1>
          <p className={styles.pageSubtitle}>
            Enroll students and manage their accounts and batch placement.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openForm()}
          disabled={!isFirebaseConfigured}
        >
          <i className="ti ti-plus" aria-hidden="true" /> Add Student
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

      {/* ---- Pending signups ---- */}
      <section className={styles.panel} aria-labelledby="pending-list-title">
        <div className={styles.panelHeader}>
          <h2 id="pending-list-title" className={styles.panelTitle}>Pending Students</h2>
          <span className="badge badge-default">{pendingStudents.length}</span>
        </div>

        {pendingStudents.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-user-check" aria-hidden="true" />
            <p className={styles.emptyText}>
              No pending signups — new registrations from the signup page will appear here.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested</th>
                  <th className={styles.actionsHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={styles.nameCell}>
                        <span className={styles.avatar} aria-hidden="true">{initials(p.name)}</span>
                        {p.name}
                      </span>
                    </td>
                    <td>{p.email}</td>
                    <td>{requestedOn(p.createdAt)}</td>
                    <td>
                      <span className={styles.actions}>
                        <button
                          type="button"
                          className={`btn btn-primary ${studentStyles.approveBtn}`}
                          onClick={() => openForm(undefined, p)}
                        >
                          <i className="ti ti-check" aria-hidden="true" /> Approve
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          aria-label={`Delete ${p.name}'s signup request`}
                          onClick={() => setModal({ status: "confirmPending", pending: p })}
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

      {/* ---- Student list ---- */}
      <section className={styles.panel} aria-labelledby="student-list-title">
        <div className={styles.panelHeader}>
          <h2 id="student-list-title" className={styles.panelTitle}>All Students</h2>
          <span className="badge badge-default">{students.length}</span>
        </div>

        {loadingList ? (
          <p className={styles.emptyText}>Loading students…</p>
        ) : students.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-users" aria-hidden="true" />
            <p className={styles.emptyText}>
              No students yet — click “Add Student” to enroll the first one.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Batch</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Password</th>
                  <th className={styles.actionsHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const visible = visiblePasswords.has(s.id);
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className={styles.nameCell}>
                          <span className={styles.avatar} aria-hidden="true">{initials(s.name)}</span>
                          {s.name}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-default">Class {s.class}</span>
                      </td>
                      <td>{s.batchLabel}</td>
                      <td>{s.email}</td>
                      <td>{s.mobile}</td>
                      <td>
                        <span className={styles.passwordCell}>
                          <code className={styles.passwordValue}>
                            {visible ? s.password : "••••••••"}
                          </code>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label={visible ? "Hide password" : "Show password"}
                            onClick={() => togglePassword(s.id)}
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
                            aria-label={`Edit ${s.name}`}
                            onClick={() => openForm(s)}
                          >
                            <i className="ti ti-pencil" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            aria-label={`Delete ${s.name}`}
                            onClick={() => setModal({ status: "confirm", student: s })}
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
          aria-label="Student dialog">
          {modal.status === "form" ? (
            <div className={`${styles.modal} ${styles.modalWide} ${studentStyles.modalWider}`}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editing ? "Edit Student" : pending ? "Approve Student" : "Add Student"}
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
                key={editing?.id ?? pending?.id ?? "new"}
                className={studentStyles.formGrid}
                onSubmit={(e) => handleSubmit(e, editing, pending)}
              >
                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-name">Name</label>
                  <input className={styles.input} id="student-name" name="name" type="text"
                    placeholder="Student's full name" required autoComplete="off"
                    defaultValue={editing?.name ?? pending?.name} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-class">Class</label>
                  <select className={styles.input} id="student-class" name="class" required
                    value={formClass}
                    onChange={(e) => {
                      setFormClass(e.target.value);
                      setFormBatchId("");
                    }}>
                    <option value="" disabled>Select a class</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-batch">Batch</label>
                  <select className={styles.input} id="student-batch" name="batch" required
                    value={formBatchId}
                    onChange={(e) => setFormBatchId(e.target.value)}
                    disabled={!formClass}>
                    <option value="" disabled>
                      {formClass ? "Select a batch" : "Select a class first"}
                    </option>
                    {classBatches.map((b) => (
                      <option key={b.id} value={b.id}>{batchLabelOf(b)}</option>
                    ))}
                  </select>
                  {formClass && classBatches.length === 0 && (
                    <p className={styles.hint}>
                      No batches for Class {formClass} yet — add one in the Batches tab.
                    </p>
                  )}
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-email">Email</label>
                  <input className={styles.input} id="student-email" name="email" type="email"
                    placeholder="student@example.com" required autoComplete="off"
                    defaultValue={editing?.email ?? pending?.email} disabled={!!editing} />
                  <p className={styles.hint}>
                    {editing
                      ? "Email can't be changed."
                      : "Used as the username to sign in."}
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-mobile">Mobile Number</label>
                  <input className={styles.input} id="student-mobile" name="mobile" type="tel"
                    placeholder="+880 1XXX-XXXXXX" required autoComplete="off"
                    defaultValue={editing?.mobile} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-password">Password</label>
                  <div className={styles.passwordWrap}>
                    <input className={styles.input} id="student-password" name="password"
                      type={showFormPassword ? "text" : "password"}
                      placeholder="At least 6 characters" required minLength={6}
                      autoComplete="new-password" defaultValue={editing?.password ?? pending?.password} />
                    <button type="button" className={styles.eyeBtn}
                      aria-label={showFormPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowFormPassword((v) => !v)}>
                      <i className={`ti ${showFormPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-mothers-name">
                    Mother&apos;s Name <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-mothers-name" name="mothersName"
                    type="text" placeholder="Mother's full name" autoComplete="off"
                    defaultValue={editing?.mothersName} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-mothers-phone">
                    Mother&apos;s Phone Number <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-mothers-phone" name="mothersPhone"
                    type="tel" placeholder="+880 1XXX-XXXXXX" autoComplete="off"
                    defaultValue={editing?.mothersPhone} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-fathers-name">
                    Father&apos;s Name <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-fathers-name" name="fathersName"
                    type="text" placeholder="Father's full name" autoComplete="off"
                    defaultValue={editing?.fathersName} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-fathers-phone">
                    Father&apos;s Phone Number <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-fathers-phone" name="fathersPhone"
                    type="tel" placeholder="+880 1XXX-XXXXXX" autoComplete="off"
                    defaultValue={editing?.fathersPhone} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-address">
                    Address <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-address" name="address" type="text"
                    placeholder="Street, city" autoComplete="off"
                    defaultValue={editing?.address} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-school">
                    School <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-school" name="school" type="text"
                    placeholder="Current school" autoComplete="off"
                    defaultValue={editing?.school} />
                </div>

                <button type="submit" className={`btn btn-primary ${studentStyles.spanFull}`}>
                  <i className={`ti ${editing ? "ti-device-floppy" : pending ? "ti-user-check" : "ti-user-plus"}`} aria-hidden="true" />
                  {editing ? "Save Changes" : pending ? "Approve & Create Account" : "Save Student"}
                </button>
              </form>
            </div>
          ) : modal.status === "confirm" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete student?</h3>
              <p className={styles.modalText}>
                <strong>{modal.student.name}</strong> ({modal.student.email}) will lose access
                and their record will be removed. This can&apos;t be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`} onClick={() => handleDelete(modal.student)}>
                  Delete
                </button>
              </div>
            </div>
          ) : modal.status === "confirmPending" ? (
            <div className={styles.modal}>
              <div className={`${styles.modalIcon} ${styles.modalIconError}`} aria-hidden="true">
                <i className="ti ti-trash" />
              </div>
              <h3 className={styles.modalTitle}>Delete signup request?</h3>
              <p className={styles.modalText}>
                <strong>{modal.pending.name}</strong> ({modal.pending.email})&apos;s signup request
                will be removed. They can register again later. This can&apos;t be undone.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-secondary" onClick={() => setModal({ status: "closed" })}>
                  Cancel
                </button>
                <button className={`btn ${styles.btnDanger}`} onClick={() => handleDeletePending(modal.pending)}>
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
