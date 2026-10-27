# Percentile Path: personalised CAT preparation (MVP)

A working prototype of a free, self-study CAT preparation platform. Two diagnostic mocks measure topic-level accuracy and speed. A rules-based engine classifies 18 topics and ranks them by expected improvement per study hour, and a daily planner turns the ranking into activities that recalibrate the plan as you go.

**Live:** https://patelhari1109-lang.github.io/percentile-path/

## Run it locally

No build step, no dependencies, no API keys. The app is plain ES modules, so it needs to be served over HTTP rather than opened as a file:

```bash
cd ~/projects/cat-compass
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server works (`npx serve`, VS Code Live Server, and so on). Data is saved in the browser's `localStorage`, so a refresh keeps your progress.

Run the engine and question-bank tests (needs Node 18+):

```bash
node tests/engine.test.mjs
```

## User journey

Landing → onboarding (`#start`) → Diagnostic Mock 1 (`#mock-1`) → Mock 1 results (`#results-1`) → Diagnostic Mock 2 (`#mock-2`) → combined report (`#report`) → prioritised plan (`#plan`) → learning activities (`#learn-<mode>-<topic>`) → daily planner (`#today`) → progress (`#progress`). The dashboard (`#dashboard`) ties these together, and `#method` documents every rule.

**Demo mode.** The landing page and the How it works page can load one of four simulated students (fast and accurate, weak fundamentals, limited time, inconsistent evidence). Demo data is generated with a seeded random generator, is labelled with a banner on every screen, and replaces any data in the browser.

## Project layout

```
index.html               entry point
css/styles.css           design tokens (light and dark) and components
js/config.js             every tunable threshold and weight
js/data/topics.js        topic taxonomy, exam-relevance assumptions, prerequisites
js/data/mocks.js         Mock 1 and Mock 2: passages, DILR sets, 40 questions
js/data/learning.js      per-topic lessons and 54 practice questions
js/engine/scoring.js     CAT-style marking
js/engine/diagnostic.js  topic, section, difficulty and DILR-set analysis
js/engine/priority.js    priority score, categories, explanations
js/engine/planner.js     daily plan generation and refresh
js/engine/demo.js        simulated demo students
js/store.js              persistence, derived data, recalibration
js/ui/*.js               one module per screen
tests/engine.test.mjs    answer-key verification and engine tests
```

## Diagnostic engine

For each topic, using every attempted question:

- **Adjusted accuracy.** Correct answers earn credit weighted by difficulty (easy 0.8, medium 1, hard 1.25). Wrong answers weigh easy 1.25, medium 1, hard 0.7, so missing a hard question costs less. A correct answer flagged as a guess earns 60% credit. The result is smoothed towards 50% with one virtual question, so one or two answers never read as 0% or 100%.
- **Speed ratio.** Median of time taken ÷ expected solving time.
- **Consistency.** If Mock 1 and Mock 2 accuracy differ by 67 percentage points or more, the topic is inconsistent: it can't be labelled Strong, and its confidence drops by 30%.
- **Evidence confidence.** 1 − e^(−n/3) for n attempted questions.
- **Labels.** Insufficient evidence: fewer than 2 attempted. Strong: adjusted accuracy ≥ 70%, speed ≤ 1.25×, consistent. Weak: at least 2 wrong, adjusted accuracy < 45%, and at least one error on an easy or medium question. Developing: everything else. Skipped questions only reduce evidence; they are never counted as errors.
- **DILR sets** are also scored as units (time spent against expected time, and questions solved). The report flags set-selection problems, such as spending longer on the harder set while leaving the easier one unfinished.

Scoring follows CAT: MCQ +3 / −1, TITA +3 / 0, unattempted 0.

## Prioritisation engine

Five factors, each normalised to 0–1:

| Factor | Default weight | Definition |
|---|---|---|
| Exam relevance | 0.25 | Assumed questions per paper ÷ the maximum across topics |
| Performance gap | 0.20 | 1 − adjusted accuracy |
| Improvement potential | 0.15 | Realistic accuracy gain to a target (weak 60%, developing 75%, strong 85%) plus half the speed gap |
| Gain per study hour | 0.25 | Estimated marks per paper ÷ estimated hours, relative to the best topic |
| Prerequisite importance | 0.15 | Number of dependent topics (cut to 30% once the topic is strong) |

