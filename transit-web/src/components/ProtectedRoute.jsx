import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, token } = useAuth();  // Also get token

  console.log('Protected Route Check:', {
    hasUser: !!user,
    user: user,
    hasToken: !!token,
    token: token
  });

  if (!user || !user.isAdmin) {
    console.log('Access denied:', {
      reason: !user ? 'No user' : 'Not admin',
      shouldRedirect: true
    });
    return <Navigate to="/" replace />;
  }

  console.log('Access granted to admin route');
  return children;
};

export default ProtectedRoute; 