import { LEARNING } from '../data/learning.js';
import { TOPIC_BY_ID } from '../data/topics.js';
import { isCorrect, isAttempted } from '../engine/scoring.js';
import { derived, recordPractice, practiceRecord, recalibrate } from '../store.js';
import { MODE_LABEL } from '../engine/priority.js';
import { esc, pct, mins, mmss, statusPill, categoryPill, contextBlock, questionBody, emptyState, topicName, modeLabel, LETTERS, round1 } from './common.js';

const STEPS = {
  concept: [['prereq', 'Prerequisite'], ['concept', 'Concept'], ['worked', 'Worked example'], ['misconception', 'Common mistake'], ['q0', 'Guided question'], ['q1', 'Independent practice'], ['q2', 'Mastery check'], ['summary', 'Result']],
  quick: [['why', 'Why this topic'], ['refresher', 'Refresher'], ['q0', 'Question 1'], ['q1', 'Question 2'], ['q2', 'Question 3'], ['summary', 'Completion check']],
  speed: [['methods', 'Methods'], ['q0', 'Timed 1'], ['q1', 'Timed 2'], ['q2', 'Timed 3'], ['summary', 'Speed report']],
  check: [['intro', 'About'], ['q0', 'Question 1'], ['q1', 'Question 2'], ['q2', 'Question 3'], ['summary', 'Result']],
};
const EST = { concept: 40, quick: 20, speed: 15, check: 10 };

