import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, User, FileCheck, ShieldAlert } from 'lucide-react';
import { QueryProvider } from './QueryProvider.jsx';

export const AppProviders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to HTTP Client session expirations (Identity Layer 1)
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem('iranse_logged_in');
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate]);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Matches', path: '/match-review', icon: Sparkles },
    { label: 'Profile', path: '/career-profile', icon: User },
    { label: 'Queue', path: '/applications', icon: FileCheck },
    { label: 'Settings', path: '/preferences', icon: ShieldAlert },
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
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(2, 6, 23, 0.7)',
            backdropFilter: 'blur(16px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
            Lagos, NG
          </div>
        </header>

        {/* Dynamic Route Screen */}
        <main className="main-content">
          <Outlet />
        </main>

        {/* Bottom navigation menu (Mobile-First Safe area aware) */}
        <nav
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'calc(4.5rem + var(--safe-bottom))',
            background: 'rgba(15, 23, 42, 0.55)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: 'var(--safe-bottom)',
            zIndex: 10,
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
