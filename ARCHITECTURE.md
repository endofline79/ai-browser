# AI Web Extraction Engine Architecture

## Purpose

This project is not a human-facing browser.

This project is a semantic extraction engine that uses a modern browser runtime to turn the live web into structured outputs that AI systems can consume.

Core goal:

- load modern JavaScript-heavy websites in Chromium
- let the page execute and settle
- extract semantic structure from the rendered result
- emit canonical JSON and derived Markdown

The product is best thought of as a compiler:

- input: the modern web
- output: an AI-readable representation of the page

## Product Definition

The system should answer:

- what content is present on the page
- how that content is structured
- what parts are primary content versus navigation or chrome
- what semantic meaning can be recovered from the rendered page
- what the page exposes as links, controls, metadata, tables, lists, code, dialogs, and other structures

The system should not require a human UI and should not optimize for pixel rendering.

## Core Design Principle

Do not make Markdown the canonical representation.

Markdown is useful, but it is lossy. The canonical representation should be a structured intermediate format that preserves:

- hierarchy
- order
- semantics
- visibility
- provenance
- extracted metadata
- link targets
- content boundaries

Markdown should be a derived view of that structure.

## Architectural Principle

The modern web should be processed in stages:

1. execute page code in a real browser
2. determine when the page is stable enough to inspect
3. capture multiple semantic signals
4. merge those signals into a normalized intermediate representation
5. emit downstream formats for AI consumption

The system should behave more like a transcoder or compiler than like a browser UI.

## High-Level Components

### 1. Browser Runtime

Responsible for loading and executing the page.

Likely technology:

- Playwright
- Chromium, initially headless

Responsibilities:

- launch browser
- create isolated page sessions
- load URLs
- wait for initial rendering
- track redirects
- expose page hooks for extraction

This layer provides execution and compatibility, not semantics.

### 2. Stabilization Layer

Responsible for deciding when the page is ready to extract.

This is necessary because modern pages do not become "done" at a single reliable moment.

Signals may include:

- load state
- network idle heuristics
- DOM mutation rate
- accessibility tree quiet period
- layout stabilization window
- timeout ceilings

Output:

- a `PageSnapshotWindow` or equivalent signal indicating extraction should begin

This layer is critical. Without it, output quality will be inconsistent.

### 3. Capture Layer

Responsible for collecting raw signals from the rendered page.

Primary capture sources:

- accessibility tree
- DOM snapshot
- visible text extraction
- page metadata
- link targets
- form and control states
- limited layout geometry

Optional capture sources:

- screenshot
- computed style subsets
- network request summary

The capture layer should gather enough data to reconstruct semantics without requiring pixels to be the primary source.

### 4. Semantic Lifting Layer

Responsible for turning raw browser signals into meaningful structures.

Responsibilities:

- align DOM nodes with accessibility nodes where possible
- recover headings, paragraphs, lists, tables, code blocks, dialogs, forms, navigation regions, and landmarks
- identify content blocks and section boundaries
- normalize repeated or boilerplate structures
- preserve source provenance and confidence

This is the core intelligence layer of the engine.

### 5. Intermediate Representation Layer

Responsible for defining the canonical output model.

This project should define a structured page IR, referred to here as `WebIR`.

`WebIR` should represent:

- document metadata
- semantic block tree
- inline content
- links and references
- controls and affordances
- visibility and confidence
- source provenance

All downstream outputs should be derived from `WebIR`.

### 6. Output Layer

Responsible for serializing the canonical representation.

Planned outputs:

- JSON as the canonical machine-readable export
- Markdown as a human-readable, LLM-friendly derived export
- possibly chunked JSON/Markdown for downstream retrieval pipelines

Markdown should be optimized for readability. JSON should be optimized for fidelity.

## Canonical Model

### WebIR

This should be the main product artifact.

```ts
type WebIR = {
  source: {
    url: string
    finalUrl: string
    title?: string
    fetchedAt: string
  }
  page: {
    kind: "document" | "application" | "mixed"
    language?: string
    description?: string
  }
  metadata: Record<string, string | string[]>
  blocks: WebBlock[]
  links: WebLink[]
  controls: WebControl[]
  extraction: {
    stable: boolean
    strategy: "default" | "article" | "app" | "fallback"
    warnings: string[]
  }
}
```

### WebBlock

```ts
type WebBlock = {
  id: string
  kind:
    | "document"
    | "section"
    | "heading"
    | "paragraph"
    | "list"
    | "list_item"
    | "table"
    | "table_row"
    | "table_cell"
    | "code"
    | "quote"
    | "navigation"
    | "form"
    | "dialog"
    | "image"
    | "note"
  role?: string
  name?: string
  text?: string
  level?: number
  visible: boolean
  confidence: number
  children?: WebBlock[]
  sourceRefs?: SourceRef[]
}
```

### WebLink

```ts
type WebLink = {
  id: string
  text?: string
  href: string
  rel?: string[]
  visible: boolean
  sourceBlockId?: string
}
```

### WebControl