export function render(root, { mode, topic: topicId }, { derived: d, store }) {
  const topic = TOPIC_BY_ID[topicId];
  const L = LEARNING[topicId];
  if (!topic || !L || !STEPS[mode]) { root.innerHTML = `<div class="page narrow">${emptyState('Activity not found', 'This link does not match a topic and activity type.', '<a class="btn primary" href="#plan">Back to priorities</a>')}</div>`; return; }
  if (!d.ranking) { root.innerHTML = `<div class="page narrow">${emptyState('Finish both diagnostic mocks first', 'Learning activities are chosen and tuned from your diagnostic results.', '<a class="btn primary" href="#dashboard">Go to dashboard</a>')}</div>`; return; }

  const row = d.ranking.rows.find(r => r.topic.id === topicId);
  const stats = row.stats;
  const steps = STEPS[mode];
  const started = Date.now();
  const st = { i: 0, resp: {}, checked: {}, time: {}, hints: {}, prereq: null, qStart: null, done: false };
  let tick = null;

  const shell = () => `
  <div class="page narrow">
    <div class="page-head">
      <p class="eyebrow">${esc(MODE_LABEL[mode])} · about ${EST[mode]} min · ${topic.section === 'QA' ? 'Quant' : topic.section}</p>
      <h1>${esc(topic.name)}</h1>
      <div class="row small">${statusPill(stats.status)}${categoryPill(row.category)}<span class="muted">${stats.correct}/${stats.attempted} correct so far · ${stats.confidenceLabel.toLowerCase()} confidence</span></div>
      ${row.mode !== mode && mode !== 'check' ? `<p class="callout info small">Your plan recommends <b>${esc(modeLabel(row.mode))}</b> for this topic. You can still do this activity; results count either way.</p>` : ''}
    </div>
    <div class="stepper" aria-label="Progress">${steps.map(([, l], i) => `<span class="${i < st.i ? 'done' : i === st.i ? 'now' : ''}" ${i === st.i ? 'aria-current="step"' : ''}>${l}</span>`).join('')}</div>
    <div id="step" class="stack-lg"></div>
  </div>`;

  function draw() {
    clearInterval(tick);
    root.innerHTML = shell();
    const el = root.querySelector('#step');
    const [key] = steps[st.i];
    el.innerHTML = stepHtml(key);
    if (key.startsWith('q')) startQuestion(Number(key[1]));
    el.querySelector('h2, h3')?.focus?.();
  }

  const nav = (label = 'Continue', back = true) => `<div class="row between">${back && st.i > 0 ? '<button class="btn ghost" data-act="back">Back</button>' : '<span></span>'}<button class="btn primary" data-act="next">${label}</button></div>`;

  function stepHtml(key) {
    switch (key) {
      case 'prereq': {
        const q = { ...L.prereq, type: 'mcq' };
        const answered = st.prereq != null;
        return `<div class="card stack"><h3 tabindex="-1">Prerequisite check</h3><p class="small muted">One question to confirm the building block this topic rests on. It does not count towards your profile.</p>
          ${questionBody(q, st.prereq, { reveal: answered, disabled: answered })}
          ${answered ? `<div class="feedback ${st.prereq === q.answer ? 'ok' : 'no'}"><b>${st.prereq === q.answer ? 'Correct.' : 'Not quite.'}</b> ${esc(q.explanation)}${st.prereq === q.answer ? '' : ' Keep this in mind in the next step.'}</div>` : ''}
        </div>${answered ? nav() : ''}`;
      }
      case 'concept':
        return `<div class="card stack"><h3 tabindex="-1">The concept, step by step</h3><ol class="steps-list">${L.concept.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div>${nav()}`;
      case 'worked':
        return `<div class="card stack"><h3 tabindex="-1">Worked example</h3><p>${esc(L.worked.problem)}</p><ol class="steps-list">${L.worked.steps.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div>${nav()}`;
      case 'misconception':
        return `<div class="card stack"><h3 tabindex="-1">Common mistake</h3>
          <div class="feedback no"><b>The mistake.</b> ${esc(L.misconception.mistake)}</div>
          <p><b>Why it fails.</b> ${esc(L.misconception.why)}</p>
          <div class="feedback ok"><b>What to do instead.</b> ${esc(L.misconception.fix)}</div></div>${nav('Start guided practice')}`;
      case 'why':
        return `<div class="card stack"><h3 tabindex="-1">Why this topic was selected</h3>
          <ul class="stack" style="margin:0;padding-left:18px">${row.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
          <div class="grid-3"><div class="stat"><span class="value">${EST.quick} min</span><span class="label">Estimated time</span></div><div class="stat"><span class="value">${stats.correct}/${stats.attempted}</span><span class="label">Correct so far</span></div><div class="stat"><span class="value">${stats.speedRatio ? stats.speedRatio.toFixed(1) + '×' : '—'}</span><span class="label">Your time vs expected</span></div></div>
          <p class="small muted">Rule: ${esc(row.rule)}. The benefit is an estimate based on a small sample, not a guarantee.</p></div>${nav('Start refresher')}`;
      case 'refresher':
        return `<div class="card stack"><h3 tabindex="-1">Refresher</h3><p>${esc(L.refresher)}</p>
          <div class="method-compare"><div><span class="eyebrow">Usual approach</span><p class="small" style="margin-top:6px">${esc(L.fast.conventional)}</p></div><div class="faster"><span class="eyebrow">Better approach</span><p class="small" style="margin-top:6px">${esc(L.fast.faster)}</p></div></div>
          <p class="small"><b>Watch out:</b> ${esc(L.misconception.mistake)} ${esc(L.misconception.fix)}</p></div>${nav('Start the 3 questions')}`;
      case 'methods':
        return `<div class="card stack"><h3 tabindex="-1">Solve it faster</h3>
          <p class="small muted">You are already accurate here (${stats.correct}/${stats.attempted}, median ${stats.speedRatio ? stats.speedRatio.toFixed(1) + '×' : '—'} expected time). The goal is the same accuracy in less time, so the basics are skipped.</p>
          <div class="method-compare"><div><span class="eyebrow">Conventional method</span><p style="margin-top:6px">${esc(L.fast.conventional)}</p></div><div class="faster"><span class="eyebrow">Faster method</span><p style="margin-top:6px">${esc(L.fast.faster)}</p></div></div>
          <div class="grid-2"><div class="feedback ok"><b>When it works.</b> ${esc(L.fast.works)}</div><div class="feedback no"><b>When it does not.</b> ${esc(L.fast.fails)}</div></div>
          <p class="small muted">Example: ${esc(L.worked.steps[L.worked.steps.length - 1])}</p></div>
          <div class="callout small">Next: three timed questions. Target time is 80% of the standard solving time. The clock is visible but nothing is cut off.</div>${nav('Start timed challenge')}`;
      case 'intro':
        return `<div class="card stack"><h3 tabindex="-1">Evidence check</h3><p>Your mocks gave only ${stats.attempted} attempted question${stats.attempted === 1 ? '' : 's'} on this topic, which is not enough to say whether it is a strength or a gap. Three short questions (easy, medium, hard) settle it. No hints, no pressure: answer as you would in the exam, and skip if you would skip.</p></div>${nav('Begin')}`;
      case 'summary':
        return summaryHtml();
      default: return questionStepHtml(Number(key[1]));
    }
  }

  function questionStepHtml(k) {
    const q = L.practice[k];
    const checked = st.checked[k];
    const r = st.resp[k];
    const guided = mode === 'concept' && k === 0;
    const labels = { concept: ['Guided question', 'Independent practice', 'Mastery check'], quick: ['Targeted question 1', 'Targeted question 2', 'Targeted question 3'], speed: ['Timed question 1', 'Timed question 2', 'Timed question 3'], check: ['Question 1 (easy)', 'Question 2 (medium)', 'Question 3 (hard)'] };
    const target = Math.round(q.expectedSec * 0.8);
    return `${L.context ? `<div class="context">${contextBlock(L.context)}</div>` : ''}
      <div class="question">
        <div class="row between"><h3 tabindex="-1">${labels[mode][k]}</h3><span class="row small"><span class="tag" style="text-transform:capitalize">${q.difficulty}</span>${mode === 'speed' ? `<span class="timer" id="qt">${checked ? mmss(st.time[k]) : '0:00'}</span><span class="muted">target ${mmss(target)}</span>` : ''}</span></div>
        ${questionBody(q, r, { name: `p-${q.id}`, reveal: checked, disabled: checked })}
        ${guided && !checked ? `<div class="stack" style="gap:6px">${q.hints.slice(0, st.hints[k] || 0).map((h, i) => `<div class="hint-box"><b>Hint ${i + 1}.</b> ${esc(h)}</div>`).join('')}${(st.hints[k] || 0) < q.hints.length ? `<div><button class="btn small" data-act="hint">Show hint ${(st.hints[k] || 0) + 1} of ${q.hints.length}</button></div>` : ''}</div>` : ''}
        ${checked ? `<div class="feedback ${isCorrect(q, r) ? 'ok' : 'no'}"><b>${!isAttempted(q, r) ? 'Skipped.' : isCorrect(q, r) ? 'Correct.' : `Not correct. The answer is ${q.type === 'mcq' ? LETTERS[q.answer] : esc(q.answer)}.`}</b> ${esc(q.explanation)}${mode === 'speed' ? ` <span class="mono">Time ${mmss(st.time[k])} vs target ${mmss(target)}.</span>` : ''}</div>` : ''}
        <div class="row between">${!checked ? `<button class="btn ghost" data-act="skip">Skip</button><button class="btn primary" data-act="check">Check answer</button>` : `<span></span><button class="btn primary" data-act="next">${k === 2 ? 'See result' : 'Next question'}</button>`}</div>
      </div>`;
  }

  function startQuestion(k) {
    if (st.checked[k]) return;
    st.qStart = Date.now() - (st.time[k] || 0) * 1000;
    if (mode === 'speed') {
      tick = setInterval(() => { const el = root.querySelector('#qt'); if (el) el.textContent = mmss((Date.now() - st.qStart) / 1000); }, 500);
    }
  }

  function checkQuestion(k, skip = false) {
    clearInterval(tick);
    st.time[k] = (Date.now() - st.qStart) / 1000;
    if (skip) delete st.resp[k];
    st.checked[k] = true;
    draw();
  }

  function summaryHtml() {
    if (!st.result) finish();
    const R = st.result;
    const cmp = R.change;
    const nextRow = R.next;
    return `<div class="card stack"><h3 tabindex="-1">${mode === 'speed' ? 'Speed report' : mode === 'check' ? 'Evidence recorded' : 'Activity complete'}</h3>
      <div class="grid-3">
        <div class="stat"><span class="value">${R.correct}/3</span><span class="label">Correct</span></div>
        <div class="stat"><span class="value">${mins(R.avgTime)}</span><span class="label">Average time${R.diagAvg ? ` (mocks: ${mins(R.diagAvg)})` : ''}</span></div>
        <div class="stat"><span class="value">${R.minutes} min</span><span class="label">Time spent (est. ${EST[mode]})</span></div>
      </div>
      ${mode === 'speed' ? `<div class="table-wrap"><table><thead><tr><th>Question</th><th>Result</th><th class="num">Your time</th><th class="num">Target</th></tr></thead><tbody>${L.practice.map((q, k) => `<tr><td style="text-transform:capitalize">${q.difficulty}</td><td>${!isAttempted(q, st.resp[k]) ? 'Skipped' : isCorrect(q, st.resp[k]) ? 'Correct' : 'Incorrect'}</td><td class="num">${mmss(st.time[k])}</td><td class="num">${mmss(q.expectedSec * 0.8)}</td></tr>`).join('')}</tbody></table></div>
        <p class="small">${R.correct >= 2 && R.avgRatio <= 0.9 ? 'Accuracy held while you beat the standard time. Keep this method.' : R.correct < 2 ? 'Accuracy dropped under time pressure. Slow down slightly: speed is only useful when answers stay right.' : 'Accurate, but not yet faster than standard. Repeat the faster method on your next revision.'}</p>` : ''}
      ${mode === 'concept' ? `<p>${R.correct === 3 ? 'Mastery check passed. The concept looks secure; the next step is timed practice.' : R.correct === 2 ? 'Nearly there. Review the explanation for the one you missed, then move on.' : 'The concept is not secure yet. Re-read the worked example and common mistake before trying again tomorrow.'}</p>` : ''}
      ${mode === 'quick' ? `<p>${R.correct >= 2 ? 'Completion check passed.' : 'Completion check not passed yet: this topic needs more than a quick refresher.'}</p>` : ''}
    </div>
    <div class="card stack"><h3>Recalibration</h3>
      <p class="small muted">Your answers were added to this topic’s evidence (re-doing the same questions replaces earlier answers rather than adding to them). Your diagnostic baseline is unchanged.</p>
      <div class="table-wrap"><table><thead><tr><th></th><th>Before</th><th>After</th></tr></thead><tbody>
        <tr><td>Status</td><td>${statusPill(cmp.before.status)}</td><td>${statusPill(cmp.after.status)}</td></tr>
        <tr><td>Adjusted accuracy</td><td class="mono">${pct(cmp.before.acc)}</td><td class="mono">${pct(cmp.after.acc)}</td></tr>
        <tr><td>Evidence confidence</td><td>${cmp.before.conf}</td><td>${cmp.after.conf}</td></tr>
        <tr><td>Priority</td><td class="mono">#${cmp.before.rank} · ${cmp.before.score}</td><td class="mono">#${cmp.after.rank} · ${cmp.after.score}</td></tr>
        <tr><td>Recommendation</td><td>${categoryPill(cmp.before.category)}</td><td>${categoryPill(cmp.after.category)}</td></tr>
      </tbody></table></div>
      <p>${esc(R.verdict)}</p>
      ${R.planNote ? `<p class="callout small">${esc(R.planNote)}</p>` : ''}
    </div>
    ${nextRow ? `<div class="card stack"><span class="eyebrow">Suggested next</span><h3>${esc(modeLabel(nextRow.mode))}: ${esc(topicName(nextRow.topicId))}</h3><div class="row"><a class="btn primary" href="#learn-${nextRow.mode}-${nextRow.topicId}">Start</a><a class="btn" href="#today">Today’s plan</a><a class="btn ghost" href="#progress">Progress</a></div></div>` : '<div class="row"><a class="btn primary" href="#today">Back to today’s plan</a></div>'}`;
  }

  function finish() {
    const before = derived().ranking.rows.find(r => r.topic.id === topicId);
    const records = L.practice.map((q, k) => practiceRecord(q, st.resp[k], st.time[k] || 0, isCorrect(q, st.resp[k]), isAttempted(q, st.resp[k]), mode));
    recordPractice(records);
    const minutes = Math.max(1, Math.round((Date.now() - started) / 60000));
    const correct = records.filter(r => r.correct).length;
    const timed = records.filter(r => r.attempted);
    const avgTime = timed.length ? timed.reduce((t, r) => t + r.timeSec, 0) / timed.length : null;
    const avgRatio = timed.length ? timed.reduce((t, r) => t + r.timeSec / r.expectedSec, 0) / timed.length : 1;
    const s = store.state;
    const item = s.plan?.items.find(i => i.id === s.activeItem && i.status === 'pending') || s.plan?.items.find(i => i.topicId === topicId && i.mode === mode && i.status === 'pending');
    store.update(x => {
      x.activities.push({ id: `a${Date.now()}`, topicId, mode, at: Date.now(), minutesSpent: minutes, estMinutes: EST[mode], correct, total: 3, statusBefore: before.stats.status, avgTimeSec: avgTime, prereqCorrect: mode === 'concept' ? st.prereq === L.prereq.answer : null });
      if (item) { const it = x.plan.items.find(i => i.id === item.id); it.status = 'done'; it.actualMinutes = minutes; }
      x.activeItem = null;
    }, { silent: true });
    const res = recalibrate(`${MODE_LABEL[mode]}: ${topic.name}`);
    const after = derived().ranking.rows.find(r => r.topic.id === topicId);
    store.update(x => { x.activities[x.activities.length - 1].statusAfter = after.stats.status; }, { silent: true });

    const b = before.stats, a = after.stats;
    let verdict;
    if (b.status === 'strong' && a.status !== 'strong') verdict = 'This topic slipped below the Strong bar. A revision block has been prioritised so accuracy recovers before you lean on speed.';
    else if (['weak', 'developing'].includes(b.status) && a.adjAccuracy > b.adjAccuracy + 0.05) verdict = `Improvement registered: adjusted accuracy rose from ${pct(b.adjAccuracy)} to ${pct(a.adjAccuracy)}, so this topic’s priority ${after.score < before.score ? 'dropped and the next opportunity moves up' : 'is being re-weighed against the others'}.`;
    else if (b.status === 'insufficient') verdict = `With ${a.attempted} attempted questions this topic is now classed as ${a.status === 'insufficient' ? 'still uncertain' : a.status}. The plan now treats it on evidence rather than a guess.`;
    else if (a.adjAccuracy < b.adjAccuracy - 0.05) verdict = 'Results were below your earlier level, so the topic keeps or gains priority.';
    else verdict = 'The recommendation still stands. One more session should make the picture clearer.';
    const changes = res?.changes;
    const planNote = changes && (changes.added.length || changes.removed.length)
      ? `Today’s plan was updated: ${changes.added.length ? 'added ' + changes.added.map(i => `${modeLabel(i.mode)}${i.topicId ? ' (' + topicName(i.topicId) + ')' : ''}`).join(', ') : ''}${changes.added.length && changes.removed.length ? '; ' : ''}${changes.removed.length ? 'removed ' + changes.removed.map(i => `${modeLabel(i.mode)}${i.topicId ? ' (' + topicName(i.topicId) + ')' : ''}`).join(', ') : ''}.`
      : item ? 'Marked complete in today’s plan.' : null;
    const next = store.state.plan?.items.find(i => i.status === 'pending' && i.topicId && i.topicId !== topicId)
      || (() => { const r = derived().ranking.rows.find(r => r.topic.id !== topicId); return r && { mode: r.mode, topicId: r.topic.id }; })();
    st.result = {
      correct, minutes, avgTime, avgRatio, diagAvg: b.avgTimeSec,
      change: {
        before: { status: b.status, acc: b.adjAccuracy, conf: b.confidenceLabel, rank: before.rank, score: before.score, category: before.category },
        after: { status: a.status, acc: a.adjAccuracy, conf: a.confidenceLabel, rank: after.rank, score: after.score, category: after.category },
      },
      verdict, planNote, next,
    };
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    const [key] = steps[st.i];
    if (t.dataset.action === 'choose') {
      if (key === 'prereq') { st.prereq = Number(t.dataset.i); return draw(); }
      const k = Number(key[1]);
      st.resp[k] = Number(t.dataset.i);
      root.querySelectorAll('.option').forEach(o => o.setAttribute('aria-pressed', o.dataset.i === t.dataset.i));
      return;
    }
    if (t.dataset.act === 'hint') { const k = Number(key[1]); st.hints[k] = (st.hints[k] || 0) + 1; st.time[k] = (Date.now() - st.qStart) / 1000; return draw(); }
    if (t.dataset.act === 'check') return checkQuestion(Number(key[1]));
    if (t.dataset.act === 'skip') return checkQuestion(Number(key[1]), true);
    if (t.dataset.act === 'next') { st.i = Math.min(steps.length - 1, st.i + 1); return draw(); }
    if (t.dataset.act === 'back') { st.i = Math.max(0, st.i - 1); return draw(); }
  });
  root.addEventListener('input', e => {
    if (e.target.dataset.action === 'tita') { const [key] = steps[st.i]; st.resp[Number(key[1])] = e.target.value; }
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.dataset.action === 'tita') { e.preventDefault(); root.querySelector('[data-act="check"]')?.click(); }
  });

  draw();
  return () => clearInterval(tick);
}
