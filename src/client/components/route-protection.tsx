import { Navigate, Outlet } from "react-router";

import { useAuth } from "@/contexts/auth";

interface ProtectedRoutesProps {
  redirectTo: string;
  optional?: boolean;
}

/**
 * Routes wrapped in this component will only be accessible when the user is logged in.
 *
 * For example, if the user *isn't* logged in and they try to access the dashboard, then they will be
 * redirected to the page specified by the `redirectTo` prop.
 */
export const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ redirectTo, optional = false }) => {
  const { currentUser } = useAuth();

  if (optional) {
    return <Outlet />;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} />;
  }

  return <Outlet />;
};

/**
 * Routes wrapped in this component will only be accessible when the user is NOT logged in.
 *
 * For example, if the user *is* logged in and they try to access the login page, they will be
 * redirected to the page specified by the `redirectTo` prop.
 */
export const StrictlyPublicRoutes: React.FC<ProtectedRoutesProps> = ({ redirectTo, optional = false }) => {
  const { currentUser } = useAuth();

  if (optional) {
    return <Outlet />;
  }

  if (currentUser) {
    return <Navigate to={redirectTo} />;
  }

  return <Outlet />;
};
