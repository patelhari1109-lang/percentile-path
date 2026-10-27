// Diagnostic Mock 1 and Mock 2.
// Every question here is ORIGINAL, written for this prototype in the CAT style.
// None is an official CAT previous-year question and none is taken from a coaching bank.
//
// Question schema:
//   id, mock, section, topic, subtopic, difficulty (easy|medium|hard), type (mcq|tita),
//   passageId | setId (optional), stem, options (mcq), answer (option index or TITA string),
//   expectedSec, explanation, prereqs (concepts the question relies on), provenance.

export const PASSAGES = {
  'p-repair': {
    title: 'Passage: the right to repair',
    paragraphs: [
      'For most of the twentieth century, repairing a broken object was an ordinary household competence. Radios came with circuit diagrams pasted inside their cabinets; cars were sold with manuals that assumed the owner would adjust the carburettor. Today, by contrast, many devices are glued shut, their parts serialised so that a replacement screen will not function unless the manufacturer authorises it. Defenders of this shift argue that sealed designs are thinner, more water-resistant and safer, and that untrained repairs cause more harm than they prevent.',
      'These arguments are not frivolous, but they conflate two different claims. The first is that some repairs are best left to specialists, a claim almost nobody disputes. The second is that only the manufacturer should decide who counts as a specialist. It is this second claim that the right-to-repair movement contests. Its advocates point out that when independent technicians are denied parts and documentation, the price of repair rises until replacement becomes the rational choice, and an object that might have lasted a decade is discarded after three years.',
      'The movement’s most interesting argument, however, is not economic but epistemic. An object that cannot be opened cannot be understood. Generations of engineers first learned their craft by dismantling household machines; a culture of sealed devices quietly removes that apprenticeship. What is lost is not merely a cheaper fix but a kind of literacy: the expectation that the things we own are intelligible to us.',
      'None of this requires romanticising the past. Many older appliances were dangerous, inefficient and short-lived in their own ways. The point is narrower. Design choices that make repair impossible are choices, and they distribute knowledge and power in particular directions.',
    ],
  },
  'p-railtime': {
    title: 'Passage: railway time',
    paragraphs: [
      'Before the railways, every town kept its own time. Noon was the moment the sun stood highest over the local church, and a traveller moving west from London to Bristol would find the clocks some ten minutes behind. For centuries this mattered to no one, because no one travelled fast enough to notice.',
      'The railways changed that. A timetable is a promise about simultaneity: it asserts that a train leaving one station at a certain hour will arrive at another at a certain hour, and the promise is meaningless unless both stations agree on what hour it is. In 1840 the Great Western Railway imposed London time on all its stations, and other companies soon followed. Towns that clung to local time found themselves keeping two clocks, sometimes on the same tower, one with an extra minute hand showing railway time.',
      'It is tempting to tell this story as the triumph of rationality over parochial habit. But that reading misses what the resisters understood. Local time was not an error awaiting correction; it was an accurate measurement of something real, the position of the sun over a particular place. Railway time was more useful, but it was also more abstract: it asked people to organise their days around a convention set in a distant capital rather than around the sky above them. The switch was less a discovery than a negotiation, and the side with the timetables won.',
      'Standard time was legally adopted across Britain only in 1880, decades after most clocks had already changed. The law, in other words, ratified a practice that commerce had already established.',
    ],
  },
};

export const SETS = {
  'set-bookshop': {
    title: 'Set A: bookshop sales',
    topic: 'di-data',
    difficulty: 'easy',
    intro: 'The table shows the number of books sold by a bookshop in four genres over three months, and the price of a book in each genre (constant across months).',
    table: {
      head: ['Genre', 'Jan', 'Feb', 'Mar', 'Price (₹)'],
      rows: [
        ['Fiction', 120, 150, 135, 300],
        ['Non-fiction', 80, 95, 110, 400],
        ['Comics', 60, 45, 75, 150],
        ['Poetry', 20, 30, 25, 250],
      ],
    },
  },
  'set-seats': {
    title: 'Set B: six seats',
    topic: 'lr-arrange',
    difficulty: 'medium',
    intro: 'Six friends, P, Q, R, S, T and U, sit in a row of six seats numbered 1 to 6 from left to right. All face the same direction.',
    rules: [
      'P sits at one of the two ends.',
      'U sits somewhere to the left of P.',
      'R sits in the seat immediately to the left of Q.',
      'S sits in seat 4.',
      'T does not sit next to S.',
    ],
  },
  'set-factories': {
    title: 'Set C: factory output',
    topic: 'di-data',
    difficulty: 'medium',
    intro: 'The chart shows the output (in thousand units) of four factories, F1 to F4, in 2024 and 2025.',
    chart: {
      unit: 'thousand units',
      categories: ['F1', 'F2', 'F3', 'F4'],
      series: [
        { name: '2024', values: [40, 60, 25, 75] },
        { name: '2025', values: [50, 54, 35, 81] },
      ],
    },
  },
  'set-teams': {
    title: 'Set D: project teams',
    topic: 'lr-grouping',
    difficulty: 'hard',
    intro: 'Seven students, A, B, C, D, E, F and G, are split into two project teams: Team X with four members and Team Y with three members. Every student is in exactly one team.',
    rules: [
      'A and B are in different teams.',
      'C and D are in the same team.',
      'If E is in Team X, then F is in Team Y.',
      'G is in Team Y.',
      'D is in Team X.',
    ],
  },
};

