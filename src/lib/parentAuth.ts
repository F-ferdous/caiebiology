// Parents authenticate directly against the Firestore "Students" collection —
// the student's ID (the admin-assigned `studentId` field) plus a parent's phone
// number (matched against the student's mother's or father's phone). No Firebase
// Auth: the "session" is just the child's Students doc id (and which parent
// signed in) kept in localStorage, mirroring the student auth model.
const PARENT_SESSION_KEY = "caie-parent-session";

export type ParentKind = "mother" | "father" | "guardian";

export type ParentSession = {
  /** The child's Firestore "Students" doc id. */
  childId: string;
  /** Which parent signed in — drives the greeting. */
  parent: ParentKind;
};

/** Normalise a phone number for comparison — ignore spaces, dashes and the
 *  like so "+880 1711-000000" and "01711000000" differ only by country code. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Does the entered phone match a stored parent phone? Compares the trailing
 *  digits so an entered local number matches a stored +880 number and vice
 *  versa. Empty stored numbers never match. */
export function phoneMatches(entered: string, stored: string | undefined | null): boolean {
  const a = normalizePhone(entered);
  const b = normalizePhone(stored ?? "");
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  // Require a meaningful overlap so short strings can't match loosely.
  return shorter.length >= 7 && longer.endsWith(shorter);
}

export function setParentSession(session: ParentSession): void {
  localStorage.setItem(PARENT_SESSION_KEY, JSON.stringify(session));
}

export function getParentSession(): ParentSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PARENT_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ParentSession>;
    if (!parsed.childId) return null;
    return { childId: parsed.childId, parent: parsed.parent ?? "guardian" };
  } catch {
    return null;
  }
}

export function clearParentSession(): void {
  localStorage.removeItem(PARENT_SESSION_KEY);
}
