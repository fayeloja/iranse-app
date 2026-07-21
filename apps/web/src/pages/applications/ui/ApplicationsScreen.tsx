import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { Clock, ShieldAlert, CheckCircle, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Calendar } from 'lucide-react';

interface ApplicationItem {
  id: string;
  user_id: string;
  job_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: 'PendingApproval' | 'Queued' | 'RateLimited' | 'Submitting' | 'Submitted' | 'Failed';
  attempts: number;
  max_attempts: number;
  error_log: string | null;
  submitted_at: string | null;
  created_at: string;
  title: string;
  company: string;
  location: string;
  url: string;
}

export const ApplicationsScreen: React.FC = () => {
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // 1. Query: Fetch ground-truth application queues status list from API (Phase 8)
  const { data: applications = [], isLoading, refetch, isRefetching } = useQuery<ApplicationItem[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/applications');
      return res.data.applications;
    },
  });

  const getStatusBadge = (status: ApplicationItem['status']) => {
    switch (status) {
      case 'Submitted':
        return <Badge variant="success">Submitted</Badge>;
      case 'PendingApproval':
        return <Badge variant="neutral">Review Pending</Badge>;
      case 'Queued':
        return <Badge variant="info">Queued (Sending Soon)</Badge>; // Honest state language (Rule #102)
      case 'RateLimited':
        return <Badge variant="warning">Rate Limited (Delaying)</Badge>;
      case 'Submitting':
        return <Badge variant="info">Submitting...</Badge>;
      case 'Failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: ApplicationItem['status']) => {
    switch (status) {
      case 'Submitted':
        return <CheckCircle size={18} style={{ color: 'rgb(52, 211, 153)' }} />;
      case 'PendingApproval':
        return <Clock size={18} style={{ color: 'hsl(var(--color-text-muted))' }} />;
      case 'Queued':
      case 'Submitting':
        return <RefreshCw size={18} style={{ color: 'rgb(34, 211, 238)', animation: 'spin 4s linear infinite' }} />;
      case 'RateLimited':
      case 'Failed':
        return <ShieldAlert size={18} style={{ color: 'rgb(248, 113, 113)' }} />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAppId(prev => (prev === id ? null : id));
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Application Status Queue
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>
            Ground truth statuses of automated portal applications (PRD 6.4)
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <RefreshCw size={14} style={{ animation: isRefetching ? 'spin 1.5s linear infinite' : 'none' }} />
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem' }}>
          <RefreshCw size={24} style={{ color: 'hsl(var(--color-primary))', animation: 'spin 2s linear infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Fetching application queue status...</span>
        </div>
      ) : applications.length === 0 ? (
        <Card variant="glass" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No active applications</h3>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.85rem', lineHeight: 1.4 }}>
            Approve recommended matches from the queue card deck to trigger tailormade automated submissions.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => {
            const isExpanded = expandedAppId === app.id;
            
            return (
              <Card key={app.id} variant="glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getStatusIcon(app.status)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{app.title}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                        {app.company} • {app.location}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* Date & Expand trigger row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => toggleExpand(app.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'none',
                      border: 'none',
                      color: 'hsl(250, 84%, 67%)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{isExpanded ? 'Less info' : 'More info'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expandable Application Details Section */}
                {isExpanded && (
                  <Card variant="simple" style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {/* Attempts Status (Rule #102) */}
                    <div>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--color-text-secondary))' }}>Submission Runs:</span>
                      <span style={{ marginLeft: '0.5rem' }}>
                        {app.attempts} of {app.max_attempts} retry attempts executed
                      </span>
                    </div>

                    {/* Resume variant link (Rule #105) */}
                    {app.resume_url && (
                      <div>
                        <span style={{ fontWeight: 600, color: 'hsl(var(--color-text-secondary))' }}>Resume Snapshot:</span>
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'hsl(var(--color-secondary))',
                            marginLeft: '0.5rem',
                            textDecoration: 'none',
                          }}
                        >
                          View Snapshot Variant <ExternalLink size={10} />
                        </a>
                      </div>
                    )}

                    {/* Cover Letter Snapshot */}
                    {app.cover_letter && (
                      <div>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--color-text-secondary))', marginBottom: '0.25rem' }}>Cover Letter:</div>
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.02)', lineHeight: 1.4 }}>
                          {app.cover_letter}
                        </div>
                      </div>
                    )}

                    {/* Error logs */}
                    {app.error_log && (
                      <div style={{ color: 'rgb(248, 113, 113)', borderLeft: '2px solid rgb(248, 113, 113)', paddingLeft: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Error logs findings:</span>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>{app.error_log}</p>
                      </div>
                    )}
                  </Card>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ApplicationsScreen;