const Q = [];
const add = q => Q.push({ provenance: 'Original CAT-style question written for this prototype', ...q });

// ---------------- MOCK 1 ----------------
// VARC
add({ id: 'm1-v1', mock: 1, section: 'VARC', topic: 'rc-main', subtopic: 'Primary purpose', difficulty: 'medium', type: 'mcq', passageId: 'p-repair', expectedSec: 120,
  stem: 'The primary purpose of the passage is to:',
  options: [
    'argue that modern devices are less safe than older appliances.',
    'separate the defensible claim behind sealed designs from the contested one, and draw attention to a less obvious cost of such designs.',
    'trace the history of household repair from the twentieth century to the present.',
    'show that the right-to-repair movement is driven mainly by economic concerns.',
  ],
  answer: 1,
  explanation: 'Paragraph 2 splits the defenders’ position into two claims and says only the second is contested; paragraph 3 adds the "epistemic" cost (loss of a kind of literacy). Option B covers both moves. A is contradicted (the author grants safety arguments are "not frivolous"); C is too narrow, history is only the opening; D is contradicted, the author calls the economic argument less interesting than the epistemic one.',
  prereqs: ['Paragraph summaries', 'Scope of main idea'] });
add({ id: 'm1-v2', mock: 1, section: 'VARC', topic: 'rc-inference', subtopic: 'Author agreement', difficulty: 'hard', type: 'mcq', passageId: 'p-repair', expectedSec: 150,
  stem: 'The author would most likely agree with which of the following statements?',
  options: [
    'Independent technicians are generally more skilled than manufacturer-authorised ones.',
    'Sealed designs offer no genuine benefits to consumers.',
    'Whether a device can be repaired by independent technicians is partly the result of deliberate decisions, not only technical necessity.',
    'Older appliances were, on balance, better designed than modern devices.',
  ],
  answer: 2,
  explanation: 'The last paragraph states that "design choices that make repair impossible are choices", which supports C. A is never claimed. B contradicts "these arguments are not frivolous". D contradicts "none of this requires romanticising the past".',
  prereqs: ['Must-be-true test', 'Spotting extreme language'] });
add({ id: 'm1-v3', mock: 1, section: 'VARC', topic: 'rc-tone', subtopic: 'Attitude', difficulty: 'easy', type: 'mcq', passageId: 'p-repair', expectedSec: 75,
  stem: 'The author’s attitude towards the defenders of sealed designs is best described as:',
  options: [
    'dismissive and contemptuous.',
    'measured: granting their points some weight while identifying a confusion in their reasoning.',
    'wholly supportive.',
    'indifferent.',
  ],
  answer: 1,
  explanation: '"These arguments are not frivolous, but they conflate two different claims": a concession followed by a specific criticism. That is a measured stance, not contempt (A), support (C) or indifference (D).',
  prereqs: ['Concession signals'] });
add({ id: 'm1-v4', mock: 1, section: 'VARC', topic: 'para-jumble', subtopic: 'Four-sentence jumble', difficulty: 'medium', type: 'tita', expectedSec: 120,
  stem: 'The four sentences below, labelled 1 to 4, form a coherent paragraph when arranged correctly. Enter the correct order as a four-digit sequence (for example, 1234).',
  sentences: [
    'This is why the first draft of a policy is rarely the one that matters.',
    'Officials who implement a rule discover, within weeks, the cases its authors never imagined.',
    'Policies are written by people who must anticipate situations they have not yet seen.',
    'Their workarounds, reported upward, become the amendments that turn a rough draft into a working instrument.',
  ],
  answer: '3241',
  explanation: 'Sentence 3 introduces the general idea with no backward reference. Sentence 2 describes what happens in practice. "Their workarounds" in 4 must refer to the officials in 2. Sentence 1 ("This is why…") draws the conclusion, so it comes last: 3-2-4-1.',
  prereqs: ['Opening sentence test', 'Pronoun links'] });
