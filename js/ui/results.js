import { QUESTIONS, MOCKS, PASSAGES, SETS } from '../data/mocks.js';
import { mockAttemptsFor } from '../store.js';
import { buildProfile } from '../engine/diagnostic.js';
import { esc, pct, mins, statusPill, topicName, questionBody, contextBlock, LETTERS, emptyState } from './common.js';
import { TOPICS } from '../data/topics.js';

const SECTION_NAME = { VARC: 'VARC', DILR: 'DILR', QA: 'Quant' };

export function render(root, { mock: n }, { store }) {
  const st = store.state.mocks[n];
  if (st.status !== 'submitted') {
    root.innerHTML = `<div class="page narrow">${emptyState(`Mock ${n} not submitted yet`, 'Results appear here once you submit the mock.', `<a class="btn primary" href="#mock-${n}">Go to Mock ${n}</a>`)}</div>`;
    return;
  }
  const atts = mockAttemptsFor(n);
  const prof = buildProfile(atts);
  const o = prof.overall;
  const qById = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
  const other = n === 1 ? store.state.mocks[2].status : null;

  const filters = [['all', 'All'], ['wrong', 'Incorrect'], ['skipped', 'Unattempted'], ['right', 'Correct'], ['marked', 'Marked for review']];
  let filter = 'all';

  root.innerHTML = `
  <div class="page">
    <div class="page-head">
      <p class="eyebrow">${MOCKS[n].name} · results${st.autoSubmitted ? ' · auto-submitted when time ran out' : ''}</p>
      <h1>${o.marks} <span class="muted" style="font-weight:500">/ ${o.maxMarks} marks</span></h1>
      <p>${o.correct} correct, ${o.wrong} incorrect, ${o.skipped} unattempted. Negative marking cost you ${Math.abs(o.negative)} mark${Math.abs(o.negative) === 1 ? '' : 's'}.</p>
    </div>
    <div class="grid-4">
      <div class="card stat"><span class="value">${pct(o.accuracy)}</span><span class="label">Accuracy (of attempted)</span></div>
      <div class="card stat"><span class="value">${pct(o.attemptRate)}</span><span class="label">Attempt rate</span></div>
      <div class="card stat"><span class="value">${mins(o.avgTimeSec)}</span><span class="label">Average time per attempt</span></div>
      <div class="card stat"><span class="value">${Math.round(st.elapsed / 60)} min</span><span class="label">Time used of 45</span></div>
    </div>

    <div class="grid-2">
      <div class="card stack"><h3>By section</h3>
        <div class="table-wrap"><table><thead><tr><th>Section</th><th class="num">Marks</th><th class="num">Correct</th><th class="num">Wrong</th><th class="num">Skipped</th><th class="num">Accuracy</th></tr></thead><tbody>
        ${prof.sections.map(s => `<tr><td>${s.short}</td><td class="num">${s.marks}</td><td class="num">${s.correct}</td><td class="num">${s.wrong}</td><td class="num">${s.skipped}</td><td class="num">${pct(s.accuracy)}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
      <div class="card stack"><h3>By difficulty</h3>
        <div class="table-wrap"><table><thead><tr><th>Difficulty</th><th class="num">Attempted</th><th class="num">Accuracy</th><th class="num">Avg time</th></tr></thead><tbody>
        ${prof.difficulty.map(d => `<tr><td style="text-transform:capitalize">${d.difficulty}</td><td class="num">${d.attempted}/${d.total}</td><td class="num">${pct(d.accuracy)}</td><td class="num">${mins(d.avgTimeSec)}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
    </div>

    <div class="card stack"><h3>DILR sets</h3>
      <p class="small muted">Sets are judged as units: which you chose, how long you stayed, and how much of each you solved.</p>
      <div class="table-wrap"><table><thead><tr><th>Set</th><th>Difficulty</th><th class="num">Solved</th><th class="num">Time spent</th><th class="num">Expected</th><th>Outcome</th></tr></thead><tbody>
      ${prof.sets.map(s => `<tr><td>${esc(s.title)}</td><td style="text-transform:capitalize">${s.difficulty}</td><td class="num">${s.correct}/${s.total}</td><td class="num">${mins(s.spentSec)}</td><td class="num">${mins(s.expectedSec)}</td><td>${esc(s.verdict)}</td></tr>`).join('')}
      </tbody></table></div>
      ${prof.setInsights.map(t => `<p class="callout info small">${esc(t)}</p>`).join('')}
    </div>

    ${n === 1 ? `<div class="card stack"><div class="row between"><h3>Preliminary topic picture</h3><span class="pill insufficient plain">Mock 1 only</span></div>
      <p class="small muted">Most topics have only one or two questions so far, so these labels are provisional. Mock 2 adds different questions on the same topics before anything is ranked.</p>
      <div class="grid-3">${TOPICS.map(t => { const s = prof.topics[t.id]; return `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="small">${esc(t.name)}</span>${statusPill(s.status)}</div>`; }).join('')}</div>
      <div class="row">${other === 'submitted' ? '<a class="btn primary" href="#report">Open the combined report</a>' : '<a class="btn primary" href="#mock-2">Continue to Mock 2</a>'}</div>
    </div>` : `<div class="row"><a class="btn primary" href="#report">Open the combined diagnostic report</a><a class="btn" href="#results-1">Mock 1 results</a></div>`}

    <section class="stack">
      <div class="row between"><h2>Question review</h2>
        <div class="choice-row" role="radiogroup" aria-label="Filter questions">${filters.map(([k, l]) => `<label class="choice"><input type="radio" name="flt" value="${k}" ${k === filter ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
      <div id="review" class="stack"></div>
    </section>
  </div>`;

  const drawReview = () => {
    const list = atts.filter(a => filter === 'all' || (filter === 'wrong' && a.attempted && !a.correct) || (filter === 'skipped' && !a.attempted) || (filter === 'right' && a.correct) || (filter === 'marked' && a.marked));
    root.querySelector('#review').innerHTML = list.length ? list.map(a => {
      const q = qById[a.qid];
      const r = st.answers[q.id];
      const ctx = q.passageId ? PASSAGES[q.passageId] : q.setId ? SETS[q.setId] : null;
      const result = !a.attempted ? '<span class="pill insufficient">Not attempted</span>' : a.correct ? '<span class="pill strong">Correct</span>' : '<span class="pill weak">Incorrect</span>';
      const keyText = q.type === 'mcq' ? `${LETTERS[q.answer]}` : q.answer;
      const yours = !a.attempted ? '—' : q.type === 'mcq' ? LETTERS[r] : esc(r);
      return `<details class="card disclose">
        <summary><span class="mono muted">Q${MOCKS[n].questions.indexOf(q.id) + 1}</span><span style="min-width:0"><b>${esc(topicName(q.topic))}</b> <span class="small muted">· ${esc(q.subtopic)} · ${q.difficulty} · ${SECTION_NAME[q.section]}</span></span>${result}${a.marked ? '<span class="pill plain" style="background:var(--review-soft);color:var(--review)">Marked</span>' : ''}</summary>
        <div class="stack" style="margin-top:14px">
          ${ctx ? `<details class="disclose"><summary class="small"><b>${esc(ctx.title)}</b></summary><div class="context" style="margin-top:8px">${contextBlock(ctx)}</div></details>` : ''}
          ${questionBody(q, r, { reveal: true, disabled: true, name: `rv-${q.id}` })}
          <div class="row small"><span>Your answer: <b class="mono">${yours}</b></span><span>Correct: <b class="mono">${esc(keyText)}</b></span><span>Time: <b class="mono">${mins(a.timeSec)}</b> (expected ${mins(q.expectedSec)})</span><span>Marks: <b class="mono">${a.marks > 0 ? '+' : ''}${a.marks}</b></span></div>
          <div class="callout"><b>Explanation.</b> ${esc(q.explanation)}</div>
          <p class="small muted">Concepts used: ${q.prereqs.map(esc).join(' · ')}</p>
        </div></details>`;
    }).join('') : '<p class="muted">No questions match this filter.</p>';
  };
  root.querySelector('[role=radiogroup]').addEventListener('change', e => { filter = e.target.value; drawReview(); });
  drawReview();
}
