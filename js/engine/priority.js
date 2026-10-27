import { PRIORITY_WEIGHTS, DIAGNOSTIC as D } from '../config.js';
import { TOPICS, DEPENDENTS } from '../data/topics.js';

const clamp01 = x => Math.max(0, Math.min(1, x));
const round1 = x => Math.round(x * 10) / 10;

// Target accuracy a focused study block can realistically reach, by current status.
const TARGET = { weak: 0.6, developing: 0.75, strong: 0.85, insufficient: 0.6 };

// Decide the learning mode and category for one topic from its measured stats.
export function categorise(topic, s, ctx) {
  const reasons = [];
  const relevanceNorm = topic.qPerPaper / ctx.maxRelevance;
  const prereqNorm = DEPENDENTS[topic.id].length / ctx.maxDependents;

  if (s.status === 'insufficient') {
    reasons.push(`Only ${s.attempted} attempted question${s.attempted === 1 ? '' : 's'} on this topic, which is too few to judge.`);
    return { category: 'check', mode: 'check', reasons, rule: 'Fewer than 2 attempted questions' };
  }
  if (s.status === 'strong') {
    reasons.push(`Accurate (${Math.round(s.adjAccuracy * 100)}% adjusted) at ${s.speedRatio ? s.speedRatio.toFixed(1) + '×' : 'normal'} expected time.`);
    return { category: 'speed', mode: 'speed', reasons, rule: 'Strong: accuracy ≥ 70% and time ≤ 1.25× expected' };
  }
  // Quick-win rules. Each must be supported by evidence, not by topic weightage alone.
  if (s.adjAccuracy >= 0.6 && s.slow) {
    reasons.push(`You get these right (${s.correct}/${s.attempted}) but take ${s.speedRatio.toFixed(1)}× the expected time. A method upgrade can recover time.`);
    return { category: 'quick', mode: 'quick', reasons, rule: 'Quick win: accurate but slow' };
  }
  if (s.status === 'developing' && s.adjAccuracy >= 0.45 && topic.conceptHours * 0.4 <= 2 && relevanceNorm >= 0.4) {
    reasons.push(`Close to consistent: ${s.correct}/${s.attempted} correct, and a short refresher (about ${round1(topic.conceptHours * 0.4)} h) addresses a frequently tested topic.`);
    return { category: 'quick', mode: 'quick', reasons, rule: 'Quick win: close to consistent accuracy, short refresher' };
  }
  if (s.status !== 'strong' && prereqNorm >= 0.5 && topic.conceptHours <= 3) {
    reasons.push(`Unlocks ${DEPENDENTS[topic.id].length} other topic${DEPENDENTS[topic.id].length > 1 ? 's' : ''} and needs only about ${topic.conceptHours} h.`);
    return { category: 'quick', mode: s.status === 'weak' ? 'concept' : 'quick', reasons, rule: 'Quick win: cheap prerequisite that unlocks other topics' };
  }
  if (s.status === 'weak') {
    reasons.push(`Repeated errors (${s.wrong} wrong, ${s.wrongNonHard} on easy or medium questions) point to a concept gap.`);
    const lowValue = relevanceNorm < 0.35 && topic.conceptHours >= 4;
    if (lowValue && ctx.timeTight) {
      reasons.push(`It carries about ${topic.qPerPaper} questions per paper and needs about ${topic.conceptHours} h, which is costly with ${ctx.daysLeft} days left.`);
      return { category: 'low', mode: 'concept', reasons, rule: 'Low priority: low relevance, high effort, limited time' };
    }
    return { category: 'concept', mode: 'concept', reasons, rule: 'Concept building: weak with repeated errors' };
  }
  reasons.push(`Mixed results (${s.correct}/${s.attempted} correct${s.inconsistent ? ', and Mock 1 and Mock 2 disagree' : ''}).`);
  return { category: 'concept', mode: 'concept', reasons, rule: 'Developing: mixed or inconsistent results' };
}

export function hoursNeeded(topic, s, mode) {
  if (mode === 'check') return 0.25;
  if (mode === 'speed') return topic.speedHours;
  if (mode === 'quick') return s.slow && s.adjAccuracy >= 0.6 ? topic.speedHours : round1(topic.conceptHours * 0.4);
  return round1(topic.conceptHours * (s.status === 'weak' ? 1 : 0.6));
}

