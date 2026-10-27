import { DEMO_PROFILES, loadDemo } from '../store.js';
import { esc } from './common.js';

export function render(root, _p, { store }) {
  const s = store.state;
  const resume = s.student
    ? `<a class="btn primary" href="#dashboard">Continue your preparation</a>`
    : `<a class="btn primary" href="#start">Start free diagnostic</a>`;
  root.innerHTML = `
  <div class="page">
    <section class="hero">
      <div class="stack-lg">
        <p class="eyebrow">CAT preparation strategist · free</p>
        <h1>Know what to study next, what you can master quickly, and where your time makes the biggest difference.</h1>
        <p class="lede">Two short diagnostic mocks measure your accuracy and speed topic by topic. The plan that follows ranks every topic by expected improvement per hour of study, and explains each recommendation.</p>
        <div class="row">${resume}<a class="btn" href="#demo-picker">Explore with a demo student</a></div>
        <p class="small muted">No videos, no sign-up, no paid AI. Your data stays in this browser.</p>
      </div>
      <div class="card stack" aria-label="Example of a ranked plan">
        <div class="row between"><span class="eyebrow">Example ranking</span><span class="pill insufficient plain">Illustrative</span></div>
        <div class="sample-rank">
          <div class="r"><span class="mono muted">1</span><div><b>Percentages, profit &amp; loss</b><div class="small muted">Accurate but 1.6× slower than expected. Method upgrade.</div></div><span class="pill quick">Quick win</span></div>
          <div class="r"><span class="mono muted">2</span><div><b>Arrangements</b><div class="small muted">3 errors on medium questions. Concept gap.</div></div><span class="pill concept">Concept building</span></div>
          <div class="r"><span class="mono muted">3</span><div><b>RC: Inference</b><div class="small muted">Only 1 question attempted. Too early to judge.</div></div><span class="pill check">Needs evidence</span></div>
          <div class="r"><span class="mono muted">4</span><div><b>Para summaries</b><div class="small muted">4/4 correct at normal pace. Keep sharp.</div></div><span class="pill speed">Speed optimisation</span></div>
        </div>
      </div>
    </section>

    <section class="grid-2">
      <div class="card stack">
        <h3>How the loop works</h3>
        <ol class="loop">
          <li><div><b>Set up your profile</b><div class="small muted">Target, time left, daily study time. About a minute.</div></div></li>
          <li><div><b>Diagnostic Mock 1</b><div class="small muted">20 questions across VARC, DILR and Quant, 45 minutes, CAT-style marking.</div></div></li>
          <li><div><b>Diagnostic Mock 2</b><div class="small muted">20 different questions on the same topics, to test whether Mock 1 findings hold.</div></div></li>
          <li><div><b>Diagnostic report</b><div class="small muted">Strong, developing, weak, or not enough evidence, for each of 18 topics.</div></div></li>
          <li><div><b>Ranked plan and daily schedule</b><div class="small muted">Quick wins, concept building and speed work, sized to your available time.</div></div></li>
          <li><div><b>Learn, practise, recalibrate</b><div class="small muted">Each activity updates your profile and reshuffles what comes next.</div></div></li>
        </ol>
      </div>
      <div class="card stack">
        <h3>What makes the recommendations trustworthy</h3>
        <ul class="stack" style="padding-left:18px;margin:0">
          <li><b>Measured, not self-reported.</b> Your confidence ratings are shown next to measured results, never used in their place.</li>
          <li><b>Honest about uncertainty.</b> Topics with too few attempts are labelled “needs evidence”, and a skipped question never counts as a weakness.</li>
          <li><b>Transparent scoring.</b> Every priority score is broken into five weighted factors you can inspect and adjust.</li>
          <li><b>Estimates are labelled.</b> Exam-weightage figures and mark gains are assumptions, marked as such.</li>
        </ul>
      </div>
    </section>

    <section id="demo-picker" class="stack">
      <div class="page-head"><h2>Explore with a demo student</h2>
      <p>Each demo loads simulated answers for both mocks so you can see the full report and plan immediately. Demo data is labelled throughout and is not from real students. Loading a demo replaces any data in this browser.</p></div>
      <div class="grid-2">${DEMO_PROFILES.map(p => `
        <div class="card stack">
          <div class="row between"><h3>${esc(p.name)}</h3><span class="tag">${esc(p.label)}</span></div>
          <p class="muted small">${esc(p.summary)}</p>
          <p class="small mono">${p.student.monthsLeft} month${p.student.monthsLeft > 1 ? 's' : ''} left · ${p.student.dailyMinutes} min/day · target ${p.student.targetPercentile} %ile</p>
          <div><button class="btn" data-demo="${p.id}">Load ${esc(p.name)}’s data</button></div>
        </div>`).join('')}
      </div>
    </section>
  </div>`;
  root.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => {
    loadDemo(b.dataset.demo);
    location.hash = 'dashboard';
  }));
  root.querySelector('a[href="#demo-picker"]').addEventListener('click', e => {
    e.preventDefault(); root.querySelector('#demo-picker').scrollIntoView({ behavior: 'smooth' });
  });
}
