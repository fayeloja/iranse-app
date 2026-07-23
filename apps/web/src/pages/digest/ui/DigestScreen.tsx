import React from 'react';
import { useQuery } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { AlertTriangle, CheckCircle, RefreshCw, Calendar } from 'lucide-react';

export const DigestScreen: React.FC = () => {
  const { data: digestData, isLoading } = useQuery({
    queryKey: ['digest'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/matching/digest');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <RefreshCw className="animate-spin" style={{ color: 'hsl(var(--color-primary))' }} />
      </div>
    );
  }

  const digest = digestData?.data || {
    newMatches: { count: 0 },
    applications: { sent: 0, needsAttention: [], sentToday: [] },
    freeApplicationsLeft: 0
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--color-text-secondary))' }}>
        <Calendar size={18} />
        <span style={{ fontWeight: 500 }}>{today}</span>
      </div>

      <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
        Your job hunt report
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card variant="simple" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--color-secondary))' }}>
            {digest.newMatches?.count || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Matches found</div>
        </Card>
        <Card variant="simple" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--color-primary))' }}>
            {digest.applications?.sent || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Applications sent</div>
        </Card>
        <Card variant="simple" style={{ textAlign: 'center', padding: '1.25rem', opacity: 0.7 }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--color-text-secondary))' }}>0</div>
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Profile views</div>
          <Badge variant="neutral" style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>Coming soon</Badge>
        </Card>
        <Card variant="simple" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--color-secondary))' }}>
            {digest.freeApplicationsLeft || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Free left</div>
        </Card>
      </div>

      {digest.applications?.needsAttention?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Needs attention</h2>
          {digest.applications.needsAttention.map((item: any, i: number) => (
            <Card key={i} variant="glass" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <AlertTriangle style={{ color: '#ef4444' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {item.jobTitle} @ {item.company}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
                    {item.errorDescription || 'Application failed to submit'}
                  </p>
                  <Button variant="secondary" size="sm">Dismiss</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sent today</h2>
        {(!digest.applications?.sentToday || digest.applications.sentToday.length === 0) ? (
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem' }}>No applications sent today yet.</p>
        ) : (
          digest.applications.sentToday.map((app: any, i: number) => (
            <Card key={i} variant="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{app.jobTitle}</h3>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>{app.company}</p>
              </div>
              <Badge variant="success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> Submitted
              </Badge>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DigestScreen;
