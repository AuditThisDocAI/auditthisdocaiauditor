import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { setCachedGmailToken } from './gmailService';
import { setCachedFormsToken } from './googleFormsService';

// Default session idle timeout in seconds (15 minutes = 900 seconds)
export const DEFAULT_SESSION_TIMEOUT_SECONDS = 900;
// Warning threshold in seconds (60 seconds before session expires)
export const WARNING_THRESHOLD_SECONDS = 60;

const STORAGE_KEYS = {
  LAST_ACTIVITY: 'audit_session_last_activity',
  TIMEOUT_SETTING: 'audit_session_timeout_seconds',
  EXPIRED_REASON: 'audit_session_expired_reason',
};

/**
 * Retrieves the configured session timeout in seconds (defaults to 15 minutes = 900s)
 */
export function getSessionTimeoutSeconds(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.TIMEOUT_SETTING);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed >= 120) {
      return parsed;
    }
  }
  return DEFAULT_SESSION_TIMEOUT_SECONDS;
}

/**
 * Updates the configured session timeout duration
 */
export function setSessionTimeoutSeconds(seconds: number): void {
  localStorage.setItem(STORAGE_KEYS.TIMEOUT_SETTING, Math.max(120, seconds).toString());
  window.dispatchEvent(new Event('session-config-changed'));
}

/**
 * Retrieves the timestamp (ms) of the last user interaction
 */
export function getLastActivityTimestamp(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
  return now;
}

/**
 * Records a user activity event to extend/reset the idle timer
 */
export function recordUserActivity(): void {
  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
  window.dispatchEvent(new Event('session-activity-recorded'));
}

/**
 * Calculates remaining session seconds before expiration
 */
export function getRemainingSessionSeconds(): number {
  const lastActive = getLastActivityTimestamp();
  const timeoutSec = getSessionTimeoutSeconds();
  const elapsedSec = Math.floor((Date.now() - lastActive) / 1000);
  return Math.max(0, timeoutSec - elapsedSec);
}

/**
 * Extends the user's session by setting last activity to now
 */
export function extendSession(): void {
  recordUserActivity();
  window.dispatchEvent(new CustomEvent('session-extended', { detail: { timestamp: Date.now() } }));
}

/**
 * Centralized complete logout procedure
 */
export async function performLogout(reason: string = 'User logged out.'): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase sign out error during session expiration:', err);
  }

  // Clear local storage authentication state
  localStorage.removeItem('audit-this-doc-cms-auth');
  localStorage.removeItem('audit-this-doc-user-email');
  localStorage.removeItem('audit_this_doc_is_pro');
  localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);

  // Clear cached OAuth tokens
  setCachedGmailToken(null);
  setCachedFormsToken(null);

  // Set session expiration notification message
  if (reason) {
    sessionStorage.setItem(STORAGE_KEYS.EXPIRED_REASON, reason);
  }

  // Notify components of auth status changes
  window.dispatchEvent(new Event('admin-auth-changed'));
  window.dispatchEvent(new Event('pro-status-changed'));
  window.dispatchEvent(new CustomEvent('session-expired', { detail: { reason } }));
  window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
}

/**
 * Checks and clears any pending session expired reason
 */
export function consumeExpiredSessionReason(): string | null {
  const reason = sessionStorage.getItem(STORAGE_KEYS.EXPIRED_REASON);
  if (reason) {
    sessionStorage.removeItem(STORAGE_KEYS.EXPIRED_REASON);
  }
  return reason;
}

/**
 * Checks if user is currently authenticated
 */
export function isUserAuthenticated(): boolean {
  return localStorage.getItem('audit-this-doc-cms-auth') === 'true' || !!auth.currentUser;
}
