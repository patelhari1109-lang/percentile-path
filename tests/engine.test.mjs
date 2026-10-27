// Run: node tests/engine.test.mjs
// Validates the question bank, the scoring engine, and the diagnostic/prioritisation logic
// against the four simulated student profiles.
import assert from 'node:assert/strict';
import { QUESTIONS, MOCKS, SETS, PASSAGES } from '../js/data/mocks.js';
import { LEARNING } from '../js/data/learning.js';
import { TOPICS, TOPIC_BY_ID } from '../js/data/topics.js';
import { isCorrect, marksFor, mockAttempts, summarise } from '../js/engine/scoring.js';
import { buildProfile, classify, topicStats } from '../js/engine/diagnostic.js';
import { prioritise } from '../js/engine/priority.js';
import { planDay } from '../js/engine/planner.js';
import { DEMO_PROFILES, simulateMock } from '../js/engine/demo.js';
import { PRIORITY_WEIGHTS } from '../js/config.js';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name); };

console.log('Question bank');
test('40 diagnostic questions, 20 per mock, no shared ids', () => {
  assert.equal(QUESTIONS.length, 40);
  assert.equal(MOCKS[1].questions.length, 20);
  assert.equal(MOCKS[2].questions.length, 20);
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, 40);
});
test('every question is fully tagged and has a valid key', () => {
  for (const q of QUESTIONS) {
    for (const k of ['section', 'topic', 'subtopic', 'difficulty', 'type', 'stem', 'explanation', 'expectedSec', 'provenance']) assert.ok(q[k], `${q.id} missing ${k}`);
    assert.ok(TOPIC_BY_ID[q.topic], `${q.id} unknown topic`);
    assert.equal(TOPIC_BY_ID[q.topic].section, q.section, `${q.id} section mismatch`);
    assert.ok(q.prereqs?.length, `${q.id} prereqs`);
    if (q.type === 'mcq') { assert.ok(q.options.length === 4 && q.answer >= 0 && q.answer < 4, q.id); }
    else assert.equal(typeof q.answer, 'string', q.id);
    if (q.sentences) assert.ok(q.answer.split('').every(d => Number(d) >= 1 && Number(d) <= q.sentences.length), q.id);
    if (q.passageId) assert.ok(PASSAGES[q.passageId], q.id);
    if (q.setId) assert.ok(SETS[q.setId], q.id);
    assert.ok(isCorrect(q, q.answer), `${q.id} key does not score as correct`);
  }
});
test('each mock covers all three sections and both DILR set types', () => {
  for (const m of [1, 2]) {
    const qs = QUESTIONS.filter(q => q.mock === m);
    assert.deepEqual([...new Set(qs.map(q => q.section))].sort(), ['DILR', 'QA', 'VARC']);
    assert.equal(new Set(qs.filter(q => q.setId).map(q => q.setId)).size, 2);
  }
});
test('every topic has learning content with 3 practice items and valid keys', () => {
  for (const t of TOPICS) {
    const l = LEARNING[t.id];
    assert.ok(l, t.id);
    for (const k of ['prereq', 'concept', 'worked', 'misconception', 'fast', 'refresher']) assert.ok(l[k], `${t.id}.${k}`);
    assert.equal(l.practice.length, 3);
    assert.deepEqual(l.practice.map(p => p.difficulty), ['easy', 'medium', 'hard']);
    for (const p of l.practice) { assert.ok(p.hints.length && p.explanation); assert.ok(isCorrect(p, p.answer), p.id); }
  }
});

