import { esc } from './common.js';
import { SECTIONS } from '../data/topics.js';

const STAGES = [
  ['starting', 'Just starting', 'Have not begun structured preparation'],
  ['beginner', 'Learning basics', 'Covering concepts for the first time'],
  ['intermediate', 'Practising', 'Concepts mostly covered, taking some mocks'],
  ['advanced', 'Mock-test phase', 'Regular full-length mocks'],
];
const TIME_LEFT = [['1', 'About 1 month'], ['3', 'About 3 months'], ['6', 'About 6 months'], ['12', 'About a year']];
const DAILY = [30, 45, 60, 90, 120, 180];

export function render(root, _p, { store }) {
  const s = store.state.student || {};
  const months = s.examDate ? null : '3';
  root.innerHTML = `
  <div class="page narrow">
    <div class="page-head">
      <p class="eyebrow">Step 1 of 4 · Profile</p>
      <h1>Set up your preparation profile</h1>
      <p>Only what changes your plan. Your two diagnostic mocks will calibrate everything else.</p>
    </div>
    <form class="card stack-lg" id="onb" novalidate>
      <div class="grid-2">
        <div class="field"><label for="name">First name <span class="muted">(optional)</span></label><input id="name" type="text" value="${esc(s.name || '')}" autocomplete="given-name"></div>
        <div class="field"><label for="exam">Target exam</label><select id="exam" disabled><option>CAT</option></select><span class="hint">This version supports CAT only.</span></div>
      </div>
      <div class="grid-2">
        <div class="field"><label for="target">Target percentile <span class="muted">(if you know it)</span></label><input id="target" type="number" min="50" max="100" step="0.1" placeholder="e.g. 95" value="${esc(s.targetPercentile ?? '')}"></div>
        <div class="field"><label for="prev">Latest mock score or percentile <span class="muted">(optional)</span></label><input id="prev" type="text" placeholder="e.g. 78 percentile" value="${esc(s.prevMock || '')}"><span class="hint">Shown for context only; it does not change your topic labels.</span></div>
      </div>
      <fieldset class="field"><legend>Time until your exam</legend>
        <div class="choice-row">${TIME_LEFT.map(([v, l]) => `<label class="choice"><input type="radio" name="months" value="${v}" ${months === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
        <label class="choice"><input type="radio" name="months" value="date" ${s.examDate ? 'checked' : ''}><span>Exact date</span></label></div>
        <input id="examDate" type="date" value="${esc(s.examDate || '')}" ${s.examDate ? '' : 'hidden'} aria-label="Exam date">
      </fieldset>
      <fieldset class="field"><legend>Study time available per day</legend>
        <div class="choice-row">${DAILY.map(v => `<label class="choice"><input type="radio" name="daily" value="${v}" ${(s.dailyMinutes || 60) === v ? 'checked' : ''}><span>${v < 60 ? v + ' min' : (v / 60) + ' h'}</span></label>`).join('')}</div>
      </fieldset>
      <fieldset class="field"><legend>Where are you in your preparation?</legend>
        <div class="grid-2">${STAGES.map(([v, l, d]) => `<label class="choice" style="display:block"><input type="radio" name="stage" value="${v}" ${(s.stage || 'intermediate') === v ? 'checked' : ''}><span style="display:grid;gap:2px"><b>${l}</b><span class="small muted">${d}</span></span></label>`).join('')}</div>
      </fieldset>
      <fieldset class="field"><legend>How confident do you feel in each section?</legend>
        <span class="hint">1 = not at all, 5 = very. We compare this with your measured results; it never replaces them.</span>
        ${SECTIONS.map(sec => `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${sec.short}</span><div class="choice-row" role="radiogroup" aria-label="${sec.short} confidence">${[1, 2, 3, 4, 5].map(n => `<label class="choice"><input type="radio" name="conf-${sec.id}" value="${n}" ${((s.selfConfidence || {})[sec.id] || 3) === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></div>`).join('')}
      </fieldset>
      <p id="err" class="callout warn" hidden></p>
      <div class="row between"><a href="#" class="btn ghost">Back</a><button class="btn primary" type="submit">Create profile</button></div>
    </form>
  </div>`;

  const form = root.querySelector('#onb');
  const dateInput = root.querySelector('#examDate');
  form.addEventListener('change', e => { if (e.target.name === 'months') dateInput.hidden = e.target.value !== 'date'; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const val = n => form.querySelector(`input[name="${n}"]:checked`)?.value;
    const err = root.querySelector('#err');
    let examDate;
    const months = val('months');
    if (!months) { err.textContent = 'Choose how long you have until the exam.'; err.hidden = false; return; }
    if (months === 'date') {
      if (!dateInput.value || new Date(dateInput.value) <= new Date()) { err.textContent = 'Enter an exam date in the future.'; err.hidden = false; return; }
      examDate = dateInput.value;
    } else examDate = new Date(Date.now() + Number(months) * 30 * 86400000).toISOString().slice(0, 10);
    const target = form.querySelector('#target').value;
    if (target && (Number(target) < 50 || Number(target) > 100)) { err.textContent = 'Target percentile should be between 50 and 100.'; err.hidden = false; return; }
    store.update(st => {
      st.student = {
        ...(st.student || {}),
        name: form.querySelector('#name').value.trim(),
        targetPercentile: target ? Number(target) : null,
        prevMock: form.querySelector('#prev').value.trim(),
        examDate, dailyMinutes: Number(val('daily')), stage: val('stage'),
        selfConfidence: Object.fromEntries(SECTIONS.map(sec => [sec.id, Number(val(`conf-${sec.id}`))])),
        createdAt: st.student?.createdAt || Date.now(),
      };
      st.plan = null; // daily time may have changed
    }, { silent: true });
    location.hash = store.state.mocks[1].status === 'submitted' ? 'dashboard' : 'dashboard';
  });
}
