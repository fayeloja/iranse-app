import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';
import { ExperienceRow, AchievementRow } from '../../career-profile/career-profile.repository.js';

/**
 * Education matching dimension scorer.
 * Parses qualifications and educational requirements.
 */
export class EducationScorer implements DimensionScorer {
  name = 'education';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: { experiences: ExperienceRow[]; achievements: AchievementRow[] }
  ): Promise<ScoreResult> {
    const jobText = job.description.toLowerCase();
    
    // Check if the job specifically requires academic degrees
    const requiresDegree = jobText.includes('degree') || jobText.includes('b.sc') || jobText.includes('bachelor') || jobText.includes('m.sc') || jobText.includes('phd') || jobText.includes('hnd') || jobText.includes('ond');
    if (!requiresDegree) {
      return {
        score: 90,
        reason: 'This job does not list strict academic degree requirements. Hands-on experience is prioritized.',
      };
    }

    // Scan candidate work achievements and experiences for education markers
    const fullProfileText = [
      ...profile.experiences.map(e => `${e.title} ${e.description || ''}`),
      ...profile.achievements.map(a => a.description)
    ].join(' ').toLowerCase();

    const hasEducationKeywords = fullProfileText.includes('degree') || fullProfileText.includes('b.sc') || fullProfileText.includes('bachelor') || fullProfileText.includes('graduate') || fullProfileText.includes('university') || fullProfileText.includes('m.sc') || fullProfileText.includes('hnd') || fullProfileText.includes('ond') || fullProfileText.includes('phd') || fullProfileText.includes('diploma');

    if (hasEducationKeywords) {
      return {
        score: 100,
        reason: 'Your profile details suggest alignment with the academic qualifications requested.',
      };
    }

    return {
      score: 75,
      reason: 'This role requests a degree, while your profile is centered primarily on raw professional achievements.',
    };
  }
}
export default EducationScorer;