add({ id: 'm1-v5', mock: 1, section: 'VARC', topic: 'para-summary', subtopic: 'Summary', difficulty: 'easy', type: 'mcq', expectedSec: 90,
  stem: 'Memory athletes who recall thousands of digits do not possess unusual brains. Studies of their neural activity show ordinary structures; what differs is technique. Most rely on the "method of loci", attaching each item to a location along an imagined route. The same technique, taught to ordinary volunteers for six weeks, produced substantial gains in recall and shifted their patterns of brain activity towards those of the champions.\n\nWhich option best captures the essence of the paragraph?',
  options: [
    'Memory champions have structurally superior brains that ordinary people cannot match.',
    'Exceptional memory feats owe more to learnable technique than to innate neural differences, as training studies suggest.',
    'The method of loci is the only effective memory technique known.',
    'Six weeks of training can turn anyone into a memory champion.',
  ],
  answer: 1,
  explanation: 'The paragraph claims technique, not brain structure, explains the feats, and backs this with a training study. B keeps both. A contradicts the passage; C ("only") and D ("anyone into a champion") overstate it.',
  prereqs: ['Central claim + support'] });
add({ id: 'm1-v6', mock: 1, section: 'VARC', topic: 'odd-sentence', subtopic: 'Odd one out', difficulty: 'medium', type: 'tita', expectedSec: 100,
  stem: 'Four of the five sentences below can be arranged into a coherent paragraph. Enter the number of the sentence that does not fit.',
  sentences: [
    'Coral reefs occupy a tiny fraction of the ocean floor.',
    'Yet they shelter a disproportionately large share of known marine species.',
    'This density of life depends on a partnership between coral polyps and the algae living in their tissues.',
    'Pearl divers in the Gulf historically held their breath for well over a minute.',
    'When water grows too warm, the polyps expel the algae, and the reef bleaches.',
  ],
  answer: '4',
  explanation: 'Sentences 1, 2, 3 and 5 trace one thread: reefs are small yet rich, that richness rests on the polyp-algae partnership, and heat breaks the partnership. Sentence 4 is about human divers and links to nothing else.',
  prereqs: ['Thread of argument'] });

// DILR
add({ id: 'm1-d1', mock: 1, section: 'DILR', topic: 'di-data', subtopic: 'Tables', difficulty: 'easy', type: 'mcq', setId: 'set-bookshop', expectedSec: 90,
  stem: 'In which month was the total number of books sold the highest?',
  options: ['January', 'February', 'March', 'February and March tied'], answer: 2,
  explanation: 'Totals: Jan 120+80+60+20 = 280; Feb 150+95+45+30 = 320; Mar 135+110+75+25 = 345. March is highest.',
  prereqs: ['Column totals'] });
add({ id: 'm1-d2', mock: 1, section: 'DILR', topic: 'di-data', subtopic: 'Tables', difficulty: 'medium', type: 'tita', setId: 'set-bookshop', expectedSec: 120,
  stem: 'What was the total revenue (in ₹) from non-fiction books over the three months?',
  answer: '114000',
  explanation: 'Non-fiction units: 80 + 95 + 110 = 285. Revenue = 285 × ₹400 = ₹1,14,000.',
  prereqs: ['Row totals', 'Unit price × quantity'] });
add({ id: 'm1-d3', mock: 1, section: 'DILR', topic: 'di-data', subtopic: 'Tables: share of total', difficulty: 'hard', type: 'mcq', setId: 'set-bookshop', expectedSec: 180,
  stem: 'In February, the share of the shop’s total revenue that came from fiction was closest to:',
  options: ['43.2%', '45.0%', '46.3%', '48.6%'], answer: 2,
  explanation: 'February revenue: fiction 150×300 = 45,000; non-fiction 95×400 = 38,000; comics 45×150 = 6,750; poetry 30×250 = 7,500. Total = 97,250. Share = 45,000 / 97,250 ≈ 0.4627, so 46.3%.',
  prereqs: ['Percentages', 'Share of total'] });
