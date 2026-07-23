import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import { Shield, Laptop, CheckSquare, Square, RefreshCw } from 'lucide-react';

interface SessionItem {
  id: string;
  ip_address: string;
  user_agent: string;
  browser: string | null;
  os: string | null;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
}

interface ConsentRecord {
  id: string;
  consent_version: string;
  ip_address: string;
  user_agent: string;
  agreed: boolean;
  created_at: string;
}

export const PreferencesScreen: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Query: Active Device Sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<SessionItem[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/identity/sessions');
      return res.data.sessions;
    },
  });

  // 2. Query: Signed Legal Consents
  const { data: consents = [], isLoading: loadingConsents } = useQuery<ConsentRecord[]>({
    queryKey: ['consents'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/identity/consents');
      return res.data.consents;
    },
  });

  const hasSignedConsent = consents.some(c => c.agreed);
  const latestConsent = consents[0];

  // 3. Mutation: Revoke Device Session
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await httpClient(`/api/v1/identity/sessions/${sessionId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const [consentError, setConsentError] = React.useState<string | null>(null);

  // 4. Mutation: Sign Consent Waiver
  const signConsentMutation = useMutation({
    mutationFn: async () => {
      setConsentError(null);
      // Retrieve client public IP or fallback
      let clientIp = '102.89.44.11'; // Default Lagos fallback
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json').then(r => r.json());
        if (ipRes && ipRes.ip) clientIp = ipRes.ip;
      } catch (e) {
        console.warn('Could not retrieve public IP, utilizing fallback local route.');
      }

      await httpClient('/api/v1/identity/consent', {
        method: 'POST',
        body: JSON.stringify({
          consentVersion: '1.0',
          ipAddress: clientIp,
          userAgent: navigator.userAgent,
          countryCode: 'NG',
          agreed: true,
        }),
      });
    },
    onSuccess: () => {
      setConsentError(null);
      queryClient.invalidateQueries({ queryKey: ['consents'] });
    },
    onError: (err: any) => {
      setConsentError(err?.error?.message || err?.message || 'Failed to record legal consent waiver.');
    },
  });

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          Security & Preferences
        </h2>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>
          Manage legal consents and device sessions
        </p>
      </div>

      {/* Auto-Apply Consent Form (PRD 6.2) */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={16} style={{ color: 'hsl(var(--color-primary))' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Legal Consent Waiver</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.4, marginBottom: '1.25rem' }}>
          I hereby authorize Iransé to act as my agent to prepare and submit job applications, 
          tailor resume variant snapshots, and agree to portal terms on my behalf.
        </p>
        
        {loadingConsents ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} /> Loading signed consents...
          </div>
        ) : hasSignedConsent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgb(52, 211, 153)', fontSize: '0.9rem', fontWeight: 600 }}>
              <CheckSquare size={20} />
              <span>Waiver Signed & Consented</span>
            </div>
            {latestConsent && (
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                Signed on: {new Date(latestConsent.created_at).toLocaleString()} from IP {latestConsent.ip_address}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => signConsentMutation.mutate()}
              isLoading={signConsentMutation.isPending}
            >
              <Square size={18} style={{ marginRight: '0.5rem' }} />
              <span>Sign Legal Consent Waiver</span>
            </Button>
            {consentError && (
              <span style={{ fontSize: '0.75rem', color: 'rgb(248, 113, 113)' }}>
                ⚠️ {consentError}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Device Sessions list (PRD 6.2) */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Laptop size={16} style={{ color: 'hsl(var(--color-primary))' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Active Device Sessions</h3>
        </div>
        
        {loadingSessions ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} /> Loading active sessions...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map(sess => (
              <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {sess.browser || 'Browser'} on {sess.os || 'Device'}
                    {sess.is_active && <span style={{ color: 'hsl(var(--color-secondary))', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Current)</span>}
                  </div>
                  <div style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.75rem' }}>
                    IP: {sess.ip_address} • Active: {new Date(sess.last_active_at).toLocaleTimeString()}
                  </div>
                </div>
                
                {sess.is_active ? (
                  <Badge variant="success">Current</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSessionMutation.mutate(sess.id)}
                    disabled={revokeSessionMutation.isPending}
                    style={{
                      color: 'rgb(248, 113, 113)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default PreferencesScreen;
