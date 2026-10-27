// Single source of truth for the student's data, persisted to localStorage.
import { QUESTIONS, MOCKS } from './data/mocks.js';
import { PRACTICE_BY_ID } from './data/learning.js';
import { PRIORITY_WEIGHTS } from './config.js';
import { mockAttempts } from './engine/scoring.js';
import { buildProfile } from './engine/diagnostic.js';
import { prioritise } from './engine/priority.js';
import { planDay, refreshToday, todayKey } from './engine/planner.js';
import { DEMO_PROFILES, simulateMock } from './engine/demo.js';

const KEY = 'cat-compass/v1';
const DAY = 86400000;

export function emptyMock() {
  return { status: 'not-started', current: 0, answers: {}, marked: {}, timeSpent: {}, confidence: {}, visited: {}, elapsed: 0 };
}
function emptyState() {
  return { version: 1, isDemo: false, demo: null, student: null, mocks: { 1: emptyMock(), 2: emptyMock() }, practice: [], activities: [], plan: null, tomorrow: [], weights: null, snapshots: [], notice: null };
}

let memoryOnly = false;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch { memoryOnly = true; }
  return emptyState();
}

export const store = {
  state: load(),
  listeners: new Set(),
  get persistent() { return !memoryOnly; },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { memoryOnly = true; }
    cache = null;
  },
  update(fn, { silent = false } = {}) {
    fn(this.state);
    this.save();
    if (!silent) this.listeners.forEach(l => l());
  },
  reset() { this.state = emptyState(); this.save(); this.listeners.forEach(l => l()); },
};

export function daysLeft(student) {
  if (!student) return 0;
  return Math.max(1, Math.round((new Date(student.examDate) - new Date(todayKey())) / DAY));
}

// ---------- derived data (memoised until the next save) ----------
let cache = null;
export function derived() {
  if (cache) return cache;
  const s = store.state;
  const mockAtt = [1, 2].flatMap(m => (s.mocks[m].status === 'submitted'
    ? mockAttempts(m, MOCKS[m].questions.map(id => QUESTIONS.find(q => q.id === id)), s.mocks[m]) : []));
  const all = [...mockAtt, ...s.practice];
  const student = s.student ? { ...s.student, daysLeft: daysLeft(s.student) } : null;
  const baseline = mockAtt.length ? buildProfile(mockAtt) : null;
  const current = mockAtt.length ? buildProfile(all) : null;
  const ready = s.mocks[1].status === 'submitted' && s.mocks[2].status === 'submitted';
  const ranking = ready && student ? prioritise(current, student, s.weights || PRIORITY_WEIGHTS) : null;
  cache = { mockAtt, all, student, baseline, current, ranking, ready };
  return cache;
}

export function mockAttemptsFor(m) {
  return derived().mockAtt.filter(a => a.mock === m);
}

// ---------- plan maintenance ----------
export function ensurePlan() {
  const d = derived();
  if (!d.ranking) return;
  const s = store.state;
  const today = todayKey();
  if (s.plan && s.plan.date === today) return;
  const carried = s.plan && s.plan.date < today ? (s.tomorrow || []) : [];
  store.update(st => {
    st.plan = { date: today, items: planDay(d.ranking.rows, d.student, { carried }) };
    st.tomorrow = [];
  }, { silent: true });
}

export function recalibrate(reason) {
  const before = derived();
  const prevRanks = Object.fromEntries((before.ranking?.rows || []).map(r => [r.topic.id, { rank: r.rank, category: r.category }]));
  store.save(); // invalidates the cache
  const d = derived();
  if (!d.ranking) return null;
  let changes = null;
  store.update(st => {
    if (st.plan) {
      const res = refreshToday(st.plan, d.ranking.rows, d.student);
      st.plan.items = res.items;
      changes = res.changes;
    }
    st.snapshots.push(snapshot(d.current, reason));
  }, { silent: true });
  return { prevRanks, changes };
}

function snapshot(profile, label) {
  return { at: Date.now(), label, topics: Object.fromEntries(Object.entries(profile.topics).map(([k, v]) => [k, { status: v.status, acc: Math.round(v.adjAccuracy * 100) }])) };
}

// Records practice answers. Re-answering the same practice item replaces the earlier record,
// so repeating an activity cannot inflate the evidence.
export function recordPractice(records) {
  store.update(st => {
    const ids = new Set(records.map(r => r.qid));
    st.practice = st.practice.filter(p => !ids.has(p.qid)).concat(records);
  }, { silent: true });
}

export function practiceRecord(item, response, timeSec, correct, attempted, mode) {
  const p = PRACTICE_BY_ID[item.id];
  return {
    qid: item.id, source: 'practice', mock: null, mode, section: null, topic: p.topic, difficulty: p.difficulty, type: p.type,
    setId: null, attempted, correct, marks: 0, timeSec: Math.round(timeSec), expectedSec: p.expectedSec, marked: false, confidence: null, at: Date.now(),
  };
}

// ---------- demo mode ----------
export function loadDemo(profileId) {
  const p = DEMO_PROFILES.find(x => x.id === profileId);
  const exam = new Date(Date.now() + p.student.monthsLeft * 30 * DAY).toISOString().slice(0, 10);
  store.state = {
    ...emptyState(),
    isDemo: true, demo: { id: p.id, name: p.name, label: p.label },
    student: { name: p.name, ...p.student, examDate: exam, createdAt: Date.now() },
    mocks: { 1: simulateMock(p, 1), 2: simulateMock(p, 2) },
  };
  store.save();
  const d = derived();
  store.update(st => { st.snapshots.push(snapshot(d.baseline, 'Diagnostic baseline')); }, { silent: true });
  ensurePlan();
  store.listeners.forEach(l => l());
}

export { DEMO_PROFILES };