Score = 100 × weighted average × (0.6 + 0.4 × evidence confidence) × time feasibility. Time feasibility is 0.6 when a topic needs more than 8% of your remaining study hours. When fewer than 45 days or 60 hours remain, the efficiency weight goes up by 0.1, and the gap and prerequisite weights each go down by 0.05. You can change the weights on the How it works page.

Categories come from explicit rules, checked in this order:

1. Insufficient evidence → **Needs evidence**: a 3-question check.
2. Strong → **Speed optimisation**: Solve Faster.
3. Adjusted accuracy ≥ 60% and slow → **Quick win** (accurate but slow).
4. Developing, adjusted accuracy ≥ 45%, a refresher of 2 hours or less, and relevance ≥ 0.4 → **Quick win** (close to consistent).
5. Not strong, unlocks at least 2 topics, and needs 3 hours or less → **Quick win** (prerequisite unlock).
6. Weak → **Concept building**, unless relevance < 0.35, it needs at least 4 hours, and time is tight. In that case it becomes **Low priority**.
7. Any other developing topic → **Concept building**.

Every recommendation answers three questions: why this topic, why now, and what next. It also shows its factor breakdown, the rule it triggered, and how confident the evidence is.

## Daily planner and recalibration

The planner first schedules one 10-minute evidence check, if any topic needs one. It splits the remaining time by days left: more than 90 days gives 55/20/15/10% to concept, quick wins, speed and review; 30–90 days gives 45/25/20/10; under 30 days gives 25/40/25/10. Unused budget rolls into the next type.

Each finished activity adds its answers to the topic's evidence. Re-doing the same questions replaces your earlier answers rather than adding to them. The engine then rebuilds the ranking and regenerates the pending part of today's plan. A Strong topic that slips is flagged for revision, and a Weak topic that improves drops down the ranking. The diagnostic baseline is stored separately, so the Progress page can compare it with your current state.

## Question bank and provenance

- **40 diagnostic questions**, 20 per mock: VARC 6 (one RC passage with 3 questions, plus para jumble, para summary and odd sentence), DILR 6 (two sets of 3), and Quant 8. Mock 2 uses different questions on the same topics.
- **54 practice questions**: 3 per topic (easy, medium, hard) with hints and explanations. There are also 18 prerequisite-check questions.
- **Provenance.** Every question is original, written for this prototype in the CAT style. None is an official CAT previous-year question, and none is copied from a coaching institute's material. No questions were scraped. Each question carries a `provenance` field, and the full list is on the How it works page.
- **Verification.** `tests/engine.test.mjs` recomputes the arithmetic behind every Quant and DI answer key. It also brute-forces both DILR logic sets to confirm each has exactly the stated solution, and checks that every key, practice key included, scores as correct. VARC keys were checked by hand against the passages.

The diagnostic is much shorter than a real CAT (20 questions in 45 minutes, against 66–68 in 120). That keeps calibration to two sittings of under an hour each, but it gives only 1–2 questions per topic per mock. The engine handles this honestly through smoothing, confidence levels and the Needs evidence label.

## Known limitations

1. **Small evidence base.** With 2–6 diagnostic questions per topic, labels are hypotheses rather than verdicts. Practice adds at most 3 more questions per topic.
2. **Exam-relevance and study-hour figures are assumptions.** The CAT section totals are public, but the per-topic split and the hour estimates are judgement calls. They are labelled as such and kept in one file so they can be replaced with data.
3. **Single device, no accounts.** Data lives in one browser's `localStorage`. Clearing site data removes it.
4. **Fixed practice pool.** Each topic has 3 practice questions, so repeated sessions reuse them (repeats replace earlier answers rather than adding evidence).
5. **No sectional timing.** The diagnostic uses one shared timer instead of CAT's 40-minute sectional limits.

## Next three most valuable improvements

1. **Larger, calibrated question bank with item statistics.** Collect anonymous response data to estimate each question's real difficulty and solving time, then move from rule thresholds to an item-response model (for example, a Rasch model per topic). This would put real confidence intervals on topic proficiency.
2. **Adaptive evidence checks.** Choose the next practice question to cut the most uncertainty in the topics that matter most to the ranking. This would replace the fixed 3-question sets and make each minute of diagnosis count.
3. **Accounts and sync, with full-length sectional mocks.** A small backend for cross-device progress, plus 120-minute sectional mocks scored against a percentile model, so students can see their trajectory towards their target percentile.
