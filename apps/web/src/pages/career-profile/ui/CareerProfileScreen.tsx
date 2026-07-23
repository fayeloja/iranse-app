import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import httpClient from '../../../shared/api/httpClient.js';
import Card from '../../../shared/ui/Card.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Badge from '../../../shared/ui/Badge.jsx';
import ProgressBar from '../../../shared/ui/ProgressBar.jsx';
import { User, Briefcase, Plus, Mic, Trash2, Upload, FileText, AlertCircle, RefreshCw, Pencil, Wrench, CheckCircle } from 'lucide-react';

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
  skills?: string[];
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface VoiceSnippet {
  id: string;
  role: 'opening' | 'body' | 'closing';
  theme: string;
  content: string;
}

export const CareerProfileScreen: React.FC = () => {
  const queryClient = useQueryClient();

  // Toggles for forms & edit states
  const [showExpForm, setShowExpForm] = useState(false);
  const [showAchForm, setShowAchForm] = useState(false);
  const [showVoiceForm, setShowVoiceForm] = useState(false);

  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingAchId, setEditingAchId] = useState<string | null>(null);

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

  const { data: skills = [], isLoading: loadingSkills } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await httpClient('/api/v1/career-profile/skill');
      return res.data.skills;
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

  const updateExpMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient(`/api/v1/career-profile/experience/${id}`, {
        method: 'PUT',
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
      setEditingExpId(null);
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

  const updateAchMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient(`/api/v1/career-profile/achievement/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: achDesc,
          skills: achSkills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
    },
    onSuccess: () => {
      setEditingAchId(null);
      setAchExpId('');
      setAchDesc('');
      setAchSkills('');
      setShowAchForm(false);
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
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
      queryClient.invalidateQueries({ queryKey: ['skills'] });
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
        queryClient.invalidateQueries({ queryKey: ['voice-snippets'] });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setCvError(err.error?.message || 'Failed to parse CV PDF document.');
      setUploadProgress(null);
    }
  };

  // Calculate Profile Completeness %
  const expScore = experiences.length > 0 ? 30 : 0;
  const achScore = achievements.length >= 2 ? 30 : achievements.length > 0 ? 15 : 0;
  const skillScore = skills.length > 0 ? 20 : 0;
  const voiceScore = voiceSnippets.length > 0 ? 20 : 0;
  const profileCompleteness = expScore + achScore + skillScore + voiceScore;

  const handleEditExperience = (exp: Experience) => {
    setEditingExpId(exp.id);
    setExpTitle(exp.title);
    setExpCompany(exp.company);
    setExpLocation(exp.location);
    setExpStartDate(exp.start_date);
    setExpEndDate(exp.end_date || '');
    setExpIsCurrent(!exp.end_date);
    setExpDesc(exp.description || '');
    setShowExpForm(true);
  };

  const handleEditAchievement = (ach: Achievement) => {
    setEditingAchId(ach.id);
    setAchExpId(ach.experience_id);
    setAchDesc(ach.description);
    setAchSkills((ach.skills || []).join(', '));
    setShowAchForm(true);
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
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Career Knowledge Base</h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem' }}>
            Structured experiences, skills taxonomy & verbatim voice snippets
          </p>
        </div>
      </div>

      {/* Profile Completeness Readiness Card */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} style={{ color: profileCompleteness >= 80 ? 'rgb(52, 211, 153)' : 'hsl(var(--color-primary))' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Matching Readiness</h3>
          </div>
          <Badge variant={profileCompleteness >= 80 ? 'success' : 'warning'}>
            {profileCompleteness}% Complete
          </Badge>
        </div>
        <ProgressBar value={profileCompleteness} height="6px" />
        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.5rem' }}>
          {profileCompleteness >= 80
            ? 'Your profile is fully configured for high-confidence job matching & resume assembly.'
            : 'Add work experiences, achievements, and skills to reach optimal matching score precision.'}
        </p>
      </Card>

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
          <label style={{ display: 'inline-flex', alignSelf: 'flex-start', width: '100%' }}>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleCVUpload}
              style={{ display: 'none' }}
            />
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                minHeight: '46px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="interactive"
            >
              <Upload size={18} /> Choose CV Document (PDF / Text)
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
          <Button variant="ghost" size="sm" onClick={() => { setEditingExpId(null); setShowExpForm(!showExpForm); }} style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Experience Add/Edit Form */}
        {showExpForm && (
          <Card variant="simple" style={{ marginBottom: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{editingExpId ? 'Edit Work Role' : 'Add New Work Role'}</h4>
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
              <Button variant="secondary" size="sm" onClick={() => { setShowExpForm(false); setEditingExpId(null); }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => editingExpId ? updateExpMutation.mutate(editingExpId) : createExpMutation.mutate()}
                isLoading={createExpMutation.isPending || updateExpMutation.isPending}
              >
                {editingExpId ? 'Save Changes' : 'Add Role'}
              </Button>
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
                  {exp.description && (
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', marginTop: '0.4rem', lineHeight: 1.35 }}>
                      {exp.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => handleEditExperience(exp)}
                    style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                    title="Edit Role"
                  >
                    <Pencil size={15} style={{ color: 'hsl(var(--color-secondary))' }} />
                  </button>
                  <button
                    onClick={() => deleteExpMutation.mutate(exp.id)}
                    disabled={deleteExpMutation.isPending}
                    style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                    title="Delete Role"
                  >
                    <Trash2 size={15} style={{ color: 'rgb(248, 113, 113)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>No work history added yet.</div>
        )}
      </Card>

      {/* Skills Taxonomy Section */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Wrench size={16} style={{ color: 'hsl(var(--color-secondary))' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Skills & Technologies Taxonomy</h3>
        </div>
        {loadingSkills ? (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>Loading skills taxonomy...</div>
        ) : skills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map(s => (
              <Badge key={s.id} variant="neutral">
                {s.name} <span style={{ opacity: 0.6, fontSize: '0.65rem', marginLeft: '0.25rem' }}>({s.category})</span>
              </Badge>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
            No skills cataloged yet. Skills are automatically populated when adding achievements or uploading a CV.
          </div>
        )}
      </Card>

      {/* Profile Achievements (MMR Targets) */}
      <Card variant="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Achievements & Skill Links</h3>
          <Button variant="ghost" size="sm" onClick={() => { setEditingAchId(null); setShowAchForm(!showAchForm); }} style={{ padding: '0.25rem' }}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Add/Edit Achievement Form */}
        {showAchForm && (
          <Card variant="simple" style={{ marginBottom: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{editingAchId ? 'Edit Achievement' : 'Add New Achievement'}</h4>
            {!editingAchId && (
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
            )}
            <div className="input-group">
              <label className="input-label">Description (What you achieved)</label>
              <textarea value={achDesc} onChange={e => setAchDesc(e.target.value)} placeholder="e.g. Developed and deployed key backend modules reducing processing lag by 30%." className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div className="input-group">
              <label className="input-label">Associated Skills (Comma separated)</label>
              <input type="text" value={achSkills} onChange={e => setAchSkills(e.target.value)} placeholder="Node.js, Redis, PostgreSQL" className="input-field" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => { setShowAchForm(false); setEditingAchId(null); }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => editingAchId ? updateAchMutation.mutate(editingAchId) : createAchMutation.mutate()}
                isLoading={createAchMutation.isPending || updateAchMutation.isPending}
              >
                {editingAchId ? 'Save Changes' : 'Add Achievement'}
              </Button>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem', flex: 1 }}>
                    <p style={{ lineHeight: 1.4 }}>{ach.description}</p>
                    {ach.skills && ach.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                        {ach.skills.map((sk, idx) => (
                          <Badge key={idx} variant="info">{sk}</Badge>
                        ))}
                      </div>
                    )}
                    {assocExp && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.15rem' }}>
                        Ref: {assocExp.title} at {assocExp.company}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                    <button
                      onClick={() => handleEditAchievement(ach)}
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                      title="Edit Achievement"
                    >
                      <Pencil size={15} style={{ color: 'hsl(var(--color-secondary))' }} />
                    </button>
                    <button
                      onClick={() => deleteAchMutation.mutate(ach.id)}
                      disabled={deleteAchMutation.isPending}
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete Achievement"
                    >
                      <Trash2 size={15} style={{ color: 'rgb(248, 113, 113)' }} />
                    </button>
                  </div>
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
