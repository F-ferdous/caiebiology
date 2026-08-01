import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebaseAdmin";
import { isAdminEmail } from "@/lib/adminAuth";

// firebase-admin needs Node APIs — keep this off the Edge runtime.
export const runtime = "nodejs";

// Assistants share the Students manager, so they may delete too. Mirrors
// ASSISTANT_EMAIL_DOMAIN in src/lib/firebase.ts (kept inline to avoid pulling
// the client SDK into this server route).
const ASSISTANT_EMAIL_DOMAIN = "assistant.caie-biology.com";

function isStaffEmail(email: string | undefined): boolean {
  return isAdminEmail(email) || Boolean(email?.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`));
}

/**
 * Deletes a student's Firebase Auth account by uid, using the Admin SDK.
 * The caller must present a valid Firebase ID token (Authorization: Bearer …)
 * belonging to a staff account (admin or assistant). The caller removes the
 * Firestore record separately.
 */
export async function POST(req: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Server is missing Firebase Admin credentials." },
      { status: 503 }
    );
  }

  // --- Authenticate the caller via their Firebase ID token ---
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let callerEmail: string | undefined;
  try {
    callerEmail = (await getAdminAuth().verifyIdToken(idToken)).email;
  } catch {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }
  if (!isStaffEmail(callerEmail)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  // --- Validate input ---
  let uid: unknown;
  try {
    ({ uid } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof uid !== "string" || !uid) {
    return NextResponse.json({ error: "A student uid is required." }, { status: 400 });
  }

  // --- Delete the Auth account ---
  try {
    await getAdminAuth().deleteUser(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string }).code;
    // Nothing to delete — from the caller's view the account is gone, which is
    // exactly the desired end state, so report success.
    if (code === "auth/user-not-found") {
      return NextResponse.json({ ok: true, alreadyGone: true });
    }
    return NextResponse.json(
      { error: (err as Error).message ?? "Could not delete the auth account.", code },
      { status: 500 }
    );
  }
}
