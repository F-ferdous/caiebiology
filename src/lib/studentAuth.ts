// Students authenticate directly against the Firestore "Students" collection
// (email + password), not Firebase Auth. The "session" is just the signed-in
// student's Firestore doc id kept in localStorage — deliberately minimal, with
// no server-verified token, matching this app's open-rules, teacher-controlled
// model. Staff (admin/assistants) still use real Firebase Auth.
const STUDENT_SESSION_KEY = "caie-student-session";

export function setStudentSession(studentId: string): void {
  localStorage.setItem(STUDENT_SESSION_KEY, studentId);
}

export function getStudentSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STUDENT_SESSION_KEY);
}

export function clearStudentSession(): void {
  localStorage.removeItem(STUDENT_SESSION_KEY);
}
