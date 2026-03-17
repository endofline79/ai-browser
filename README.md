# ai-browser

`ai-browser` is a passive web extraction engine for AI systems.

It is not a human-facing browser and it is not an automation agent.

The project goal is to:

- load modern web pages in a real browser runtime
- let JavaScript execute
- extract semantic structure from the rendered result
- emit canonical JSON and derived Markdown

The current implementation is Milestone 1:

- open a URL with Playwright
- wait for a basic stabilization window
- capture metadata, visible text blocks, links, and control counts
- build a minimal `WebIR`
- output JSON to stdout or JSON plus Markdown into a folder

## Status

This repo currently contains:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
- [LANDSCAPE.md](./LANDSCAPE.md)
- a Milestone 1 TypeScript scaffold for extraction

## Milestone 1 Scope

Milestone 1 is intentionally narrow.

Included:

- Chromium-backed page load
- basic stabilization heuristics
- page metadata extraction
- visible text block extraction
- link extraction
- minimal page classification
- JSON and Markdown output

Not included yet:

- accessibility tree fusion
- robust boilerplate removal
- login flows
- interactions
- crawling
- screenshot-based extraction

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

The current `WebIR` is intentionally minimal. It includes:

- source URL and final URL
- title and metadata
- page kind heuristic: `document`, `application`, or `mixed`
- visible content blocks
- visible links
- control count summary
- extraction warnings

This is not the final schema. It is the first working slice.

## Repository Layout

```text
src/
  browser/
    runtime.ts
    stability.ts
  capture/
    metadata.ts
    snapshot.ts
    text.ts
  output/
    json.ts
    markdown.ts
  semantic/
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
