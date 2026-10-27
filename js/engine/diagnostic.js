import { DIAGNOSTIC as D } from '../config.js';
import { TOPICS, SECTIONS } from '../data/topics.js';
import { SETS } from '../data/mocks.js';
import { summarise } from './scoring.js';

const median = xs => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = x => `${Math.round(x * 100)}%`;

// Difficulty- and confidence-weighted accuracy, smoothed towards a neutral prior so that
// one or two answers never produce 0% or 100%.
export function adjustedAccuracy(attempted) {
  let credit = 0, weight = 0;
  for (const a of attempted) {
    if (a.correct) {
      const w = D.creditByDifficulty[a.difficulty];
      credit += w * (a.confidence === 'unsure' ? D.unsureCorrectCredit : 1);
      weight += w;
    } else {
      weight += D.penaltyByDifficulty[a.difficulty];
    }
  }
  return (credit + D.prior * D.priorWeight) / (weight + D.priorWeight);
}

export function evidenceConfidence(nAttempted, inconsistent) {
  const base = 1 - Math.exp(-nAttempted / 3);
  return base * (inconsistent ? 0.7 : 1);
}

export const confidenceLabel = c => (c >= 0.7 ? 'High' : c >= 0.45 ? 'Medium' : 'Low');

export function classify(stats) {
  const { attempted, adjAccuracy, speedRatio, wrong, wrongNonHard, inconsistent } = stats;
  if (attempted < D.minAttempts) return 'insufficient';
  if (adjAccuracy >= D.strong.minAccuracy && (speedRatio ?? 1) <= D.strong.maxSpeedRatio && !inconsistent) return 'strong';
  // Weak needs repeated errors, at least one of them on a question that was not hard.
  if (wrong >= D.weak.minWrong && adjAccuracy < D.weak.maxAccuracy && wrongNonHard >= 1) return 'weak';
  return 'developing';
}

export function topicStats(topicId, attempts) {
  const all = attempts.filter(a => a.topic === topicId);
  const att = all.filter(a => a.attempted);
  const correct = att.filter(a => a.correct).length;
  const wrongList = att.filter(a => !a.correct);
  const byMock = {};
  for (const m of [1, 2]) {
    const xs = all.filter(a => a.mock === m);
    const xa = xs.filter(a => a.attempted);
    byMock[m] = { presented: xs.length, attempted: xa.length, correct: xa.filter(a => a.correct).length };
    byMock[m].accuracy = xa.length ? byMock[m].correct / xa.length : null;
  }
  const prac = all.filter(a => a.source === 'practice');
  const pracAtt = prac.filter(a => a.attempted);
  const practice = { attempted: pracAtt.length, correct: pracAtt.filter(a => a.correct).length };

  let consistency = 'single-source';
  if (byMock[1].accuracy != null && byMock[2].accuracy != null) {
    consistency = Math.abs(byMock[1].accuracy - byMock[2].accuracy) >= D.inconsistencyGap ? 'inconsistent' : 'consistent';
  } else if (byMock[1].attempted + byMock[2].attempted === 0) consistency = 'none';

  const ratios = att.filter(a => a.timeSec > 0).map(a => a.timeSec / a.expectedSec);
  const stats = {
    topicId,
    presented: all.length,
    attempted: att.length,
    skipped: all.length - att.length,
    correct,
    wrong: wrongList.length,
    wrongNonHard: wrongList.filter(a => a.difficulty !== 'hard').length,
    hardWrong: wrongList.filter(a => a.difficulty === 'hard').length,
    unsureCorrect: att.filter(a => a.correct && a.confidence === 'unsure').length,
    rawAccuracy: att.length ? correct / att.length : null,
    adjAccuracy: adjustedAccuracy(att),
    speedRatio: median(ratios),
    avgTimeSec: att.length ? att.reduce((s, a) => s + a.timeSec, 0) / att.length : null,
    byMock, practice, consistency,
    inconsistent: consistency === 'inconsistent',
  };
  stats.confidence = evidenceConfidence(att.length, stats.inconsistent);
  stats.confidenceLabel = confidenceLabel(stats.confidence);
  stats.status = classify(stats);
  stats.slow = stats.speedRatio != null && stats.speedRatio >= D.slowRatio;
  stats.evidence = describeEvidence(stats);
  return stats;
}

