# Landscape

## Scope

This document maps the current landscape around browser-backed web extraction for AI systems.

Date of review:

- 2026-03-16

Focus:

- projects that turn web pages into AI-friendly outputs
- adjacent browser automation and extraction tools
- publisher-side alternatives such as `llms.txt`
- practical code-reuse and license considerations

This is a product and engineering note, not legal advice.

## Executive Summary

You are not early to the idea. You are early to a specific shape of the idea.

The space already contains:

- hosted APIs that turn pages into Markdown or JSON
- browser automation stacks with extraction helpers
- article distillation libraries
- publisher-side standards for LLM-friendly docs
- model-based HTML-to-Markdown and HTML-to-JSON conversion

What still looks open is the combination you are aiming at:

- Chromium-backed execution for modern JavaScript pages
- passive extraction rather than workflow automation
- JSON-first canonical output rather than Markdown-first output
- a real intermediate representation instead of ad hoc scrape payloads
- support for both document-like pages and app-like pages
- self-hostable and inspectable behavior

## Main Categories

### 1. Hosted Web-to-LLM APIs

These products are the closest to the product instinct behind this repo.

- Firecrawl
- Jina Reader
- Diffbot

### 2. Browser Automation and Extraction Infrastructure

These are useful building blocks, but they are not themselves a canonical web-to-IR engine.

- Crawlee
- Stagehand

### 3. Content Distillation Libraries

These are strong for articles and docs, weaker for modern app surfaces.

- Mozilla Readability
- Trafilatura
- Mercury Parser

### 4. Publisher-Side AI Documentation

These do not solve the whole web, but they are the cleanest case when available.

- `llms.txt`

### 5. Model-Based Conversion

These are relevant when you want a learned HTML-to-structure step.

- ReaderLM-v2

## Comparison Matrix

