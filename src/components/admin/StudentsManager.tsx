"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import {
  getFirebaseDb,
  getFirebaseStorage,
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  DEFAULT_ASSISTANT_PERMISSIONS,
  subscribeAssistantPermissions,
} from "@/lib/assistantPermissions";
import type { PanelRole } from "@/lib/panelRole";
import StudentDetailsModal from "./StudentDetailsModal";
import styles from "./AssistantsManager.module.css";
import studentStyles from "./StudentsManager.module.css";

type Student = {
  id: string;
  name: string;
  studentId: string;
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
  // Optional: signups made before the full form existed only carry name/email/
  // password. Newer signups carry the whole enrollment record.
  studentId?: string;
  class?: string;
  batchId?: string;
  batchLabel?: string;
  mobile?: string;
  fathersName?: string;
  fathersPhone?: string;
  mothersName?: string;
  mothersPhone?: string;
  address?: string;
  school?: string;
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
  | { status: "confirmPending"; pending: PendingStudent }
  | { status: "details"; student: Student };

const classOptions = ["IX", "X", "XI", "XII"];
const locationOptions = ["Mirpur", "Gulshan", "Lalmatia"];

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

export default function StudentsManager({ role = "admin" }: { role?: PanelRole }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingList, setLoadingList] = useState(isFirebaseConfigured);
  // Admins always delete; assistants only when the admin has granted it.
  const [canDelete, setCanDelete] = useState(
    role === "admin" ? true : DEFAULT_ASSISTANT_PERMISSIONS.canDeleteStudents
  );
  const [modal, setModal] = useState<ModalState>({ status: "closed" });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState(false);
  // Controlled so the Batch dropdown can cascade from the selected class
  const [formClass, setFormClass] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  // List controls: search, filters, pagination
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

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

  // Assistants read the delete permission live so an admin toggle applies at once
  useEffect(() => {
    if (role === "admin" || !isFirebaseConfigured) return;
    return subscribeAssistantPermissions((perms) =>
      setCanDelete(perms.canDeleteStudents)
    );
  }, [role]);

  const classBatches = batches.filter((b) => b.class === formClass);

  // A student's location is the first word of their batch's location field
  // (e.g. "Mirpur campus, Room 3" → "Mirpur"). Resolve it from the live batch,
  // falling back to the tail of the stored "time — location" label.
  const locationOf = (s: Student) => {
    const b = batches.find((bb) => bb.id === s.batchId);
    const loc = b?.location ?? (() => {
      const idx = s.batchLabel.lastIndexOf("—");
      return idx >= 0 ? s.batchLabel.slice(idx + 1) : s.batchLabel;
    })();
    return loc.trim().split(/\s+/)[0] ?? "";
  };

  const q = search.trim().toLowerCase();
  const filteredStudents = students.filter((s) => {
    if (filterClass && s.class !== filterClass) return false;
    if (filterLocation && locationOf(s).toLowerCase() !== filterLocation.toLowerCase()) return false;
    if (q) {
      const hay = [s.name, s.email, s.studentId, s.mobile]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageStudents = filteredStudents.slice(pageStart, pageStart + pageSize);

  // Any change to the query, filters, or page size returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [search, filterClass, filterLocation, pageSize]);

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
    setFormClass(editing?.class ?? pending?.class ?? "");
    setFormBatchId(editing?.batchId ?? pending?.batchId ?? "");
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
    const studentId = String(data.get("studentId") ?? "").trim();
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
      studentId,
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
        // Password lives in the record, so a plain updateDoc saves any change.
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
      text: "Saving the student's details.",
    });
    try {
      // Students authenticate against Firestore (email + password), so email is
      // the login id — enforce uniqueness ourselves (Firebase Auth used to).
      const clash = await getDocs(
        query(collection(db, "Students"), where("email", "==", email))
      );
      if (!clash.empty) {
        setModal({ status: "error", message: "A student with this email already exists." });
        return;
      }

      await addDoc(collection(db, "Students"), {
        email,
        ...record,
        role: "student",
        createdAt: serverTimestamp(),
      });

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
      // No Firebase Auth account to clean up — the student lives entirely in
      // Firestore. Remove the avatar (if any) and the record.
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
                        {canDelete && (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            aria-label={`Delete ${p.name}'s signup request`}
                            onClick={() => setModal({ status: "confirmPending", pending: p })}
                          >
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        )}
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
          <span className="badge badge-default">{filteredStudents.length}</span>
        </div>

        {/* Search + filters */}
        <div className={studentStyles.toolbar}>
          <div className={studentStyles.searchWrap}>
            <i className="ti ti-search" aria-hidden="true" />
            <input
              type="search"
              className={studentStyles.searchInput}
              placeholder="Search by name, email, ID or mobile"
              aria-label="Search students"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={studentStyles.filterSelect}
            aria-label="Filter by location"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="">All locations</option>
            {locationOptions.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            className={studentStyles.filterSelect}
            aria-label="Filter by class"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All classes</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
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
        ) : filteredStudents.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-search-off" aria-hidden="true" />
            <p className={styles.emptyText}>
              No students match your search or filters.
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
                {pageStudents.map((s) => {
                  const visible = visiblePasswords.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={studentStyles.clickableRow}
                      onClick={() => setModal({ status: "details", student: s })}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${s.name}'s details`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setModal({ status: "details", student: s });
                        }
                      }}
                    >
                      <td>
                        <span className={styles.nameCell}>
                          <span className={styles.avatar} aria-hidden="true">{initials(s.name)}</span>
                          <span className={studentStyles.nameStack}>
                            {s.name}
                            {s.studentId ? (
                              <span className={studentStyles.studentId}>ID: {s.studentId}</span>
                            ) : null}
                          </span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePassword(s.id);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              openForm(s);
                            }}
                          >
                            <i className="ti ti-pencil" aria-hidden="true" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              aria-label={`Delete ${s.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ status: "confirm", student: s });
                              }}
                            >
                              <i className="ti ti-trash" aria-hidden="true" />
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loadingList && filteredStudents.length > 0 && (
          <div className={studentStyles.pagination}>
            <div className={studentStyles.pageSize}>
              <label htmlFor="page-size">Per page</label>
              <select
                id="page-size"
                className={studentStyles.filterSelect}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            <span className={studentStyles.pageInfo}>
              {pageStart + 1}–{Math.min(pageStart + pageSize, filteredStudents.length)} of{" "}
              {filteredStudents.length}
            </span>

            <div className={studentStyles.pageNav}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="ti ti-chevron-left" aria-hidden="true" />
              </button>
              <span className={studentStyles.pageInfo}>
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <i className="ti ti-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---- Details (read-only) ---- */}
      {modal.status === "details" && (
        <StudentDetailsModal
          student={modal.student}
          onClose={() => setModal({ status: "closed" })}
        />
      )}

      {/* ---- Modal ---- */}
      {modal.status !== "closed" && modal.status !== "details" && (
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
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-name">Name</label>
                  <input className={styles.input} id="student-name" name="name" type="text"
                    placeholder="Student's full name" required autoComplete="off"
                    defaultValue={editing?.name ?? pending?.name} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-id">Student ID</label>
                  <input className={styles.input} id="student-id" name="studentId" type="text"
                    placeholder="e.g. CB-1024" autoComplete="off"
                    defaultValue={editing?.studentId ?? pending?.studentId} />
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
                    defaultValue={editing?.mobile ?? pending?.mobile} />
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

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-fathers-name">
                    Father&apos;s Name <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-fathers-name" name="fathersName"
                    type="text" placeholder="Father's full name" autoComplete="off"
                    defaultValue={editing?.fathersName ?? pending?.fathersName} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-fathers-phone">
                    Father&apos;s Phone Number <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-fathers-phone" name="fathersPhone"
                    type="tel" placeholder="+880 1XXX-XXXXXX" autoComplete="off"
                    defaultValue={editing?.fathersPhone ?? pending?.fathersPhone} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-mothers-name">
                    Mother&apos;s Name <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-mothers-name" name="mothersName"
                    type="text" placeholder="Mother's full name" autoComplete="off"
                    defaultValue={editing?.mothersName ?? pending?.mothersName} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-mothers-phone">
                    Mother&apos;s Phone Number <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-mothers-phone" name="mothersPhone"
                    type="tel" placeholder="+880 1XXX-XXXXXX" autoComplete="off"
                    defaultValue={editing?.mothersPhone ?? pending?.mothersPhone} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-address">
                    Address <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-address" name="address" type="text"
                    placeholder="Street, city" autoComplete="off"
                    defaultValue={editing?.address ?? pending?.address} />
                </div>

                <div className={`${styles.field} ${studentStyles.spanFull}`}>
                  <label className={styles.label} htmlFor="student-school">
                    School <OptionalTag />
                  </label>
                  <input className={styles.input} id="student-school" name="school" type="text"
                    placeholder="Current school" autoComplete="off"
                    defaultValue={editing?.school ?? pending?.school} />
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
