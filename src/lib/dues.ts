import type { Timestamp } from "firebase/firestore";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** A calendar month as a single sortable integer: year * 12 + monthIndex(0–11). */
export function monthIndexFromDate(d: Date) {
  return d.getFullYear() * 12 + d.getMonth();
}

/** Parse a stored month label like "July 2026" back into a month index. */
export function parseMonthLabel(label: string): number | null {
  const parts = label.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const m = MONTHS.indexOf(parts[0]);
  const y = Number(parts[1]);
  if (m < 0 || !Number.isFinite(y)) return null;
  return y * 12 + m;
}

export function labelFromMonthIndex(idx: number) {
  return `${MONTHS[idx % 12]} ${Math.floor(idx / 12)}`;
}

export function currentMonthIndex(now = new Date()) {
  return now.getFullYear() * 12 + now.getMonth();
}

type StudentLike = { id: string; createdAt: Timestamp | null };
type PaymentLike = { studentId: string; month: string };

/**
 * A student owes for every month from the one they enrolled in up to last
 * month (inclusive) that has no recorded payment. The current month isn't due
 * yet, and months before they were enrolled never count — so a student added
 * in July can't appear in June's dues, and surfaces in August if July is
 * still unrecorded.
 */
export function computeDueEntries<S extends StudentLike, P extends PaymentLike>(
  students: S[],
  payments: P[],
  monthIndexNow: number
): { student: S; dueMonths: number[] }[] {
  const paidByStudent = new Map<string, Set<number>>();
  for (const p of payments) {
    const idx = parseMonthLabel(p.month);
    if (idx == null) continue;
    let set = paidByStudent.get(p.studentId);
    if (!set) paidByStudent.set(p.studentId, (set = new Set()));
    set.add(idx);
  }

  const entries: { student: S; dueMonths: number[] }[] = [];
  for (const s of students) {
    if (!s.createdAt) continue;
    const joinIndex = monthIndexFromDate(s.createdAt.toDate());
    const paid = paidByStudent.get(s.id) ?? new Set<number>();
    const dueMonths: number[] = [];
    for (let idx = joinIndex; idx <= monthIndexNow - 1; idx++) {
      if (!paid.has(idx)) dueMonths.push(idx);
    }
    if (dueMonths.length > 0) entries.push({ student: s, dueMonths });
  }
  return entries;
}
