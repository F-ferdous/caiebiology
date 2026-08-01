// Admin now authenticates against Firebase Auth (real session), signing in with
// a short id that maps to a synthetic email — same trick as assistants use.
// The admin types id "admin"; under the hood that's admin@caiebiology.com.
export const ADMIN_EMAIL_DOMAIN = "caiebiology.com";

export function adminEmail(id: string): string {
  return `${id.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
}

/** The single admin account. Login and the panel guard both key off this. */
export const ADMIN_ID = "admin";
export const ADMIN_EMAIL = adminEmail(ADMIN_ID);

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
