/**
 * The current JWT, kept outside React so the API layer can attach it to every request.
 * AuthContext owns the session and keeps this in sync; nothing else should write to it.
 */
let token: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const getAuthToken = () => token;

export function setAuthToken(value: string | null) {
  token = value;
}

/** Registers the callback run when the API rejects the current token. Returns an unsubscribe function. */
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

/**
 * Called by the API layer on a 401. Ignored if the rejected token is no longer the
 * current one (e.g. a slow request from a previous session finished after re-login).
 */
export function notifyUnauthorized(rejectedToken: string) {
  if (rejectedToken === token) unauthorizedHandler?.();
}
