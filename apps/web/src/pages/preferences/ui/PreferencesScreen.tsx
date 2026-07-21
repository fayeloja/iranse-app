import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import { Shield, Key, Eye, EyeOff, Laptop, CheckSquare, Square, RefreshCw, AlertCircle } from 'lucide-react';

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

interface ConnectedAccount {
  id: string;
  portal_id: string;
  username: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [portalId, setPortalId] = useState('jobberman');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);

  // 1. Query: Active Device Sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<SessionItem[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/identity/sessions');
      return res.data.sessions;
    },
  });

  // 2. Query: Connected Portals Accounts
  const { data: connectedAccounts = [], isLoading: loadingAccounts } = useQuery<ConnectedAccount[]>({
    queryKey: ['connected-accounts'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/identity/connected-accounts');
      return res.data.accounts;
    },
  });

  // 3. Query: Signed Legal Consents
  const { data: consents = [], isLoading: loadingConsents } = useQuery<ConsentRecord[]>({
    queryKey: ['consents'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/identity/consents');
      return res.data.consents;
    },
  });

  const hasSignedConsent = consents.some(c => c.agreed);
  const latestConsent = consents[0];

  // 4. Mutation: Revoke Device Session
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await httpClient(`/api/v1/identity/sessions/${sessionId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  // 5. Mutation: Sign Consent Waiver
  const signConsentMutation = useMutation({
    mutationFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['consents'] });
    },
  });

  // 6. Mutation: Connect Portal Credentials
  const connectAccountMutation = useMutation({
    mutationFn: async () => {
      setConnectError(null);
      await httpClient('/api/v1/identity/connected-accounts', {
        method: 'POST',
        body: JSON.stringify({
          portalId,
          username,
          password,
        }),
      });
    },
    onSuccess: () => {
      setUsername('');
      setPassword('');
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
    },
    onError: (err: any) => {
      setConnectError(err.error?.message || 'Failed to save connected portal account details.');
    },
  });

  // 7. Mutation: Disconnect Portal
  const disconnectPortalMutation = useMutation({
    mutationFn: async (targetPortalId: string) => {
      await httpClient(`/api/v1/identity/connected-accounts/${targetPortalId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
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
          Manage legal consents, linked job portals, and device sessions
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
          <button
            onClick={() => signConsentMutation.mutate()}
            disabled={signConsentMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              padding: '0.25rem 0',
            }}
          >
            <Square size={20} style={{ color: 'hsl(var(--color-text-muted))' }} />
            <span>Click to sign legal consent waiver</span>
          </button>
        )}
      </Card>

      {/* Linked Accounts (PRD 6.2) */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Key size={16} style={{ color: 'hsl(var(--color-primary))' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Connected Job Portals</h3>
        </div>

        {/* Existing Accounts List */}
        {loadingAccounts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} /> Loading portal list...
          </div>
        ) : connectedAccounts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {connectedAccounts.map(account => (
              <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                <div>
                  <Badge variant="info">{account.portal_id.toUpperCase()}</Badge>
                  <span style={{ marginLeft: '0.5rem', color: 'hsl(var(--color-text-secondary))' }}>{account.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => disconnectPortalMutation.mutate(account.portal_id)}
                  style={{ color: 'rgb(248, 113, 113)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Connect Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Select Job Portal</label>
            <select
              value={portalId}
              onChange={(e) => setPortalId(e.target.value)}
              className="input-field"
              style={{ background: 'rgba(15, 23, 42, 0.6)' }}
            >
              <option value="jobberman" style={{ background: '#0f172a' }}>Jobberman Nigeria</option>
              <option value="greenhouse" style={{ background: '#0f172a' }}>Greenhouse Board</option>
            </select>
          </div>
          
          <div className="input-group">
            <label className="input-label">Username / Portal Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. name@email.com"
              className="input-field"
            />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label className="input-label">Portal Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter account password"
              className="input-field"
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '32px',
                background: 'none',
                border: 'none',
                color: 'hsl(var(--color-text-muted))',
                cursor: 'pointer',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {connectError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgb(248, 113, 113)', fontSize: '0.75rem' }}>
              <AlertCircle size={14} />
              <span>{connectError}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => connectAccountMutation.mutate()}
            isLoading={connectAccountMutation.isPending}
            style={{ alignSelf: 'flex-start' }}
          >
            Save Encrypted Credentials
          </Button>
        </div>
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
