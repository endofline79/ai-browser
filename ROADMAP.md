# Roadmap

## Phase 1

Phase 1 is a passive extraction engine for the modern web.

Phase 1 is not:

- a human-facing browser
- a text UI shell
- an autonomous agent
- an interaction-heavy automation stack

Phase 1 is:

- Chromium-powered page execution
- semantic extraction of rendered pages
- canonical JSON output
- derived Markdown output

The product for Phase 1 is a tool that turns the live web into structured AI-readable documents.

## Phase 1 Goal

Create an engine that:

- loads modern JavaScript-heavy pages in Chromium
- waits until the page is stable enough to inspect
- extracts semantic structure from the rendered result
- emits `WebIR` JSON as the primary output
- emits Markdown as a secondary readable projection

## Phase 1 Non-Goals

Do not try to solve these yet:

- browser UI for humans
- keyboard navigation shell
- generalized page interaction workflows
- multi-step agents
- multi-tab orchestration
- login automation
- web crawling at scale

This phase is about semantic extraction quality, not browser ergonomics.

## Product Shape

The basic workflow should be:

1. accept a URL
2. open it in Chromium
3. let the page render and execute JavaScript
4. detect a reasonable stabilization point
5. capture semantic signals
6. build `WebIR`
7. output JSON and Markdown

At the end of Phase 1, a caller should be able to treat the engine like a compiler:

- input: URL
- output: structured page representation

## Core Components for Phase 1

### 1. Browser Runtime

Build:

- Playwright session management
- page navigation
- redirect tracking
- timeout handling

Requirement:

- one page at a time, deterministic behavior

### 2. Stability Heuristics

Build:

- load-state heuristics
- network quiet window
- DOM mutation quiet window
- timeout ceiling

Requirement:

- the engine must know when to extract, even if the page never becomes perfectly idle

### 3. Capture Pipeline

Build:

- accessibility snapshot extraction
- DOM snapshot extraction
- visible text extraction
- page metadata extraction
- link and control inventory

Requirement:

- capture enough raw signal to reconstruct semantic structure without relying on screenshots as the default

### 4. Semantic Lifting

Build:

- block detection
- heading and section recovery
- list and table recovery
- form and control recovery
- navigation and boilerplate identification
- document/application/mixed classification

Requirement:

- the engine must output meaningful structure, not just flattened text

### 5. WebIR

Build:

- canonical type definitions
- block tree
- metadata model
- provenance and confidence fields

Requirement:

- every output mode should derive from `WebIR`

### 6. Output Adapters

Build:

- JSON serializer
- Markdown renderer
- chunked output for downstream AI use

Requirement:

- JSON preserves fidelity
- Markdown remains readable without pretending to be the source of truth

## Phase 1 Deliverables

By the end of Phase 1, the project should have:

- a Chromium-backed extraction runtime
- a stability detector
- a raw snapshot collector
- a `WebIR` builder
- JSON output
- Markdown output
- page-kind classification
- extraction warnings and debug logs

## Suggested Milestones

### Milestone 1: Minimal Pipeline

Build:

- open URL
- wait for a basic load event
- capture visible text and metadata
- emit a minimal JSON document

Success criteria:

- given a URL, the engine returns basic structured output instead of raw HTML

### Milestone 2: Browser Signal Fusion

Build:

- accessibility capture
- DOM capture
- link extraction
- control extraction

Success criteria:

- output contains richer semantic structure than text scraping alone

### Milestone 3: WebIR

Build:

- canonical block tree
- block types
- page-kind classification
- provenance fields

Success criteria:

- the project has a stable internal representation that can support multiple serializers

### Milestone 4: Markdown Projection

Build:

- Markdown rendering from `WebIR`
- handling for headings, lists, tables, links, code, and callouts

Success criteria:

- a caller can request readable Markdown without losing the canonical JSON path

### Milestone 5: Quality Pass

Build:

- stabilization improvements
- boilerplate tagging
- warning generation
- extraction confidence

Success criteria:

- outputs are explainable and degrade gracefully on hard pages

## Proposed Build Order

1. Choose runtime stack: likely Node.js + TypeScript + Playwright.
2. Implement page loader and timeout model.
3. Implement initial stabilization logic.
4. Implement raw capture pipeline.
5. Define `WebIR` in code.
6. Build semantic lifting from raw capture to `WebIR`.
7. Build JSON serializer.
8. Build Markdown projection.
9. Add warnings, confidence, and debug output.

## Acceptance Criteria

Phase 1 is complete when all of the following are true:

- the engine can load modern JavaScript-driven pages in Chromium
- the engine can emit a structured JSON representation of the rendered page
- the engine can emit a Markdown projection derived from that JSON
- the engine can distinguish at least roughly between document-like and app-like pages
- the engine exposes enough metadata and warnings for downstream systems to judge output quality

## Risks

The main risks in Phase 1 are:

- pages that never fully settle
- poor accessibility metadata
- highly dynamic or virtualized UI
- app-like pages that do not map cleanly to Markdown
- boilerplate dominating output

These are real product constraints, not edge cases. The roadmap should optimize for graceful degradation rather than pretending perfect extraction is possible.

## After Phase 1

Only after the extraction engine is solid should the project move into:

- deeper content distillation
- selective interaction for hidden content
- agentic workflows
- retrieval-oriented chunking and indexing strategies
- scale-out crawling or batch processing
