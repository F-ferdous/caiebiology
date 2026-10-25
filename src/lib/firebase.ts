import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import {
  getMessaging,
  isSupported as isMessagingSupported,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** The public web-app config, used to initialise Firebase inside the
 *  messaging service worker (passed as URL params at registration). */
export const publicFirebaseConfig = firebaseConfig;

/** Web Push VAPID key (Firebase console → Cloud Messaging → Web Push certs). */
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

function getFirebaseApp(): FirebaseApp {
  return getApps().some((a) => a.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(firebaseConfig);
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

/** Firebase Cloud Messaging — resolves to null when the browser can't support
 *  it (no window, no service worker / push, private mode, etc.). */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  try {
    if (!(await isMessagingSupported())) return null;
    return getMessaging(getFirebaseApp());
  } catch {
    return null;
  }
}

/**
 * Creating a user with the client SDK signs that user in on the app instance
 * used. A secondary app keeps the admin's session on the default app untouched.
 */
export function getSecondaryAuth(): Auth {
  const name = "assistant-creator";
  const existing = getApps().find((a) => a.name === name);
  return getAuth(existing ?? initializeApp(firebaseConfig, name));
}

/** Firebase Auth requires an email — assistants sign in with a synthetic
 *  address derived from their username. */
export const ASSISTANT_EMAIL_DOMAIN = "assistant.caie-biology.com";

export function assistantEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${ASSISTANT_EMAIL_DOMAIN}`;
}
