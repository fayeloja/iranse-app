import React from 'react';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OnboardingModal from '../../onboarding/ui/OnboardingModal.jsx';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Welcome Banner */}
      <Card variant="glow" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Hello, Candidate
        </h2>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Iransé has ingested your resume and is monitoring Lagos channels for matches.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="primary" size="md" onClick={() => navigate('/match-review')} className="flex items-center gap-2">
            View Matches <Sparkles size={16} style={{ marginLeft: '4px' }} />
          </Button>
          <Button variant="secondary" size="md" onClick={() => setShowOnboarding(true)} className="flex items-center gap-2">
            Complete Onboarding <ShieldCheck size={16} style={{ marginLeft: '4px' }} />
          </Button>
        </div>
      </Card>

      {/* Stats Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card variant="simple" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--color-secondary))' }}>12</div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Matched Jobs</div>
        </Card>
        <Card variant="simple" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--color-primary))' }}>4</div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Active Applications</div>
        </Card>
      </div>

      {/* Action Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Card variant="glass" interactive onClick={() => navigate('/career-profile')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Optimize Career Profile</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Edit skills, experience, and voice snippets</p>
          </div>
          <ArrowRight size={18} style={{ color: 'hsl(var(--color-text-muted))' }} />
        </Card>

        <Card variant="glass" interactive onClick={() => navigate('/preferences')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Security & Portals</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Manage sessions and connect accounts</p>
          </div>
          <ArrowRight size={18} style={{ color: 'hsl(var(--color-text-muted))' }} />
        </Card>
      </div>
    </div>
  );
};
export default HomeScreen;