| Project | What it is | Where it overlaps | Main gap vs this repo | License / access | Reuse posture |
| --- | --- | --- | --- | --- | --- |
| [Firecrawl](https://docs.firecrawl.dev/features/scrape) | Hosted and self-hostable web data API for AI | Browser-backed extraction, JS handling, Markdown and JSON output | Product is API-oriented and extraction payload-oriented, not clearly centered on a canonical IR | Core repo is AGPL-3.0; SDKs and some UI components are MIT | Safe to study ideas; be cautious about copying core code into a closed or proprietary product |
| [Jina Reader](https://github.com/jina-ai/reader) | URL-to-LLM-friendly content service | Very close product shape for single-page extraction | JSON mode is minimal and product is output-service oriented rather than IR-first | Apache-2.0 | Best open reference for product behavior; code reuse is legally friendlier than Firecrawl |
| [Diffbot Extract](https://www.diffbot.com/products/extract/) | Proprietary extraction API | Strong precedent for page classification and structured extraction | Proprietary and not self-hostable; output model is vendor-defined | Hosted commercial service | Good source of product ideas, not a code-reuse source for the core engine |
| [Crawlee](https://github.com/apify/crawlee) | Open crawling and browser automation library | Good substrate for loaders, sessions, retries, and crawling | Not a semantic IR system by itself | Apache-2.0 | Strong candidate dependency or reference implementation |
| [Stagehand](https://github.com/browserbase/stagehand) | AI browser automation framework | Useful for extraction primitives and browser-backed observation | Main focus is acting on pages, not passive semantic compilation | MIT | Safe to reuse code patterns selectively; probably not a core product model fit |
| [Mozilla Readability](https://github.com/mozilla/readability) | Reader-mode/article extractor | Useful fallback for document pages | Poor fit for app-like pages and richer structured outputs | Apache-2.0 | Good fallback module for article distillation |
| [Trafilatura](https://github.com/adbar/trafilatura) | Text and metadata extraction toolkit | Good article/docs extraction with multiple output formats | Not designed around modern JS apps and browser execution | Apache-2.0 in current versions; older versions were GPLv3+ | Useful for comparison or fallback, but pin to current Apache-licensed versions |
| [Mercury Parser](https://github.com/usr42/mercury-parser) | Open web content extractor | Similar to Readability but with site-specific extraction support | Mostly article/content-centric, not app-state centric | Dual MIT / Apache-2.0 | Legally easy to reuse with attribution; best as a fallback parser |
| [`llms.txt`](https://llmstxt.org/index.html) | Publisher-side standard for AI-friendly docs | Solves the problem cleanly when sites cooperate | Only works where publishers adopt it; does not cover the live web broadly | Spec repo is Apache-2.0 | Implement support directly; no reason not to consume it when present |
| [ReaderLM-v2](https://huggingface.co/jinaai/ReaderLM-v2) | Model for HTML-to-Markdown / HTML-to-JSON | Very relevant to learned semantic conversion | Model license is non-commercial; model output still needs browser-backed input quality | CC-BY-NC-4.0 | Good for evaluation and research, not a safe core dependency if commercial use is possible |

## What The Sources Actually Say

### Firecrawl

Firecrawl says it:

- handles dynamic and JS-rendered content
- outputs Markdown, structured data, screenshots, and HTML
- supports actions before extraction

Its repo states the core project is AGPL-3.0, while SDKs and some UI components are MIT.

This makes Firecrawl the closest product neighbor, but also the most important license boundary if you want to stay permissive.

### Jina Reader

Jina Reader is openly positioned as a way to convert any URL into an LLM-friendly input. The README also says the service supports JavaScript-heavy sites through headless Chrome and Puppeteer.

Important practical detail:

- the repo is Apache-2.0
- but it references an internal `thinapps-shared` submodule that is not open sourced

That means it is legally friendlier than Firecrawl, but may still require adaptation if you want to run parts of it directly.

### Diffbot

Diffbot is the clearest precedent for:

- classifying page type
- extracting typed structured data
- treating the web as a machine-readable substrate

It is proprietary. You can use the API or copy the product idea at a high level, but not the engine implementation.

### Crawlee

Crawlee is a strong open-source foundation for:

- browser sessions
- navigation
- retry logic
- crawling and extraction workflows

It is not your product, but it could reduce a large amount of plumbing work.

### Stagehand

Stagehand is primarily an automation framework, but its `extract()` capability is relevant as a proof that browser-backed structured extraction is useful.

It is probably more useful as a pattern library than as a direct conceptual template because your current scope is passive extraction, not browser acting.

### Readability, Trafilatura, Mercury

These all support the "reduce a noisy page to meaningful content" instinct.

They should not define the whole architecture, but they are valuable for:

- article fallback mode
- regression comparison
- quality baselines

### llms.txt

This is the strongest argument that publishers know the problem exists.

When a site ships `llms.txt`, your engine should use it as a high-confidence input shortcut. But you still need the extraction engine because most of the web will not provide it consistently.

### ReaderLM-v2

This matters because it proves there is demand for learned HTML-to-Markdown and HTML-to-JSON conversion.

The current problem is license posture:

- the model card shows `cc-by-nc-4.0`

That makes it unsuitable as a default core dependency if there is any chance this project becomes commercial or sits inside a commercial stack.

## License and Reuse Notes

## General Rule

There are three different things to keep separate:

- ideas
- code
- service/model licenses

High-level ideas and architecture are generally safe to learn from and emulate.

Code reuse is controlled by the repository license.

Service APIs and model checkpoints can have separate terms that are more restrictive than their public docs make obvious.

## Practical Reuse Buckets

### Green: Permissive Open Source

These are the safest buckets for direct code reuse or dependency use, assuming you preserve notices and comply with the license text:

- Jina Reader: Apache-2.0
- Crawlee: Apache-2.0
- Mozilla Readability: Apache-2.0
- Trafilatura: Apache-2.0 on current versions
- Mercury Parser: MIT or Apache-2.0
- Stagehand: MIT
- `llms.txt` spec repo: Apache-2.0

### Yellow: Open, But Strategy Matters

- Firecrawl core: AGPL-3.0

This is not "forbidden," but it is a strong copyleft license. If you want this project to stay privately developed and potentially closed-source, avoid copying AGPL core code unless you are prepared to comply with AGPL obligations.

### Red: Not A Good Default Core Dependency

- ReaderLM-v2: CC-BY-NC-4.0
- Diffbot Extract core service: proprietary

These may still be useful for evaluation, benchmarking, or optional integrations, but not as the legal center of the project.

## Important Non-License Constraint

Open-source code licenses are not the only legal constraint here.

Separate from repository licenses, you still need to think about:

- target-site terms of service
- robots behavior and crawl policy
- copyright in extracted site content
- privacy and personal data handling

Those are separate from whether a GitHub repo is MIT or Apache-2.0.

## Positioning For This Repo

If this project becomes a real private repo, the safest product posture is:

- build the core engine from your own architecture
- use permissive dependencies where they save real time
- avoid AGPL core imports unless you are intentionally choosing that license path
- avoid non-commercial model dependencies in the product core

## Recommended Borrowing Strategy

### Safe To Borrow Heavily

- Crawlee for session and crawler patterns
- Readability for document fallback ideas
- Trafilatura and Mercury for extraction heuristics comparisons
- `llms.txt` support directly in the fetch pipeline

### Safe To Study, But Probably Reimplement

- Jina Reader request model and output ergonomics
- Stagehand extraction ergonomics
- Diffbot-style page classification

### Study Only Unless You Deliberately Accept The License

- Firecrawl core implementation
- ReaderLM-v2 as a built-in commercial dependency

## Suggested Product Differentiation

Most current tools optimize for one of these:

- hosted API convenience
- article extraction
- browser automation
- Markdown generation

This repo should differentiate on:

- canonical `WebIR` JSON as the source of truth
- browser-backed passive extraction for JS-heavy pages
- explicit document versus application page handling
- explainable warnings and confidence
- self-hostable pipeline
- Markdown as a derived view, not the product core

## Recommendation Before You Start A Private Repo

If you make this a real project, set a clear dependency policy on day one:

- prefer MIT / Apache-2.0 dependencies
- do not paste AGPL code into the repo casually
- do not base the core product on non-commercial model weights
- keep a `THIRD_PARTY.md` file once implementation starts

That will save you from expensive cleanup later.

## Sources

- [Firecrawl Scrape docs](https://docs.firecrawl.dev/features/scrape)
- [Firecrawl GitHub repo](https://github.com/firecrawl/firecrawl)
- [Jina Reader GitHub repo](https://github.com/jina-ai/reader)
- [Diffbot Extract](https://www.diffbot.com/products/extract/)
- [Diffbot Pricing](https://www.diffbot.com/pricing/)
- [Crawlee GitHub repo](https://github.com/apify/crawlee)
- [Stagehand GitHub repo](https://github.com/browserbase/stagehand)
- [Mozilla Readability GitHub repo](https://github.com/mozilla/readability)
- [Trafilatura GitHub repo](https://github.com/adbar/trafilatura)
- [Mercury Parser GitHub repo](https://github.com/usr42/mercury-parser)
- [`llms.txt` proposal site](https://llmstxt.org/index.html)
- [`llms.txt` GitHub repo](https://github.com/AnswerDotAI/llms-txt)
- [ReaderLM-v2 model card](https://huggingface.co/jinaai/ReaderLM-v2)
