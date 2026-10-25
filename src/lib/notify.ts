import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

// The reusable notification engine. ANY feature (announcements, resources,
// tests, mark uploads, …) creates one doc in the `Notifications` collection via
// queueNotification(); the `sendNotification` Cloud Function picks it up and
// pushes it to the matching students. Students also read this collection as
// their in-app Notices feed. To notify from a new feature, just call
// queueNotification() — no new backend code needed.

export type NotifyType = "announcement" | "resource" | "test" | "mark";

/** Who a notification reaches. */
export type NotifyTarget = "all" | "class" | "batch" | "student";

export type NotifyRecord = {
  id: string;
  type: NotifyType;
  title: string;
  body: string;
  /** Where tapping the notification should take the student. */
  url: string;
  target: NotifyTarget;
  class: string | null;
  batchId: string | null;
  batchLabel: string | null;
  /** Set for target "student". */
  studentId: string | null;
  createdBy: string;
  createdByRole: "admin" | "assistant" | "system";
  createdAt: Timestamp | null;
};

/** Per-type presentation + default landing page for the in-app feed. */
export const NOTIFY_TYPES: Record<
  NotifyType,
  { label: string; icon: string; url: string }
> = {
  announcement: { label: "Announcement", icon: "ti-speakerphone", url: "/student/notices" },
  resource: { label: "Resource", icon: "ti-books", url: "/student/resources" },
  test: { label: "Test", icon: "ti-clipboard-check", url: "/student/tests" },
  mark: { label: "Result", icon: "ti-report-analytics", url: "/student/tests" },
};

export function notifyTypeMeta(type: string) {
  return NOTIFY_TYPES[type as NotifyType] ?? NOTIFY_TYPES.announcement;
}

/** Does this notification reach the given student? Mirrors the Cloud Function's
 *  targeting so the in-app feed and the push notifications stay consistent. */
export function notificationMatchesStudent(
  n: Pick<NotifyRecord, "target" | "class" | "batchId" | "studentId">,
  student: { id?: string; class?: string; batchId?: string }
): boolean {
  switch (n.target) {
    case "all":
      return true;
    case "class":
      return !!n.class && n.class === student.class;
    case "batch":
      return !!n.batchId && n.batchId === student.batchId;
    case "student":
      return !!n.studentId && n.studentId === student.id;
    default:
      return false;
  }
}

/** Human-readable audience label. */
export function notificationAudience(
  n: Pick<NotifyRecord, "target" | "class" | "batchLabel">
): string {
  switch (n.target) {
    case "all":
      return "All students";
    case "class":
      return n.class ? `Class ${n.class}` : "A class";
    case "batch":
      return n.batchLabel ? `Batch · ${n.batchLabel}` : "A batch";
    case "student":
      return "You";
    default:
      return "Students";
  }
}

export type QueueNotificationInput = {
  type: NotifyType;
  title: string;
  body: string;
  target: NotifyTarget;
  /** Overrides the type's default landing URL when provided. */
  url?: string;
  class?: string | null;
  batchId?: string | null;
  batchLabel?: string | null;
  studentId?: string | null;
  createdBy?: string;
  createdByRole?: "admin" | "assistant" | "system";
};

/**
 * Enqueue a notification. One write to `Notifications` fans out to every
 * matching student's device (via the Cloud Function) and shows in their Notices
 * feed. Call this from any feature that should alert students.
 */
export async function queueNotification(input: QueueNotificationInput): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), "Notifications"), {
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    url: input.url ?? notifyTypeMeta(input.type).url,
    target: input.target,
    class: input.target === "all" ? null : input.class ?? null,
    batchId: input.target === "batch" ? input.batchId ?? null : null,
    batchLabel: input.target === "batch" ? input.batchLabel ?? null : null,
    studentId: input.target === "student" ? input.studentId ?? null : null,
    createdBy: input.createdBy ?? "system",
    createdByRole: input.createdByRole ?? "system",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
