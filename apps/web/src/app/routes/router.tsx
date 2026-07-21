import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomeScreen from '../../pages/home/ui/HomeScreen.jsx';
import MatchReviewScreen from '../../pages/match-review/ui/MatchReviewScreen.jsx';
import CareerProfileScreen from '../../pages/career-profile/ui/CareerProfileScreen.jsx';
import ApplicationsScreen from '../../pages/applications/ui/ApplicationsScreen.jsx';
import PreferencesScreen from '../../pages/preferences/ui/PreferencesScreen.jsx';
import LoginScreen from '../../pages/login/ui/LoginScreen.jsx';
import AppProviders from '../providers/AppProviders.jsx';

import { getAccessToken, rotateToken } from '../../shared/api/httpClient.js';

/**
 * Route protection wrapper:
 * Performs silent session bootstrap check on page reload (Identity Layer 1).
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = React.useState<boolean>(() => {
    return !!localStorage.getItem('iranse_logged_in') && !getAccessToken();
  });
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(() => {
    return !!localStorage.getItem('iranse_logged_in');
  });

  React.useEffect(() => {
    if (!localStorage.getItem('iranse_logged_in')) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    if (!getAccessToken()) {
      rotateToken().then((token) => {
        if (token) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('iranse_logged_in');
          setIsAuthenticated(false);
        }
        setIsChecking(false);
      });
    } else {
      setIsChecking(false);
    }
  }, []);

  if (isChecking) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'hsl(var(--bg-base))',
          color: '#ffffff',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'hsl(var(--color-primary))',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
          Verifying session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginScreen />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppProviders />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <HomeScreen />,
      },
      {
        path: '/match-review',
        element: <MatchReviewScreen />,
      },
      {
        path: '/career-profile',
        element: <CareerProfileScreen />,
      },
      {
        path: '/applications',
        element: <ApplicationsScreen />,
      },
      {
        path: '/preferences',
        element: <PreferencesScreen />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
export default router;
