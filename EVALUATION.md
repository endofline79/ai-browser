# Evaluation Plan

## Purpose

Milestone 5 is not more extraction logic.

Milestone 5 is an evaluation and regression system that answers:

- is the extractor stable
- is it getting better or worse over time
- is the output actually useful for downstream AI agents

## Evaluation Goals

The evaluation system should measure:

- schema correctness
- extraction stability
- page classification quality
- main-content versus boilerplate separation
- usefulness of the output for downstream LLM reasoning
- runtime and output-size tradeoffs

## Test Layers

### 1. Fixture Tests

Use local pages that are fully controlled by the repo.

Purpose:

- deterministic regressions
- targeted edge cases
- easy diffing

Suggested fixture categories:

- simple document page
- article page
- documentation page
- table-heavy page
- form-heavy page
- app-like page
- page with heavy footer and navigation boilerplate
- page with poor accessibility markup

### 2. Live Canary Pages

Use a curated allowlist of real URLs.

Purpose:

- real-world coverage
- ongoing smoke tests against the modern web

Suggested categories:

- homepage
- blog or news article
- docs page
- search page
- ecommerce/product page
- JS-heavy landing page
- app-like page
- multilingual or link-dense page

Keep the list small and intentional at first.

### 3. Agent Utility Tests

Use an LLM judge on top of the extractor output.

Purpose:

- test whether the extracted output helps an AI answer useful questions

Suggested prompt tasks:

- what is this page about
- what is the main heading
- is this a document or an application
- what content is likely boilerplate
- what actions or controls are available
- what are the key sections

The judge should score answers against expected outcomes from the corpus.

## Corpus Design

Use a manifest for each evaluated page.

Each entry should include:

- page id
- url or fixture path
- category
- expected page kind
- expected main heading
- expected keywords in main content
- expected boilerplate keywords
- expected controls count range if relevant
- notes

## Output Artifacts

Every evaluation run should produce:

- raw `page.json`
- raw `page.md`
- structured run result JSON
- summary Markdown report

The report should include:

- URL
- predicted page kind
- extraction confidence
- primary, supporting, and boilerplate text counts
- number of links and controls
- warnings
- pass/fail per check
- diffs versus previous baseline where relevant

## Core Checks

### Structural Checks

- extractor did not crash
- output is valid JSON
- required top-level fields exist
- document tree exists
- quality labels exist on blocks

### Semantic Checks

- page kind matches expectation
- main heading matches expectation
- expected keywords appear in primary or supporting content
- known boilerplate keywords are not promoted to main content
- control extraction is within expected range

### Stability Checks

- same page run twice does not produce large unexpected diffs
- confidence does not swing wildly between repeated runs
- major block ids and labels remain reasonably stable

### Performance Checks

- runtime stays within budget
- output size stays within budget

## Suggested Metrics

- classification accuracy
- primary-content precision
- boilerplate suppression rate
- confidence calibration
- median extraction runtime
- median output token estimate
- crash rate

## LLM Judge Design

The LLM judge should not be allowed to browse freely.

It should receive:

- the extractor output
- a small rubric
- a structured question set

It should return:

- score
- short justification
- failure mode tags

This keeps the LLM in the role of evaluator, not open-ended explorer.

## Agent Auditor

An auditor agent is useful, but only on top of a deterministic harness.

Good auditor behavior:

- reads a page manifest
- runs extraction
- compares against expected checks
- writes a structured report
- flags regressions

Bad auditor behavior:

- roams arbitrary sites
- produces non-reproducible findings
- invents pass/fail criteria on the fly

## Repository Shape

Suggested future layout:

```text
eval/
  fixtures/
  manifests/
    local.json
    live.json
  prompts/
    judge.md
  reports/
scripts/
  run-eval.ts
  summarize-eval.ts
```

## Pass Criteria For First Version

The first evaluation harness is good enough if it can:

- run a fixed local corpus
- run a small live canary corpus
- validate schema and basic semantic expectations
- generate a readable Markdown report
- detect obvious regressions between runs

## Tomorrow Build Order

1. create `eval/manifests/local.json`
2. create a few local fixture pages
3. create `scripts/run-eval.ts`
4. define machine-readable checks
5. add a summary report generator
6. optionally add an LLM judge pass after the deterministic checks work