add({ id: 'm1-d4', mock: 1, section: 'DILR', topic: 'lr-arrange', subtopic: 'Linear arrangement', difficulty: 'easy', type: 'mcq', setId: 'set-seats', expectedSec: 150,
  stem: 'Who sits in seat 2?', options: ['T', 'R', 'Q', 'U'], answer: 1,
  explanation: 'Since U is left of P and P is at an end, P is in seat 6. S is in seat 4, so T (not next to S) is in seat 1 or 2. The block R-Q must fit in seats 1-2 or 2-3 (seats 3-4 and 5-6 are blocked). If R-Q took seats 1-2, T would have no seat, so R-Q is in seats 2-3, T is in seat 1 and U is in seat 5. Final order: T, R, Q, S, U, P. Seat 2 is R.',
  prereqs: ['Fixed positions first', 'Adjacent blocks'] });
add({ id: 'm1-d5', mock: 1, section: 'DILR', topic: 'lr-arrange', subtopic: 'Linear arrangement', difficulty: 'medium', type: 'mcq', setId: 'set-seats', expectedSec: 60,
  stem: 'Who sits immediately to the left of P?', options: ['S', 'Q', 'U', 'T'], answer: 2,
  explanation: 'From the unique arrangement T, R, Q, S, U, P, the person in seat 5 is U.',
  prereqs: ['Linear arrangement'] });
add({ id: 'm1-d6', mock: 1, section: 'DILR', topic: 'lr-constraints', subtopic: 'Counting cases', difficulty: 'medium', type: 'tita', setId: 'set-seats', expectedSec: 150,
  stem: 'If the condition "T does not sit next to S" is removed and all other conditions still hold, how many different seating arrangements are possible?',
  answer: '4',
  explanation: 'P stays in seat 6 and S in seat 4. The R-Q block can be in seats 1-2 or 2-3. In each case the two remaining seats go to T and U in either order (U is always left of P). 2 × 2 = 4.',
  prereqs: ['Case enumeration'] });

// QA
add({ id: 'm1-q1', mock: 1, section: 'QA', topic: 'q-percent', subtopic: 'Mark-up and discount', difficulty: 'easy', type: 'tita', expectedSec: 75,
  stem: 'A shopkeeper marks an item 40% above its cost price and then offers a discount of 15% on the marked price. What is the profit percentage?',
  answer: '19',
  explanation: 'Selling price = 1.40 × 0.85 × CP = 1.19 × CP. Profit = 19%.',
  prereqs: ['Multiplying factors'] });
add({ id: 'm1-q2', mock: 1, section: 'QA', topic: 'q-ratio', subtopic: 'Mixtures', difficulty: 'medium', type: 'tita', expectedSec: 120,
  stem: 'A 60-litre mixture contains milk and water in the ratio 7 : 3. How many litres of water must be added to make the ratio 3 : 2?',
  answer: '10',
  explanation: 'Milk = 42 L, water = 18 L. Milk is unchanged: 42 / (18 + x) = 3/2, so 18 + x = 28 and x = 10.',
  prereqs: ['Invariant component in mixtures'] });
add({ id: 'm1-q3', mock: 1, section: 'QA', topic: 'q-tsd', subtopic: 'Time and work', difficulty: 'medium', type: 'tita', expectedSec: 120,
  stem: 'A can complete a piece of work in 12 days and B in 18 days. They work together for 4 days, after which A leaves. In how many more days will B finish the work?',
  answer: '8',
  explanation: 'Take total work = 36 units (LCM). A does 3/day, B does 2/day. In 4 days together: 20 units. Remaining 16 units at 2/day = 8 days.',
  prereqs: ['Work as rates', 'LCM method'] });
add({ id: 'm1-q4', mock: 1, section: 'QA', topic: 'q-algebra', subtopic: 'Modulus inequality', difficulty: 'medium', type: 'tita', expectedSec: 150,
  stem: 'How many integer values of x satisfy |x − 3| + |x + 2| ≤ 9?',
  answer: '10',
  explanation: 'For −2 ≤ x ≤ 3 the sum is always 5. For x > 3: 2x − 1 ≤ 9 gives x ≤ 5. For x < −2: 1 − 2x ≤ 9 gives x ≥ −4. So −4 ≤ x ≤ 5: 10 integers.',
  prereqs: ['Modulus as distance', 'Counting integers in an interval'] });
