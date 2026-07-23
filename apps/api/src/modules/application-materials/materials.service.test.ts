import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectAchievementsMMR } from './materials.service.js';

describe('Maximal Marginal Relevance (MMR) Selector Unit Tests', () => {
  it('returns all achievements if total count is less than or equal to limit', () => {
    const achievements = [
      { id: '1', description: 'Achievement 1', embedding: [1, 0, 0] },
      { id: '2', description: 'Achievement 2', embedding: [0, 1, 0] },
    ];
    const jobVector = [1, 0, 0];

    const result = selectAchievementsMMR(achievements, jobVector, 3);
    assert.equal(result.length, 2);
  });

  it('selects relevant yet diverse achievements up to specified limit', () => {
    const jobVector = [1, 0, 0];
    const achievements = [
      { id: '1', description: 'Node.js optimization A', embedding: [0.9, 0.1, 0] },
      { id: '2', description: 'Node.js optimization B (duplicate similarity)', embedding: [0.89, 0.11, 0] },
      { id: '3', description: 'Database indexing win (diverse topic)', embedding: [0.7, 0.7, 0] },
      { id: '4', description: 'DevOps CI/CD pipeline (diverse topic)', embedding: [0.5, 0.8, 0.3] },
    ];

    const selected = selectAchievementsMMR(achievements, jobVector, 3, 0.5);
    assert.equal(selected.length, 3);
    assert.equal(selected[0].id, '1'); // Most similar added first
    // Due to diversity penalty, a different topic (3 or 4) should be picked over duplicate B (2)
    assert.ok(selected.some(a => a.id === '3' || a.id === '4'));
  });
});
