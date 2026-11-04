import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, staffOnly = false }) {
  const { user } = useAuth();
  if (user === undefined) return null; // still loading
  if (!user) return <Navigate to="/login" replace />;
  if (staffOnly && !['staff', 'admin'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