add({ id: 'm1-q5', mock: 1, section: 'QA', topic: 'q-functions', subtopic: 'Arithmetic progression', difficulty: 'medium', type: 'tita', expectedSec: 105,
  stem: 'The sum of the first n terms of an arithmetic progression is 3n² + 5n. What is its 10th term?',
  answer: '62',
  explanation: 'T10 = S10 − S9 = (300 + 50) − (243 + 45) = 350 − 288 = 62. (In general Tn = 6n + 2.)',
  prereqs: ['Tn = Sn − S(n−1)'] });
add({ id: 'm1-q6', mock: 1, section: 'QA', topic: 'q-geometry', subtopic: 'Inradius', difficulty: 'easy', type: 'mcq', expectedSec: 90,
  stem: 'A right-angled triangle has legs of 9 cm and 12 cm. What is the radius of its inscribed circle?',
  options: ['2 cm', '3 cm', '4 cm', '4.5 cm'], answer: 1,
  explanation: 'Hypotenuse = 15 (3-4-5 triplet × 3). For a right triangle r = (a + b − c)/2 = (9 + 12 − 15)/2 = 3. Check: Area/s = 54/18 = 3.',
  prereqs: ['Pythagorean triplets', 'r = Area / s'] });
add({ id: 'm1-q7', mock: 1, section: 'QA', topic: 'q-numbers', subtopic: 'Remainders of powers', difficulty: 'hard', type: 'tita', expectedSec: 150,
  stem: 'What is the remainder when 7¹⁰³ is divided by 25?',
  answer: '18',
  explanation: '7² = 49 ≡ −1 (mod 25), so 7¹⁰⁰ = (7²)⁵⁰ ≡ 1. Then 7¹⁰³ ≡ 7³ = 343 ≡ 343 − 325 = 18.',
  prereqs: ['Negative remainders', 'Splitting exponents'] });
add({ id: 'm1-q8', mock: 1, section: 'QA', topic: 'q-modern', subtopic: 'Arrangements with repetition', difficulty: 'easy', type: 'tita', expectedSec: 75,
  stem: 'In how many distinct ways can the letters of the word LEVEL be arranged?',
  answer: '30',
  explanation: 'LEVEL has 5 letters with L twice and E twice. Arrangements = 5! / (2! × 2!) = 120 / 4 = 30.',
  prereqs: ['Dividing by repeats'] });

// ---------------- MOCK 2 ----------------
add({ id: 'm2-v1', mock: 2, section: 'VARC', topic: 'rc-main', subtopic: 'Main idea', difficulty: 'medium', type: 'mcq', passageId: 'p-railtime', expectedSec: 120,
  stem: 'Which of the following best captures the main point of the passage?',
  options: [
    'Railway companies deliberately suppressed local customs to increase their profits.',
    'Local time was scientifically inaccurate and was rightly abandoned.',
    'The adoption of standard time is better understood as a practical convention prevailing over an accurate local measure than as the correction of an error.',
    'British law played the decisive role in introducing standard time.',
  ],
  answer: 2,
  explanation: 'Paragraph 3 is the core: local time "was not an error" and the switch "was less a discovery than a negotiation". C states this. B contradicts it; A invents a profit motive; D contradicts the last paragraph, where the law merely ratified existing practice.',
  prereqs: ['Locating the pivot ("But…")'] });
add({ id: 'm2-v2', mock: 2, section: 'VARC', topic: 'rc-inference', subtopic: 'Detail inference', difficulty: 'easy', type: 'mcq', passageId: 'p-railtime', expectedSec: 75,
  stem: 'It can be inferred from the passage that, before the railways, differences in local time went largely unnoticed mainly because:',
  options: [
    'clocks were too imprecise to show them.',
    'travel was too slow for the differences to cause practical problems.',
    'the Church opposed any common standard.',
    'most towns already followed London time.',
  ],
  answer: 1,
  explanation: '"For centuries this mattered to no one, because no one travelled fast enough to notice." Only B is supported. A and C are not mentioned; D contradicts the first sentence.',
  prereqs: ['Returning to the cited line'] });
