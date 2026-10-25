"use client";

// Client-side Web Push / FCM helpers. A user grants notification permission,
// we fetch an FCM registration token and store it (with who they are + which
// class/batch) in the `PushTokens` collection. The Announcements Cloud Function
// reads those docs to target the right students when the admin posts.
import { getToken, onMessage } from "firebase/messaging";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  getFirebaseDb,
  getFirebaseMessaging,
  isFirebaseConfigured,
  publicFirebaseConfig,
  VAPID_KEY,
} from "./firebase";

export type PushRole = "student" | "parent" | "admin" | "assistant";

/** Who a token belongs to — class/batch let the sender target students. */
export type PushOwner = {
  role: PushRole;
  studentId?: string;
  class?: string;
  batchId?: string;
  name?: string;
};

export type EnableResult =
  | { ok: true; token: string }
  | {
      ok: false;
      reason: "unsupported" | "missing-vapid" | "denied" | "default" | "error";
    };

const TOKEN_STORAGE_KEY = "caie-push-token";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    "PushManager" in window
  );
}

/** "granted" | "denied" | "default", or "unsupported" when the browser can't. */
export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** iOS/iPadOS only allow web push once the app runs from the home screen. */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag on navigator.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Register the FCM service worker, passing the public config as URL params so
 *  the worker can initialise Firebase without the config being committed. */
async function registerMessagingSw(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  const c = publicFirebaseConfig;
  const params = new URLSearchParams();
  Object.entries(c).forEach(([k, v]) => {
    if (v) params.set(k, String(v));
  });
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`, {
    scope: "/",
    updateViaCache: "none",
  });
}

async function saveToken(token: string, owner: PushOwner): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "PushTokens", token),
    {
      token,
      role: owner.role,
      studentId: owner.studentId ?? null,
      class: owner.class ?? null,
      batchId: owner.batchId ?? null,
      name: owner.name ?? null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    /* storage may be unavailable (private mode) — token still saved server-side */
  }
}

/** Prompt for permission (if needed) and register the token. Call from a click. */
export async function enablePush(owner: PushOwner): Promise<EnableResult> {
  if (!isFirebaseConfigured || !isPushSupported()) return { ok: false, reason: "unsupported" };
  if (!VAPID_KEY) return { ok: false, reason: "missing-vapid" };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: permission === "denied" ? "denied" : "default" };
    }
    const registration = await registerMessagingSw();
    const messaging = await getFirebaseMessaging();
    if (!registration || !messaging) return { ok: false, reason: "unsupported" };

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return { ok: false, reason: "error" };

    await saveToken(token, owner);
    return { ok: true, token };
  } catch (err) {
    console.error("enablePush failed", err);
    return { ok: false, reason: "error" };
  }
}

/** Silently re-register the token on load when permission is already granted —
 *  refreshes the owner metadata (class/batch may have changed) and handles
 *  rotated FCM tokens. No prompt is shown. */
export async function refreshPushToken(owner: PushOwner): Promise<void> {
  if (!isFirebaseConfigured || !isPushSupported() || !VAPID_KEY) return;
  if (Notification.permission !== "granted") return;
  try {
    const registration = await registerMessagingSw();
    const messaging = await getFirebaseMessaging();
    if (!registration || !messaging) return;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (token) await saveToken(token, owner);
  } catch {
    /* best-effort */
  }
}

/** Forget this device's token (used when a student signs out). */
export async function disablePush(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (token && isFirebaseConfigured) {
    try {
      await deleteDoc(doc(getFirebaseDb(), "PushTokens", token));
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type ForegroundMessage = { title: string; body: string; url?: string };

/** Subscribe to messages that arrive while the app is open (foreground). The
 *  service worker only fires for background messages, so the app shows these
 *  itself. Returns an unsubscribe function. */
export function onForegroundMessage(cb: (msg: ForegroundMessage) => void): () => void {
  let unsub = () => {};
  let cancelled = false;
  getFirebaseMessaging().then((messaging) => {
    if (!messaging || cancelled) return;
    unsub = onMessage(messaging, (payload) => {
      const data = (payload.data ?? {}) as Record<string, string>;
      cb({
        title: data.title || payload.notification?.title || "CAIE-BIOLOGY",
        body: data.body || payload.notification?.body || "",
        url: data.url,
      });
    });
  });
  return () => {
    cancelled = true;
    unsub();
  };
}
