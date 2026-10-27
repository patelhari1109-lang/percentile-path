import { recalibrate, derived } from '../store.js';
import { planDay, refreshToday } from '../engine/planner.js';
import { planShares } from '../config.js';
import { esc, modeLabel, topicName, categoryPill, emptyState, toast } from './common.js';

export function render(root, _p, { derived: d, store }) {
  if (!d.ranking) {
    root.innerHTML = `<div class="page narrow">${emptyState('Your daily plan starts after the diagnostics', 'The planner allocates your daily minutes using your diagnostic results, so it needs both mocks first.', '<a class="btn primary" href="#dashboard">Go to dashboard</a>')}</div>`;
    return;
  }
  const s = store.state;
  const plan = s.plan;
  const rows = d.ranking.rows;
  const rowOf = id => rows.find(r => r.topic.id === id);
  const student = d.student;
  const shares = planShares(student.daysLeft);
  const active = plan.items.filter(i => i.status !== 'rescheduled');
  const total = active.reduce((t, i) => t + i.minutes, 0);
  const doneMin = plan.items.filter(i => i.status === 'done').reduce((t, i) => t + i.minutes, 0);
  const tomorrowPreview = [...(s.tomorrow || []), ...planDay(rows, student, { minutes: Math.max(0, student.dailyMinutes - (s.tomorrow || []).reduce((t, i) => t + i.minutes, 0)), exclude: new Set([...plan.items.map(i => i.topicId), ...(s.tomorrow || []).map(i => i.topicId)].filter(Boolean)) })];

  const itemRow = i => {
    const r = i.topicId ? rowOf(i.topicId) : null;
    const href = i.topicId ? `#learn-${i.mode}-${i.topicId}` : '#results-2';
    return `<div class="plan-item ${i.status}">
      <span class="mins">${i.minutes}<span class="small muted"> min</span></span>
      <div style="min-width:0">
        <div class="row" style="gap:8px"><b class="title">${esc(modeLabel(i.mode))}${i.topicId ? ': ' + esc(topicName(i.topicId)) : ''}</b>${r ? categoryPill(r.category) : ''}${i.carried ? '<span class="tag">moved from yesterday</span>' : ''}${i.status === 'done' ? '<span class="pill strong">Done</span>' : ''}${i.status === 'rescheduled' ? '<span class="pill insufficient">Moved to tomorrow</span>' : ''}</div>
        <p class="small muted" style="margin-top:4px">${r ? esc(r.why.whyTopic) : 'Re-read the explanations for every question you got wrong in the mocks and note the step where your method broke. Patterns here feed the next concept block.'}</p>
        ${i.status === 'done' && i.actualMinutes ? `<p class="small mono muted">Actual ${i.actualMinutes} min vs planned ${i.minutes}</p>` : ''}
      </div>
      <div class="actions">${i.status === 'pending' ? `<a class="btn small primary" href="${href}" data-start="${i.id}">Start</a><button class="btn small" data-done="${i.id}">Mark complete</button><button class="btn small ghost" data-move="${i.id}">Tomorrow</button>` : i.status === 'rescheduled' ? `<button class="btn small ghost" data-undo="${i.id}">Bring back</button>` : ''}</div>
    </div>`;
  };

  root.innerHTML = `
  <div class="page narrow">
    <div class="page-head">
      <p class="eyebrow">Daily planner · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1>Today: ${student.dailyMinutes} minutes</h1>
      <p>With ${student.daysLeft} days left, time is split roughly ${Math.round(shares.concept * 100)}% concept building, ${Math.round(shares.quick * 100)}% quick wins, ${Math.round(shares.speed * 100)}% speed work and ${Math.round(shares.review * 100)}% review. Strong topics get short speed sessions only. Topics are drawn from your live ranking.</p>
    </div>
    <div class="card stack">
      <div class="row between"><span class="small"><b class="mono">${doneMin}</b> of <b class="mono">${total}</b> planned minutes done</span><span class="small muted">${student.dailyMinutes - total > 0 ? `${student.dailyMinutes - total} min unallocated` : ''}</span></div>
      <div class="timeline" role="img" aria-label="Plan timeline">${active.map(i => `<span class="t-${i.mode} ${i.status === 'done' ? 't-done' : ''}" style="width:${(i.minutes / Math.max(total, student.dailyMinutes)) * 100}%" title="${esc(modeLabel(i.mode))} ${i.minutes} min"></span>`).join('')}</div>
      <div class="chart-legend"><span><i style="background:var(--weak)"></i>Concept</span><span><i style="background:var(--developing)"></i>Quick win</span><span><i style="background:var(--strong)"></i>Speed</span><span><i style="background:var(--unknown)"></i>Evidence check</span><span><i style="background:var(--muted)"></i>Review</span></div>
    </div>
    <div id="notice"></div>
    <div class="card" style="padding-block:4px">${plan.items.length ? plan.items.map(itemRow).join('') : '<p class="muted" style="padding:16px 0">Nothing planned. Regenerate to build today’s plan.</p>'}</div>
    <div class="row"><button class="btn" id="regen">Rebuild remaining plan from latest ranking</button><a class="btn ghost" href="#start">Change daily time</a></div>
    <div class="card stack"><div class="row between"><h3>Tomorrow (preview)</h3><span class="small muted">Recalculated after each activity</span></div>
      ${tomorrowPreview.length ? tomorrowPreview.map(i => `<div class="row between small" style="padding:4px 0;border-bottom:1px solid var(--line)"><span>${esc(modeLabel(i.mode))}${i.topicId ? ': ' + esc(topicName(i.topicId)) : ''}${(s.tomorrow || []).some(t => t.topicId === i.topicId && t.mode === i.mode) ? ' <span class="tag">moved from today</span>' : ''}</span><span class="mono muted">${i.minutes} min</span></div>`).join('') : '<p class="small muted">Nothing yet.</p>'}
    </div>
  </div>`;

  const notice = msg => { root.querySelector('#notice').innerHTML = `<p class="callout small" role="status">${esc(msg)}</p>`; };

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-done],[data-move],[data-undo],[data-start],#regen');
    if (!t) return;
    if (t.dataset.start) { store.update(x => { x.activeItem = t.dataset.start; }, { silent: true }); return; }
    if (t.id === 'regen') {
      store.update(x => { x.plan.items = refreshToday(x.plan, derived().ranking.rows, d.student).items; });
      toast('Remaining plan rebuilt from your latest ranking');
      return;
    }
    if (t.dataset.done) {
      store.update(x => {
        const it = x.plan.items.find(i => i.id === t.dataset.done);
        it.status = 'done'; it.selfReported = true;
        if (it.topicId) x.activities.push({ id: `a${Date.now()}`, topicId: it.topicId, mode: it.mode, at: Date.now(), minutesSpent: it.minutes, estMinutes: it.minutes, correct: null, total: null, selfReported: true });
      }, { silent: true });
      recalibrate('Marked complete');
      store.update(() => {});
      toast('Marked complete. Self-reported completions do not change topic accuracy.');
      return;
    }
    if (t.dataset.move) {
      let moved;
      store.update(x => {
        const it = x.plan.items.find(i => i.id === t.dataset.move);
        it.status = 'rescheduled'; moved = it;
        x.tomorrow = [...(x.tomorrow || []), { topicId: it.topicId, mode: it.mode, minutes: it.minutes }];
      });
      toast(`Moved to tomorrow. Today now has ${store.state.plan.items.filter(i => i.status !== 'rescheduled').reduce((a, i) => a + i.minutes, 0)} planned minutes.`);
      return;
    }
    if (t.dataset.undo) {
      store.update(x => {
        const it = x.plan.items.find(i => i.id === t.dataset.undo);
        it.status = 'pending';
        const idx = (x.tomorrow || []).findIndex(i => i.topicId === it.topicId && i.mode === it.mode);
        if (idx >= 0) x.tomorrow.splice(idx, 1);
      });
    }
  });
  if (s.notice) { notice(s.notice); store.update(x => { x.notice = null; }, { silent: true }); }
}
