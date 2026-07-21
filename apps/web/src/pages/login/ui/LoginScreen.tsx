import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { setAccessToken } from '../../../shared/api/httpClient.js';
import { ShieldCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const path = isLogin ? '/api/v1/identity/login' : '/api/v1/identity/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, fullName, phone };

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Authentication failed');
      }

      // Save token to React memory and toggle login session indicators
      setAccessToken(result.data.accessToken);
      localStorage.setItem('iranse_logged_in', 'true');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'hsl(var(--bg-base))',
        padding: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Title Brand */}
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '1rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={28} className="text-gradient" />
          </span>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            IRANSÉ
          </h1>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Agentic Career Platform
          </p>
        </div>

        {/* Auth form Card */}
        <Card variant="glass">
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1.5rem' }}>
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                color: isLogin ? '#ffffff' : 'hsl(var(--color-text-muted))',
                fontWeight: 600,
                borderBottom: isLogin ? '2px solid hsl(var(--color-primary))' : 'none',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                color: !isLogin ? '#ffffff' : 'hsl(var(--color-text-muted))',
                fontWeight: 600,
                borderBottom: !isLogin ? '2px solid hsl(var(--color-primary))' : 'none',
                cursor: 'pointer',
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080 1234 5678"
                    className="input-field"
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {error && (
              <div style={{ color: 'rgb(248, 113, 113)', fontSize: '0.8rem', textAlign: 'center', margin: '0.5rem 0' }}>
                {error}
              </div>
            )}

            <Button variant="primary" type="submit" isLoading={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default LoginScreen;
