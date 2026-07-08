import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingScreen } from './LoadingScreen.jsx';

const roleHome = {
  recruiter: '/hr/dashboard',
  candidate: '/candidate/dashboard'
};

export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={roleHome[user?.role] || '/login'} replace />;
  }

  return children;
};
