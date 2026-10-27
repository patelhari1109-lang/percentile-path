// Topic taxonomy.
// qPerPaper: ESTIMATED questions per CAT paper. Section totals (VARC 24, DILR 22, QA 22)
// follow the CAT pattern used since 2021; the split across topics is our assumption from
// the typical distribution of recent papers, not an official figure.
// conceptHours: estimated study time to move from weak to developing.
// speedHours: estimated time for speed work on a topic that is already accurate.

export const SECTIONS = [
  { id: 'VARC', name: 'Verbal Ability & Reading Comprehension', short: 'VARC', questions: 24 },
  { id: 'DILR', name: 'Data Interpretation & Logical Reasoning', short: 'DILR', questions: 22 },
  { id: 'QA', name: 'Quantitative Ability', short: 'Quant', questions: 22 },
];

export const TOPICS = [
  { id: 'rc-main', section: 'VARC', name: 'RC: Main idea & structure', qPerPaper: 5, conceptHours: 3, speedHours: 1.5, prereqs: [] },
  { id: 'rc-inference', section: 'VARC', name: 'RC: Inference', qPerPaper: 7, conceptHours: 4, speedHours: 2, prereqs: ['rc-main'] },
  { id: 'rc-tone', section: 'VARC', name: "RC: Author's tone & purpose", qPerPaper: 4, conceptHours: 2.5, speedHours: 1, prereqs: ['rc-main'] },
  { id: 'para-jumble', section: 'VARC', name: 'Para jumbles', qPerPaper: 2.5, conceptHours: 3, speedHours: 1.5, prereqs: [] },
  { id: 'para-summary', section: 'VARC', name: 'Para summaries', qPerPaper: 3, conceptHours: 2, speedHours: 1, prereqs: ['rc-main'] },
  { id: 'odd-sentence', section: 'VARC', name: 'Odd sentence out', qPerPaper: 2.5, conceptHours: 2, speedHours: 1, prereqs: ['para-jumble'] },

  { id: 'di-data', section: 'DILR', name: 'DI: Tables & charts', qPerPaper: 6, conceptHours: 4, speedHours: 2, prereqs: ['q-percent'] },
  { id: 'lr-arrange', section: 'DILR', name: 'Arrangements', qPerPaper: 5, conceptHours: 4, speedHours: 2, prereqs: [] },
  { id: 'lr-grouping', section: 'DILR', name: 'Grouping, selection & distribution', qPerPaper: 5, conceptHours: 4, speedHours: 2, prereqs: [] },
  { id: 'lr-constraints', section: 'DILR', name: 'Scheduling & logical constraints', qPerPaper: 6, conceptHours: 5, speedHours: 2.5, prereqs: ['lr-arrange', 'lr-grouping'] },

  { id: 'q-percent', section: 'QA', name: 'Percentages, profit & loss', qPerPaper: 3, conceptHours: 2, speedHours: 1, prereqs: [] },
  { id: 'q-ratio', section: 'QA', name: 'Ratios, averages & mixtures', qPerPaper: 3, conceptHours: 3, speedHours: 1.5, prereqs: ['q-percent'] },
  { id: 'q-tsd', section: 'QA', name: 'Time, speed, distance & work', qPerPaper: 3, conceptHours: 4, speedHours: 1.5, prereqs: ['q-ratio'] },
  { id: 'q-algebra', section: 'QA', name: 'Equations & inequalities', qPerPaper: 4, conceptHours: 5, speedHours: 2, prereqs: [] },
  { id: 'q-functions', section: 'QA', name: 'Functions & progressions', qPerPaper: 2, conceptHours: 4, speedHours: 1.5, prereqs: ['q-algebra'] },
  { id: 'q-geometry', section: 'QA', name: 'Geometry & mensuration', qPerPaper: 3.5, conceptHours: 6, speedHours: 2, prereqs: ['q-algebra'] },
  { id: 'q-numbers', section: 'QA', name: 'Number systems', qPerPaper: 2, conceptHours: 5, speedHours: 2, prereqs: [] },
  { id: 'q-modern', section: 'QA', name: 'Permutations, combinations & probability', qPerPaper: 1.5, conceptHours: 4, speedHours: 1.5, prereqs: ['q-numbers'] },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));

// Number of topics that list a topic as a prerequisite.
export const DEPENDENTS = Object.fromEntries(TOPICS.map(t => [t.id, TOPICS.filter(o => o.prereqs.includes(t.id)).map(o => o.id)]));
