import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import './styles/tokens.css';
import './styles/globals.css';

function AppContent() {
  const { user, userProfile, loading } = useAuth();

  if (loading) return null;
  if (!user || !userProfile) return <LoginPage />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