console.log('Independent re-computation of quantitative answer keys');
test('arithmetic behind QA and DI keys', () => {
  const key = id => QUESTIONS.find(q => q.id === id).answer;
  assert.equal(String(Math.round((1.4 * 0.85 - 1) * 100)), key('m1-q1'));
  assert.equal(String(42 / 1.5 - 18), key('m1-q2'));
  assert.equal(String((1 - 4 * (1 / 12 + 1 / 18)) * 18), key('m1-q3'));
  let n = 0; for (let x = -50; x <= 50; x++) if (Math.abs(x - 3) + Math.abs(x + 2) <= 9) n++;
  assert.equal(String(n), key('m1-q4'));
  const S = k => 3 * k * k + 5 * k; assert.equal(String(S(10) - S(9)), key('m1-q5'));
  let p = 1n; for (let i = 0; i < 103; i++) p = (p * 7n) % 25n; assert.equal(String(p), key('m1-q7'));
  assert.equal(String(120 / 4), key('m1-q8'));
  assert.equal(String(480 - 380 - 55), key('m2-q2'));
  let k = 0; for (let x = -50; x <= 50; x++) for (let y = x; y <= 50; y++) if (x + y === 7 && y - x === 3) k = x * y;
  assert.equal(String(k), key('m2-q4'));
  assert.equal(String(-12 / 2), key('m2-q5'));
  assert.equal(String((196 - 154) / 4), key('m2-q6'));
  let sq = 0; for (let d = 1; d <= 360; d++) if (360 % d === 0 && Number.isInteger(Math.sqrt(d))) sq++;
  assert.equal(String(sq), key('m2-q7'));
  let prime = 0; const isP = v => [2, 3, 5, 7, 11].includes(v);
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (isP(a + b)) prime++;
  assert.equal(prime, 15);
  // Boat problem: upstream 5, downstream 11
  assert.ok(Math.abs(30 / 5 + 44 / 11 - 10) < 1e-9 && Math.abs(40 / 5 + 55 / 11 - 13) < 1e-9);
  assert.equal(String((5 + 11) / 2), key('m2-q3'));
  // Bookshop
  assert.equal(String(285 * 400), key('m1-d2'));
  assert.ok(Math.abs(45000 / 97250 - 0.463) < 0.001);
  // Factories
  assert.ok(Math.abs(54 * 1.4 / (50 + 54 * 1.4 + 35 + 81) - 0.313) < 0.001);
});
test('DILR sets solved by brute force', () => {
  const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(r => [x, ...r]));
  const seats = perms(['P', 'Q', 'R', 'S', 'T', 'U']).filter(o => {
    const at = c => o.indexOf(c);
    return (at('P') === 0 || at('P') === 5) && at('U') < at('P') && at('Q') === at('R') + 1 && at('S') === 3;
  });
  const strict = seats.filter(o => Math.abs(o.indexOf('T') - 3) !== 1);
  assert.equal(strict.length, 1); assert.equal(strict[0].join(''), 'TRQSUP');
  assert.equal(seats.length, 4);
  // Teams
  const people = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const valid = [];
  for (let mask = 0; mask < 128; mask++) {
    const X = people.filter((_, i) => mask & (1 << i));
    if (X.length !== 4) continue;
    const inX = c => X.includes(c);
    if (inX('A') === inX('B')) continue; if (inX('C') !== inX('D')) continue;
    if (inX('E') && inX('F')) continue; if (inX('G')) continue; if (!inX('D')) continue;
    valid.push(X.join(''));
  }
  assert.equal(valid.length, 4);
  const extra = valid.filter(x => !x.includes('B') && x.includes('A') !== x.includes('E'));
  assert.equal(extra.length, 1); assert.ok(extra[0].includes('F'));
});

console.log('Scoring');
test('CAT-style marks: MCQ +3/-1, TITA +3/0, skip 0', () => {
  const mcq = QUESTIONS.find(q => q.type === 'mcq'), tita = QUESTIONS.find(q => q.type === 'tita' && !q.sentences);
  assert.equal(marksFor(mcq, mcq.answer), 3);
  assert.equal(marksFor(mcq, (mcq.answer + 1) % 4), -1);
  assert.equal(marksFor(mcq, undefined), 0);
  assert.equal(marksFor(tita, tita.answer), 3);
  assert.equal(marksFor(tita, '99999'), 0);
  assert.equal(marksFor(tita, ''), 0);
  assert.ok(isCorrect(QUESTIONS.find(q => q.id === 'm2-q6'), '10.50'));
  assert.ok(isCorrect(QUESTIONS.find(q => q.id === 'm1-d2'), '1,14,000'));
});

console.log('Diagnostic rules');
const rec = (o) => ({ topic: 't', mock: 1, source: 'mock1', attempted: true, correct: true, difficulty: 'medium', timeSec: 100, expectedSec: 100, confidence: null, ...o });
test('a skipped question does not make a topic weak', () => {
  const s = topicStats('t', [rec({ correct: false }), rec({ attempted: false, correct: false })]);
  assert.equal(s.status, 'insufficient');
});
test('errors only on hard questions are not labelled weak', () => {
  const s = topicStats('t', [rec({ correct: false, difficulty: 'hard' }), rec({ correct: false, difficulty: 'hard', mock: 2, source: 'mock2' })]);
  assert.equal(s.status, 'developing');
});
test('repeated errors on easy/medium questions are weak', () => {
  const s = topicStats('t', [rec({ correct: false }), rec({ correct: false, mock: 2, source: 'mock2' })]);
  assert.equal(s.status, 'weak');
});
test('accurate but slow is not strong; accurate and fast is', () => {
  assert.equal(topicStats('t', [rec({ timeSec: 200 }), rec({ timeSec: 200, mock: 2 })]).status, 'developing');
  assert.equal(topicStats('t', [rec({}), rec({ mock: 2 })]).status, 'strong');
});
test('inconsistent results across mocks are never labelled strong', () => {
  const s = topicStats('t', [rec({ difficulty: 'hard' }), rec({ difficulty: 'hard' }), rec({ mock: 2, correct: false, difficulty: 'hard' })]);
  assert.equal(s.inconsistent, true);
  assert.notEqual(s.status, 'strong');
});

console.log('Simulated students');
const runProfile = (p, overrides = {}) => {
  const atts = [1, 2].flatMap(m => mockAttempts(m, MOCKS[m].questions.map(id => QUESTIONS.find(q => q.id === id)), simulateMock(p, m)));
  const prof = buildProfile(atts);
  const student = { ...p.student, daysLeft: p.student.monthsLeft * 30, ...overrides };
  return { prof, ranking: prioritise(prof, student, PRIORITY_WEIGHTS), student };
};
const counts = rows => rows.reduce((c, r) => ((c[r.category] = (c[r.category] || 0) + 1), c), {});

