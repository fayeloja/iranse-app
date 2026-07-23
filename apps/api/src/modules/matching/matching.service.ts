import { SkillsScorer } from './dimensions/skills.scorer.js';
import { ExperienceScorer } from './dimensions/experience.scorer.js';
import { LocationScorer } from './dimensions/location.scorer.js';
import { SalaryScorer } from './dimensions/salary.scorer.js';
import { IndustryScorer } from './dimensions/industry.scorer.js';
import { EducationScorer } from './dimensions/education.scorer.js';
import { VisaScorer } from './dimensions/visa.scorer.js';
import { CultureFitScorer } from './dimensions/culture-fit.scorer.js';
import { DimensionScorer } from './dimensions/scorer.interface.js';
import * as repository from './matching.repository.js';
import { getExperiences, getAchievements } from '../career-profile/career-profile.repository.js';
import { getJobById } from '../job-discovery/job-discovery.repository.js';
import { getUserApplications } from '../applications/applications.repository.js';
import { getUserMonthlyApplicationStatus } from '../applications/applications.service.js';

// Weight configuration for overall score calculation (sum equals 1.0)
const WEIGHTS = {
  skills: 0.25,
  experience: 0.20,
  industry: 0.15,
  education: 0.10,
  location: 0.10,
  salary: 0.10,
  visa: 0.05,
  'culture-fit': 0.05,
};

const SCORERS: DimensionScorer[] = [
  new SkillsScorer(),
  new ExperienceScorer(),
  new LocationScorer(),
  new SalaryScorer(),
  new IndustryScorer(),
  new EducationScorer(),
  new VisaScorer(),
  new CultureFitScorer(),
];

/**
 * Calculates multi-dimensional match score for a specific user and job posting.
 * Persists the output and returns the breakdown detail (PRD 6.3).
 */
export async function calculateUserJobMatch(userId: string, jobId: string) {
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error(`Job posting [${jobId}] not found.`);
  }

  // 1. Fetch user's career profile
  const experiences = await getExperiences(userId);
  const achievements = await getAchievements(userId);
  const profile = { experiences, achievements };

  // 2. Compute individual dimension scores
  const breakdown: Record<string, { score: number; reason: string }> = {};
  let overallScore = 0;

  for (const scorer of SCORERS) {
    const res = await scorer.calculateScore(userId, job as any, profile);
    breakdown[scorer.name] = res;
    
    // Add weighted contribution
    const weight = WEIGHTS[scorer.name as keyof typeof WEIGHTS] || 0;
    overallScore += res.score * weight;
  }

  const finalOverallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  // 3. Persist match details
  return repository.upsertJobMatch(
    userId,
    jobId,
    finalOverallScore,
    breakdown.skills.score,
    breakdown.experience.score,
    breakdown.location.score,
    breakdown.salary.score,
    breakdown
  );
}

/**
 * Process a newly ingested job posting by matching it against all active candidates (PRD 6.2).
 * Called within background BullMQ worker loops.
 */
export async function matchJobAgainstAllUsers(jobId: string): Promise<{ matchedUsersCount: number }> {
  const users = await repository.getAllActiveUsers();
  console.log(`📊 Matching Engine: Matching job [${jobId}] against ${users.length} active users...`);

  let matchedUsersCount = 0;
  for (const user of users) {
    try {
      await calculateUserJobMatch(user.id, jobId);
      matchedUsersCount++;
    } catch (err) {
      console.error(`❌ Failed to run matching calculations for User [${user.id}] against Job [${jobId}]:`, err);
    }
  }

  return { matchedUsersCount };
}

export async function getUserMatches(userId: string, minScore: number = 0, limit: number = 20, offset: number = 0) {
  const matches = await repository.getUserMatches(userId, minScore, limit, offset);
  return matches.map((match) => ({
    id: match.id,
    jobId: match.job_id,
    overallScore: match.overall_score,
    skillsScore: match.skills_score,
    experienceScore: match.experience_score,
    locationScore: match.location_score,
    salaryScore: match.salary_score,
    breakdown: typeof match.breakdown === 'string' ? JSON.parse(match.breakdown) : match.breakdown,
    job: {
      title: match.title,
      company: match.company,
      location: match.location,
      salary: match.salary,
      experienceLevel: match.experience_level,
      url: match.url,
    },
    createdAt: match.created_at,
    updatedAt: match.updated_at,
  }));
}

export async function getUserDigest(userId: string) {
  const sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const newMatches = await repository.getNewMatchesSince(userId, sinceDate, 5);
  const matchSummary = await repository.getMatchesSummary(userId, sinceDate);
  
  const applications = await getUserApplications(userId, 1000, 0);
  
  const needsAttention = applications.filter(app => app.status === 'Failed');
  const recentlySubmitted = applications.filter(app => 
    app.status === 'Submitted' && 
    app.submitted_at && 
    new Date(app.submitted_at) >= sinceDate
  );
  
  const quota = await getUserMonthlyApplicationStatus(userId);
  
  return {
    date: new Date().toISOString(),
    newMatches: {
      count: matchSummary.count,
      topMatches: newMatches.map(m => ({
        jobId: m.job_id,
        title: m.title,
        company: m.company,
        location: m.location,
        overallScore: m.overall_score
      }))
    },
    applications: {
      sent: applications.filter(a => a.status === 'Submitted').length,
      needsAttention: needsAttention.map(a => ({
        id: a.id,
        title: a.title,
        company: a.company,
        status: a.status,
        errorLog: a.error_log
      })),
      recentlySubmitted: recentlySubmitted.map(a => ({
        id: a.id,
        title: a.title,
        company: a.company,
        submittedAt: a.submitted_at
      }))
    },
    freeApplicationsLeft: quota.remaining
  };
}
