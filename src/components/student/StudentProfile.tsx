"use client";

import { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { useStudent } from "./StudentShell";
import adminStyles from "../admin/AdminDashboard.module.css";
import formStyles from "../admin/AssistantsManager.module.css";
import styles from "./StudentPortal.module.css";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.infoRow}>
      <dt className={styles.infoLabel}>{label}</dt>
      <dd className={`${styles.infoValue} ${!value ? styles.infoValueMuted : ""}`}>
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export default function StudentProfile() {
  const student = useStudent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ kind: "error", message: "Choose an image file (JPG, PNG or WebP)." });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setStatus({ kind: "error", message: "Image is too large — keep it under 5 MB." });
      return;
    }
    setStatus(null);
    setUploading(true);
    try {
      // Fixed path per student: re-uploads overwrite the previous picture
      // instead of piling up copies in Storage.
      const ref = storageRef(getFirebaseStorage(), `student-avatars/${student.id}`);
      await uploadBytes(ref, file, { contentType: file.type });
      const url = await getDownloadURL(ref);
      // The download URL is stable across overwrites; the timestamp defeats
      // the browser cache so the new picture shows immediately.
      await updateDoc(doc(getFirebaseDb(), "Students", student.id), {
        photoURL: `${url}&v=${Date.now()}`,
      });
      setStatus({ kind: "success", message: "Profile picture updated." });
    } catch {
      setStatus({ kind: "error", message: "Could not upload the picture. Try again." });
    } finally {
      setUploading(false);
    }
  };

  const startEditing = () => {
    setMobile(student.mobile ?? "");
    setAddress(student.address ?? "");
    setStatus(null);
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await updateDoc(doc(getFirebaseDb(), "Students", student.id), {
        mobile: mobile.trim(),
        address: address.trim(),
      });
      setEditing(false);
      setStatus({ kind: "success", message: "Contact details updated." });
    } catch {
      setStatus({ kind: "error", message: "Could not save your changes. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={adminStyles.dashboard}>
      <header className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Profile</h1>
          <p className={adminStyles.pageSubtitle}>
            Your enrollment and contact information on record.
          </p>
        </div>
      </header>

      <div className={styles.profileCard}>
        <div className={styles.avatarWrap}>
          <div className={styles.profileAvatar} aria-hidden="true">
            {student.photoURL ? (
              /* User-uploaded Storage URL at avatar size — next/image adds nothing here */
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.avatarImage} src={student.photoURL} alt="" />
            ) : (
              initials(student.name)
            )}
          </div>
          <button
            type="button"
            className={styles.avatarEditBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={student.photoURL ? "Change profile picture" : "Upload profile picture"}
            title={student.photoURL ? "Change profile picture" : "Upload profile picture"}
          >
            <i
              className={`ti ${uploading ? "ti-loader-2 " + styles.spinning : "ti-camera"}`}
              aria-hidden="true"
            />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handlePhotoChange}
          />
        </div>
        <div>
          <div className={styles.profileName}>{student.name}</div>
          <div className={styles.profileMeta}>
            <span className="badge badge-default">Class {student.class}</span>
            <span>{student.batchLabel}</span>
          </div>
        </div>
      </div>

      {status && (
        <p
          className={`${styles.status} ${status.kind === "error" ? styles.statusError : styles.statusSuccess}`}
          role="status"
        >
          <i
            className={`ti ${status.kind === "error" ? "ti-alert-circle" : "ti-circle-check"}`}
            aria-hidden="true"
          />
          {status.message}
        </p>
      )}

      <div className={styles.panelGrid}>
        <section className={adminStyles.panel} aria-labelledby="contact-title">
          <div className={adminStyles.panelHeader}>
            <h2 id="contact-title" className={adminStyles.panelTitle}>Contact & School</h2>
            {!editing && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={startEditing}>
                <i className="ti ti-pencil" aria-hidden="true" /> Edit
              </button>
            )}
          </div>
          {editing ? (
            <form className={styles.editForm} onSubmit={handleSave}>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="profile-mobile">Mobile</label>
                <input
                  className={formStyles.input}
                  id="profile-mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 01XXXXXXXXX"
                  disabled={saving}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="profile-address">Address</label>
                <input
                  className={formStyles.input}
                  id="profile-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, road, area, city"
                  disabled={saving}
                />
              </div>
              <p className={styles.note}>
                <i className="ti ti-lock" aria-hidden="true" />
                Email and password can only be changed by your teacher.
              </p>
              <div className={styles.editActions}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className={styles.infoList}>
              <Row label="Email" value={student.email} />
              <Row label="Mobile" value={student.mobile} />
              <Row label="School" value={student.school} />
              <Row label="Address" value={student.address} />
            </dl>
          )}
        </section>

        <section className={adminStyles.panel} aria-labelledby="guardian-title">
          <div className={adminStyles.panelHeader}>
            <h2 id="guardian-title" className={adminStyles.panelTitle}>Guardian Info</h2>
          </div>
          <dl className={styles.infoList}>
            <Row label="Mother's Name" value={student.mothersName} />
            <Row label="Mother's Phone" value={student.mothersPhone} />
            <Row label="Father's Name" value={student.fathersName} />
            <Row label="Father's Phone" value={student.fathersPhone} />
          </dl>
        </section>
      </div>

      <p className={styles.note}>
        <i className="ti ti-info-circle" aria-hidden="true" />
        Need your name, school or guardian details corrected? Contact your teacher.
      </p>
    </div>
  );
}