for (const p of DEMO_PROFILES) {
  const { prof, ranking, student } = runProfile(p);
  const status = Object.values(prof.topics).reduce((c, t) => ((c[t.status] = (c[t.status] || 0) + 1), c), {});
  const plan = planDay(ranking.rows, student);
  console.log(`    ${p.name.padEnd(7)} score ${prof.overall.marks}/${prof.overall.maxMarks}  status ${JSON.stringify(status)}  categories ${JSON.stringify(counts(ranking.rows))}`);
  console.log(`            top 3: ${ranking.rows.slice(0, 3).map(r => `${r.topic.id}(${r.category},${r.score})`).join(', ')}  plan: ${plan.map(i => `${i.mode}:${i.minutes}`).join(' ')}`);
}

test('fast, accurate student gets speed-optimisation recommendations', () => {
  const { ranking } = runProfile(DEMO_PROFILES[0]);
  const c = counts(ranking.rows);
  assert.ok((c.speed || 0) >= 8, JSON.stringify(c));
  assert.ok(!c.concept || c.concept <= 3);
});
test('weak-fundamentals student gets concept-building in Quant/DILR at the top', () => {
  const { ranking } = runProfile(DEMO_PROFILES[1]);
  const top5 = ranking.rows.slice(0, 5);
  assert.ok(top5.filter(r => r.category === 'concept' || r.mode === 'concept').length >= 3, top5.map(r => r.category).join());
  assert.ok(top5.filter(r => r.topic.section !== 'VARC').length >= 4);
});
test('limited-time student gets a shorter, more selective plan', () => {
  const tight = runProfile(DEMO_PROFILES[2]);
  const roomy = runProfile(DEMO_PROFILES[2], { daysLeft: 180, dailyMinutes: 150 });
  const tPlan = planDay(tight.ranking.rows, tight.student);
  const rPlan = planDay(roomy.ranking.rows, roomy.student);
  assert.ok(tPlan.filter(i => i.topicId).length < rPlan.filter(i => i.topicId).length);
  assert.ok(tPlan.reduce((t, i) => t + i.minutes, 0) <= 45);
  assert.ok(tight.ranking.ctx.timeTight && !roomy.ranking.ctx.timeTight);
});
test('inconsistent student gets no confident "strong" labels and receives evidence checks', () => {
  const { prof, ranking } = runProfile(DEMO_PROFILES[3]);
  const strong = Object.values(prof.topics).filter(t => t.status === 'strong');
  assert.ok(strong.every(t => !t.inconsistent));
  assert.ok(Object.values(prof.topics).some(t => t.inconsistent));
  assert.ok(ranking.rows.some(r => r.category === 'check'));
});
test('ranking changes when time availability changes', () => {
  const a = runProfile(DEMO_PROFILES[1]).ranking.rows.map(r => r.topic.id).join();
  const b = runProfile(DEMO_PROFILES[1], { daysLeft: 20, dailyMinutes: 30 }).ranking.rows.map(r => r.topic.id).join();
  assert.notEqual(a, b);
});
test('ranking changes when performance changes (practice recalibration)', () => {
  const p = DEMO_PROFILES[1];
  const atts = [1, 2].flatMap(m => mockAttempts(m, MOCKS[m].questions.map(id => QUESTIONS.find(q => q.id === id)), simulateMock(p, m)));
  const student = { ...p.student, daysLeft: 180 };
  const before = prioritise(buildProfile(atts), student, PRIORITY_WEIGHTS);
  const top = before.rows[0];
  const practice = LEARNING[top.topic.id].practice.map(it => ({ qid: it.id, source: 'practice', mock: null, topic: top.topic.id, difficulty: it.difficulty, type: it.type, attempted: true, correct: true, timeSec: it.expectedSec, expectedSec: it.expectedSec }));
  const after = prioritise(buildProfile([...atts, ...practice]), student, PRIORITY_WEIGHTS);
  const afterRow = after.rows.find(r => r.topic.id === top.topic.id);
  assert.ok(afterRow.score < top.score, `${top.score} -> ${afterRow.score}`);
  assert.ok(afterRow.stats.adjAccuracy > top.stats.adjAccuracy);
  // One 3-question session should not erase many mock errors, but on a 2-question topic it can lift the label.
  const small = before.rows.find(r => r.stats.status === 'weak' && r.stats.attempted === 2);
  if (small) {
    const pr = LEARNING[small.topic.id].practice.map(it => ({ qid: it.id, source: 'practice', mock: null, topic: small.topic.id, difficulty: it.difficulty, type: it.type, attempted: true, correct: true, timeSec: it.expectedSec, expectedSec: it.expectedSec }));
    assert.notEqual(buildProfile([...atts, ...pr]).topics[small.topic.id].status, 'weak');
  }
});

console.log(`\n${passed} checks passed`);
