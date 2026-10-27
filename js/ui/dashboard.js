import { SECTIONS } from '../data/topics.js';
import { esc, pct, bar, statusPill, categoryPill, modeLabel, topicName, emptyState } from './common.js';
import { whyBlock, learnHref } from './plan.js';

const STAGE = { starting: 'Just starting', beginner: 'Learning basics', intermediate: 'Practising', advanced: 'Mock-test phase' };

export function render(root, _p, { derived: d, store }) {
  const s = store.state;
  if (!s.student) { location.hash = 'start'; return; }
  const st = d.student;
  const m1 = s.mocks[1].status, m2 = s.mocks[2].status;
  const greet = st.name ? `${esc(st.name)}’s preparation` : 'Your preparation';

  const profileCard = `<div class="card stack">
    <div class="row between"><h3>Profile</h3><a class="btn ghost small" href="#start">Edit</a></div>
    <div class="grid-2" style="gap:10px">
      <div class="stat"><span class="value">${st.daysLeft}</span><span class="label">days to exam</span></div>
      <div class="stat"><span class="value">${st.dailyMinutes}</span><span class="label">minutes a day</span></div>
    </div>
    <p class="small muted">Target ${st.targetPercentile ? st.targetPercentile + ' percentile' : 'not set'} · ${STAGE[st.stage] || ''}${st.prevMock ? ` · last mock: ${esc(st.prevMock)}` : ''}</p>
  </div>`;

  if (!d.ready) {
    const next = m1 !== 'submitted' ? 1 : 2;
    root.innerHTML = `
    <div class="page">
      <div class="page-head"><p class="eyebrow">Initial profile</p><h1>${greet}</h1>
        <p>Your profile is set. Right now the plan knows your time budget and how you rate yourself, but nothing measured. The two diagnostic mocks calibrate it.</p></div>
      <div class="grid-2">
        <div class="card stack">
          <h3>Calibration</h3>
          ${[1, 2].map(n => { const ms = s.mocks[n].status; return `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><b>Diagnostic Mock ${n}</b><div class="small muted">${n === 1 ? 'Builds your first topic profile' : 'Confirms or challenges Mock 1 with new questions'}</div></div>${ms === 'submitted' ? `<a class="btn small" href="#results-${n}">View results</a>` : ms === 'in-progress' ? `<a class="btn small primary" href="#mock-${n}">Resume</a>` : n === next ? `<a class="btn small primary" href="#mock-${n}">Start</a>` : '<span class="small muted">Locked</span>'}</div>`; }).join('')}
          <p class="small muted">About 45 minutes each. You can pause and come back.</p>
        </div>
        ${profileCard}
      </div>
      <div class="card stack"><h3>Your self-assessment</h3><p class="small muted">Recorded for comparison with measured results. Not used to label any topic.</p>
        ${SECTIONS.map(x => `<div class="factor"><span>${x.short}</span>${bar((st.selfConfidence?.[x.id] || 0) / 5)}<span class="num">${st.selfConfidence?.[x.id] || '—'}/5</span></div>`).join('')}
      </div>
    </div>`;
    return;
  }

  const rows = d.ranking.rows;
  const top = rows[0];
  const cur = d.current;
  const plan = s.plan;
  const done = plan ? plan.items.filter(i => i.status === 'done') : [];
  const planned = plan ? plan.items.filter(i => i.status !== 'rescheduled').reduce((t, i) => t + i.minutes, 0) : 0;
  const acts = s.activities;
  const estMin = acts.reduce((t, a) => t + (a.estMinutes || 0), 0), actMin = acts.reduce((t, a) => t + (a.minutesSpent || 0), 0);
  const nextItem = plan?.items.find(i => i.status === 'pending' && i.topicId);
  const list = (cat, n = 3) => rows.filter(r => r.category === cat).slice(0, n);
  const mini = (cat, title, empty) => `<div class="card col-card"><div class="row between"><h3>${title}</h3>${categoryPill(cat)}</div>
    ${list(cat).length ? list(cat).map(r => `<div class="item"><a href="${learnHref(r)}"><b>${esc(r.topic.name)}</b></a><span class="small muted">${esc(r.reasons[0])}</span></div>`).join('') : `<p class="small muted">${empty}</p>`}</div>`;

  root.innerHTML = `
  <div class="page">
    <div class="page-head"><p class="eyebrow">Dashboard</p><h1>${greet}</h1></div>

    <div class="grid-2">
      <div class="card stack" style="border-color:var(--accent)">
        <span class="eyebrow">Next recommended action</span>
        ${nextItem ? (() => { const r = rows.find(x => x.topic.id === nextItem.topicId); return `<h2 style="font-size:var(--step-2)">${modeLabel(nextItem.mode)}: ${esc(topicName(nextItem.topicId))}</h2>
          <p class="small muted">${nextItem.minutes} minutes · from today’s plan</p>${r ? whyBlock(r) : ''}
          <div class="row"><a class="btn primary" href="#learn-${nextItem.mode}-${nextItem.topicId}" data-item="${nextItem.id}">Start now</a><a class="btn" href="#today">See today’s plan</a></div>`; })()
        : `<h2 style="font-size:var(--step-2)">${modeLabel(top.mode)}: ${esc(top.topic.name)}</h2>${whyBlock(top)}<div class="row"><a class="btn primary" href="${learnHref(top)}">Start now</a></div>`}
      </div>
      ${profileCard}
    </div>

    <div class="grid-3">
      ${SECTIONS.map(sec => { const x = d.baseline.sections.find(y => y.id === sec.id); const ts = rows.filter(r => r.topic.section === sec.id); return `<div class="card stack">
        <div class="row between"><h3>${sec.short}</h3><span class="mono">${x.marks}/${x.maxMarks}</span></div>
        <div class="factor"><span>Accuracy</span>${bar(x.accuracy ?? 0)}<span class="num">${pct(x.accuracy)}</span></div>
        <div class="row small" style="gap:6px">${['strong', 'developing', 'weak', 'insufficient'].map(k => { const c = ts.filter(r => cur.topics[r.topic.id].status === k).length; return c ? `${statusPill(k)}<span class="mono">${c}</span>` : ''; }).join(' ')}</div>
        <p class="small muted">Self-rated ${st.selfConfidence?.[sec.id] ?? '—'}/5 · measured accuracy ${pct(x.accuracy)}</p></div>`; }).join('')}
    </div>

    <div class="grid-2">
      <div class="card stack"><div class="row between"><h3>Study next</h3><a class="btn ghost small" href="#plan">Full ranking</a></div>
        ${rows.slice(0, 5).map(r => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line);flex-wrap:nowrap"><div style="min-width:0"><span class="mono muted">${r.rank}</span> <a href="${learnHref(r)}"><b>${esc(r.topic.name)}</b></a><div class="small muted">${esc(r.why.whyTopic)}</div></div><div class="row" style="flex-wrap:nowrap">${categoryPill(r.category)}<span class="mono">${r.score}</span></div></div>`).join('')}
      </div>
      <div class="card stack"><div class="row between"><h3>Today</h3><a class="btn ghost small" href="#today">Open planner</a></div>
        ${plan ? `<div class="factor"><span>${done.length}/${plan.items.length} activities</span>${bar(plan.items.length ? done.length / plan.items.length : 0, 'strong')}<span class="num">${done.reduce((t, i) => t + i.minutes, 0)}/${planned} min</span></div>
        ${plan.items.slice(0, 5).map(i => `<div class="row between small" style="padding:4px 0"><span>${i.status === 'done' ? '✓ ' : ''}${modeLabel(i.mode)}${i.topicId ? ': ' + esc(topicName(i.topicId)) : ''}</span><span class="mono muted">${i.minutes} min${i.status === 'rescheduled' ? ' · moved' : ''}</span></div>`).join('')}` : '<p class="muted small">No plan yet.</p>'}
        <hr class="divider"><div class="grid-2" style="gap:8px"><div class="stat"><span class="value">${acts.length}</span><span class="label">activities completed</span></div><div class="stat"><span class="value">${actMin}<span class="muted" style="font-size:1rem"> / ${estMin}</span></span><span class="label">minutes actual / estimated</span></div></div>
      </div>
    </div>

    <div class="grid-3">
      ${mini('quick', 'Quick wins', 'No topic currently meets a quick-win rule.')}
      ${mini('concept', 'Concept clarity needed', 'No repeated concept gaps detected.')}
      ${mini('speed', 'Strong: save time here', 'No topic meets the Strong bar yet.')}
    </div>
  </div>`;
  root.querySelectorAll('[data-item]').forEach(a => a.addEventListener('click', () => store.update(x => { x.activeItem = a.dataset.item; }, { silent: true })));
}
