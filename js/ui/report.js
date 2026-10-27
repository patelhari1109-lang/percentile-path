import { TOPICS, SECTIONS } from '../data/topics.js';
import { SCORING } from '../config.js';
import { buildProfile } from '../engine/diagnostic.js';
import { esc, pct, mins, statusPill, groupedBarChart, emptyState, bar } from './common.js';

export function render(root, _p, { derived: d, store }) {
  const s = store.state;
  if (!s.student) { root.innerHTML = `<div class="page narrow">${emptyState('No profile yet', 'Create a profile and take the two diagnostic mocks to see your report.', '<a class="btn primary" href="#start">Create profile</a>')}</div>`; return; }
  if (!d.ready) {
    const next = s.mocks[1].status !== 'submitted' ? 1 : 2;
    root.innerHTML = `<div class="page narrow">${emptyState('Your combined report needs both mocks', `The report compares Mock 1 and Mock 2 so that one lucky or unlucky question does not decide a topic. ${next === 2 ? 'Mock 1 is done; one more to go.' : ''}`, `<div class="row"><a class="btn primary" href="#mock-${next}">${next === 1 ? 'Start' : 'Continue to'} Mock ${next}</a>${next === 2 ? '<a class="btn" href="#results-1">Mock 1 results</a>' : ''}</div>`)}</div>`;
    return;
  }
  const p = d.baseline;
  const m1 = buildProfile(d.mockAtt.filter(a => a.mock === 1));
  const m2 = buildProfile(d.mockAtt.filter(a => a.mock === 2));
  const statusCount = k => TOPICS.filter(t => p.topics[t.id].status === k).length;
  const consistent = TOPICS.filter(t => p.topics[t.id].consistency === 'consistent').length;
  const inconsistent = TOPICS.filter(t => p.topics[t.id].inconsistent);
  const both = TOPICS.filter(t => ['consistent', 'inconsistent'].includes(p.topics[t.id].consistency)).length;

  const sectionRows = SECTIONS.map(sec => {
    const a = m1.sections.find(x => x.id === sec.id), b = m2.sections.find(x => x.id === sec.id), c = p.sections.find(x => x.id === sec.id);
    const self = s.student.selfConfidence?.[sec.id];
    return { sec, a, b, c, self };
  });

  root.innerHTML = `
  <div class="page">
    <div class="page-head">
      <p class="eyebrow">Combined diagnostic report · Mock 1 + Mock 2 · measured results</p>
      <h1>Your diagnostic baseline</h1>
      <p>Built from ${p.overall.total} questions across both mocks. Practice you do later is tracked separately on the Progress page, so this baseline stays comparable.</p>
    </div>

    <div class="grid-4">
      <div class="card stat"><span class="value">${m1.overall.marks} → ${m2.overall.marks}</span><span class="label">Marks, Mock 1 → Mock 2 (of ${m1.overall.maxMarks})</span></div>
      <div class="card stat"><span class="value">${pct(p.overall.accuracy)}</span><span class="label">Overall accuracy</span><span class="note">${p.overall.correct}/${p.overall.attempted} attempted</span></div>
      <div class="card stat"><span class="value">${pct(p.overall.attemptRate)}</span><span class="label">Attempt rate</span></div>
      <div class="card stat"><span class="value">${p.overall.negative}</span><span class="label">Marks lost to negative marking</span></div>
    </div>

    <div class="grid-2">
      <div class="card stack"><h3>Section accuracy, Mock 1 vs Mock 2</h3>
        ${groupedBarChart({ categories: SECTIONS.map(x => x.short), series: [{ name: 'Mock 1', values: sectionRows.map(r => Math.round((r.a.accuracy ?? 0) * 100)) }, { name: 'Mock 2', values: sectionRows.map(r => Math.round((r.b.accuracy ?? 0) * 100)) }], max: 100, valueFmt: v => `${v}%`, unit: 'accuracy of attempted questions' })}
      </div>
      <div class="card stack"><h3>Measured vs how you rated yourself</h3>
        <p class="small muted">Self-ratings from onboarding are shown for reflection only. They do not affect any label.</p>
        <div class="table-wrap"><table><thead><tr><th>Section</th><th class="num">Your rating</th><th class="num">Accuracy</th><th class="num">Marks</th><th class="num">Avg time</th></tr></thead><tbody>
        ${sectionRows.map(r => `<tr><td>${r.sec.short}</td><td class="num">${r.self ?? '—'}/5</td><td class="num">${pct(r.c.accuracy)}</td><td class="num">${r.c.marks}/${r.c.maxMarks}</td><td class="num">${mins(r.c.avgTimeSec)}</td></tr>`).join('')}
        </tbody></table></div>
        ${calibrationNote(sectionRows)}
      </div>
    </div>

    <div class="card stack">
      <div class="row between"><h3>Topic classification</h3>
        <div class="row small">${['strong', 'developing', 'weak', 'insufficient'].map(k => `${statusPill(k)} <span class="mono">${statusCount(k)}</span>`).join(' ')}</div></div>
      <p class="small muted">Adjusted accuracy weights answers by difficulty, gives partial credit for correct guesses, and is smoothed towards 50% so that two answers never read as 0% or 100%. Speed is median time ÷ expected time.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Topic</th><th>Status</th><th class="num">Correct</th><th class="num">Mock 1</th><th class="num">Mock 2</th><th class="num">Adj. accuracy</th><th class="num">Speed</th><th>Confidence</th></tr></thead>
        <tbody>${SECTIONS.map(sec => `<tr><td colspan="8" class="eyebrow" style="background:var(--sunken)">${sec.name}</td></tr>` + TOPICS.filter(t => t.section === sec.id).map(t => {
          const x = p.topics[t.id];
          return `<tr><td><details class="disclose"><summary><b>${esc(t.name)}</b></summary><ul class="small muted" style="margin:6px 0 0;padding-left:16px">${x.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details></td>
            <td>${statusPill(x.status)}</td><td class="num">${x.correct}/${x.attempted}${x.skipped ? ` <span class="muted">(+${x.skipped} skip)</span>` : ''}</td>
            <td class="num">${x.byMock[1].attempted ? `${x.byMock[1].correct}/${x.byMock[1].attempted}` : '—'}</td><td class="num">${x.byMock[2].attempted ? `${x.byMock[2].correct}/${x.byMock[2].attempted}` : '—'}</td>
            <td class="num">${pct(x.adjAccuracy)}</td><td class="num">${x.speedRatio != null ? x.speedRatio.toFixed(1) + '×' : '—'}</td><td>${x.confidenceLabel}${x.inconsistent ? ' <span class="tag">inconsistent</span>' : ''}</td></tr>`;
        }).join('')).join('')}</tbody>
      </table></div>
      <p class="small muted">Rules: <b>Strong</b> = adjusted accuracy ≥ 70%, speed ≤ 1.25× and consistent across mocks. <b>Weak</b> = at least 2 errors, adjusted accuracy below 45%, and at least one error on an easy or medium question. <b>Insufficient evidence</b> = fewer than 2 attempted questions. Everything else is <b>Developing</b>.</p>
    </div>

    <div class="grid-2">
      <div class="card stack"><h3>Consistency between mocks</h3>
        <p>${both} topic${both === 1 ? '' : 's'} had attempts in both mocks. ${consistent} gave consistent results${inconsistent.length ? `; ${inconsistent.length} did not: ${inconsistent.map(t => esc(t.name)).join(', ')}` : ''}.</p>
        ${inconsistent.length ? '<p class="callout warn small">Inconsistent topics are never labelled Strong, and their confidence is reduced. The plan schedules extra evidence before committing time to them.</p>' : '<p class="callout good small">Your two mocks broadly agree, which makes the topic labels more reliable.</p>'}
        <p class="small muted">Some topics appear in only one mock (for example, arrangement sets in Mock 1 and grouping sets in Mock 2), so consistency cannot be checked for them.</p>
      </div>
      <div class="card stack"><h3>Performance by difficulty</h3>
        ${p.difficulty.map(x => `<div class="factor"><span style="text-transform:capitalize">${x.difficulty} <span class="muted">(${x.attempted}/${x.total})</span></span>${bar(x.accuracy ?? 0)}<span class="num">${pct(x.accuracy)}</span></div>`).join('')}
        <p class="small muted">Average time on attempted questions: ${p.difficulty.map(x => `${x.difficulty} ${mins(x.avgTimeSec)}`).join(' · ')}.</p>
      </div>
    </div>

    <div class="card stack"><h3>DILR set selection</h3>
      <div class="table-wrap"><table><thead><tr><th>Mock</th><th>Set</th><th>Difficulty</th><th class="num">Solved</th><th class="num">Time</th><th>Outcome</th></tr></thead><tbody>
      ${p.sets.map(x => `<tr><td class="num">${x.mock}</td><td>${esc(x.title)}</td><td style="text-transform:capitalize">${x.difficulty}</td><td class="num">${x.correct}/${x.total}</td><td class="num">${mins(x.spentSec)}</td><td>${esc(x.verdict)}</td></tr>`).join('')}
      </tbody></table></div>
      ${p.setInsights.map(t => `<p class="callout info small">${esc(t)}</p>`).join('')}
    </div>

    <div class="card stack small"><h3>Scoring assumptions</h3>
      <p>CAT-style marking: MCQ +${SCORING.mcq.correct} correct, ${SCORING.mcq.wrong} wrong; TITA +${SCORING.tita.correct} correct, no negative marking; unattempted 0. Each diagnostic has 20 questions in 45 minutes (a full CAT has 66–68 in 120), so marks here are not comparable to a CAT score or percentile. With one or two questions per topic per mock, labels are a starting hypothesis that practice will refine.</p>
    </div>

    <div class="row"><a class="btn primary" href="#plan">See your prioritised plan</a><a class="btn" href="#results-1">Mock 1 review</a><a class="btn" href="#results-2">Mock 2 review</a></div>
  </div>`;
}

function calibrationNote(rows) {
  const notes = rows.filter(r => r.self && r.c.accuracy != null).map(r => {
    const measured = r.c.accuracy;
    if (r.self >= 4 && measured < 0.5) return `${r.sec.short}: you rated yourself ${r.self}/5, but measured accuracy is ${pct(measured)}.`;
    if (r.self <= 2 && measured >= 0.7) return `${r.sec.short}: you rated yourself ${r.self}/5, yet scored ${pct(measured)}. You may be stronger here than you think.`;
    return null;
  }).filter(Boolean);
  return notes.length ? notes.map(n => `<p class="callout warn small">${esc(n)}</p>`).join('') : '<p class="small muted">Your self-ratings broadly match your measured results.</p>';
}
