import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';

export const RoleRedirect = () => {
  const { loading, user, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Navigate to={user?.role === 'recruiter' ? '/hr/dashboard' : '/candidate/dashboard'} replace />;
};
