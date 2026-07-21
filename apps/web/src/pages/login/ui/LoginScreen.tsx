import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { setAccessToken } from '../../../shared/api/httpClient.js';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'auth' | 'forgot_password' | 'reset_password'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const normalizePhoneNumber = (raw: string): string => {
    let sanitized = raw.replace(/[\s\-\(\)]/g, ''); // strip spaces, hyphens, parentheses
    if (sanitized.startsWith('0')) {
      sanitized = '+234' + sanitized.substring(1); // convert local 080... to +23480...
    }
    return sanitized;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Frontend validations
    if (!isLogin) {
      if (fullName.trim().length < 2) {
        setError('Full name must be at least 2 characters long');
        setIsLoading(false);
        return;
      }
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
        setError('Invalid phone number format. Please include country code (e.g. +234)');
        setIsLoading(false);
        return;
      }
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    const path = isLogin ? '/api/v1/identity/login' : '/api/v1/identity/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, fullName, phone: normalizePhoneNumber(phone) };

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

      if (isLogin) {
        // Login success: save access token to React memory and flag session
        setAccessToken(result.data.accessToken);
        localStorage.setItem('iranse_logged_in', 'true');
        navigate('/');
      } else {
        // Option B: Registration success -> Switch to Sign In tab with success notice
        setIsLogin(true);
        setPassword('');
        setSuccessMessage('Account created successfully! Please sign in with your email and password.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/v1/identity/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Password reset request failed');
      }

      if (result.data?.resetToken) {
        setResetToken(result.data.resetToken);
        setSuccessMessage(`Reset token issued (Dev Mode): ${result.data.resetToken}`);
      } else {
        setSuccessMessage('If an account exists with this email, a password reset token has been sent.');
      }
      setViewMode('reset_password');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/identity/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Password reset failed');
      }

      setViewMode('auth');
      setIsLogin(true);
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setPassword('');
      setResetToken('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
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

        {/* Auth / Recovery Card */}
        <Card variant="glass">
          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#4ade80',
                fontSize: '0.8rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {viewMode === 'auth' && (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => { setIsLogin(true); setError(null); setSuccessMessage(null); }}
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
                  onClick={() => { setIsLogin(false); setError(null); setSuccessMessage(null); }}
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

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                      <label className="input-label">Phone Number (with Country Code)</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 803 123 4567"
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setViewMode('forgot_password'); setError(null); setSuccessMessage(null); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'hsl(var(--color-primary))',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field"
                      style={{ paddingRight: '2.5rem', width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--color-text-muted))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.25rem',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
            </>
          )}

          {viewMode === 'forgot_password' && (
            <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setViewMode('auth'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Reset Password</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
                Enter your registered email address below to receive a password reset token.
              </p>

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

              {error && (
                <div style={{ color: 'rgb(248, 113, 113)', fontSize: '0.8rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <Button variant="primary" type="submit" isLoading={isLoading}>
                Request Reset Token
              </Button>
            </form>
          )}

          {viewMode === 'reset_password' && (
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setViewMode('forgot_password'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Set New Password</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Reset Token</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste 64-character token"
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="input-field"
                />
              </div>

              {error && (
                <div style={{ color: 'rgb(248, 113, 113)', fontSize: '0.8rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <Button variant="primary" type="submit" isLoading={isLoading}>
                Reset Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
export default LoginScreen;
