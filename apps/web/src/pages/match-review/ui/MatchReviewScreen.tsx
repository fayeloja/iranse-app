import React, { useState } from 'react';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import ProgressBar from '../../../shared/ui/ProgressBar.jsx';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, MapPin, Landmark, DollarSign, Sparkles } from 'lucide-react';

interface MatchItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  explanation: string;
  breakdown: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
  };
}

export const MatchReviewScreen: React.FC = () => {
  const [matches, setMatches] = useState<MatchItem[]>([
    {
      id: '1',
      title: 'Senior Full Stack Engineer',
      company: 'PayLagos Fintech',
      location: 'Lagos, Nigeria (Hybrid)',
      salary: '₦1,200,000 - ₦1,500,000 / month',
      score: 88,
      explanation: 'Highly compatible skills list match. Experience years align. Remote/hybrid preference matches.',
      breakdown: { skills: 95, experience: 85, location: 90, salary: 80 }
    },
    {
      id: '2',
      title: 'Backend Developer (Node.js)',
      company: 'E-Cart Logistics',
      location: 'Lekki Phase 1, Lagos',
      salary: '₦900,000 - ₦1,100,000 / month',
      score: 74,
      explanation: 'Good match for core skills but requires physical commute to Lekki Phase 1.',
      breakdown: { skills: 85, experience: 70, location: 50, salary: 90 }
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentMatch = matches[currentIndex];

  const handleAction = (type: 'approve' | 'skip') => {
    console.log(`Action: ${type} on Job: ${currentMatch?.title}`);
    setIsExpanded(false);
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed queue
      setMatches([]);
    }
  };

  if (matches.length === 0 || !currentMatch) {
    return (
      <div className="fade-in-up" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <Sparkles size={48} style={{ color: 'hsl(var(--color-secondary))', marginBottom: '1.25rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Match Queue Complete!</h3>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem' }}>
          Check back later for newly discovered job openings.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Queue Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
        <span>MATCH QUEUE</span>
        <span>{currentIndex + 1} of {matches.length} JOBS</span>
      </div>

      {/* Match Review Card */}
      <Card variant="glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        {/* Score indicator header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {currentMatch.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              <Landmark size={14} />
              <span>{currentMatch.company}</span>
            </div>
          </div>
          <Badge variant={currentMatch.score >= 80 ? 'success' : 'info'} size="md">
            {currentMatch.score}% Match
          </Badge>
        </div>

        {/* Quick details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))', margin: '0.25rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={14} />
            <span>{currentMatch.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={14} />
            <span>{currentMatch.salary}</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />

        {/* Explainability reasons */}
        <div>
          <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            WHY YOU MATCH
          </h4>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
            {currentMatch.explanation}
          </p>
        </div>

        {/* Expandable score breakdowns (PRD 6.3 / Consequence #13) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'hsl(var(--color-secondary))',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.25rem 0',
            }}
          >
            <span>{isExpanded ? 'Hide dimensional breakdown' : 'Show dimensional breakdown'}</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExpanded && (
            <Card variant="simple" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', marginTop: '0.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Skills Compatibility</span>
                  <span>{currentMatch.breakdown.skills}%</span>
                </div>
                <ProgressBar value={currentMatch.breakdown.skills} height="4px" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Years of Experience</span>
                  <span>{currentMatch.breakdown.experience}%</span>
                </div>
                <ProgressBar value={currentMatch.breakdown.experience} height="4px" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Office Commute</span>
                  <span>{currentMatch.breakdown.location}%</span>
                </div>
                <ProgressBar value={currentMatch.breakdown.location} height="4px" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Salary Range Alignment</span>
                  <span>{currentMatch.breakdown.salary}%</span>
                </div>
                <ProgressBar value={currentMatch.breakdown.salary} height="4px" />
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Approve / Skip buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <Button variant="secondary" onClick={() => handleAction('skip')} style={{ flex: 1, gap: '0.5rem' }}>
          <ThumbsDown size={16} /> Skip
        </Button>
        <Button variant="primary" onClick={() => handleAction('approve')} style={{ flex: 1, gap: '0.5rem' }}>
          <ThumbsUp size={16} /> Approve
        </Button>
      </div>
    </div>
  );
};
export default MatchReviewScreen;
