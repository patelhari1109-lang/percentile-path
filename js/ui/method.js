import { PRIORITY_WEIGHTS, WEIGHT_LABELS, DIAGNOSTIC as D, SCORING, ACTIVITY_MINUTES, planShares } from '../config.js';
import { TOPICS, DEPENDENTS } from '../data/topics.js';
import { QUESTIONS } from '../data/mocks.js';
import { PRACTICE_BY_ID } from '../data/learning.js';
import { DEMO_PROFILES, loadDemo } from '../store.js';
import { esc, topicName, toast } from './common.js';

export function render(root, _p, { derived: d, store }) {
  const s = store.state;
  const w = { ...PRIORITY_WEIGHTS, ...(s.weights || {}) };
  const top5 = d.ranking ? d.ranking.rows.slice(0, 5).map(r => r.topic.name) : null;

  root.innerHTML = `
  <div class="page narrow">
    <div class="page-head"><p class="eyebrow">How it works</p><h1>The rules behind every recommendation</h1>
      <p>Everything here is rule-based and runs in your browser. No language model, no paid API, no hidden scoring. All thresholds live in one configuration file (<span class="mono">js/config.js</span>).</p></div>

    <section class="card stack"><h3>1. Scoring</h3>
      <p>CAT-style marks: MCQ +${SCORING.mcq.correct} / ${SCORING.mcq.wrong}, TITA +${SCORING.tita.correct} / ${SCORING.tita.wrong}, unattempted 0. Numerical answers accept a tolerance of ±${SCORING.numericTolerance}; ordering answers (para jumbles) must match exactly. Each mock: 20 questions, 45 minutes (a full CAT is 66–68 questions in 120 minutes).</p>
    </section>

    <section class="card stack"><h3>2. Diagnostic engine: classifying each topic</h3>
      <ol class="steps-list">
        <li><b>Adjusted accuracy.</b> A correct answer earns credit weighted by difficulty (easy ${D.creditByDifficulty.easy}, medium ${D.creditByDifficulty.medium}, hard ${D.creditByDifficulty.hard}); a wrong answer weighs easy ${D.penaltyByDifficulty.easy}, medium ${D.penaltyByDifficulty.medium}, hard ${D.penaltyByDifficulty.hard}, so a miss on a hard question hurts less. A correct answer marked “Guessing” earns ${D.unsureCorrectCredit * 100}% credit. The result is smoothed towards ${D.prior * 100}% with a weight of ${D.priorWeight} virtual question, so two answers never read as 0% or 100%.</li>
        <li><b>Speed ratio.</b> Median of (time taken ÷ expected solving time) over attempted questions. At ${D.slowRatio}× or more, a topic counts as slow.</li>
        <li><b>Consistency.</b> If a topic was attempted in both mocks and accuracy differs by ${D.inconsistencyGap * 100}% or more, it is inconsistent: never labelled Strong, and its confidence is cut by 30%.</li>
        <li><b>Evidence confidence</b> = 1 − e<sup>−n/3</sup> for n attempted questions (1 → 0.28, 2 → 0.49, 4 → 0.74, 6 → 0.86). High ≥ 0.7, Medium ≥ 0.45.</li>
        <li><b>Labels.</b> <i>Insufficient evidence</i>: fewer than ${D.minAttempts} attempted. <i>Strong</i>: adjusted accuracy ≥ ${D.strong.minAccuracy * 100}%, speed ≤ ${D.strong.maxSpeedRatio}×, consistent. <i>Weak</i>: ≥ ${D.weak.minWrong} wrong, adjusted accuracy &lt; ${D.weak.maxAccuracy * 100}%, and at least one error on an easy or medium question. <i>Developing</i>: everything else.</li>
        <li><b>Skips are not errors.</b> Unattempted questions only reduce evidence. A topic whose only errors are on hard questions cannot be labelled Weak.</li>
        <li><b>DILR sets</b> are also scored as units (time spent vs expected, questions solved), and the report flags set-selection problems separately from answer accuracy.</li>
      </ol>
    </section>

    <section class="card stack"><h3>3. Prioritisation engine</h3>
      <p>Goal: maximise expected improvement per hour, not topics completed. For each topic, five factors are normalised to 0–1:</p>
      <ul class="stack" style="margin:0;padding-left:18px">
        <li><b>Exam relevance</b>: assumed questions per paper ÷ the maximum across topics.</li>
        <li><b>Performance gap</b>: 1 − adjusted accuracy (0.5 when evidence is insufficient).</li>
        <li><b>Improvement potential</b>: realistic accuracy gain to a target (weak 60%, developing 75%, strong 85%) plus half the speed gap.</li>
        <li><b>Gain per study hour</b>: estimated marks per paper (questions × 3 × accuracy gain, plus a speed allowance) ÷ estimated hours, relative to the best topic.</li>
        <li><b>Prerequisite importance</b>: how many topics depend on this one (reduced to 30% once the topic is strong).</li>
      </ul>
      <p>Score = 100 × weighted average × evidence confidence factor (0.6 + 0.4 × confidence) × time feasibility (0.6 when the topic needs more than 8% of your remaining study hours). With under 45 days or 60 hours left, efficiency gains +0.1 weight and gap and prerequisite each lose 0.05.</p>
      <p><b>Categories</b> follow explicit rules, checked in this order: Insufficient evidence → <i>Needs evidence</i>; Strong → <i>Speed optimisation</i>; adjusted accuracy ≥ 60% and slow → <i>Quick win (accurate but slow)</i>; developing, accuracy ≥ 45%, refresher ≤ 2 h, relevance ≥ 0.4 → <i>Quick win (close to consistent)</i>; not strong, unlocks ≥ 2 topics, ≤ 3 h → <i>Quick win (prerequisite unlock)</i>; weak → <i>Concept building</i>, unless relevance &lt; 0.35, ≥ 4 h and time is tight → <i>Low priority</i>; otherwise developing → <i>Concept building</i>.</p>

      <h4>Adjust the weights</h4>
      <form id="weights" class="stack">
        ${Object.keys(WEIGHT_LABELS).map(k => `<div class="factor" style="grid-template-columns:minmax(0,180px) minmax(0,1fr) 56px"><label for="w-${k}">${WEIGHT_LABELS[k]}</label><input id="w-${k}" name="${k}" type="range" min="0" max="0.5" step="0.05" value="${w[k]}"><span class="num" id="wv-${k}">${w[k].toFixed(2)}</span></div>`).join('')}
        <div class="row"><button class="btn primary" type="submit" ${d.ranking ? '' : 'disabled'}>Apply and re-rank</button><button class="btn" type="button" id="w-reset">Restore defaults</button></div>
        ${top5 ? `<p class="small muted">Current top 5: ${top5.map(esc).join(' · ')}</p>` : '<p class="small muted">Weights apply once both mocks are done.</p>'}
      </form>
    </section>

    <section class="card stack"><h3>4. Daily planner</h3>
      <p>Activity lengths: concept ${ACTIVITY_MINUTES.concept} min, quick win ${ACTIVITY_MINUTES.quick}, speed ${ACTIVITY_MINUTES.speed}, evidence check ${ACTIVITY_MINUTES.check}, review ${ACTIVITY_MINUTES.review}. One evidence check comes first if any topic lacks evidence. The rest is split by days left:</p>
      <div class="table-wrap"><table><thead><tr><th>Days left</th><th class="num">Concept</th><th class="num">Quick wins</th><th class="num">Speed</th><th class="num">Review</th></tr></thead><tbody>
      ${[[120, 'More than 90'], [60, '30–90'], [20, 'Under 30']].map(([n, l]) => { const x = planShares(n); return `<tr><td>${l}</td><td class="num">${x.concept * 100}%</td><td class="num">${x.quick * 100}%</td><td class="num">${x.speed * 100}%</td><td class="num">${x.review * 100}%</td></tr>`; }).join('')}
      </tbody></table></div>
      <p>Unused budget rolls into the next type. After every activity the profile is recalculated, the ranking rebuilt, and the pending part of today’s plan regenerated. Completed and rescheduled items stay put.</p>
    </section>

    <section class="card stack"><h3>5. Exam-relevance assumptions</h3>
      <p class="small muted">Section totals (VARC 24, DILR 22, Quant 22) follow the CAT pattern in use since 2021. The split across topics below is our estimate of a typical recent paper, not an official figure. Hours are rough study-time estimates.</p>
      <div class="table-wrap"><table><thead><tr><th>Topic</th><th class="num">Qs/paper (assumed)</th><th class="num">Concept h</th><th class="num">Speed h</th><th>Unlocks</th></tr></thead><tbody>
      ${TOPICS.map(t => `<tr><td>${esc(t.name)}</td><td class="num">${t.qPerPaper}</td><td class="num">${t.conceptHours}</td><td class="num">${t.speedHours}</td><td class="small">${DEPENDENTS[t.id].map(topicName).map(esc).join(', ') || '—'}</td></tr>`).join('')}
      </tbody></table></div>
    </section>

    <section class="card stack"><h3>6. Question bank and provenance</h3>
      <p>All ${QUESTIONS.length} diagnostic questions and ${Object.keys(PRACTICE_BY_ID).length} practice questions are <b>original</b>, written for this prototype in the CAT style. None is an official CAT previous-year question, and none is copied from a coaching institute’s bank. Answer keys are checked by an automated test suite that recomputes the arithmetic and brute-forces every DILR set (<span class="mono">tests/engine.test.mjs</span>). Questions live in <span class="mono">js/data/mocks.js</span> and <span class="mono">js/data/learning.js</span>.</p>
      <details class="disclose"><summary><b>Diagnostic question list (${QUESTIONS.length})</b></summary>
        <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>ID</th><th>Section</th><th>Topic</th><th>Difficulty</th><th>Type</th><th class="num">Expected</th></tr></thead><tbody>
        ${QUESTIONS.map(q => `<tr><td class="mono small">${q.id}</td><td>${q.section === 'QA' ? 'Quant' : q.section}</td><td class="small">${esc(topicName(q.topic))} · ${esc(q.subtopic)}</td><td>${q.difficulty}</td><td>${q.type.toUpperCase()}</td><td class="num">${q.expectedSec}s</td></tr>`).join('')}
        </tbody></table></div></details>
    </section>

    <section class="card stack" id="demo"><h3>7. Demo mode and your data</h3>
      <p>${s.isDemo ? `You are viewing <b>${esc(s.demo.name)}</b> (${esc(s.demo.label)}), simulated demo data.` : 'You are using your own data.'} Data is stored only in this browser.</p>
      <div class="row">${DEMO_PROFILES.map(p => `<button class="btn small" data-demo="${p.id}">Load ${esc(p.name)}: ${esc(p.label.toLowerCase())}</button>`).join('')}</div>
      <div id="reset-zone" class="row"><button class="btn danger" id="reset">${s.isDemo ? 'Exit demo and start fresh' : 'Delete all my data'}</button></div>
    </section>
  </div>`;

  const form = root.querySelector('#weights');
  form.addEventListener('input', e => { root.querySelector(`#wv-${e.target.name}`).textContent = Number(e.target.value).toFixed(2); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nw = Object.fromEntries(Object.keys(WEIGHT_LABELS).map(k => [k, Number(form.elements[k].value)]));
    if (Object.values(nw).every(v => v === 0)) { toast('Set at least one weight above zero.'); return; }
    store.update(x => { x.weights = nw; });
    toast('Weights applied. The ranking has been recalculated.');
  });
  root.querySelector('#w-reset').addEventListener('click', () => { store.update(x => { x.weights = null; }); toast('Default weights restored.'); });
  root.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => { loadDemo(b.dataset.demo); location.hash = 'dashboard'; }));
  root.querySelector('#reset').addEventListener('click', () => {
    root.querySelector('#reset-zone').innerHTML = `<p class="callout warn small" style="flex-basis:100%">This permanently removes ${s.isDemo ? 'the demo data' : 'your profile, mock answers and progress'} from this browser.</p><button class="btn danger" id="reset-yes">Yes, delete</button><button class="btn" id="reset-no">Cancel</button>`;
    root.querySelector('#reset-yes').addEventListener('click', () => { store.reset(); location.hash = ''; });
    root.querySelector('#reset-no').addEventListener('click', () => store.update(() => {}));
  });
}
