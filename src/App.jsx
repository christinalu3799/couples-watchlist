import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import Timeline from './pages/Timeline';
import './styles/tokens.css';
import './styles/globals.css';

function AppContent() {
  const { user, userProfile, loading } = useAuth();
  const [page, setPage] = useState('home');

  useEffect(() => {
    if (user?.uid) {
      setPage('home');
    }
  }, [user?.uid]);

  if (loading) return null;
  if (!user || !userProfile) return <LoginPage />;

  return page === 'timeline' ? (
    <Timeline onBackHome={() => setPage('home')} />
  ) : (
    <Home onOpenTimeline={() => setPage('timeline')} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
