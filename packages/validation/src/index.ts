import { z } from 'zod';

// ==========================================
// 1. IDENTITY & AUTHENTICATION SCHEMAS
// ==========================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 expected)'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const otpSendSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  purpose: z.enum(['registration', 'payout', 'consent_toggle']),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  code: z.string().length(6, 'OTP code must be exactly 6 digits'),
});

export const verifyNINSchema = z.object({
  nin: z.string().length(11, 'NIN must be exactly 11 digits'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
});

export const userSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tokenHash: z.string(),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  browser: z.string().optional(),
  os: z.string().optional(),
  isActive: z.boolean(),
  lastActiveAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const userConsentSchema = z.object({
  consentVersion: z.string().min(1, 'Consent version is required'),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  countryCode: z.string().length(2).optional(),
  agreed: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms and consent waiver' }),
  }),
});

export const connectedAccountSchema = z.object({
  portalId: z.string().min(1, 'Portal ID is required'),
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
  cookies: z.string().optional(),
});

// ==========================================
// 2. CAREER PROFILE SCHEMAS
// ==========================================

export const experienceSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').nullable(), // Null means current role
  description: z.string().optional(),
});

export const achievementSchema = z.object({
  experienceId: z.string().uuid('Invalid experience ID reference'),
  description: z.string().min(10, 'Achievement description must be at least 10 characters long'),
  skills: z.array(z.string().min(1)).min(1, 'Associate at least one skill with this achievement'),
});

export const voiceSnippetSchema = z.object({
  role: z.enum(['opening', 'body', 'closing'], {
    errorMap: () => ({ message: 'Role must be opening, body, or closing' }),
  }),
  theme: z.string().min(1, 'Theme tag is required (e.g. startup, enterprise)'),
  content: z.string().min(20, 'Voice snippet content must be at least 20 characters long'),
});

export const resumeVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required (e.g. backend-engineer)'),
  achievementIds: z.array(z.string().uuid()).min(1, 'Select at least one achievement for this variant'),
});

// ==========================================
// 3. JOB INGESTION & DISCOVERY SCHEMAS
// ==========================================

export const normalizedJobSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(50, 'Description must be at least 50 characters long'),
  url: z.string().url('Invalid listing URL'),
  sourceId: z.string().min(1, 'Ingestion source ID is required'),
  salary: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  experienceLevel: z.string().nullable().optional(),
  rawListingData: z.record(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
});

// ==========================================
// 4. APPLICATIONS QUEUE SCHEMAS
// ==========================================

export const queueApplicationInputSchema = z.object({
  jobId: z.string().uuid('Invalid Job ID'),
  resumeVariantId: z.string().uuid('Invalid Resume Variant ID'),
  coverLetterSnippetIds: z.array(z.string().uuid()).default([]),
});

export const applicationQueueItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  jobId: z.string().uuid(),
  resumeVariantId: z.string().uuid(),
  coverLetterSnippetIds: z.array(z.string().uuid()),
  status: z.enum(['PendingApproval', 'Queued', 'RateLimited', 'Submitting', 'Submitted', 'Failed']),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(5),
  errorLog: z.string().nullable().optional(),
  submittedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ==========================================
// TYPESCRIPT TYPES INFERRED FROM SCHEMAS
// ==========================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type VerifyNINInput = z.infer<typeof verifyNINSchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
export type UserConsent = z.infer<typeof userConsentSchema>;
export type ConnectedAccount = z.infer<typeof connectedAccountSchema>;

export type ExperienceInput = z.infer<typeof experienceSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type VoiceSnippetInput = z.infer<typeof voiceSnippetSchema>;
export type ResumeVariantInput = z.infer<typeof resumeVariantSchema>;

export type NormalizedJob = z.infer<typeof normalizedJobSchema>;

export type QueueApplicationInput = z.infer<typeof queueApplicationInputSchema>;
export type ApplicationQueueItem = z.infer<typeof applicationQueueItemSchema>;