```ts
type WebControl = {
  id: string
  kind: "button" | "input" | "select" | "checkbox" | "radio" | "textarea" | "dialog_trigger"
  name?: string
  value?: string
  enabled: boolean
  visible: boolean
  sourceBlockId?: string
}
```

## Why JSON First

If the goal is "AI vision," JSON should be first-class because AI systems benefit from explicit structure.

JSON can preserve:

- node types
- parent-child relationships
- confidence
- source provenance
- extracted metadata
- hidden versus visible distinctions

Markdown cannot preserve all of that without becoming awkward.

The right model is:

- `WebIR` is the truth
- Markdown is a useful projection

## Why Accessibility Is Still Important

The accessibility tree remains one of the best semantic signals available on the modern web.

It provides:

- roles
- accessible names
- hierarchy
- state for controls
- a user-centric interpretation of page structure

However, it is not sufficient alone. Some sites expose poor or incomplete accessibility metadata. The engine must fuse accessibility with DOM and visible-text extraction.

## Output Modes

The engine should support more than one extraction mode.

### 1. Full Semantic Mode

Goal:

- preserve as much structure as possible

Best for:

- downstream AI reasoning
- knowledge extraction
- debugging the pipeline

### 2. Markdown Distillation Mode

Goal:

- produce a readable flattened view

Best for:

- LLM context windows
- summaries
- quick inspection

### 3. Main Content Mode

Goal:

- reduce boilerplate and page chrome

Best for:

- articles
- docs
- search results

### 4. Application State Mode

Goal:

- preserve interactive app structure rather than pretending everything is a document

Best for:

- dashboards
- SaaS apps
- tools with panels, menus, tables, and filters

This distinction matters. Not every modern page should be converted into article-style Markdown.

## Lynx Influence

Lynx is still a useful conceptual influence, but the relevant idea is not text rendering. The relevant idea is semantic reduction.

What Lynx got right:

- the page should be reduced to meaningful structure
- links and controls matter more than pixels
- a compact text-like representation can be more useful than a visual one

Where this project differs:

- the target is AI systems, not human terminal browsing
- the underlying runtime must execute modern JavaScript
- the output should be structured JSON first, not a text UI first

The right mental model is:

- Lynx for the reduction philosophy
- Chromium for execution
- `WebIR` for the canonical representation

## Processing Pipeline

The core pipeline should be:

1. Load URL in Chromium.
2. Let the page execute.
3. Wait for stabilization.
4. Capture accessibility, DOM, text, metadata, and link/control state.
5. Lift captured signals into `WebIR`.
6. Classify page type as document, application, or mixed.
7. Serialize to JSON.
8. Optionally render a Markdown projection.

This is a passive pipeline. It does not require downstream interaction to be useful.

## Proposed Layer Boundaries

### Browser Runtime API

Provides:

- `open(url)`
- `waitForStability()`
- `captureAccessibilityTree()`
- `captureDOMSnapshot()`
- `captureVisibleText()`
- `captureMetadata()`

### Capture API

Provides:

- `collectSnapshot(page): Promise<RawPageSnapshot>`

### Semantic Lifting API

Provides:

- `buildWebIR(snapshot): Promise<WebIR>`
- `classifyPageKind(webIR): "document" | "application" | "mixed"`

### Output API

Provides:

- `toJSON(webIR): string`
- `toMarkdown(webIR): string`
- `toChunks(webIR): Chunk[]`

## Major Technical Problems

### 1. Stability Detection

Modern pages may continue updating indefinitely. The engine needs pragmatic extraction rules, not a fantasy notion of perfect completeness.

### 2. Boilerplate Versus Content

Headers, nav bars, cookie banners, footers, and repeated chrome need to be identified or at least marked.

### 3. Document Versus Application Pages

A news article and a spreadsheet-like SaaS view should not be flattened in the same way.

### 4. Hidden State

Tabs, collapsed sections, virtualized lists, and off-screen content complicate extraction.

### 5. Lossy Conversion

Markdown is useful but incomplete. The system should not degrade core structure just to fit Markdown.

## Initial Scope

Version 1 should stay narrow.

Include:

- one-shot page load
- stabilization heuristics
- accessibility plus DOM plus text fusion
- JSON output
- Markdown output
- document/application/mixed page classification

Do not include yet:

- autonomous agents
- browser UI
- generalized page interaction
- login workflows
- continuous crawling

## Suggested Repository Shape

```text
src/
  browser/
    runtime.ts
    stability.ts
  capture/
    accessibility.ts
    dom.ts
    text.ts
    metadata.ts
    snapshot.ts
  semantic/
    classify.ts
    blocks.ts
    links.ts
    controls.ts
    web-ir.ts
  output/
    json.ts
    markdown.ts
    chunks.ts
  shared/
    types.ts
    logger.ts
docs/
  architecture/
```

## Near-Term Recommendation

Build the thinnest vertical slice:

1. load a page in Chromium
2. wait for basic stabilization
3. capture accessibility, DOM, and visible text
4. build a minimal `WebIR`
5. emit JSON
6. emit Markdown

If that slice is solid, the project has a real foundation.
