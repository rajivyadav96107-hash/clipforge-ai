import { AuthProvider, useAuth } from './lib/auth';
import { useHashRoute, navigate } from './lib/router';
import { ToastHost } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { useEffect } from 'react';

function Router() {
  const route = useHashRoute();
  const { user, loading } = useAuth();

  // If a logged-in user lands on /login or /signup, send them to the dashboard.
  useEffect(() => {
    if (!loading && user && (route === '/login' || route === '/signup')) {
      navigate('/dashboard');
    }
  }, [loading, user, route]);

  switch (route) {
    case '/login':
      return <AuthPage mode="login" />;
    case '/signup':
      return <AuthPage mode="signup" />;
    case '/dashboard':
      return <DashboardPage />;
    case '/':
    default:
      return <LandingPage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <ToastHost />
    </AuthProvider>
  );
}
