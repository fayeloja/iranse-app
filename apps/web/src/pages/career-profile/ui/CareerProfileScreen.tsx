import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import { User, Briefcase, Plus, Mic, Trash2, Upload, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

interface Achievement {
  id: string;
  experience_id: string;
  description: string;
}

interface VoiceSnippet {
  id: string;
  role: 'opening' | 'body' | 'closing';
  theme: string;
  content: string;
}

export const CareerProfileScreen: React.FC = () => {
  const queryClient = useQueryClient();

  // Toggles for forms
  const [showExpForm, setShowExpForm] = useState(false);
  const [showAchForm, setShowAchForm] = useState(false);
  const [showVoiceForm, setShowVoiceForm] = useState(false);

  // Experience form state
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState('');

  // Achievement form state
  const [achExpId, setAchExpId] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achSkills, setAchSkills] = useState('');

  // Voice snippet form state
  const [voiceRole, setVoiceRole] = useState<'opening' | 'body' | 'closing'>('body');
  const [voiceTheme, setVoiceTheme] = useState('');
  const [voiceContent, setVoiceContent] = useState('');

  // CV File Upload state
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);

  // Queries
  const { data: experiences = [], isLoading: loadingExp } = useQuery<Experience[]>({
    queryKey: ['experiences'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/career-profile/experience');
      return res.data.experiences;
    },
  });

  const { data: achievements = [], isLoading: loadingAch } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/career-profile/achievement');
      return res.data.achievements;
    },
  });

  const { data: voiceSnippets = [], isLoading: loadingVoice } = useQuery<VoiceSnippet[]>({
    queryKey: ['voice-snippets'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/career-profile/voice-snippet');
      return res.data.snippets;
    },
  });

  // Mutations
  const createExpMutation = useMutation({
    mutationFn: async () => {
      await httpClient('/api/v1/career-profile/experience', {
        method: 'POST',
        body: JSON.stringify({
          title: expTitle,
          company: expCompany,
          location: expLocation,
          startDate: expStartDate,
          endDate: expIsCurrent ? null : expEndDate,
          description: expDesc || undefined,
        }),
      });
    },
    onSuccess: () => {
      setExpTitle('');
      setExpCompany('');
      setExpLocation('');
      setExpStartDate('');
      setExpEndDate('');
      setExpIsCurrent(false);
      setExpDesc('');
      setShowExpForm(false);
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });

  const createAchMutation = useMutation({
    mutationFn: async () => {
      await httpClient('/api/v1/career-profile/achievement', {
        method: 'POST',
        body: JSON.stringify({
          experienceId: achExpId,
          description: achDesc,
          skills: achSkills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
    },
    onSuccess: () => {
      setAchExpId('');
      setAchDesc('');
      setAchSkills('');
      setShowAchForm(false);
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const createVoiceMutation = useMutation({
    mutationFn: async () => {
      await httpClient('/api/v1/career-profile/voice-snippet', {
        method: 'POST',
        body: JSON.stringify({
          role: voiceRole,
          theme: voiceTheme,
          content: voiceContent,
        }),
      });
    },
    onSuccess: () => {
      setVoiceTheme('');
      setVoiceContent('');
      setShowVoiceForm(false);
      queryClient.invalidateQueries({ queryKey: ['voice-snippets'] });
    },
  });

  const deleteExpMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient(`/api/v1/career-profile/experience/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });

  const deleteAchMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient(`/api/v1/career-profile/achievement/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const deleteVoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient(`/api/v1/career-profile/voice-snippet/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-snippets'] });
    },
  });

  // CV Upload Handler (sends raw binary body - conforms to lightweight limit configurations)
  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress('Parsing document details via Gemini...');
    setCvError(null);

    try {

      
      const response = await httpClient('/api/v1/career-profile/upload-cv', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
        body: file,
      });

      console.log('CV successfully seeded:', response);
      setUploadProgress('Upload success! Seeding experiences database...');
      setTimeout(() => {
        setUploadProgress(null);
        queryClient.invalidateQueries({ queryKey: ['experiences'] });
        queryClient.invalidateQueries({ queryKey: ['achievements'] });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setCvError(err.error?.message || 'Failed to parse CV PDF document.');
      setUploadProgress(null);
    }
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

      {/* CV Upload Section */}
      <Card variant="glow" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <FileText size={16} style={{ color: 'hsl(var(--color-secondary))' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Upload CV (PDF / Text)</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.4, marginBottom: '1.25rem' }}>
          Uploading a new CV automatically parses achievements and experiences via LLM, 
          seeding your profile matching configurations.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleCVUpload}
              style={{ display: 'none' }}
            />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="interactive"
            >
              <Upload size={16} /> Choose CV Document
            </span>
          </label>
          
          {uploadProgress && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--color-secondary))' }}>
              <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} /> {uploadProgress}
            </div>
          )}

          {cvError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgb(248, 113, 113)', fontSize: '0.8rem' }}>
              <AlertCircle size={14} />
              <span>{cvError}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Experience history section */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} style={{ color: 'hsl(var(--color-primary))' }} /> Work Experience
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowExpForm(!showExpForm)} style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Experience Add Form */}
        {showExpForm && (
          <Card variant="simple" style={{ marginBottom: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="input-group">
              <label className="input-label">Job Title</label>
              <input type="text" value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">Company Name</label>
              <input type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)} placeholder="e.g. Flutterwave" className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">Office Location</label>
              <input type="text" value={expLocation} onChange={e => setExpLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" className="input-field" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input type="text" value={expStartDate} onChange={e => setExpStartDate(e.target.value)} placeholder="YYYY-MM-DD" className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label">End Date</label>
                <input type="text" value={expEndDate} onChange={e => setExpEndDate(e.target.value)} placeholder="YYYY-MM-DD" className="input-field" disabled={expIsCurrent} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={expIsCurrent} onChange={e => setExpIsCurrent(e.target.checked)} />
              <span>Currently work here</span>
            </label>
            <div className="input-group">
              <label className="input-label">Job Description</label>
              <textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Describe core roles and responsibilities" className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowExpForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => createExpMutation.mutate()} isLoading={createExpMutation.isPending}>Add Role</Button>
            </div>
          </Card>
        )}

        {loadingExp ? (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Loading experiences...</div>
        ) : experiences.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {experiences.map(exp => (
              <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.875rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{exp.title}</div>
                  <div style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>{exp.company} • {exp.location}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                    {exp.start_date} to {exp.end_date || 'Present'}
                  </div>
                </div>
                <button
                  onClick={() => deleteExpMutation.mutate(exp.id)}
                  disabled={deleteExpMutation.isPending}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Trash2 size={16} style={{ color: 'rgb(248, 113, 113)' }} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>No work history added yet.</div>
        )}
      </Card>

      {/* Profile Achievements (MMR Targets) */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Achievements & Skills</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowAchForm(!showAchForm)} style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Add Achievement Form */}
        {showAchForm && (
          <Card variant="simple" style={{ marginBottom: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="input-group">
              <label className="input-label">Select Associated Experience</label>
              <select
                value={achExpId}
                onChange={e => setAchExpId(e.target.value)}
                className="input-field"
                style={{ background: 'rgba(15, 23, 42, 0.6)' }}
              >
                <option value="">-- Choose Role --</option>
                {experiences.map(e => (
                  <option key={e.id} value={e.id} style={{ background: '#0f172a' }}>{e.title} at {e.company}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Description (What you achieved)</label>
              <textarea value={achDesc} onChange={e => setAchDesc(e.target.value)} placeholder="e.g. Developed and deployed key backend modules reducing processing lag by 30%." className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div className="input-group">
              <label className="input-label">Associated Skills (Comma separated)</label>
              <input type="text" value={achSkills} onChange={e => setAchSkills(e.target.value)} placeholder="Node.js, Redis, PostgreSQL" className="input-field" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowAchForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => createAchMutation.mutate()} isLoading={createAchMutation.isPending}>Add Achievement</Button>
            </div>
          </Card>
        )}

        {loadingAch ? (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Loading achievements...</div>
        ) : achievements.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {achievements.map(ach => {
              const assocExp = experiences.find(e => e.id === ach.experience_id);
              
              return (
                <div key={ach.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
                    <p style={{ lineHeight: 1.4 }}>{ach.description}</p>
                    {assocExp && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                        Ref: {assocExp.title} at {assocExp.company}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAchMutation.mutate(ach.id)}
                    disabled={deleteAchMutation.isPending}
                    style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem', marginLeft: '0.5rem' }}
                  >
                    <Trash2 size={16} style={{ color: 'rgb(248, 113, 113)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>No achievements added yet.</div>
        )}
      </Card>

      {/* Voice Snippets Tone Guides (PRD 6.4) */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mic size={16} style={{ color: 'hsl(var(--color-primary))' }} /> Voice Snippets Tones
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowVoiceForm(!showVoiceForm)} style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Add Voice Form */}
        {showVoiceForm && (
          <Card variant="simple" style={{ marginBottom: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="input-group">
              <label className="input-label">Select Snippet Type/Role</label>
              <select
                value={voiceRole}
                onChange={e => setVoiceRole(e.target.value as any)}
                className="input-field"
                style={{ background: 'rgba(15, 23, 42, 0.6)' }}
              >
                <option value="opening" style={{ background: '#0f172a' }}>Opening Introduction</option>
                <option value="body" style={{ background: '#0f172a' }}>Body Pitch</option>
                <option value="closing" style={{ background: '#0f172a' }}>Closing Signature</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Theme Tag</label>
              <input type="text" value={voiceTheme} onChange={e => setVoiceTheme(e.target.value)} placeholder="e.g. startup, technical, enterprise" className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">Tone & Style Content (Minimum 20 characters)</label>
              <textarea value={voiceContent} onChange={e => setVoiceContent(e.target.value)} placeholder="Introduce yourself in your own style and perspective..." className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowVoiceForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => createVoiceMutation.mutate()} isLoading={createVoiceMutation.isPending}>Add Snippet</Button>
            </div>
          </Card>
        )}

        {loadingVoice ? (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Loading voice snippets...</div>
        ) : voiceSnippets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {voiceSnippets.map(snippet => (
              <div
                key={snippet.id}
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  background: 'rgba(15, 23, 42, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Badge variant="info">{snippet.role.toUpperCase()}</Badge>
                    <Badge variant="neutral">{snippet.theme.toUpperCase()}</Badge>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.35 }}>
                    "{snippet.content}"
                  </p>
                </div>
                <button
                  onClick={() => deleteVoiceMutation.mutate(snippet.id)}
                  disabled={deleteVoiceMutation.isPending}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem', marginLeft: '0.5rem' }}
                >
                  <Trash2 size={16} style={{ color: 'rgb(248, 113, 113)' }} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>No voice snippets tone guides added yet.</div>
        )}
      </Card>
    </div>
  );
};
export default CareerProfileScreen;
