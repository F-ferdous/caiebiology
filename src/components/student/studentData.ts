import { Timestamp } from "firebase/firestore";

/** Mirrors the record shape written by the admin/assistant Students manager. */
export type StudentRecord = {
  id: string;
  uid: string;
  name: string;
  class: string;
  batchId: string;
  batchLabel: string;
  email: string;
  mobile: string;
  mothersName: string;
  mothersPhone: string;
  fathersName: string;
  fathersPhone: string;
  address: string;
  school: string;
  createdAt: Timestamp | null;
};

export type BatchRecord = {
  id: string;
  class: string;
  time: string;
  location: string;
  details: string;
  seats: number;
  classType: string;
};

/** Tests are authored in the (upcoming) admin Tests section — read tolerantly. */
export type TestRecord = {
  id: string;
  title?: string;
  name?: string;
  class?: string;
  type?: string;
  date?: Timestamp | string;
  time?: string;
  syllabus?: string;
  topic?: string;
  totalMarks?: number;
};

/** Payments are authored in the (upcoming) admin Payments section — read tolerantly. */
export type PaymentRecord = {
  id: string;
  studentId?: string;
  uid?: string;
  month?: string;
  amount?: number;
  method?: string;
  status?: string;
  note?: string;
  date?: Timestamp | string;
  createdAt?: Timestamp | null;
};

export function testTitle(t: TestRecord): string {
  return t.title || t.name || "Untitled test";
}

export function testSyllabus(t: TestRecord): string {
  return t.syllabus || t.topic || "";
}

/** Firestore Timestamps and plain date strings both appear in the wild. */
export function toJsDate(value: Timestamp | string | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: Timestamp | string | undefined | null): string {
  const date = toJsDate(value);
  if (!date) return typeof value === "string" ? value : "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A test counts as upcoming until the end of its scheduled day. */
export function isUpcoming(value: Timestamp | string | undefined | null): boolean {
  const date = toJsDate(value);
  if (!date) return false;
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() >= Date.now();
}
