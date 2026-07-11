// Demo-only client-side auth — replace with a real backend (API route +
// hashed credentials + httpOnly session cookie) before production.
export const ADMIN_SESSION_KEY = "caie-admin-session";

const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "caie-admin-2026";

export function verifyAdmin(id: string, password: string): boolean {
  return id === ADMIN_ID && password === ADMIN_PASSWORD;
}
