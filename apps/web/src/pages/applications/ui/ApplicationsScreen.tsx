import React from 'react';
import Card from '../../../shared/ui/Card.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import { Clock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface ApplicationItem {
  id: string;
  title: string;
  company: string;
  status: 'PendingApproval' | 'Queued' | 'RateLimited' | 'Submitting' | 'Submitted' | 'Failed';
  lastUpdate: string;
  attempts: number;
}

export const ApplicationsScreen: React.FC = () => {
  const applications: ApplicationItem[] = [
    { id: '1', title: 'Senior Full Stack Engineer', company: 'PayLagos Fintech', status: 'Submitted', lastUpdate: 'Just now', attempts: 1 },
    { id: '2', title: 'Backend Developer (Node.js)', company: 'E-Cart Logistics', status: 'Queued', lastUpdate: '10 mins ago', attempts: 0 },
    { id: '3', title: 'Frontend Engineer', company: 'TechHub Solutions', status: 'PendingApproval', lastUpdate: '2 hours ago', attempts: 0 },
    { id: '4', title: 'Product Developer', company: 'SecureVerify', status: 'RateLimited', lastUpdate: '1 hour ago', attempts: 2 }
  ];

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

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          Application Status Queue
        </h2>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>
          Ground truth statuses of automated portal applications (PRD 6.4)
        </p>
      </div>

      {/* Applications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {applications.map(app => (
          <Card key={app.id} variant="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
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
                  {app.company} • {app.lastUpdate}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              {getStatusBadge(app.status)}
              {app.attempts > 0 && (
                <span style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))' }}>
                  Attempt {app.attempts}/5
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default ApplicationsScreen;
