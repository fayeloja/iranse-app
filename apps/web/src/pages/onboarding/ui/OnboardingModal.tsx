import React, { useState } from 'react';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import httpClient from '../../../shared/api/httpClient.js';
import { ShieldCheck, FileCheck2, CheckCircle2, X } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'nin' | 'consent' | 'complete'>('nin');
  
  // NIN fields
  const [nin, setNin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  // Consent fields
  const [agreed, setAgreed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyNIN = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await httpClient('/api/v1/identity/verify-nin', {
        method: 'POST',
        body: JSON.stringify({ nin, firstName, lastName, dateOfBirth }),
      });
      setStep('consent');
    } catch (err: any) {
      setError(err.error?.message || err.message || 'NIN verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must check the agreement box to proceed.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await httpClient('/api/v1/identity/consent', {
        method: 'POST',
        body: JSON.stringify({
          consentVersion: 'v1.0',
          agreed: true,
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
        }),
      });
      setStep('complete');
    } catch (err: any) {
      setError(err.error?.message || err.message || 'Signing consent failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto', boxSizing: 'border-box' }}>
        <Card variant="glass" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} style={{ color: 'hsl(var(--color-primary))' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Account Onboarding</h2>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {step === 'nin' && (
            <form onSubmit={handleVerifyNIN} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>
                Verify your identity using your 11-digit NIN. (Optional: You can skip this step and complete it later in Settings).
              </p>

              <div className="input-group">
                <label className="input-label">National Identity Number (NIN)</label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  placeholder="11-digit NIN"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                <div className="input-group" style={{ minWidth: 0, marginBottom: 0 }}>
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="input-field"
                  />
                </div>
                <div className="input-group" style={{ minWidth: 0, marginBottom: 0 }}>
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Date of Birth (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input-field"
                />
              </div>

              {error && (
                <div style={{ color: 'rgb(248, 113, 113)', fontSize: '0.8rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setStep('consent')}
                  style={{ flex: 1 }}
                >
                  Skip for Now
                </Button>
                <Button variant="primary" type="submit" isLoading={isLoading} style={{ flex: 1 }}>
                  Verify NIN
                </Button>
              </div>
            </form>
          )}

          {step === 'consent' && (
            <form onSubmit={handleSignConsent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck2 size={20} style={{ color: 'hsl(var(--color-primary))' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Auto-Apply Waiver & Terms</h3>
              </div>

              <p style={{ fontSize: '0.825rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.5 }}>
                Iransé operates as your agentic career platform. Applications are assembled strictly from your own pre-written achievements and require human review by default.
              </p>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'hsl(var(--color-primary))' }}
                />
                <span>
                  I agree to the Terms of Service and consent to Iransé assembling and queuing application materials on my behalf.
                </span>
              </label>

              {error && (
                <div style={{ color: 'rgb(248, 113, 113)', fontSize: '0.8rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <Button variant="primary" type="submit" isLoading={isLoading} style={{ marginTop: '0.5rem' }}>
                Sign Waiver & Continue
              </Button>
            </form>
          )}

          {step === 'complete' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
              <CheckCircle2 size={48} style={{ color: '#4ade80' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Onboarding Complete!</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>
                Your account is set up and ready. You can now build your Career Knowledge Base and discover matching jobs.
              </p>
              <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default OnboardingModal;
