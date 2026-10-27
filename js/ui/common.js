import { STATUS_LABEL, CATEGORY_LABEL, MODE_LABEL } from '../engine/priority.js';
import { TOPIC_BY_ID } from '../data/topics.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const pct = (x, digits = 0) => (x == null ? '—' : `${(x * 100).toFixed(digits)}%`);
export const mmss = sec => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
export const mins = sec => (sec == null ? '—' : sec < 90 ? `${Math.round(sec)}s` : `${(sec / 60).toFixed(1)} min`);
export const round1 = x => Math.round(x * 10) / 10;
export const topicName = id => TOPIC_BY_ID[id]?.name || id;

export const statusPill = s => `<span class="pill ${s}">${STATUS_LABEL[s]}</span>`;
export const categoryPill = c => `<span class="pill ${c}">${CATEGORY_LABEL[c]}</span>`;
export const modeLabel = m => (m === 'review' ? 'Error-log review' : MODE_LABEL[m]);
export const LETTERS = ['A', 'B', 'C', 'D'];

export function bar(value, cls = '') {
  const v = Math.max(0, Math.min(1, value || 0));
  return `<div class="bar ${cls}" role="img" aria-label="${Math.round(v * 100)}%"><span style="width:${(v * 100).toFixed(1)}%"></span></div>`;
}

export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function dataTable(t) {
  return `<div class="table-wrap"><table><thead><tr>${t.head.map((h, i) => `<th class="${i ? 'num' : ''}">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${t.rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// Grouped vertical bar chart drawn to a single linear scale.
export function groupedBarChart({ categories, series, unit, max, height = 220, valueFmt = v => v, colors }) {
  const W = 520, H = height, padL = 40, padB = 28, padT = 16, padR = 8;
  const top = max ?? niceMax(Math.max(...series.flatMap(s => s.values)));
  const ticks = 4;
  const plotH = H - padB - padT, plotW = W - padL - padR;
  const groupW = plotW / categories.length;
  const barW = Math.min(28, (groupW * 0.7) / series.length);
  const y = v => padT + plotH - (v / top) * plotH;
  const cols = colors || ['var(--muted)', 'var(--accent)', 'var(--strong)'];
  let g = '';
  for (let i = 0; i <= ticks; i++) {
    const v = (top / ticks) * i;
    g += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${valueFmt(round1(v))}</text>`;
  }
  categories.forEach((c, ci) => {
    const gx = padL + ci * groupW + (groupW - barW * series.length) / 2;
    series.forEach((s, si) => {
      const v = s.values[ci] ?? 0;
      g += `<rect x="${gx + si * barW}" y="${y(v)}" width="${barW - 3}" height="${Math.max(0, padT + plotH - y(v))}" fill="${cols[si % cols.length]}" rx="2"><title>${esc(c)} ${esc(s.name)}: ${valueFmt(v)}</title></rect>`;
      if (series.length <= 3) g += `<text x="${gx + si * barW + (barW - 3) / 2}" y="${y(v) - 4}" text-anchor="middle" style="fill:var(--ink)">${valueFmt(v)}</text>`;
    });
    g += `<text x="${padL + ci * groupW + groupW / 2}" y="${H - 8}" text-anchor="middle">${esc(c)}</text>`;
  });
  return `<figure class="stack" style="margin:0"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart${unit ? ' in ' + esc(unit) : ''}">${g}</svg>
    <figcaption class="chart-legend">${series.map((s, i) => `<span><i style="background:${cols[i % cols.length]}"></i>${esc(s.name)}</span>`).join('')}${unit ? `<span>Values in ${esc(unit)}</span>` : ''}</figcaption></figure>`;
}
function niceMax(v) { const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000]; for (const s of steps) if (v <= s) return s; return Math.ceil(v / 100) * 100; }

export function contextBlock(ctx) {
  if (!ctx) return '';
  let html = '';
  if (ctx.paragraphs) html += ctx.paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
  if (ctx.intro) html += `<p>${esc(ctx.intro)}</p>`;
  if (ctx.table) html += `<div style="margin-top:12px">${dataTable(ctx.table)}</div>`;
  if (ctx.chart) html += `<div style="margin-top:12px">${groupedBarChart(ctx.chart)}</div>`;
  if (ctx.rules) html += `<ol class="rules">${ctx.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>`;
  return html;
}

// Renders a question body (stem, sentences, options or input). Used by mocks and practice.
export function questionBody(q, response, { name = 'ans', reveal = false, disabled = false } = {}) {
  let html = `<div class="stem">${esc(q.stem)}</div>`;
  if (q.sentences) html += `<ol class="sentences">${q.sentences.map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span></li>`).join('')}</ol>`;
  if (q.type === 'mcq') {
    html += `<div class="options" role="group" aria-label="Answer options">${q.options.map((o, i) => {
      let cls = '';
      if (reveal) cls = i === q.answer ? 'correct' : i === response ? 'incorrect' : '';
      return `<button type="button" class="option ${cls}" data-action="choose" data-i="${i}" aria-pressed="${response === i}" ${disabled ? 'disabled' : ''}><span class="key">${LETTERS[i]}</span><span>${esc(o)}</span></button>`;
    }).join('')}</div>`;
  } else {
    html += `<div class="field tita"><label for="${name}">Type your answer${q.sentences ? ' (digits only, e.g. 2143)' : ''}</label>
      <input id="${name}" type="text" inputmode="${q.sentences ? 'numeric' : 'decimal'}" autocomplete="off" value="${esc(response ?? '')}" ${disabled ? 'disabled' : ''} data-action="tita"></div>`;
  }
  return html;
}

export function emptyState(title, body, cta) {
  return `<div class="empty"><h3>${esc(title)}</h3><p class="muted">${body}</p>${cta || ''}</div>`;
}