// Main entry: rank every topic. Returns rows sorted by priority score (desc).
export function prioritise(profile, student, weights = PRIORITY_WEIGHTS) {
  const daysLeft = student.daysLeft;
  const hoursLeft = daysLeft * student.dailyMinutes / 60;
  const ctx = {
    daysLeft, hoursLeft,
    timeTight: daysLeft < 45 || hoursLeft < 60,
    maxRelevance: Math.max(...TOPICS.map(t => t.qPerPaper)),
    maxDependents: Math.max(1, ...TOPICS.map(t => DEPENDENTS[t.id].length)),
  };
  // Tighter timelines shift weight from gap-closing towards efficiency.
  const w = { ...weights };
  if (ctx.timeTight) { w.efficiency += 0.1; w.gap = Math.max(0, w.gap - 0.05); w.prerequisite = Math.max(0, w.prerequisite - 0.05); }
  const wSum = Object.values(w).reduce((a, b) => a + b, 0);

  const rows = TOPICS.map(topic => {
    const s = profile.topics[topic.id];
    const cat = categorise(topic, s, ctx);
    const acc = s.status === 'insufficient' ? 0.5 : s.adjAccuracy;
    const accGain = Math.max(0, TARGET[s.status] - acc);
    const speedGap = s.speedRatio ? clamp01(s.speedRatio - 1) : 0;
    const hours = hoursNeeded(topic, s, cat.mode);
    // Expected marks per paper: questions × 3 marks × achievable accuracy gain,
    // plus a small allowance for time recovered (a slow solver attempts fewer questions).
    const expMarks = topic.qPerPaper * 3 * accGain + topic.qPerPaper * 3 * 0.15 * speedGap;
    const minutesSaved = s.speedRatio && s.speedRatio > 1 && s.avgTimeSec
      ? topic.qPerPaper * (s.avgTimeSec - s.avgTimeSec / s.speedRatio) * 0.5 / 60 : 0;
    return { topic, stats: s, ...cat, hours, accGain, speedGap, expMarks, minutesSaved, gainPerHour: expMarks / hours };
  });

  const maxGPH = Math.max(...rows.map(r => r.gainPerHour), 0.0001);
  for (const r of rows) {
    const s = r.stats;
    const f = {
      relevance: r.topic.qPerPaper / ctx.maxRelevance,
      gap: s.status === 'insufficient' ? 0.5 : 1 - s.adjAccuracy,
      improvement: clamp01(r.accGain / 0.5 + 0.5 * r.speedGap),
      efficiency: r.gainPerHour / maxGPH,
      // A prerequisite only matters when the student is not yet secure in it.
      prerequisite: (DEPENDENTS[r.topic.id].length / ctx.maxDependents) * (s.status === 'strong' ? 0.3 : 1),
    };
    let feasibility = 1;
    if (r.hours > 0.08 * hoursLeft) { feasibility = 0.6; r.reasons.push(`Needs about ${r.hours} h, more than 8% of the ${Math.round(hoursLeft)} study hours you have left.`); }
    const confidenceFactor = s.status === 'insufficient' ? 0.85 : 0.6 + 0.4 * s.confidence;
    const base = Object.keys(w).reduce((t, k) => t + w[k] * f[k], 0) / wSum;
    r.factors = f;
    r.weightsUsed = w;
    r.feasibility = feasibility;
    r.confidenceFactor = confidenceFactor;
    r.score = Math.round(100 * base * confidenceFactor * feasibility * (r.category === 'low' ? 0.6 : 1));
    r.why = whyText(r);
  }
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return { rows, ctx, weights: w };
}

function whyText(r) {
  const t = r.topic, s = r.stats;
  const whyTopic = r.reasons[0];
  let whyNow;
  if (r.category === 'check') whyNow = 'A 10-minute check now prevents the plan from being built on a guess.';
  else if (r.category === 'speed') whyNow = `Accuracy is already there; ${r.minutesSaved > 0.2 ? `faster methods could save roughly ${round1(r.minutesSaved)} min per paper` : 'faster methods free time for harder sections'} (estimate).`;
  else if (r.category === 'low') whyNow = 'With limited time, other topics give more expected improvement per hour. Revisit if time allows.';
  else whyNow = `About ${t.qPerPaper} questions per paper (assumed) and an estimated ${round1(r.expMarks)} marks of headroom per paper for about ${r.hours} h of study. Estimates, not guarantees.`;
  const next = {
    check: 'Take the 3-question evidence check.',
    speed: 'Open Solve Faster and run the timed challenge.',
    quick: 'Open the Quick Win: a short refresher and 3 targeted questions.',
    concept: 'Open Build Concept Clarity: prerequisite check, worked example, then guided practice.',
    low: 'Park it for now; do a light concept pass only if time allows.',
  }[r.category];
  return { whyTopic, whyNow, next, uncertainty: `${s.confidenceLabel} confidence (${s.attempted} attempted question${s.attempted === 1 ? '' : 's'}${s.inconsistent ? ', inconsistent across mocks' : ''}).` };
}

export const CATEGORY_LABEL = {
  quick: 'Quick win', concept: 'Concept building', speed: 'Speed optimisation', check: 'Needs evidence', low: 'Low priority',
};
export const MODE_LABEL = { concept: 'Build Concept Clarity', speed: 'Solve Faster', quick: 'Quick Win', check: 'Evidence check' };
export const STATUS_LABEL = { strong: 'Strong', developing: 'Developing', weak: 'Weak', insufficient: 'Insufficient evidence' };
