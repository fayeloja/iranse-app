import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import ProgressBar from '../../../shared/ui/ProgressBar.jsx';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, MapPin, Landmark, DollarSign, Sparkles, RefreshCw, FileText, ExternalLink, AlertCircle } from 'lucide-react';

interface JobMatch {
  id: string;
  user_id: string;
  job_id: string;
  overall_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  breakdown: string | any; // JSON string or parsed object
  title: string;
  company: string;
  location: string;
  salary: string | null;
  experience_level: string | null;
  url: string;
}

interface TailoredMaterials {
  resumeUrl: string;
  coverLetter: string;
  tailoredBulletPoints: string[];
}

export const MatchReviewScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  
  // Staging state for human-in-loop tailoring reviews (Rule #104)
  const [tailoredMaterials, setTailoredMaterials] = useState<TailoredMaterials | null>(null);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');

  // 1. Query: Fetch job matches from API (Phase 7)
  const { data: matches = [], isLoading: loadingMatches, refetch } = useQuery<JobMatch[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/matching');
      return res.data.matches;
    },
  });

  const currentMatch = matches[currentIndex];

  // 2. Mutation: Initiate dynamic materials generation (MMR + Gemini - Phase 8)
  const initiateAppMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await httpClient('/api/v1/applications/initiate', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      });
      return res.data.materials;
    },
    onSuccess: (data) => {
      setTailoredMaterials(data);
      setEditedCoverLetter(data.coverLetter);
    },
  });

  // 3. Mutation: Approve and queue submission (Phase 8)
  const approveAppMutation = useMutation({
    mutationFn: async (jobId: string) => {
      // Send the approved application package. We can also post edited cover letter if required.
      await httpClient('/api/v1/applications/approve', {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          coverLetter: editedCoverLetter,
        }),
      });
    },
    onSuccess: () => {
      setTailoredMaterials(null);
      setEditedCoverLetter('');
      setSelectedMatch(null);
      
      // Shift to next match
      if (currentIndex < matches.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        setCurrentIndex(0);
      }
    },
  });

  const handleSkip = () => {
    // Locally skip and transition card
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setCurrentIndex(0);
    }
  };

  const handleApprove = () => {
    if (!currentMatch) return;
    setSelectedMatch(currentMatch);
    initiateAppMutation.mutate(currentMatch.job_id);
  };

  if (loadingMatches) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <RefreshCw size={36} style={{ color: 'hsl(var(--color-primary))', animation: 'spin 2s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-secondary))' }}>Calculating matches index...</span>
      </div>
    );
  }

  if (matches.length === 0 || !currentMatch) {
    return (
      <div className="fade-in-up" style={{ textAlign: 'center', paddingTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Sparkles size={48} style={{ color: 'hsl(var(--color-secondary))', marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Queue Completed!</h3>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto', lineHeight: 1.4 }}>
          No fresh matches. Adjust salary/location constraints or trigger manual recalculations.
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw size={14} /> Refresh Queue
        </Button>
      </div>
    );
  }

  // Parse dimensional score breakdowns safely
  let breakdownData: any = {};
  try {
    breakdownData = typeof currentMatch.breakdown === 'string'
      ? JSON.parse(currentMatch.breakdown)
      : currentMatch.breakdown || {};
  } catch (e) {
    console.error('Failed to parse match breakdown JSON metadata:', e);
  }

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Human-in-the-Loop Tailoring Review Screen (Rule #104 / Rule #105) */}
      {selectedMatch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            height: '100vh',
            background: 'hsl(var(--bg-base))',
            zIndex: 30,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Review Tailored Materials</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)}>Cancel</Button>
          </div>

          {initiateAppMutation.isPending ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' }}>
              <RefreshCw size={28} style={{ color: 'hsl(var(--color-secondary))', animation: 'spin 2s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>Tailoring Resume & Letter via Gemini...</span>
            </div>
          ) : tailoredMaterials ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Provenance details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'hsl(var(--color-success))', fontSize: '0.8rem', fontWeight: 600 }}>
                <Sparkles size={14} />
                <span>Tailored cover letter and resume variant generated successfully.</span>
              </div>

              {/* Tailored Achievements Bullets List */}
              <Card variant="simple">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <FileText size={16} style={{ color: 'hsl(var(--color-primary))' }} />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Tailored Resume Variant Accomplishments</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
                  {tailoredMaterials.tailoredBulletPoints?.map((bp, i) => (
                    <p key={i} style={{ borderLeft: '2px solid hsl(var(--color-primary))', paddingLeft: '0.5rem', lineHeight: 1.35 }}>
                      {bp}
                    </p>
                  ))}
                  <a
                    href={tailoredMaterials.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'hsl(var(--color-secondary))',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    View Assembled Resume Variant <ExternalLink size={12} />
                  </a>
                </div>
              </Card>

              {/* Cover Letter Edit Textbox */}
              <div className="input-group">
                <label className="input-label">Tailored Cover Letter Pitch (Edit freely)</label>
                <textarea
                  value={editedCoverLetter}
                  onChange={(e) => setEditedCoverLetter(e.target.value)}
                  className="input-field"
                  style={{ minHeight: '220px', fontSize: '0.85rem', lineHeight: 1.45, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="secondary" onClick={() => setSelectedMatch(null)} style={{ flex: 1 }}>Back</Button>
                <Button
                  variant="primary"
                  onClick={() => approveAppMutation.mutate(selectedMatch.job_id)}
                  isLoading={approveAppMutation.isPending}
                  style={{ flex: 1 }}
                >
                  Submit Application
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgb(248,113,113)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>Failed to generate materials. Please check your credentials configurations.</span>
            </div>
          )}
        </div>
      )}

      {/* Queue Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
        <span>RECOMMENDED MATCHES</span>
        <span>{currentIndex + 1} of {matches.length} JOBS</span>
      </div>

      {/* Main Matching Job Review Card */}
      <Card variant="glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', padding: '1.5rem' }}>
        
        {/* Title and Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>
              {currentMatch.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              <Landmark size={14} />
              <span>{currentMatch.company}</span>
            </div>
          </div>
          <Badge variant={currentMatch.overall_score >= 80 ? 'success' : 'info'} size="md">
            {currentMatch.overall_score}% Match
          </Badge>
        </div>

        {/* Location & Compensation specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={14} />
            <span>{currentMatch.location}</span>
          </div>
          {currentMatch.salary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={14} />
              <span>{currentMatch.salary}</span>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />

        {/* Dynamic breakdown scoring explanation description (Phase 7 scorer findings) */}
        <div>
          <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            EXPLAINABLE SCORES INSIGHT
          </h4>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'hsl(var(--color-text-secondary))' }}>
            {breakdownData.explanation || 'Analyzed skills compatibility, location commutes, and salary mappings successfully.'}
          </p>
        </div>

        {/* Dimensional Scoring breakdown (PRD 6.3 - expand parameters) */}
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
              color: 'hsl(250, 84%, 67%)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.25rem 0',
            }}
          >
            <span>{isExpanded ? 'Hide scoring components' : 'Expand scoring breakdown'}</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExpanded && (
            <Card variant="simple" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem', marginTop: '0.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span>Skills Matching</span>
                  <span>{currentMatch.skills_score}%</span>
                </div>
                <ProgressBar value={currentMatch.skills_score} height="4px" />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span>Experience History</span>
                  <span>{currentMatch.experience_score}%</span>
                </div>
                <ProgressBar value={currentMatch.experience_score} height="4px" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span>Location Commutes</span>
                  <span>{currentMatch.location_score}%</span>
                </div>
                <ProgressBar value={currentMatch.location_score} height="4px" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span>Salary Mappings</span>
                  <span>{currentMatch.salary_score}%</span>
                </div>
                <ProgressBar value={currentMatch.salary_score} height="4px" />
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Action triggers */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <Button variant="secondary" onClick={handleSkip} style={{ flex: 1, gap: '0.5rem' }}>
          <ThumbsDown size={16} style={{ marginRight: '4px' }} /> Skip
        </Button>
        <Button variant="primary" onClick={handleApprove} style={{ flex: 1, gap: '0.5rem' }}>
          <ThumbsUp size={16} style={{ marginRight: '4px' }} /> Approve
        </Button>
      </div>
    </div>
  );
};
export default MatchReviewScreen;
