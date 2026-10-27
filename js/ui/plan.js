import { SECTIONS } from '../data/topics.js';
import { WEIGHT_LABELS } from '../config.js';
import { CATEGORY_LABEL } from '../engine/priority.js';
import { esc, pct, statusPill, categoryPill, bar, round1, emptyState, modeLabel } from './common.js';

export const learnHref = r => `#learn-${r.mode}-${r.topic.id}`;

export function whyBlock(r) {
  return `<div class="why"><div><b>Why this topic?</b>${esc(r.why.whyTopic)}</div><div><b>Why now?</b>${esc(r.why.whyNow)}</div><div><b>What next?</b>${esc(r.why.next)}</div></div>`;
}

export function factorBlock(r) {
  const keys = Object.keys(WEIGHT_LABELS);
  return `<div class="stack" style="gap:6px;margin-top:12px">
    ${keys.map(k => `<div class="factor"><span>${WEIGHT_LABELS[k]} <span class="muted">× ${r.weightsUsed[k].toFixed(2)}</span></span>${bar(r.factors[k])}<span class="num">${r.factors[k].toFixed(2)}</span></div>`).join('')}
    <p class="small muted">Score = weighted average of the factors (0–1) × evidence confidence (${r.confidenceFactor.toFixed(2)})${r.feasibility < 1 ? ` × time feasibility (${r.feasibility})` : ''}${r.category === 'low' ? ' × low-priority damping (0.6)' : ''} × 100 = <b class="mono">${r.score}</b>. Rule applied: ${esc(r.rule)}.</p>
  </div>`;
}

