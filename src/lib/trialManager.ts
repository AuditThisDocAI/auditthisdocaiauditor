import { useState, useEffect } from 'react';
import { isCurrentAdmin, isSuperAdminEmail, getCurrentUserEmail } from './authUtils';

export const TRIAL_DURATION_DAYS = 7;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export const TRIAL_START_KEY = 'audit_this_doc_trial_start';
export const TRIAL_FORCED_EXPIRED_KEY = 'audit_this_doc_trial_forced_expired';

export interface TrialStatus {
  isPro: boolean;
  isAdmin: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  startedAt: number;
  expiresAt: number;
  remainingMs: number;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingFormatted: string;
  percentUsed: number;
}

/**
 * Initializes or retrieves the trial start timestamp
 */
export function getOrCreateTrialStartTime(): number {
  if (typeof window === 'undefined') return Date.now();
  const existing = localStorage.getItem(TRIAL_START_KEY);
  if (existing) {
    const parsed = parseInt(existing, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const now = Date.now();
  localStorage.setItem(TRIAL_START_KEY, now.toString());
  return now;
}

/**
 * Evaluates current trial status
 */
export function getTrialStatus(): TrialStatus {
  if (typeof window === 'undefined') {
    return {
      isPro: false,
      isAdmin: false,
      isTrialActive: true,
      isTrialExpired: false,
      startedAt: Date.now(),
      expiresAt: Date.now() + TRIAL_DURATION_MS,
      remainingMs: TRIAL_DURATION_MS,
      remainingDays: TRIAL_DURATION_DAYS,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingFormatted: `${TRIAL_DURATION_DAYS} days remaining`,
      percentUsed: 0,
    };
  }

  const userEmail = getCurrentUserEmail();
  const isAdmin = isCurrentAdmin() || isSuperAdminEmail(userEmail);
  const isPaidPro = localStorage.getItem('audit_this_doc_is_pro') === 'true';
  const isPro = isAdmin || isPaidPro;

  // Check for test override
  const isForcedExpired = localStorage.getItem(TRIAL_FORCED_EXPIRED_KEY) === 'true';

  const startedAt = getOrCreateTrialStartTime();
  const expiresAt = startedAt + TRIAL_DURATION_MS;
  const now = Date.now();

  const isTimeUp = now >= expiresAt || isForcedExpired;
  const isTrialExpired = !isPro && isTimeUp;
  const isTrialActive = !isPro && !isTimeUp;

  const remainingMs = Math.max(0, expiresAt - now);
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  let remainingFormatted = '';
  if (isPro) {
    remainingFormatted = 'Unlimited Pro Plan';
  } else if (isTrialExpired) {
    remainingFormatted = 'Trial Expired';
  } else if (remainingDays >= 1) {
    remainingFormatted = `${remainingDays}d ${remainingHours}h remaining`;
  } else if (remainingHours >= 1) {
    remainingFormatted = `${remainingHours}h ${remainingMinutes}m remaining`;
  } else {
    remainingFormatted = `${Math.max(1, remainingMinutes)}m remaining`;
  }

  const elapsedMs = Math.max(0, now - startedAt);
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / TRIAL_DURATION_MS) * 100)));

  return {
    isPro,
    isAdmin,
    isTrialActive,
    isTrialExpired,
    startedAt,
    expiresAt,
    remainingMs,
    remainingDays,
    remainingHours,
    remainingMinutes,
    remainingFormatted,
    percentUsed,
  };
}

/**
 * Trigger testing helper to simulate time is up immediately
 */
export function simulateTrialExpiredForTesting(): void {
  localStorage.setItem(TRIAL_FORCED_EXPIRED_KEY, 'true');
  window.dispatchEvent(new CustomEvent('trial-status-changed'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Trigger testing helper to reset the 7-day trial back to fresh
 */
export function resetTrialToFreshForTesting(): void {
  localStorage.removeItem(TRIAL_FORCED_EXPIRED_KEY);
  localStorage.setItem(TRIAL_START_KEY, Date.now().toString());
  window.dispatchEvent(new CustomEvent('trial-status-changed'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Hook for components to reactively observe 7-day trial status
 */
export function useTrial(): TrialStatus & {
  simulateExpired: () => void;
  resetTrial: () => void;
} {
  const [status, setStatus] = useState<TrialStatus>(getTrialStatus());

  useEffect(() => {
    const update = () => setStatus(getTrialStatus());
    
    // Check periodically so time is detected in real-time
    const interval = setInterval(update, 30000); // every 30 seconds

    window.addEventListener('trial-status-changed', update);
    window.addEventListener('pro-status-changed', update);
    window.addEventListener('admin-auth-changed', update);
    window.addEventListener('storage', update);

    return () => {
      clearInterval(interval);
      window.removeEventListener('trial-status-changed', update);
      window.removeEventListener('pro-status-changed', update);
      window.removeEventListener('admin-auth-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return {
    ...status,
    simulateExpired: simulateTrialExpiredForTesting,
    resetTrial: resetTrialToFreshForTesting,
  };
}
