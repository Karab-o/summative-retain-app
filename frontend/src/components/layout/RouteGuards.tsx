import { Navigate, Outlet, useLocation } from 'react-router';
import type { Role } from '../../api/types';
import { useAppSelector } from '../../store/hooks';

/** Where each role lands after signing in. */
export const homePathFor = (role: Role) => (role === 'admin' ? '/admin' : '/dashboard');

/** Renders child routes only for signed-in users, optionally restricted to certain roles. */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { token, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <Outlet />;
}

/** Sign-in and sign-up pages: signed-in users are sent to their home page instead. */
export function GuestOnly() {
  const user = useAppSelector((state) => state.auth.user);
  return user ? <Navigate to={homePathFor(user.role)} replace /> : <Outlet />;
}

export function HomeRedirect() {
  const user = useAppSelector((state) => state.auth.user);
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}