add({ id: 'm2-v3', mock: 2, section: 'VARC', topic: 'rc-tone', subtopic: 'Purpose of a phrase', difficulty: 'hard', type: 'mcq', passageId: 'p-railtime', expectedSec: 120,
  stem: 'The phrase "the side with the timetables won" primarily serves to:',
  options: [
    'celebrate the efficiency of the railway companies.',
    'suggest that the outcome reflected practical leverage rather than the superior truth of one system.',
    'mock the towns that resisted railway time.',
    'imply that the law of 1880 was unnecessary.',
  ],
  answer: 1,
  explanation: 'The phrase closes the sentence "less a discovery than a negotiation": one side prevailed because it held the practical lever (timetables), not because it was more correct. That is B. The author is sympathetic to the resisters, so not C, and is not celebrating (A). D concerns a different paragraph.',
  prereqs: ['Function of a line in the argument'] });
add({ id: 'm2-v4', mock: 2, section: 'VARC', topic: 'para-jumble', subtopic: 'Four-sentence jumble', difficulty: 'medium', type: 'tita', expectedSec: 120,
  stem: 'The four sentences below, labelled 1 to 4, form a coherent paragraph when arranged correctly. Enter the correct order as a four-digit sequence.',
  sentences: [
    'A map that showed every detail would have to be as large as the territory itself.',
    'Usefulness, in other words, comes from what a map leaves out.',
    'Such a map would be perfectly accurate and perfectly useless.',
    'Every cartographer therefore begins not by drawing but by deciding what to ignore.',
  ],
  answer: '1324',
  explanation: '1 sets up the thought experiment; "Such a map" in 3 refers to it. 2 restates the lesson of 3 ("in other words": useless, so usefulness comes from omission). 4 draws the practical consequence ("therefore"). Order 1-3-2-4.',
  prereqs: ['Demonstratives ("Such")', 'Connectors ("in other words", "therefore")'] });
add({ id: 'm2-v5', mock: 2, section: 'VARC', topic: 'para-summary', subtopic: 'Summary', difficulty: 'medium', type: 'mcq', expectedSec: 105,
  stem: 'Many cities have tried to reduce traffic by building more roads, only to find congestion returning within a few years. Economists call this induced demand: when driving becomes easier, people make trips they previously avoided, choose more distant homes and jobs, and switch from buses to cars. The new capacity is absorbed until travel becomes as slow as before. Conversely, when roads are closed, some traffic simply disappears rather than moving elsewhere.\n\nWhich option best captures the essence of the paragraph?',
  options: [
    'Road building is always wasteful and should be abandoned.',
    'Because travel behaviour adjusts to available capacity, adding roads tends not to reduce congestion in the long run, while removing roads can reduce traffic.',
    'Congestion is caused mainly by people switching from buses to cars.',
    'Economists disagree about whether new roads reduce traffic.',
  ],
  answer: 1,
  explanation: 'The paragraph explains induced demand (behaviour adjusts to capacity) and its converse (closures remove traffic). B keeps both halves. A adds a recommendation and "always"; C picks one mechanism; D invents a disagreement.',
  prereqs: ['Keep the logical relationship'] });
add({ id: 'm2-v6', mock: 2, section: 'VARC', topic: 'odd-sentence', subtopic: 'Odd one out', difficulty: 'medium', type: 'tita', expectedSec: 100,
  stem: 'Four of the five sentences below can be arranged into a coherent paragraph. Enter the number of the sentence that does not fit.',
  sentences: [
    'The first mechanical clocks in medieval Europe had no minute hands.',
    'They were built to ring bells marking the hours of prayer in monasteries.',
    'Precision to the minute served no purpose in a day organised around these offices.',
    'Minute hands became common only when finer coordination of work and travel demanded them.',
    'Sundials, by contrast, are useless at night or under cloud.',
  ],
  answer: '5',
  explanation: 'The thread is why early clocks lacked minute hands and when they gained them (1 → 2 → 3 → 4). Sentence 5 shares the subject of timekeeping but switches to a weakness of sundials, which no other sentence takes up.',
  prereqs: ['Same topic, different thread'] });

add({ id: 'm2-d1', mock: 2, section: 'DILR', topic: 'di-data', subtopic: 'Bar chart: growth', difficulty: 'easy', type: 'mcq', setId: 'set-factories', expectedSec: 90,
  stem: 'Which factory had the highest percentage growth in output from 2024 to 2025?', options: ['F1', 'F2', 'F3', 'F4'], answer: 2,
  explanation: 'F1: 10/40 = 25%. F2: −6/60 = −10%. F3: 10/25 = 40%. F4: 6/75 = 8%. F3 is highest.',
  prereqs: ['Percentage change on the old base'] });
