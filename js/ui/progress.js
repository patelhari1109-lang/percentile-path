import { TOPICS } from '../data/topics.js';
import { esc, pct, statusPill, modeLabel, topicName, emptyState, mins } from './common.js';

const ORDER = ['strong', 'developing', 'weak', 'insufficient'];
const COLOR = { strong: 'var(--strong)', developing: 'var(--developing)', weak: 'var(--weak)', insufficient: 'var(--unknown)' };
const RANK = { weak: 0, insufficient: 1, developing: 1, strong: 2 };

export function render(root, _p, { derived: d, store }) {
  if (!d.ready) {
    root.innerHTML = `<div class="page narrow">${emptyState('Progress tracking starts after your diagnostics', 'Your two mocks form the baseline that all later practice is compared against.', '<a class="btn primary" href="#dashboard">Go to dashboard</a>')}</div>`;
    return;
  }
  const s = store.state;
  const acts = [...s.activities].reverse();
  const practice = s.practice;
  const pCorrect = practice.filter(p => p.correct).length;
  const actMin = s.activities.reduce((t, a) => t + (a.minutesSpent || 0), 0);
  const estMin = s.activities.reduce((t, a) => t + (a.estMinutes || 0), 0);

  const movement = TOPICS.map(t => {
    const b = d.baseline.topics[t.id], c = d.current.topics[t.id];
    let flag = '';
    if (b.status === 'strong' && c.status !== 'strong') flag = '<span class="pill weak">Needs revision</span>';
    else if (RANK[c.status] > RANK[b.status] || (c.status === b.status && c.adjAccuracy - b.adjAccuracy > 0.05 && c.practice.attempted)) flag = '<span class="pill strong">Improved</span>';
    else if (c.adjAccuracy - b.adjAccuracy < -0.05) flag = '<span class="pill developing">Slipped</span>';
    else if (b.status === 'insufficient' && c.status !== 'insufficient') flag = '<span class="pill plain">Now measured</span>';
    return { t, b, c, flag };
  });
  const touched = movement.filter(m => m.c.practice.attempted);

  const snaps = s.snapshots.slice(-8);
  const snapChart = snaps.length ? `<div class="stack" style="gap:8px">${snaps.map(sn => {
    const counts = ORDER.map(k => Object.values(sn.topics).filter(x => x.status === k).length);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return `<div class="factor" style="grid-template-columns:minmax(0,180px) minmax(0,1fr) 120px"><span class="small" title="${esc(sn.label)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(sn.label)}</span>
      <div class="timeline" role="img" aria-label="${ORDER.map((k, i) => `${counts[i]} ${k}`).join(', ')}">${counts.map((c, i) => c ? `<span style="width:${(c / total) * 100}%;background:${COLOR[ORDER[i]]}"></span>` : '').join('')}</div>
      <span class="num small">${counts.join(' / ')}</span></div>`;
  }).join('')}<div class="chart-legend">${ORDER.map(k => `<span><i style="background:${COLOR[k]}"></i>${k === 'insufficient' ? 'Insufficient evidence' : k[0].toUpperCase() + k.slice(1)}</span>`).join('')}<span>Counts: strong / developing / weak / insufficient</span></div></div>` : '<p class="small muted">No snapshots yet.</p>';

  root.innerHTML = `
  <div class="page">
    <div class="page-head"><p class="eyebrow">Progress · baseline vs now</p><h1>What has changed since your diagnostics</h1>
      <p>The baseline uses only your two diagnostic mocks and never changes. “Now” adds every practice question you have answered since.</p></div>
    <div class="grid-4">
      <div class="card stat"><span class="value">${s.activities.length}</span><span class="label">Activities completed</span></div>
      <div class="card stat"><span class="value">${practice.length ? `${pCorrect}/${practice.length}` : '0'}</span><span class="label">Practice questions correct</span><span class="note">${practice.length ? pct(pCorrect / practice.length) + ' accuracy' : 'None yet'}</span></div>
      <div class="card stat"><span class="value">${actMin}<span class="muted" style="font-size:1rem"> / ${estMin}</span></span><span class="label">Minutes actual / estimated</span></div>
      <div class="card stat"><span class="value">${touched.length}</span><span class="label">Topics practised</span></div>
    </div>

    <div class="card stack"><h3>Topic labels over time</h3><p class="small muted">One row per recalibration (latest at the bottom).</p>${snapChart}</div>

    <div class="card stack"><h3>Topic movement</h3>
      ${movement.some(m => m.flag.includes('Needs revision')) ? '<p class="callout warn small">At least one previously strong topic has slipped. Its revision block has moved up your ranking.</p>' : ''}
      <div class="table-wrap"><table><thead><tr><th>Topic</th><th>Baseline</th><th class="num">Baseline acc.</th><th>Now</th><th class="num">Now acc.</th><th class="num">Practice</th><th></th></tr></thead><tbody>
      ${movement.map(m => `<tr><td>${esc(m.t.name)}</td><td>${statusPill(m.b.status)}</td><td class="num">${pct(m.b.adjAccuracy)}</td><td>${statusPill(m.c.status)}</td><td class="num">${pct(m.c.adjAccuracy)}</td><td class="num">${m.c.practice.attempted ? `${m.c.practice.correct}/${m.c.practice.attempted}` : '—'}</td><td>${m.flag}</td></tr>`).join('')}
      </tbody></table></div>
    </div>

    <div class="card stack"><h3>Activity log</h3>
      ${acts.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Activity</th><th class="num">Score</th><th class="num">Avg time</th><th class="num">Minutes (est.)</th><th>Status change</th></tr></thead><tbody>
      ${acts.map(a => `<tr><td class="small">${new Date(a.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(modeLabel(a.mode))}: ${esc(topicName(a.topicId))}${a.selfReported ? ' <span class="tag">self-reported</span>' : ''}${a.demo ? ' <span class="tag">demo</span>' : ''}</td><td class="num">${a.total ? `${a.correct}/${a.total}` : '—'}</td><td class="num">${mins(a.avgTimeSec)}</td><td class="num">${a.minutesSpent} (${a.estMinutes})</td><td>${a.statusBefore && a.statusAfter ? `${statusPill(a.statusBefore)} → ${statusPill(a.statusAfter)}` : '—'}</td></tr>`).join('')}
      </tbody></table></div>` : emptyState('No activities yet', 'Start the first item in today’s plan. Each completed activity updates your topic profile and appears here.', '<a class="btn primary" href="#today">Open today’s plan</a>')}
    </div>
  </div>`;
}
