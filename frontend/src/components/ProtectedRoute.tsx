import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) return <div className="loading">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole && !hasRole(requiredRole))
    return (
      <div className="container">
        <div className="card">
          <h2>Access Denied</h2>
          <p>You don't have the required role: <strong>{requiredRole}</strong></p>
        </div>
      </div>
    );

  return <>{children}</>;
}
