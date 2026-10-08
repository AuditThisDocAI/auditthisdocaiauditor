export const ADMIN_EMAILS = [
  'brigittalombard09@gmail.com',
  'brigttalombard09@gmail.com'
];

export const ADMIN_EMAIL = 'brigittalombard09@gmail.com';

/**
 * Checks if a given email belongs to the super admin
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === clean);
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
 * Returns a secure display name that never reveals the admin's private email address to other users
 */
export function getSafeUserDisplayName(email?: string | null): string {
  if (!email) return 'Member';
  if (isSuperAdminEmail(email)) {
    return 'Administrator';
  }
  return email;
}

/**
 * Free audit limit configuration
 * 7-Day Free Trial policy with standard free document quota
 */
export const FREE_AUDIT_LIMIT = 5;

/**
 * Checks whether user has exceeded the free audit limit or trial time has expired
 */
export function hasExceededFreeLimit(currentCount?: number): boolean {
  if (isUserPro()) return false;
  try {
    const expired = localStorage.getItem('audit_this_doc_trial_forced_expired') === 'true';
    if (expired) return true;
    const startStr = localStorage.getItem('audit_this_doc_trial_start');
    if (startStr) {
      const start = parseInt(startStr, 10);
      if (!isNaN(start) && Date.now() >= start + 7 * 24 * 60 * 60 * 1000) {
        return true;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  if (typeof currentCount === 'number') {
    return currentCount >= FREE_AUDIT_LIMIT;
  }
  return false;
}

