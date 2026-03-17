import type { Page } from "playwright";

import { captureAccessibilitySummary } from "./accessibility.js";
import { captureDomStructure } from "./dom.js";
import { captureMetadata } from "./metadata.js";
import { captureTextContent } from "./text.js";
import type { RawPageSnapshot } from "../shared/types.js";

export async function capturePageSnapshot(page: Page, sourceUrl: string): Promise<RawPageSnapshot> {
  const [metadata, textContent, domCapture, accessibility] = await Promise.all([
    captureMetadata(page),
    captureTextContent(page),
    captureDomStructure(page),
    captureAccessibilitySummary(page)
  ]);

  return {
    sourceUrl,
    finalUrl: page.url(),
    metadata,
    blocks: textContent.blocks,
    links: textContent.links,
    controls: domCapture.controls,
    structure: domCapture.structure,
    accessibility,
    extractedAt: new Date().toISOString()
  };
}