add({ id: 'm2-d2', mock: 2, section: 'DILR', topic: 'di-data', subtopic: 'Bar chart: totals', difficulty: 'medium', type: 'tita', setId: 'set-factories', expectedSec: 105,
  stem: 'By what percentage was the total output of the four factories in 2025 higher than in 2024?',
  answer: '10',
  explanation: '2024 total = 40 + 60 + 25 + 75 = 200. 2025 total = 50 + 54 + 35 + 81 = 220. Increase = 20/200 = 10%.',
  prereqs: ['Totals', 'Percentage change'] });
add({ id: 'm2-d3', mock: 2, section: 'DILR', topic: 'di-data', subtopic: 'Bar chart: projection', difficulty: 'hard', type: 'mcq', setId: 'set-factories', expectedSec: 180,
  stem: 'Suppose that in 2026 F2’s output grows at the same percentage rate that F3’s output grew from 2024 to 2025, while the other three factories keep their 2025 output. F2’s share of total 2026 output would be closest to:',
  options: ['24.6%', '28.5%', '31.3%', '34.0%'], answer: 2,
  explanation: 'F3 grew 40%. F2 in 2026 = 54 × 1.4 = 75.6. Total = 50 + 75.6 + 35 + 81 = 241.6. Share = 75.6 / 241.6 ≈ 0.313, so 31.3%.',
  prereqs: ['Growth factors', 'Share of total'] });
add({ id: 'm2-d4', mock: 2, section: 'DILR', topic: 'lr-grouping', subtopic: 'Teams', difficulty: 'easy', type: 'mcq', setId: 'set-teams', expectedSec: 120,
  stem: 'Which of the following students must be in Team X?', options: ['A', 'C', 'E', 'G'], answer: 1,
  explanation: 'D is in Team X and C is with D, so C must be in Team X. A, E and G are not forced into X (G is in Y).',
  prereqs: ['"Together" rules'] });
add({ id: 'm2-d5', mock: 2, section: 'DILR', topic: 'lr-grouping', subtopic: 'Counting valid groupings', difficulty: 'medium', type: 'tita', setId: 'set-teams', expectedSec: 150,
  stem: 'How many different ways can the two teams be formed?',
  answer: '4',
  explanation: 'Team X has C, D and one of A/B; Team Y has G and the other of A/B. That leaves one place in each team for E and F. If E is in X, F is in Y (allowed by the rule). If F is in X, E is in Y (the rule is not triggered). So A/B: 2 ways × E/F: 2 ways = 4.',
  prereqs: ['Capacity counting', 'Conditional rules'] });
add({ id: 'm2-d6', mock: 2, section: 'DILR', topic: 'lr-constraints', subtopic: 'Added condition', difficulty: 'hard', type: 'mcq', setId: 'set-teams', expectedSec: 150,
  stem: 'If, in addition, A and E cannot be in the same team, and B is in Team Y, which of the following must be true?',
  options: ['E is in Team X', 'F is in Team X', 'A is in Team Y', 'D is in Team Y'], answer: 1,
  explanation: 'B in Y means A is in X. A and E apart means E is in Y. Team X needs a fourth member and only F is left, so F is in X. Team X = A, C, D, F; Team Y = B, E, G.',
  prereqs: ['Applying a new condition to the base solution'] });

add({ id: 'm2-q1', mock: 2, section: 'QA', topic: 'q-percent', subtopic: 'Expenditure', difficulty: 'easy', type: 'tita', expectedSec: 75,
  stem: 'The price of sugar rises by 25%. By what percentage must a household reduce its consumption so that its expenditure on sugar is unchanged?',
  answer: '20',
  explanation: 'Expenditure = price × quantity. New price factor 5/4, so quantity factor must be 4/5: a reduction of 1/5 = 20%. Shortcut: r/(100 + r) = 25/125 = 20%.',
  prereqs: ['Fraction-percentage equivalents'] });
add({ id: 'm2-q2', mock: 2, section: 'QA', topic: 'q-ratio', subtopic: 'Averages', difficulty: 'medium', type: 'tita', expectedSec: 105,
  stem: 'The average of 12 numbers is 40. When two of the numbers are removed, the average of the remaining numbers is 38. If one of the removed numbers is 55, what is the other?',
  answer: '45',
  explanation: 'Total = 480. Remaining total = 10 × 38 = 380. Removed sum = 100, so the other number = 100 − 55 = 45.',
  prereqs: ['Average × count = sum'] });
