# ai-browser

`ai-browser` is a passive web extraction engine for AI systems.

It is not a human-facing browser and it is not an automation agent.

The project goal is to:

- load modern web pages in a real browser runtime
- let JavaScript execute
- extract semantic structure from the rendered result
- emit canonical JSON and derived Markdown

The current implementation is Milestone 4:

- open a URL with Playwright
- wait for a basic stabilization window
- capture metadata, visible text blocks, DOM structure, accessibility roles, links, and controls
- build a hierarchical `WebIR` document tree with provenance
- score regions and blocks for primary content vs boilerplate
- output JSON to stdout or JSON plus Markdown into a folder

## Status

This repo currently contains:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
- [LANDSCAPE.md](./LANDSCAPE.md)
- a Milestone 4 TypeScript scaffold for extraction and quality scoring

## Milestone 4 Scope

Milestone 4 is the first quality/distillation pass over the tree.

Included:

- Chromium-backed page load
- basic stabilization heuristics
- page metadata extraction
- visible text block extraction with region provenance
- DOM structure capture
- Chromium accessibility summary capture
- link extraction
- control extraction
- document/application/mixed classification signals
- hierarchical document tree
- content quality labels: `primary`, `supporting`, `boilerplate`
- main-content summaries and extraction confidence
- JSON and Markdown output

Not included yet:

- robust multi-page deduplication
- site-specific boilerplate models
- main-content extraction regression suite
- login flows
- interactions
- crawling

## Quick Start

### 1. Install dependencies

```bash
npm install
```

If you do not have a local Chrome or Chromium binary available, install a Playwright browser:

```bash
npx playwright install chromium
```

### 2. Run the extractor

Print JSON to stdout:

```bash
npm run extract -- https://example.com
```

Write both `page.json` and `page.md` to an output directory:

```bash
npm run extract -- https://example.com --out ./output
```

Force Markdown to stdout:

```bash
npm run extract -- https://example.com --format markdown
```

## CLI

```text
npm run extract -- <url> [--out <dir>] [--format json|markdown]
```

Behavior:

- default output format is `json`
- `--out <dir>` writes `page.json` and `page.md`
- `--format markdown` prints Markdown to stdout instead of JSON

## Current `WebIR`

The current `WebIR` includes:

- source URL and final URL
- title and metadata
- page kind heuristic plus classification signals
- a hierarchical `document` tree
- per-block provenance and quality labels
- flat semantic content blocks for convenience
- a `content` summary with primary/supporting/boilerplate block ids
- visible links
- control summary and control items
- DOM structure summary
- accessibility role counts and sample nodes
- extraction warnings and confidence

The canonical structure is the `document` tree. The flat `blocks` list and Markdown are derived views.

## Repository Layout

```text
src/
  browser/
    runtime.ts
    stability.ts
  capture/
    accessibility.ts
    dom.ts
    metadata.ts
    snapshot.ts
    text.ts
  output/
    json.ts
    markdown.ts
  semantic/
    block-tree.ts
    quality.ts
    web-ir.ts
  shared/
    types.ts
  cli.ts
```

## Notes On Browser Runtime

By default the runtime will try, in order:

- `CHROME_PATH` if provided
- the local Chrome channel available to Playwright
- Playwright's bundled Chromium if installed

That keeps local development simple while allowing explicit override in CI or production.
