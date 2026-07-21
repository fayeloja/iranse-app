import React, { useState } from 'react';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import { User, Briefcase, Plus, Mic, CheckCircle } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
}

interface Achievement {
  id: string;
  description: string;
  skills: string[];
}

export const CareerProfileScreen: React.FC = () => {
  const experiences: Experience[] = [
    { id: '1', title: 'Senior Software Engineer', company: 'Global Commerce', period: '2023 - Present' },
    { id: '2', title: 'Software Engineer', company: 'AppFactory NG', period: '2021 - 2023' }
  ];

  const achievements: Achievement[] = [
    { id: '1', description: 'Architected high-throughput payment settlement engine processing ₦100M daily.', skills: ['Node.js', 'PostgreSQL', 'Redis'] },
    { id: '2', description: 'Reduced REST API latencies by 40% through redis caching implementations.', skills: ['Redis', 'Caching'] }
  ];

  const [voiceSnippets, setVoiceSnippets] = useState([
    { id: '1', theme: 'Startup', content: 'Focussed on high velocity iterations, rapid prototyping, and shipping code.', active: true },
    { id: '2', theme: 'Technical', content: 'Strong systems design principles, optimized schemas, and zero-downtime migrations.', active: false }
  ]);

  const handleToggleSnippet = (id: string) => {
    setVoiceSnippets(prev => prev.map(s => ({
      ...s,
      active: s.id === id
    })));
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '1rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={24} style={{ color: 'hsl(var(--color-secondary))' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Career Profile</h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>
            Extracted from CV & tailored for automated applications
          </p>
        </div>
      </div>

      {/* Experience list */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} style={{ color: 'hsl(var(--color-primary))' }} /> Experience History
          </h3>
          <Button variant="ghost" size="sm" style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {experiences.map(exp => (
            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.9rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{exp.title}</div>
                <div style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>{exp.company}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>{exp.period}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements (MMR Targets) */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Profile Achievements</h3>
          <Button variant="ghost" size="sm" style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {achievements.map(ach => (
            <div key={ach.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <p style={{ lineHeight: 1.4 }}>{ach.description}</p>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {ach.skills.map(skill => (
                  <Badge key={skill} variant="neutral" size="sm">{skill}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Voice Snippets Styling (PRD 6.4) */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Mic size={16} style={{ color: 'hsl(var(--color-primary))' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Voice Snippets Tone Guides</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {voiceSnippets.map(snippet => (
            <div
              key={snippet.id}
              onClick={() => handleToggleSnippet(snippet.id)}
              style={{
                padding: '0.875rem',
                borderRadius: '0.75rem',
                border: `1px solid ${snippet.active ? 'hsla(var(--color-primary), 0.3)' : 'rgba(255, 255, 255, 0.04)'}`,
                background: snippet.active ? 'hsla(var(--color-primary), 0.04)' : 'rgba(15, 23, 42, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{snippet.theme} Tone</span>
                {snippet.active && <CheckCircle size={14} style={{ color: 'hsl(var(--color-success))' }} />}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.35 }}>
                "{snippet.content}"
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
export default CareerProfileScreen;
