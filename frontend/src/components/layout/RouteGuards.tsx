import { Navigate, Outlet, useLocation } from 'react-router';
import type { Role } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

/** Where each role lands after signing in. */
export const homePathFor = (role: Role) => (role === 'admin' ? '/admin' : '/dashboard');

/** Renders child routes only for signed-in users, optionally restricted to certain roles. */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (roles && !hasRole(...roles)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <Outlet />;
}

/** Sign-in and sign-up pages: signed-in users are sent to their home page instead. */
export function GuestOnly() {
  const { user } = useAuth();
  return user ? <Navigate to={homePathFor(user.role)} replace /> : <Outlet />;
}

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}