add({ id: 'm2-q3', mock: 2, section: 'QA', topic: 'q-tsd', subtopic: 'Boats and streams', difficulty: 'hard', type: 'tita', expectedSec: 180,
  stem: 'A boat travels 30 km upstream and 44 km downstream in 10 hours. It travels 40 km upstream and 55 km downstream in 13 hours. What is the speed of the boat in still water, in km/h?',
  answer: '8',
  explanation: 'Let u = 1/(upstream speed), d = 1/(downstream speed). 30u + 44d = 10 and 40u + 55d = 13. Multiply by 4 and 3: 120u + 176d = 40 and 120u + 165d = 39, so 11d = 1, d = 1/11. Then 30u = 6, u = 1/5. Upstream 5 km/h, downstream 11 km/h, still-water speed = (5 + 11)/2 = 8.',
  prereqs: ['Relative speed', 'Linear equations in reciprocals'] });
add({ id: 'm2-q4', mock: 2, section: 'QA', topic: 'q-algebra', subtopic: 'Quadratic roots', difficulty: 'medium', type: 'tita', expectedSec: 105,
  stem: 'The roots of x² − 7x + k = 0 differ by 3. What is the value of k?',
  answer: '10',
  explanation: 'Sum of roots = 7 and difference = 3, so the roots are 5 and 2. k = product = 10.',
  prereqs: ['Sum and product of roots'] });
add({ id: 'm2-q5', mock: 2, section: 'QA', topic: 'q-functions', subtopic: 'Composition', difficulty: 'hard', type: 'tita', expectedSec: 150,
  stem: 'Let f(x) = 2x + 3 and g(x) = x² − 1. What is the sum of all real x for which f(g(x)) = g(f(x))?',
  answer: '-6',
  explanation: 'f(g(x)) = 2(x² − 1) + 3 = 2x² + 1. g(f(x)) = (2x + 3)² − 1 = 4x² + 12x + 8. Setting equal: 2x² + 12x + 7 = 0. Discriminant 144 − 56 = 88 > 0, so both roots are real and their sum is −12/2 = −6.',
  prereqs: ['Function composition', 'Sum of roots'] });
add({ id: 'm2-q6', mock: 2, section: 'QA', topic: 'q-geometry', subtopic: 'Circle in square', difficulty: 'medium', type: 'tita', expectedSec: 105,
  stem: 'A circle is inscribed in a square of side 14 cm. What is the area (in sq cm) of the region in ONE corner of the square that lies outside the circle? (Take π = 22/7.)',
  answer: '10.5',
  explanation: 'Square = 196, circle = (22/7) × 49 = 154. Region outside the circle = 42, split equally among 4 corners: 10.5.',
  prereqs: ['Area of circle', 'Symmetry'] });
add({ id: 'm2-q7', mock: 2, section: 'QA', topic: 'q-numbers', subtopic: 'Factors', difficulty: 'medium', type: 'tita', expectedSec: 105,
  stem: 'How many factors of 360 are perfect squares?',
  answer: '4',
  explanation: '360 = 2³ × 3² × 5. A square factor uses even powers: 2 ∈ {0, 2}, 3 ∈ {0, 2}, 5 ∈ {0}. 2 × 2 × 1 = 4 (they are 1, 4, 9, 36).',
  prereqs: ['Prime factorisation'] });
add({ id: 'm2-q8', mock: 2, section: 'QA', topic: 'q-modern', subtopic: 'Probability with dice', difficulty: 'medium', type: 'mcq', expectedSec: 105,
  stem: 'Two fair six-sided dice are rolled. What is the probability that the sum of the numbers shown is a prime number?',
  options: ['1/3', '7/18', '5/12', '4/9'], answer: 2,
  explanation: 'Prime sums and their counts: 2 (1), 3 (2), 5 (4), 7 (6), 11 (2) = 15 outcomes out of 36. 15/36 = 5/12.',
  prereqs: ['Counting outcomes'] });

export const QUESTIONS = Q;
export const QUESTION_BY_ID = Object.fromEntries(Q.map(q => [q.id, q]));
export const MOCKS = {
  1: { id: 1, name: 'Diagnostic Mock 1', purpose: 'Builds your first topic-level profile.', questions: Q.filter(q => q.mock === 1).map(q => q.id) },
  2: { id: 2, name: 'Diagnostic Mock 2', purpose: 'Checks whether Mock 1 findings hold up on different questions.', questions: Q.filter(q => q.mock === 2).map(q => q.id) },
};
