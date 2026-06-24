import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, authInitialized } = useAuth();
  const location = useLocation();

  // Don't redirect until the session has been restored from storage.
  if (!authInitialized) return null;

  if (!user) {
    // Store the intended path so we can return the user here after login.
    sessionStorage.setItem('pc_return_to', location.pathname);
    return <Navigate to="/" replace />;
  }

  return children;
}
