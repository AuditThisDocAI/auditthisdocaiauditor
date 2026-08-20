export const ADMIN_EMAIL = 'brigittalombard09@gmail.com';

/**
 * Checks if a given email belongs to the super admin
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Checks if the currently logged-in user is the super admin
 */
export function isCurrentAdmin(): boolean {
  const userEmail = (localStorage.getItem('audit-this-doc-user-email') || '').trim().toLowerCase();
  const cmsAuth = localStorage.getItem('audit-this-doc-cms-auth') === 'true';
  return (cmsAuth && isSuperAdminEmail(userEmail)) || isSuperAdminEmail(userEmail);
}

/**
 * Checks if the current user has Pro privileges (either paid Pro or Super Admin)
 */
export function isUserPro(): boolean {
  if (isCurrentAdmin()) return true;
  return localStorage.getItem('audit_this_doc_is_pro') === 'true';
}

/**
 * Gets the current user's email
 */
export function getCurrentUserEmail(): string {
  return localStorage.getItem('audit-this-doc-user-email') || '';
}

/**
 * Free audit limit configuration
 * Simple policy: Exactly 1 free document audit per user
 */
export const FREE_AUDIT_LIMIT = 1;

/**
 * Checks whether user has exceeded the free audit limit
 */
export function hasExceededFreeLimit(currentCount: number): boolean {
  if (isUserPro()) return false;
  return currentCount >= FREE_AUDIT_LIMIT;
}
