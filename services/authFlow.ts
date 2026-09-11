export type BrowserEnvironment = {
  userAgent: string;
  maxTouchPoints: number;
  width: number;
};

/** Firebase recommends redirect auth on mobile browsers and popup auth on desktop. */
export function isMobileBrowserEnvironment(environment: BrowserEnvironment): boolean {
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(environment.userAgent);
  const compactTouchDevice = environment.maxTouchPoints > 0 && environment.width < 900;
  return mobileUserAgent || compactTouchDevice;
}

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}

/** A superseded popup is expected control flow, not a user-facing failure. */
export function getFriendlyAuthError(error: unknown): string | null {
  const code = getErrorCode(error);
  if (code === 'auth/cancelled-popup-request') return null;
  if (code === 'auth/popup-closed-by-user') return 'Google sign-in was cancelled. You can try again when you’re ready.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google sign-in window. Allow popups for TVBeli and try again.';
  if (code === 'auth/unauthorized-domain') return 'This TVBeli domain is not authorized in Firebase Authentication.';
  if (code === 'auth/network-request-failed') return 'Google sign-in could not reach Firebase. Check your connection and try again.';
  return error instanceof Error && !error.message.startsWith('Firebase:')
    ? error.message
    : 'Google sign-in could not be completed. Please try again.';
}

export class SingleFlight {
  private current: Promise<void> | null = null;

  run(action: () => Promise<void>): Promise<void> {
    if (this.current) return this.current;
    const pending = action();
    this.current = pending.finally(() => {
      if (this.current === pendingWithCleanup) this.current = null;
    });
    const pendingWithCleanup = this.current;
    return pendingWithCleanup;
  }
}
