// All tunable assumptions live here so they can be reviewed in one place.
// The "How it works" page renders these values directly.

export const SCORING = {
  // CAT-style marking (assumption based on the publicly stated CAT pattern):
  // MCQ: +3 correct, -1 wrong. TITA (type-in-the-answer): +3 correct, 0 wrong.
  mcq: { correct: 3, wrong: -1, skipped: 0 },
  tita: { correct: 3, wrong: 0, skipped: 0 },
  numericTolerance: 0.01,
};

export const MOCK_DURATION_MIN = 45; // per diagnostic mock (a full CAT is 120 min)

export const DIAGNOSTIC = {
  minAttempts: 2,            // below this, a topic is "insufficient evidence"
  prior: 0.5,                // smoothing prior for accuracy
  priorWeight: 1,            // how many "virtual" attempts the prior counts as
  creditByDifficulty: { easy: 0.8, medium: 1, hard: 1.25 },   // weight of a correct answer
  penaltyByDifficulty: { easy: 1.25, medium: 1, hard: 0.7 },  // weight of a wrong answer
  unsureCorrectCredit: 0.6,  // a correct answer the student flagged as a guess earns partial credit
  strong: { minAccuracy: 0.7, maxSpeedRatio: 1.25 },
  weak: { maxAccuracy: 0.45, minWrong: 2 },
  inconsistencyGap: 0.67,    // gap between Mock 1 and Mock 2 accuracy treated as inconsistent
  slowRatio: 1.3,            // time / expected time above which a topic counts as slow
};

export const PRIORITY_WEIGHTS = {
  relevance: 0.25,   // expected questions per paper
  gap: 0.2,          // 1 - adjusted accuracy
  improvement: 0.15, // realistic accuracy/speed gain available
  efficiency: 0.25,  // estimated gain per hour of study
  prerequisite: 0.15 // how many other topics depend on this one
};

export const WEIGHT_LABELS = {
  relevance: 'Exam relevance',
  gap: 'Performance gap',
  improvement: 'Improvement potential',
  efficiency: 'Gain per study hour',
  prerequisite: 'Prerequisite importance',
};

// Activity lengths in minutes, used by the daily planner.
export const ACTIVITY_MINUTES = { concept: 40, quick: 20, speed: 15, check: 10, review: 15 };

// Share of daily time per activity type, by days remaining until the exam.
export function planShares(daysLeft) {
  if (daysLeft > 90) return { concept: 0.55, quick: 0.2, speed: 0.15, review: 0.1 };
  if (daysLeft >= 30) return { concept: 0.45, quick: 0.25, speed: 0.2, review: 0.1 };
  return { concept: 0.25, quick: 0.4, speed: 0.25, review: 0.1 };
}
