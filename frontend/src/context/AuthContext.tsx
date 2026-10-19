import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onUnauthorized, setAuthToken } from '../api/session';
import type { AuthResponse, LoginInput, RegisterInput, Role, User } from '../api/types';
import { api, useLoginMutation, useRegisterMutation } from '../store/api';
import { expenseFiltersReset } from '../store/expenseFiltersSlice';
import { useAppDispatch } from '../store/hooks';
import { readJSON, writeJSON } from '../store/storage';

const STORAGE_KEY = 'retain.auth';

interface SessionState {
  token: string | null;
  user: User | null;
  sessionExpired: boolean;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True when the API rejected the saved session, so the sign-in page can explain why. */
  sessionExpired: boolean;
  /** Signs in and returns the user. Throws an `ApiError` if the credentials are rejected. */
  login: (input: LoginInput) => Promise<User>;
  /** Creates an account, signs in and returns the user. Throws an `ApiError` on failure. */
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  /** Replaces the cached profile with fresh data from the API (e.g. after a role change). */
  refreshUser: (user: User) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Restores the session saved by a previous visit so a page refresh keeps the user signed in. */
function loadStoredSession(): SessionState {
  const stored = readJSON<AuthResponse>(STORAGE_KEY);
  const valid = Boolean(stored?.token && stored.user);
  setAuthToken(valid ? stored!.token : null);
  return { token: valid ? stored!.token : null, user: valid ? stored!.user : null, sessionExpired: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [session, setSession] = useState<SessionState>(loadStoredSession);
  const [loginRequest] = useLoginMutation();
  const [registerRequest] = useRegisterMutation();

  useEffect(() => {
    writeJSON(STORAGE_KEY, session.token && session.user ? { token: session.token, user: session.user } : null);
  }, [session.token, session.user]);

  const startSession = useCallback((auth: AuthResponse) => {
    // Set the token before re-rendering so the first requests of the new screen are authenticated.
    setAuthToken(auth.token);
    setSession({ token: auth.token, user: auth.user, sessionExpired: false });
    return auth.user;
  }, []);

  const endSession = useCallback(
    (expired: boolean) => {
      setAuthToken(null);
      setSession({ token: null, user: null, sessionExpired: expired });
      // Drop cached data and filters so the next account never sees the previous one's.
      dispatch(api.util.resetApiState());
      dispatch(expenseFiltersReset());
    },
    [dispatch],
  );

  // The API layer reports rejected tokens here (expired or deleted account).
  useEffect(() => onUnauthorized(() => endSession(true)), [endSession]);

  const login = useCallback(
    async (input: LoginInput) => startSession(await loginRequest(input).unwrap()),
    [loginRequest, startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => startSession(await registerRequest(input).unwrap()),
    [registerRequest, startSession],
  );

  const logout = useCallback(() => endSession(false), [endSession]);

  const refreshUser = useCallback((user: User) => {
    setSession((prev) => (prev.token ? { ...prev, user } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      sessionExpired: session.sessionExpired,
      login,
      register,
      logout,
      refreshUser,
      hasRole: (...roles) => Boolean(session.user && roles.includes(session.user.role)),
    }),
    [session, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the signed-in user and auth actions. Must be used inside `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
