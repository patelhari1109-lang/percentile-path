// Run: node tests/render-smoke.mjs
// Renders every screen against a stub DOM to catch runtime errors (no browser needed).
const mem = {};
globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
const el = () => new Proxy({ dataset: {}, style: {}, classList: { toggle() {}, add() {} } }, {
  get(t, p) {
    if (p in t) return t[p];
    if (p === 'querySelectorAll') return () => [];
    if (p === 'querySelector' || p === 'closest') return () => el();
    if (typeof p === 'string' && /^(add|remove)EventListener|focus|setAttribute|remove|appendChild|scrollIntoView$/.test(p)) return () => {};
    return undefined;
  },
  set(t, p, v) { t[p] = v; return true; },
});
globalThis.document = { getElementById: () => el(), querySelector: () => null, createElement: () => el(), addEventListener() {}, removeEventListener() {}, body: el(), hidden: false };
globalThis.location = { hash: '' };
globalThis.window = { addEventListener() {}, scrollTo() {} };

const { store, derived, ensurePlan, loadDemo } = await import('../js/store.js');
const views = {
  landing: '../js/ui/landing.js', onboarding: '../js/ui/onboarding.js', dashboard: '../js/ui/dashboard.js', report: '../js/ui/report.js',
  plan: '../js/ui/plan.js', today: '../js/ui/today.js', progress: '../js/ui/progress.js', method: '../js/ui/method.js',
  results: '../js/ui/results.js', mock: '../js/ui/mock.js', learn: '../js/ui/learn.js',
};
const mods = {};
for (const [k, p] of Object.entries(views)) mods[k] = await import(p);

let fails = 0;
function run(name, mod, params = {}) {
  try {
    ensurePlan();
    const root = el();
    const c = mod.render(root, params, { derived: derived(), store });
    if (typeof c === 'function') c();
    const len = (root.innerHTML || '').length;
    if (!len) throw new Error('rendered nothing');
    console.log(`  ok  ${name} (${len} chars)`);
  } catch (e) { fails++; console.log(`  ERR ${name}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
}

console.log('Empty state');
for (const k of ['landing', 'onboarding', 'report', 'plan', 'today', 'progress', 'method']) run(k, mods[k]);

for (const id of ['fast-accurate', 'weak-fundamentals', 'limited-time', 'inconsistent']) {
  console.log(`Demo: ${id}`);
  loadDemo(id);
  for (const k of ['landing', 'dashboard', 'report', 'plan', 'today', 'progress', 'method']) run(k, mods[k]);
  run('results-1', mods.results, { mock: 1 });
  run('results-2', mods.results, { mock: 2 });
  const rows = derived().ranking.rows;
  for (const mode of ['concept', 'speed', 'quick', 'check']) run(`learn-${mode}-${rows[0].topic.id}`, mods.learn, { mode, topic: rows[0].topic.id });
}

console.log('Fresh student, mock 1 intro');
store.reset();
store.update(s => { s.student = { examDate: '2027-06-01', dailyMinutes: 60, stage: 'intermediate', selfConfidence: { VARC: 3, DILR: 3, QA: 3 } }; }, { silent: true });
run('dashboard (pre-mock)', mods.dashboard);
run('mock-1 intro', mods.mock, { mock: 1 });
console.log(fails ? `\n${fails} failures` : '\nAll screens rendered');
process.exit(fails ? 1 : 0);