export function topicRow(r, { detail = true } = {}) {
  const s = r.stats;
  return `<div class="topic-row">
    <span class="rank">${r.rank}</span>
    <div style="min-width:0">
      <div class="row" style="gap:8px"><b>${esc(r.topic.name)}</b>${categoryPill(r.category)}${statusPill(s.status)}<span class="tag">${r.topic.section === 'QA' ? 'Quant' : r.topic.section}</span></div>
      <p class="small muted" style="margin-top:4px">${s.correct}/${s.attempted} correct · adjusted ${pct(s.adjAccuracy)} · ${s.speedRatio ? s.speedRatio.toFixed(1) + '× time' : 'no timing data'} · ~${r.topic.qPerPaper} Qs/paper (assumed) · est. ${r.hours} h · ${s.confidenceLabel.toLowerCase()} confidence</p>
      ${whyBlock(r)}
      ${detail ? `<details class="disclose" style="margin-top:10px"><summary class="small"><b>Score breakdown and evidence</b></summary>${factorBlock(r)}<ul class="small muted" style="margin:8px 0 0;padding-left:16px">${s.evidence.concat(r.reasons.slice(1)).map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>` : ''}
      <div class="row" style="margin-top:10px"><a class="btn small ${r.rank <= 3 ? 'primary' : ''}" href="${learnHref(r)}">${modeLabel(r.mode)}</a></div>
    </div>
    <div class="score-badge">${r.score}<small>priority</small></div>
  </div>`;
}

export function render(root, _p, { derived: d, store }) {
  if (!d.ranking) {
    root.innerHTML = `<div class="page narrow">${emptyState('Your plan appears after both diagnostic mocks', 'Ranking topics on one mock would over-react to single questions. Finish both mocks and the plan is generated automatically.', `<a class="btn primary" href="${store.state.student ? (store.state.mocks[1].status === 'submitted' ? '#mock-2' : '#mock-1') : '#start'}">Continue</a>`)}</div>`;
    return;
  }
  const { rows, ctx } = d.ranking;
  const st = store.state;
  const f = { section: 'all', time: 'all', category: 'all', ...(st.planFilter || {}) };
  const byCat = c => rows.filter(r => r.category === c);

  root.innerHTML = `
  <div class="page">
    <div class="page-head">
      <p class="eyebrow">Topic prioritisation · ${ctx.daysLeft} days left · ${d.student.dailyMinutes} min/day · about ${Math.round(ctx.hoursLeft)} study hours</p>
      <h1>Where your next hour does the most</h1>
      <p>Ranked by expected improvement per hour of study, not by how many topics you finish. ${ctx.timeTight ? 'Your timeline is tight, so efficiency is weighted more heavily and long concept builds are discounted.' : 'With your timeline, concept gaps in high-relevance topics still pay off.'}</p>
    </div>

    <div class="grid-3">
      ${catColumn('quick', 'Quick wins', 'Evidence says a short, focused effort should pay off here.', byCat('quick'))}
      ${catColumn('concept', 'High-priority concept building', 'Repeated errors in topics the exam tests often. Build the concept before speed.', byCat('concept'))}
      ${catColumn('speed', 'Strong-topic speed optimisation', 'Already accurate. Faster methods free time for the rest of the paper.', byCat('speed'))}
    </div>
    ${byCat('check').length || byCat('low').length ? `<div class="grid-2">
      ${byCat('check').length ? `<div class="card stack"><div class="row between"><h3>Needs more evidence</h3>${categoryPill('check')}</div><p class="small muted">Too few attempted questions to judge. A 3-question check (about 10 minutes) settles it before you invest more time.</p>${byCat('check').map(r => `<div class="row between"><span>${esc(r.topic.name)}</span><a class="btn small" href="${learnHref(r)}">Take check</a></div>`).join('')}</div>` : ''}
      ${byCat('low').length ? `<div class="card stack"><div class="row between"><h3>Deprioritised for now</h3>${categoryPill('low')}</div><p class="small muted">Weak, but low exam relevance and high effort given your remaining time. Not abandoned: revisit if time allows.</p>${byCat('low').map(r => `<div class="row between"><span>${esc(r.topic.name)}</span><span class="small muted mono">~${r.topic.qPerPaper} Qs · ${r.hours} h</span></div>`).join('')}</div>` : ''}
    </div>` : ''}

    <section class="stack">
      <div class="row between"><h2>Full ranking</h2><a class="btn ghost small" href="#method">Adjust weights</a></div>
      <form class="filters card" id="filters" aria-label="Filter the ranking">
        <div class="field"><label for="f-section">Section</label><select id="f-section" name="section"><option value="all">All sections</option>${SECTIONS.map(s => `<option value="${s.id}" ${f.section === s.id ? 'selected' : ''}>${s.short}</option>`).join('')}</select></div>
        <div class="field"><label for="f-time">Time required</label><select id="f-time" name="time">${[['all', 'Any'], ['short', 'Up to 1 h'], ['mid', '1–3 h'], ['long', 'Over 3 h']].map(([v, l]) => `<option value="${v}" ${f.time === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="f-cat">Priority type</label><select id="f-cat" name="category"><option value="all">All</option>${Object.entries(CATEGORY_LABEL).map(([k, l]) => `<option value="${k}" ${f.category === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <span class="small muted" id="count" style="padding-bottom:10px"></span>
      </form>
      <div class="card" id="ranked" style="padding-block:4px"></div>
    </section>
  </div>`;

  const draw = () => {
    const list = rows.filter(r => (f.section === 'all' || r.topic.section === f.section)
      && (f.category === 'all' || r.category === f.category)
      && (f.time === 'all' || (f.time === 'short' ? r.hours <= 1 : f.time === 'mid' ? r.hours > 1 && r.hours <= 3 : r.hours > 3)));
    root.querySelector('#count').textContent = `${list.length} of ${rows.length} topics`;
    root.querySelector('#ranked').innerHTML = list.length ? list.map(r => topicRow(r)).join('') : '<p class="muted" style="padding:16px 0">No topics match these filters.</p>';
  };
  root.querySelector('#filters').addEventListener('change', e => {
    f[e.target.name] = e.target.value;
    store.update(x => { x.planFilter = { ...f }; }, { silent: true });
    draw();
  });
  draw();
}

function catColumn(cat, title, blurb, list) {
  return `<div class="card col-card"><div class="row between"><h3>${title}</h3><span class="mono muted">${list.length}</span></div>
    <p class="small muted">${blurb}</p>
    ${list.length ? list.slice(0, 4).map(r => `<div class="item"><div class="row between"><a href="${learnHref(r)}"><b>${esc(r.topic.name)}</b></a><span class="mono small">${r.score}</span></div><span class="small muted">${esc(r.reasons[0])}</span><span class="small mono muted">est. ${r.hours} h · up to ~${round1(r.expMarks)} marks/paper (estimate)</span></div>`).join('') + (list.length > 4 ? `<p class="small muted" style="padding-top:8px">+${list.length - 4} more in the full ranking</p>` : '')
      : `<p class="small muted" style="padding-top:8px">${cat === 'speed' ? 'No topic meets the Strong bar yet. Speed work starts once accuracy is reliable.' : cat === 'concept' ? 'No topic shows a repeated concept gap.' : 'No topic currently meets a quick-win rule.'}</p>`}
  </div>`;
}
