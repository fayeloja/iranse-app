import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomeScreen from '../../pages/home/ui/HomeScreen.jsx';
import MatchReviewScreen from '../../pages/match-review/ui/MatchReviewScreen.jsx';
import CareerProfileScreen from '../../pages/career-profile/ui/CareerProfileScreen.jsx';
import ApplicationsScreen from '../../pages/applications/ui/ApplicationsScreen.jsx';
import PreferencesScreen from '../../pages/preferences/ui/PreferencesScreen.jsx';
import LoginScreen from '../../pages/login/ui/LoginScreen.jsx';
import AppProviders from '../providers/AppProviders.jsx';

/**
 * Route protection wrapper:
 * Redirects to /login if user is unauthenticated (Identity Layer 1).
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if access token exists in memory (React state)
  const isAuth = !!localStorage.getItem('iranse_logged_in'); // simple session persistence flag
  if (!isAuth) {
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
