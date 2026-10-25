// What teaching assistants are allowed to do in the shared panels. The admin
// flips these any time; assistants read them live. Stored as a single settings
// doc so a missing doc simply means "nothing extra granted yet".
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type AssistantPermissions = {
  /** Assistants may delete students (and reject pending signups). */
  canDeleteStudents: boolean;
  /** Assistants may delete payment history entries. */
  canDeletePayments: boolean;
};

/** Locked-down default — assistants get delete access only once the admin grants it. */
export const DEFAULT_ASSISTANT_PERMISSIONS: AssistantPermissions = {
  canDeleteStudents: false,
  canDeletePayments: false,
};

const SETTINGS_COLLECTION = "Settings";
const PERMISSIONS_DOC = "assistantPermissions";

function permissionsRef() {
  return doc(getFirebaseDb(), SETTINGS_COLLECTION, PERMISSIONS_DOC);
}

/** Subscribe to the live permissions doc. Missing/partial fields fall back to
 *  the locked-down default. Returns the unsubscribe function. */
export function subscribeAssistantPermissions(
  onChange: (perms: AssistantPermissions) => void
): () => void {
  return onSnapshot(
    permissionsRef(),
    (snap) => {
      const data = (snap.data() ?? {}) as Partial<AssistantPermissions>;
      onChange({
        canDeleteStudents: data.canDeleteStudents ?? DEFAULT_ASSISTANT_PERMISSIONS.canDeleteStudents,
        canDeletePayments: data.canDeletePayments ?? DEFAULT_ASSISTANT_PERMISSIONS.canDeletePayments,
      });
    },
    () => onChange(DEFAULT_ASSISTANT_PERMISSIONS)
  );
}

/** Merge-write one or more permission flags (admin only). */
export function setAssistantPermissions(
  partial: Partial<AssistantPermissions>
): Promise<void> {
  return setDoc(permissionsRef(), partial, { merge: true });
}
