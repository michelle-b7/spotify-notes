import {Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './auth/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/DashBoard';
import Search from './pages/Search';
import Note from './pages/Note';

function ProtectedRoute({children}) {
  const {token} = useAuth();
  if (!token) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth-callback" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/note/:trackId" element={<ProtectedRoute><Note /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
