import { ACTIVITY_MINUTES as AM, planShares } from '../config.js';

let seq = 0;
const newId = () => `act-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// Builds a list of activities that fits `minutes`, drawing from the ranked topics.
// `exclude` holds topic ids already covered (done today, or already scheduled).
export function planDay(rows, student, { minutes = student.dailyMinutes, exclude = new Set(), carried = [] } = {}) {
  const items = carried.map(c => ({ ...c, id: newId(), status: 'pending', carried: true }));
  const used = new Set([...exclude, ...carried.map(c => c.topicId)]);
  let remaining = minutes - carried.reduce((t, c) => t + c.minutes, 0);
  if (remaining <= 0) return items;

  const pool = cat => rows.filter(r => r.category === cat && !used.has(r.topic.id));
  const take = (r, mode, mins) => {
    used.add(r.topic.id);
    items.push({ id: newId(), topicId: r.topic.id, mode, minutes: mins, status: 'pending', score: r.score, category: r.category });
    remaining -= mins;
  };

  // 1. One evidence check first, if any topic lacks evidence: cheapest way to improve the plan itself.
  const check = pool('check')[0];
  if (check && remaining >= AM.check) take(check, 'check', AM.check);

  // 2. Split the rest by activity type; shares depend on days left.
  const shares = planShares(student.daysLeft);
  const start = remaining;
  let carry = 0;
  for (const type of ['concept', 'quick', 'speed']) {
    let budget = start * shares[type] + carry;
    const dur = AM[type];
    for (const r of pool(type)) {
      if (budget < dur * 0.6 || remaining < dur * 0.6) break;
      const mins = Math.min(dur, remaining);
      const mode = type === 'quick' ? r.mode : type;
      take(r, mode, mins);
      budget -= mins;
    }
    carry = Math.max(0, budget);
  }
  // 3. Leftover time: further activities in rank order (low-priority topics last).
  for (const r of rows.filter(r => !used.has(r.topic.id) && r.category !== 'low')) {
    const dur = AM[r.mode] || AM.quick;
    if (remaining < Math.min(dur, AM.review) + 5) break;
    take(r, r.mode, Math.min(dur, remaining));
  }
  // 4. Error-log review closes the session.
  if (remaining >= 10) {
    items.push({ id: newId(), topicId: null, mode: 'review', minutes: Math.min(AM.review, remaining), status: 'pending' });
    remaining -= Math.min(AM.review, remaining);
  }
  return items;
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Regenerates the pending part of today's plan after recalibration, keeping completed
// and rescheduled items. Returns { items, changes } so the UI can show what moved.
export function refreshToday(plan, rows, student) {
  const kept = plan.items.filter(i => i.status !== 'pending');
  const done = kept.filter(i => i.status === 'done');
  const spent = done.reduce((t, i) => t + i.minutes, 0);
  const left = Math.max(0, student.dailyMinutes - spent);
  const exclude = new Set(kept.map(i => i.topicId).filter(Boolean));
  const fresh = left > 0 ? planDay(rows, student, { minutes: left, exclude }) : [];
  const before = plan.items.filter(i => i.status === 'pending').map(i => `${i.topicId}:${i.mode}`);
  const after = fresh.map(i => `${i.topicId}:${i.mode}`);
  const changes = {
    added: fresh.filter(i => !before.includes(`${i.topicId}:${i.mode}`)),
    removed: plan.items.filter(i => i.status === 'pending' && !after.includes(`${i.topicId}:${i.mode}`)),
  };
  return { items: [...kept, ...fresh], changes };
}
