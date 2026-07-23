import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, User, FileCheck, Settings, LogOut } from 'lucide-react';
import { QueryProvider } from './QueryProvider.jsx';
import httpClient, { setAccessToken, getAccessToken, rotateToken } from '../../shared/api/httpClient.js';

export const AppProviders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to HTTP Client session expirations & restore token on app mount (Identity Layer 1)
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem('iranse_logged_in');
      setAccessToken(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:logout', handleLogout);

    // Proactively restore access token from HTTP-only refresh cookie if logged in
    if (localStorage.getItem('iranse_logged_in') === 'true' && !getAccessToken()) {
      rotateToken().catch(() => {
        handleLogout();
      });
    }

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate]);

  const handleManualLogout = async () => {
    try {
      await httpClient('/api/v1/identity/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Backend logout call completed or skipped:', e);
    } finally {
      localStorage.removeItem('iranse_logged_in');
      setAccessToken(null);
      navigate('/login', { replace: true });
    }
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Matches', path: '/match-review', icon: Sparkles },
    { label: 'Profile', path: '/career-profile', icon: User },
    { label: 'Applications', path: '/applications', icon: FileCheck },
  ];

  return (
    <QueryProvider>
      <div className="app-container">
        {/* Dynamic header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            flexShrink: 0,
            zIndex: 50,
          }}
        >
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(250, 84%, 67%) 0%, hsl(190, 90%, 50%) 100%)',
                boxShadow: '0 0 10px hsla(190, 90%, 50%, 0.6)',
              }}
            />
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              IRANSÉ
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/preferences')}
              title="Security & Settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: location.pathname === '/preferences' ? 'rgba(255, 255, 255, 0.1)' : 'none',
                border: 'none',
                color: location.pathname === '/preferences' ? '#ffffff' : 'hsl(var(--color-text-secondary))',
                cursor: 'pointer',
                padding: '0.4rem 0.6rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Settings size={16} />
              <span className="hide-mobile">Settings</span>
            </button>

            <button
              onClick={handleManualLogout}
              title="Log Out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'rgb(248, 113, 113)',
                cursor: 'pointer',
                padding: '0.4rem 0.65rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={15} />
              <span className="hide-mobile">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Screen */}
        <main className="main-content">
          <Outlet />
        </main>

        {/* Bottom navigation menu (Mobile-First Safe area aware, fixed bottom viewport) */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: '480px',
            margin: '0 auto',
            height: 'calc(4.5rem + var(--safe-bottom))',
            background: 'rgba(15, 23, 42, 0.92)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: 'var(--safe-bottom)',
            zIndex: 50,
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: isActive ? '#ffffff' : 'hsl(var(--color-text-muted))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '0.5rem',
                }}
              >
                <Icon
                  size={20}
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 8px hsla(250, 84%, 67%, 0.5))' : 'none',
                    strokeWidth: isActive ? 2.5 : 2,
                    color: isActive ? 'hsl(250, 84%, 67%)' : 'inherit',
                  }}
                />
                <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </QueryProvider>
  );
};
export default AppProviders;
