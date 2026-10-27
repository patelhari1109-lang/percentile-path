import { QUESTIONS, MOCKS, PASSAGES, SETS } from '../data/mocks.js';
import { MOCK_DURATION_MIN, SCORING } from '../config.js';
import { isAttempted } from '../engine/scoring.js';
import { derived } from '../store.js';
import { buildProfile } from '../engine/diagnostic.js';
import { esc, mmss, contextBlock, questionBody, LETTERS } from './common.js';

const SECTION_ORDER = ['VARC', 'DILR', 'QA'];
const SECTION_NAME = { VARC: 'VARC', DILR: 'DILR', QA: 'Quant' };
// Which mock is open in this tab. Not persisted, so a reload lands on the resume screen.
let activeMock = null;

export function render(root, { mock: n }, { store }) {
  const s = store.state;
  if (!s.student) { location.hash = 'start'; return; }
  if (n === 2 && s.mocks[1].status !== 'submitted') {
    root.innerHTML = `<div class="page narrow"><div class="empty"><h3>Finish Mock 1 first</h3><p class="muted">Mock 2 is designed to confirm or challenge what Mock 1 found, so it unlocks after Mock 1 is submitted.</p><a class="btn primary" href="#mock-1">Go to Mock 1</a></div></div>`;
    return;
  }
  const st = s.mocks[n];
  if (st.status === 'submitted') { location.hash = `results-${n}`; return; }
  const qs = MOCKS[n].questions.map(id => QUESTIONS.find(q => q.id === id))
    .sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section));
  const duration = MOCK_DURATION_MIN * 60;

  if (st.status === 'not-started' || activeMock !== n) return intro();

  // ---------- running console ----------
  let paused = false, timer = null, tick = 0;
  root.innerHTML = `
  <div class="exam">
    <div class="exam-bar"><div class="inner">
      <b>${MOCKS[n].name}</b><span class="muted small" id="secname"></span>
      <span style="flex:1"></span>
      <span class="small muted" id="progress"></span>
      <span class="timer" id="timer" aria-live="off" title="Time remaining">${mmss(duration - st.elapsed)}</span>
      <button class="btn small" id="pause">Pause</button>
      <button class="btn small primary" id="submit">Submit</button>
    </div></div>
    <div class="exam-body">
      <div id="qpane" class="qpane"></div>
      <aside class="palette" aria-label="Question palette">
        <div class="card stack" id="pal"></div>
        <div class="card stack small">
          <div class="legend"><span><i class="answered"></i>Answered</span><span><i class="unanswered"></i>Not answered</span><span><i class="marked"></i>Marked for review</span><span><i></i>Not visited</span></div>
          <p class="muted" style="font-size:.75rem">Keys: A–D choose · N next · P previous · M mark</p>
        </div>
        <div class="card small muted">Marking: MCQ +${SCORING.mcq.correct} / ${SCORING.mcq.wrong}; TITA +${SCORING.tita.correct} / no negative. Skipping costs nothing.</div>
      </aside>
    </div>
    <div id="modal"></div>
  </div>`;
  const $ = sel => root.querySelector(sel);

  const save = () => store.save();
  const current = () => qs[st.current];
  const respOf = q => st.answers[q.id];

  function paletteHtml() {
    return SECTION_ORDER.map(sec => {
      const items = qs.map((q, i) => ({ q, i })).filter(x => x.q.section === sec);
      return `<div class="stack" style="gap:6px"><div class="eyebrow">${SECTION_NAME[sec]}</div><div class="pal-grid">${items.map(({ q, i }) => {
        const ans = isAttempted(q, respOf(q));
        const cls = [st.marked[q.id] ? 'marked' : '', ans ? 'answered' : st.visited[q.id] ? 'unanswered' : '', i === st.current ? 'current' : ''].join(' ');
        const label = `Question ${i + 1}, ${ans ? 'answered' : st.visited[q.id] ? 'not answered' : 'not visited'}${st.marked[q.id] ? ', marked for review' : ''}`;
        return `<button class="pal-btn ${cls}" data-go="${i}" aria-label="${label}">${i + 1}</button>`;
      }).join('')}</div></div>`;
    }).join('');
  }

  function draw() {
    const q = current();
    st.visited[q.id] = true;
    const ctx = q.passageId ? PASSAGES[q.passageId] : q.setId ? SETS[q.setId] : null;
    const qp = $('#qpane');
    qp.className = `qpane ${ctx ? 'split' : ''}`;
    qp.innerHTML = `
      ${ctx ? `<section class="context" aria-label="${esc(ctx.title)}"><div class="eyebrow" style="margin-bottom:8px">${esc(ctx.title)}</div>${contextBlock(ctx)}</section>` : ''}
      <section class="question" aria-labelledby="qhead">
        <div class="row between"><h2 id="qhead" style="font-size:var(--step-1)">Question ${st.current + 1} <span class="muted small" style="font-family:var(--font-body);font-weight:400">of ${qs.length}</span></h2>
          <span class="row" style="gap:6px"><span class="tag">${q.type === 'mcq' ? 'MCQ · negative marking' : 'TITA · no negative'}</span></span></div>
        ${questionBody(q, respOf(q), { name: 'tita-in' })}
        <div class="confidence" role="group" aria-label="How sure are you?"><span>How sure are you? (optional)</span>
          <button type="button" data-conf="sure" aria-pressed="${st.confidence[q.id] === 'sure'}">Sure</button>
          <button type="button" data-conf="unsure" aria-pressed="${st.confidence[q.id] === 'unsure'}">Guessing</button></div>
        <div class="qactions">
          <div class="group"><button class="btn" data-act="prev" ${st.current === 0 ? 'disabled' : ''}>Previous</button><button class="btn" data-act="clear">Clear response</button></div>
          <div class="group"><button class="btn" data-act="mark">${st.marked[q.id] ? 'Unmark' : 'Mark for review'} &amp; next</button><button class="btn primary" data-act="next">${st.current === qs.length - 1 ? 'Save' : 'Save &amp; next'}</button></div>
        </div>
      </section>`;
    $('#pal').innerHTML = paletteHtml();
    $('#secname').textContent = `· ${SECTION_NAME[q.section]}`;
    const answered = qs.filter(x => isAttempted(x, respOf(x))).length;
    $('#progress').textContent = `${answered}/${qs.length} answered`;
    save();
  }

  function go(i) { st.current = Math.max(0, Math.min(qs.length - 1, i)); draw(); $('#qhead')?.focus?.(); }

  root.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t || paused && !t.matches('#resume')) return;
    const q = current();
    if (t.dataset.go) return go(Number(t.dataset.go));
    if (t.dataset.action === 'choose') { st.answers[q.id] = Number(t.dataset.i); return draw(); }
    if (t.dataset.conf) { st.confidence[q.id] = st.confidence[q.id] === t.dataset.conf ? null : t.dataset.conf; return draw(); }
    if (t.dataset.act === 'prev') return go(st.current - 1);
    if (t.dataset.act === 'next') return st.current === qs.length - 1 ? draw() : go(st.current + 1);
    if (t.dataset.act === 'clear') { delete st.answers[q.id]; delete st.confidence[q.id]; return draw(); }
    if (t.dataset.act === 'mark') { st.marked[q.id] = !st.marked[q.id]; return st.current === qs.length - 1 ? draw() : go(st.current + 1); }
    if (t.id === 'pause') return pause();
    if (t.id === 'resume') return resume();
    if (t.id === 'submit') return confirmSubmit();
    if (t.id === 'cancel-submit') { $('#modal').innerHTML = ''; return; }
    if (t.id === 'do-submit') return submit();
  });
  root.addEventListener('input', e => {
    if (e.target.dataset.action === 'tita') {
      const q = current();
      st.answers[q.id] = e.target.value;
      $('#pal').innerHTML = paletteHtml();
      $('#progress').textContent = `${qs.filter(x => isAttempted(x, respOf(x))).length}/${qs.length} answered`;
    }
  });
  const onKey = e => {
    if (paused || $('#modal').innerHTML || e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const q = current(), k = e.key.toUpperCase();
    if (q.type === 'mcq' && (LETTERS.includes(k) || ['1', '2', '3', '4'].includes(k))) { st.answers[q.id] = LETTERS.includes(k) ? LETTERS.indexOf(k) : Number(k) - 1; draw(); }
    else if (k === 'N') go(st.current + 1);
    else if (k === 'P') go(st.current - 1);
    else if (k === 'M') { st.marked[q.id] = !st.marked[q.id]; draw(); }
  };
  document.addEventListener('keydown', onKey);

  function startTimer() {
    timer = setInterval(() => {
      if (paused || document.hidden) return;
      st.elapsed += 1;
      st.timeSpent[current().id] = (st.timeSpent[current().id] || 0) + 1;
      const left = duration - st.elapsed;
      const el = $('#timer');
      if (el) { el.textContent = mmss(left); el.classList.toggle('low', left <= 300); }
      if (left === 300) el?.setAttribute('aria-live', 'polite');
      if (++tick % 5 === 0) save();
      if (left <= 0) submit(true);
    }, 1000);
  }
  function pause() {
    paused = true; save();
    $('#modal').innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ph"><h3 id="ph">Mock paused</h3>
      <p class="muted">The timer has stopped and questions are hidden. Your answers are saved, so you can also close this tab and resume later.</p>
      <p class="mono">Time remaining ${mmss(duration - st.elapsed)}</p><div><button class="btn primary" id="resume">Resume mock</button></div></div></div>`;
    $('#qpane').style.visibility = 'hidden';
    $('#resume').focus();
  }
  function resume() { paused = false; $('#modal').innerHTML = ''; $('#qpane').style.visibility = ''; }
  function confirmSubmit() {
    const answered = qs.filter(x => isAttempted(x, respOf(x))).length;
    const marked = qs.filter(x => st.marked[x.id]).length;
    $('#modal').innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="sh"><h3 id="sh">Submit ${MOCKS[n].name}?</h3>
      <div class="grid-3"><div class="stat"><span class="value">${answered}</span><span class="label">Answered</span></div><div class="stat"><span class="value">${qs.length - answered}</span><span class="label">Not answered</span></div><div class="stat"><span class="value">${marked}</span><span class="label">Marked</span></div></div>
      <p class="muted small">You cannot change answers after submitting. Unanswered questions score zero and are not treated as weaknesses.</p>
      <div class="row"><button class="btn primary" id="do-submit">Submit mock</button><button class="btn" id="cancel-submit">Keep working</button></div></div></div>`;
    $('#do-submit').focus();
  }
  function submit(auto = false) {
    clearInterval(timer);
    st.status = 'submitted'; st.submittedAt = Date.now(); st.autoSubmitted = auto; activeMock = null;
    store.save();
    if (n === 2) {
      const d = derived();
      store.update(x => { x.snapshots.push({ at: Date.now(), label: 'Diagnostic baseline', topics: Object.fromEntries(Object.entries(buildProfile(d.mockAtt).topics).map(([k, v]) => [k, { status: v.status, acc: Math.round(v.adjAccuracy * 100) }])) }); x.plan = null; }, { silent: true });
    }
    location.hash = `results-${n}`;
  }

  draw();
  startTimer();
  return () => { clearInterval(timer); document.removeEventListener('keydown', onKey); activeMock = null; if (st.status !== 'submitted') store.save(); };

  // ---------- intro / resume screen ----------
  function intro() {
    const resuming = st.status === 'in-progress';
    const bySec = SECTION_ORDER.map(sec => ({ sec, n: qs.filter(q => q.section === sec).length }));
    root.innerHTML = `
    <div class="page narrow">
      <div class="page-head">
        <p class="eyebrow">Step ${n + 1} of 4 · Diagnostic</p>
        <h1>${MOCKS[n].name}</h1>
        <p>${MOCKS[n].purpose} ${n === 2 ? 'Every question is new; the topics match Mock 1 so the two can be compared.' : ''}</p>
      </div>
      <div class="card stack-lg">
        <div class="grid-4">
          <div class="stat"><span class="value">${qs.length}</span><span class="label">Questions</span></div>
          <div class="stat"><span class="value">${MOCK_DURATION_MIN}</span><span class="label">Minutes</span></div>
          ${bySec.map(b => `<div class="stat"><span class="value">${b.n}</span><span class="label">${SECTION_NAME[b.sec]}</span></div>`).join('')}
        </div>
        <hr class="divider">
        <ul class="stack" style="margin:0;padding-left:18px">
          <li>A full CAT has 66–68 questions in 120 minutes with sectional time limits. This diagnostic is shorter by design: 20 questions, one shared timer, and you can move freely between sections.</li>
          <li>Marking follows CAT: MCQs +3 / −1, type-in-the-answer (TITA) +3 / 0. Skipped questions score 0.</li>
          <li>Skip anything you would skip in the real exam. A skip is never counted as a weakness.</li>
          <li>Optionally mark each answer as “Sure” or “Guessing”. Correct guesses earn only partial credit in your topic profile.</li>
          <li>You can pause. The timer stops while paused or when you leave this page.</li>
        </ul>
        ${resuming ? `<p class="callout info">You have a mock in progress: ${Object.keys(st.answers).length} answered, ${mmss(duration - st.elapsed)} remaining.</p>` : ''}
        <div class="row"><button class="btn primary" id="begin">${resuming ? 'Resume mock' : 'Start mock'}</button><a class="btn ghost" href="#dashboard">Not now</a></div>
      </div>
    </div>`;
    root.querySelector('#begin').addEventListener('click', () => {
      // A non-silent update re-renders through the router, which owns timer cleanup.
      activeMock = n;
      store.update(() => {
        if (st.status === 'not-started') { st.status = 'in-progress'; st.startedAt = Date.now(); }
      });
    });
    root.querySelector('#begin').focus();
  }
}
