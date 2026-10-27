import { SCORING } from '../config.js';

export function normaliseAnswer(v) {
  return String(v ?? '').trim().replace(/\s+/g, '').replace(/,/g, '');
}

export function isAttempted(q, response) {
  if (q.type === 'mcq') return Number.isInteger(response);
  return normaliseAnswer(response) !== '';
}

export function isCorrect(q, response) {
  if (!isAttempted(q, response)) return false;
  if (q.type === 'mcq') return response === q.answer;
  const given = normaliseAnswer(response);
  const key = normaliseAnswer(q.answer);
  // Ordered sequences (para jumbles, sentence numbers) compare as strings.
  if (q.sentences) return given === key;
  const g = Number(given), k = Number(key);
  if (Number.isFinite(g) && Number.isFinite(k)) return Math.abs(g - k) <= SCORING.numericTolerance;
  return given.toLowerCase() === key.toLowerCase();
}

export function marksFor(q, response) {
  const rule = SCORING[q.type];
  if (!isAttempted(q, response)) return rule.skipped;
  return isCorrect(q, response) ? rule.correct : rule.wrong;
}

// Turns a submitted mock into per-question attempt records used by the diagnostic engine.
export function mockAttempts(mockNo, questions, state) {
  return questions.map(q => {
    const r = state.answers[q.id];
    const attempted = isAttempted(q, r);
    return {
      qid: q.id, source: `mock${mockNo}`, mock: mockNo,
      section: q.section, topic: q.topic, difficulty: q.difficulty, type: q.type, setId: q.setId || null,
      attempted, correct: isCorrect(q, r), marks: marksFor(q, r),
      timeSec: Math.round(state.timeSpent[q.id] || 0), expectedSec: q.expectedSec,
      marked: !!state.marked[q.id], confidence: state.confidence?.[q.id] || null,
    };
  });
}

export function summarise(attempts) {
  const s = { total: attempts.length, attempted: 0, correct: 0, wrong: 0, skipped: 0, marks: 0, negative: 0, timeSec: 0, maxMarks: 0 };
  for (const a of attempts) {
    s.maxMarks += SCORING[a.type].correct;
    if (!a.attempted) { s.skipped++; continue; }
    s.attempted++;
    s.timeSec += a.timeSec;
    if (a.correct) s.correct++; else { s.wrong++; if (a.marks < 0) s.negative += a.marks; }
    s.marks += a.marks;
  }
  s.accuracy = s.attempted ? s.correct / s.attempted : null;
  s.attemptRate = s.total ? s.attempted / s.total : 0;
  s.avgTimeSec = s.attempted ? s.timeSec / s.attempted : null;
  return s;
}
