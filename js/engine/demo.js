// Illustrative demo students. Their responses are SIMULATED from the ability settings below
// with a seeded random generator, so every load produces the same data. They are not real users.
import { QUESTIONS, MOCKS } from '../data/mocks.js';

function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const DIFF_ADJ = { easy: 0.15, medium: 0, hard: -0.2 };

export const DEMO_PROFILES = [
  {
    id: 'fast-accurate', name: 'Ananya', label: 'Fast, accurate solver',
    summary: 'Scores well across sections and solves quickly. Expect speed-optimisation and maintenance recommendations.',
    student: { targetPercentile: 99, monthsLeft: 4, dailyMinutes: 120, stage: 'advanced', prevMock: '96 percentile', selfConfidence: { VARC: 4, DILR: 4, QA: 5 } },
    ability: () => 0.95, speed: () => 0.8, attempt: () => 0.98,
  },
  {
    id: 'weak-fundamentals', name: 'Rohan', label: 'Weak fundamentals',
    summary: 'Reasonable in reading, but struggles with Quant and DILR basics. Expect concept-building recommendations.',
    student: { targetPercentile: 90, monthsLeft: 6, dailyMinutes: 90, stage: 'beginner', prevMock: '', selfConfidence: { VARC: 3, DILR: 3, QA: 3 } },
    ability: q => (q.section === 'VARC' ? 0.7 : 0.1), speed: q => (q.section === 'VARC' ? 1.05 : 1.5), attempt: () => 0.95,
  },
  {
    id: 'limited-time', name: 'Meera', label: 'Working professional, limited time',
    summary: 'Mixed results, 45 minutes a day and about a month to go. Expect a short, selective plan.',
    student: { targetPercentile: 95, monthsLeft: 1, dailyMinutes: 45, stage: 'intermediate', prevMock: '82 percentile', selfConfidence: { VARC: 4, DILR: 2, QA: 3 } },
    ability: q => ({ VARC: 0.75, DILR: 0.45, QA: 0.6 })[q.section], speed: q => (q.section === 'QA' ? 1.4 : 1.1), attempt: () => 0.9,
  },
  {
    id: 'inconsistent', name: 'Kabir', label: 'Inconsistent evidence',
    summary: 'Did well in Mock 1 and poorly in Mock 2, and skipped many questions. Expect cautious labels and evidence checks.',
    student: { targetPercentile: 95, monthsLeft: 3, dailyMinutes: 60, stage: 'intermediate', prevMock: '', selfConfidence: { VARC: 4, DILR: 4, QA: 4 } },
    ability: q => (q.mock === 1 ? 0.9 : 0.15), speed: () => 1.0, attempt: q => (q.section === 'QA' ? 0.45 : 0.85),
  },
];

function wrongOption(q, r) {
  if (q.type === 'mcq') { const opts = q.options.map((_, i) => i).filter(i => i !== q.answer); return opts[Math.floor(r() * opts.length)]; }
  if (q.sentences && q.answer.length === 1) return String((Number(q.answer) % q.sentences.length) + 1);
  if (q.sentences) return q.answer.split('').reverse().join('');
  return String(Number(q.answer) + 1 + Math.floor(r() * 5));
}

export function simulateMock(profile, mockNo) {
  const r = rng(`${profile.id}-${mockNo}`);
  const st = { status: 'submitted', current: 0, answers: {}, marked: {}, timeSpent: {}, confidence: {}, visited: {}, elapsed: 0, submittedAt: Date.now() };
  for (const id of MOCKS[mockNo].questions) {
    const q = QUESTIONS.find(x => x.id === id);
    st.visited[id] = true;
    const t = Math.round(q.expectedSec * profile.speed(q) * (0.85 + r() * 0.3));
    st.timeSpent[id] = t;
    st.elapsed += t;
    if (r() > profile.attempt(q)) { st.timeSpent[id] = Math.round(t * 0.3); continue; }
    const p = Math.max(0.02, Math.min(0.98, profile.ability(q) + DIFF_ADJ[q.difficulty]));
    const ok = r() < p;
    st.answers[id] = ok ? q.answer : wrongOption(q, r);
    if (r() < 0.12) st.marked[id] = true;
    if (ok && p < 0.5 && r() < 0.5) st.confidence[id] = 'unsure';
  }
  return st;
}
