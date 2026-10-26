// Client helpers for the AI Biology tutor. The heavy lifting (grounding, the
// LLM key, rate limits, persistence) all live in the `askTutor` Cloud Function
// — this file just calls it and streams the saved chat back from Firestore.
import { httpsCallable } from "firebase/functions";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb, getFirebaseFunctions } from "./firebase";

export type TutorRole = "user" | "assistant";

export type TutorMessage = {
  id?: string;
  role: TutorRole;
  content: string;
  /** Strictly-increasing sort key set by the function (see index.js). */
  order?: number;
  createdAt?: Timestamp | null;
};

type AskTutorRequest = {
  studentId: string;
  question: string;
  history: { role: TutorRole; content: string }[];
};

type AskTutorResponse = { answer: string; level: "O" | "A" };

/** How many past messages to keep on screen / replay to the model. The
 *  function trims again server-side, so this is only a sensible client bound. */
export const TUTOR_HISTORY_LIMIT = 40;

/** Classes IX & X are O Level; XI & XII are A Level. Kept in sync with the
 *  `levelForClass` helper in functions/index.js. */
export function tutorLevelLabel(studentClass: string): string {
  const c = (studentClass || "").trim().toUpperCase();
  if (c === "IX" || c === "X" || c === "9" || c === "10") return "O Level";
  if (c === "XI" || c === "XII" || c === "11" || c === "12") return "A Level";
  return "";
}

/** Ask the tutor a question. Resolves with the answer, or rejects with a
 *  Firebase callable error whose `.message` is safe to show the student. */
export async function askTutor(
  studentId: string,
  question: string,
  history: TutorMessage[]
): Promise<AskTutorResponse> {
  const callable = httpsCallable<AskTutorRequest, AskTutorResponse>(
    getFirebaseFunctions(),
    "askTutor"
  );
  const res = await callable({
    studentId,
    question,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });
  return res.data;
}

/** Live-follow a student's own tutor history, oldest first. */
export function subscribeTutorHistory(
  studentId: string,
  onChange: (messages: TutorMessage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(getFirebaseDb(), "TutorChats", studentId, "messages"),
    orderBy("order", "asc"),
    limit(TUTOR_HISTORY_LIMIT)
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TutorMessage, "id">) }))
      );
    },
    (err) => onError?.(err)
  );
}