function describeEvidence(s) {
  const out = [];
  if (s.presented === 0) { out.push('No questions on this topic yet.'); return out; }
  out.push(`${s.correct} of ${s.attempted} attempted correct${s.skipped ? `, ${s.skipped} skipped` : ''}.`);
  if (s.byMock[1].attempted && s.byMock[2].attempted) {
    out.push(`Mock 1: ${s.byMock[1].correct}/${s.byMock[1].attempted}. Mock 2: ${s.byMock[2].correct}/${s.byMock[2].attempted}${s.inconsistent ? ' (results disagree)' : ''}.`);
  } else if (s.byMock[1].attempted || s.byMock[2].attempted) {
    out.push(`Mock evidence comes from ${s.byMock[1].attempted ? 'Mock 1' : 'Mock 2'} only.`);
  }
  if (s.practice.attempted) out.push(`Practice: ${s.practice.correct}/${s.practice.attempted}.`);
  if (s.speedRatio != null) out.push(`Median time is ${s.speedRatio.toFixed(1)}× the expected solving time.`);
  if (s.hardWrong && !s.wrongNonHard) out.push('All errors were on hard questions, so they are not treated as a concept gap.');
  if (s.skipped && s.attempted < D.minAttempts) out.push('Skipped questions are not counted as errors.');
  if (s.unsureCorrect) out.push(`${s.unsureCorrect} correct answer${s.unsureCorrect > 1 ? 's were' : ' was'} marked as a guess and earned partial credit.`);
  return out;
}

export function sectionStats(attempts) {
  return SECTIONS.map(sec => {
    const xs = attempts.filter(a => a.section === sec.id);
    return { ...sec, ...summarise(xs) };
  });
}

export function difficultyStats(attempts) {
  return ['easy', 'medium', 'hard'].map(d => ({ difficulty: d, ...summarise(attempts.filter(a => a.difficulty === d)) }));
}

// DILR: judge each set as a unit (selection and time) separately from per-question accuracy.
export function setStats(attempts) {
  const ids = [...new Set(attempts.filter(a => a.setId).map(a => a.setId))];
  return ids.map(id => {
    const xs = attempts.filter(a => a.setId === id);
    const s = summarise(xs);
    const expected = xs.reduce((t, a) => t + a.expectedSec, 0);
    const spent = xs.reduce((t, a) => t + a.timeSec, 0);
    let verdict;
    if (s.attempted === 0) verdict = 'Not attempted';
    else if (s.correct === s.total) verdict = 'Fully solved';
    else if (s.correct === 0) verdict = spent > expected ? 'Time sink: no correct answers' : 'Attempted, no correct answers';
    else verdict = 'Partly solved';
    return { setId: id, title: SETS[id].title, difficulty: SETS[id].difficulty, mock: xs[0].mock, ...s, expectedSec: expected, spentSec: spent, verdict };
  });
}

export function setSelectionInsights(sets) {
  const notes = [];
  const rank = { easy: 0, medium: 1, hard: 2 };
  for (const m of [1, 2]) {
    const xs = sets.filter(s => s.mock === m).sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
    if (xs.length < 2) continue;
    const [easier, harder] = [xs[0], xs[xs.length - 1]];
    if (harder.spentSec > easier.spentSec && easier.attempted < easier.total) {
      notes.push(`Mock ${m}: you spent more time on the harder set (${harder.title.split(':')[0]}) while leaving questions in the easier one unanswered. In CAT, choosing the right sets matters as much as solving them.`);
    }
    for (const s of xs) if (s.verdict.startsWith('Time sink')) notes.push(`Mock ${m}: ${s.title.split(':')[0]} took ${Math.round(s.spentSec / 60)} min without a correct answer. Set a 2–3 minute checkpoint before committing to a set.`);
  }
  if (!notes.length && sets.length) notes.push('No set-selection problems detected: time went mainly to sets where you scored.');
  return notes;
}

export function buildProfile(attempts) {
  const topics = Object.fromEntries(TOPICS.map(t => [t.id, topicStats(t.id, attempts)]));
  const mockOnly = attempts.filter(a => a.source !== 'practice');
  const sets = setStats(mockOnly);
  return {
    overall: summarise(mockOnly),
    sections: sectionStats(mockOnly),
    difficulty: difficultyStats(mockOnly),
    sets, setInsights: setSelectionInsights(sets),
    topics,
  };
}

export { pct };
