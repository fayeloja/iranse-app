import React from 'react';
import { useQuery } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { Sparkles, ShieldCheck, Briefcase, BarChart3, Send, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OnboardingModal from '../../onboarding/ui/OnboardingModal.jsx';

interface QuotaData {
  used: number;
  limit: number;
  remaining: number;
}

interface DigestData {
  newMatches: { count: number };
  applications: { sent: number };
  freeApplicationsLeft: number;
}

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const { data: quota } = useQuery<QuotaData>({
    queryKey: ['applicationQuota'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/applications/quota');
      return res.data;
    },
  });

  const { data: digest } = useQuery<DigestData>({
    queryKey: ['digestSummary'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/matching/digest');
      return res.data;
    },
    staleTime: 60_000, // Cache for 1 minute to avoid redundant calls
  });

  const matchCount = digest?.newMatches?.count ?? 0;
  const freeLeft = quota?.remaining ?? digest?.freeApplicationsLeft ?? 0;

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Welcome Banner with match count */}
      <Card variant="glow" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Good morning
        </h2>
        {matchCount > 0 ? (
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            {matchCount} new match{matchCount !== 1 ? 'es' : ''} waiting for review
          </p>
        ) : (
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            Iransé is monitoring job channels for matches.
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="primary" size="md" onClick={() => navigate('/match-review')} className="flex items-center gap-2">
            {matchCount > 0 ? `${matchCount} matches waiting` : 'View Matches'} <Sparkles size={16} style={{ marginLeft: '4px' }} />
          </Button>
          <Button variant="secondary" size="md" onClick={() => setShowOnboarding(true)} className="flex items-center gap-2">
            Complete Onboarding <ShieldCheck size={16} style={{ marginLeft: '4px' }} />
          </Button>
        </div>
      </Card>

      {/* Stats Grid — matches concept UI mockup */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Card variant="simple" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Sent this month</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--color-primary))' }}>{quota?.used ?? 0}</div>
        </Card>
        <Card variant="simple" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Free left</div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: freeLeft <= 1 ? 'rgb(234, 179, 8)' : 'rgb(52, 211, 153)',
          }}>{freeLeft}</div>
        </Card>
      </div>

      {/* Quick Access Grid — matches concept UI mockup */}
      <div>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick access
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Card variant="glass" interactive onClick={() => navigate('/career-profile')} style={{ padding: '1.25rem' }}>
            <Briefcase size={20} style={{ color: 'hsl(var(--color-primary))', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Career profile</h4>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.3 }}>Achievements, resumes, letters</p>
          </Card>

          <Card variant="glass" interactive onClick={() => navigate('/digest')} style={{ padding: '1.25rem' }}>
            <BarChart3 size={20} style={{ color: 'hsl(var(--color-secondary))', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Daily digest</h4>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.3 }}>Overnight activity reports</p>
          </Card>

          <Card variant="glass" interactive onClick={() => navigate('/applications')} style={{ padding: '1.25rem' }}>
            <Send size={20} style={{ color: 'hsl(var(--color-primary))', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Applications</h4>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.3 }}>Track every submission</p>
          </Card>

          <Card variant="glass" interactive onClick={() => navigate('/preferences')} style={{ padding: '1.25rem' }}>
            <Settings size={20} style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Preferences</h4>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.3 }}>Roles, threshold, mode</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default HomeScreen;
