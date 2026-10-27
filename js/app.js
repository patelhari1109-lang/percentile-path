import { store, derived, ensurePlan } from './store.js';
import { esc } from './ui/common.js';
import * as landing from './ui/landing.js';
import * as onboarding from './ui/onboarding.js';
import * as mock from './ui/mock.js';
import * as results from './ui/results.js';
import * as report from './ui/report.js';
import * as plan from './ui/plan.js';
import * as dashboard from './ui/dashboard.js';
import * as learn from './ui/learn.js';
import * as today from './ui/today.js';
import * as progress from './ui/progress.js';
import * as method from './ui/method.js';

// Routes are plain hash names (letters, digits, hyphens) so links survive sharing.
function parse(hash) {
  const h = hash.replace(/^#/, '');
  if (!h) return { view: landing };
  if (h === 'start') return { view: onboarding };
  let m;
  if ((m = h.match(/^mock-(1|2)$/))) return { view: mock, params: { mock: Number(m[1]) }, nav: 'diagnostic', bare: true };
  if ((m = h.match(/^results-(1|2)$/))) return { view: results, params: { mock: Number(m[1]) }, nav: 'report' };
  if ((m = h.match(/^learn-(concept|speed|quick|check)-(.+)$/))) return { view: learn, params: { mode: m[1], topic: m[2] }, nav: 'plan' };
  const map = { report, plan, dashboard, today, progress, method };
  if (map[h]) return { view: map[h], nav: h };
  return { view: landing };
}

const NAV = [
  ['dashboard', 'Dashboard'], ['report', 'Diagnostic report'], ['plan', 'Priorities'], ['today', 'Today'], ['progress', 'Progress'], ['method', 'How it works'],
];

const root = document.getElementById('app');
let cleanup = null;

function shell(route) {
  const s = store.state;
  const showNav = !!s.student;
  const demo = s.isDemo ? `<div class="demo-banner" role="note"><div class="wrap"><strong>Demo data</strong><span>You are viewing ${esc(s.demo.name)}, an illustrative student (${esc(s.demo.label.toLowerCase())}). Mock answers were simulated; they are not real user data.</span><a href="#method" class="btn ghost small">Switch or exit demo</a></div></div>` : '';
  const storageWarn = store.persistent ? '' : `<div class="demo-banner"><div class="wrap">Your browser is blocking storage, so progress will be lost when you close this tab.</div></div>`;
  return `<header class="topbar"><div class="topbar-inner">
      <a class="brand" href="${showNav ? '#dashboard' : '#'}"><span class="brand-mark" aria-hidden="true"></span><span>Percentile<span class="full"> Path</span></span></a>
      ${showNav ? `<nav class="nav" aria-label="Main">${NAV.map(([k, label]) => `<a href="#${k}" ${route.nav === k ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>` : '<span style="flex:1"></span><a class="btn ghost small" href="#method">How it works</a>'}
    </div></header>${demo}${storageWarn}<main id="view"></main>`;
}

function render() {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const route = parse(location.hash);
  ensurePlan();
  root.innerHTML = shell(route);
  const view = document.getElementById('view');
  cleanup = route.view.render(view, route.params || {}, { derived: derived(), store }) || null;
  const h1 = view.querySelector('h1, h2');
  if (h1 && !route.bare) { h1.setAttribute('tabindex', '-1'); }
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
store.listeners.add(() => render());
render();
