import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { SkillsScorer } from './skills.scorer.js';
import { ExperienceScorer } from './experience.scorer.js';
import { LocationScorer } from './location.scorer.js';
import { SalaryScorer } from './salary.scorer.js';

const TEST_USER_ID = 'c1a4dd1b-e53b-4aa5-acc6-2411319d8e5f';

describe('Matching Dimension Scorers Unit Tests', () => {

  describe('SkillsScorer', () => {
    const scorer = new SkillsScorer();

    it('returns baseline fallback score when user has no achievements in database', async () => {
      const mockJob: any = {
        skills: ['Node.js', 'PostgreSQL', 'Redis'],
        description: 'Node.js backend role using PostgreSQL',
      };
      const mockProfile: any = {
        experiences: [],
        achievements: [],
      };

      const result = await scorer.calculateScore(TEST_USER_ID, mockJob, mockProfile);
      assert.ok(typeof result.score === 'number');
      assert.ok(result.score >= 0 && result.score <= 100);
    });
  });

  describe('ExperienceScorer', () => {
    const scorer = new ExperienceScorer();

    it('scores high for matching experience level and relevant job title', async () => {
      const mockJob: any = {
        title: 'Senior Backend Engineer',
        description: 'We are looking for a Senior Developer with 5+ years of experience.',
        experience_level: 'Senior',
      };
      const mockProfile: any = {
        experiences: [
          { title: 'Senior Node Developer', start_date: new Date('2019-01-01'), end_date: null },
        ],
        achievements: [],
      };

      const result = await scorer.calculateScore(TEST_USER_ID, mockJob, mockProfile);
      assert.ok(result.score >= 70, `Expected score >= 70, got ${result.score}`);
    });
  });

  describe('LocationScorer', () => {
    const scorer = new LocationScorer();

    it('returns 100 for Lagos remote or Lagos hybrid matches', async () => {
      const mockJob: any = {
        location: 'Lagos, Nigeria (Remote)',
      };
      const mockProfile: any = {
        experiences: [{ location: 'Lagos, Nigeria' }],
        achievements: [],
      };

      const result = await scorer.calculateScore(TEST_USER_ID, mockJob, mockProfile);
      assert.equal(result.score, 100);
    });
  });

  describe('SalaryScorer', () => {
    const scorer = new SalaryScorer();

    it('returns valid score calculation when salary is present', async () => {
      const mockJob: any = {
        salary: '₦1,000,000 / month',
      };
      const mockProfile: any = { experiences: [], achievements: [] };

      const result = await scorer.calculateScore(TEST_USER_ID, mockJob, mockProfile);
      assert.ok(result.score >= 0 && result.score <= 100);
    });
  });

});
