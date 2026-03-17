import type { Page } from "playwright";

import { captureMetadata } from "./metadata.js";
import { captureTextContent } from "./text.js";
import type { RawPageSnapshot } from "../shared/types.js";

export async function capturePageSnapshot(page: Page, sourceUrl: string): Promise<RawPageSnapshot> {
  const [metadata, textContent] = await Promise.all([captureMetadata(page), captureTextContent(page)]);

  return {
    sourceUrl,
    finalUrl: page.url(),
    metadata,
    blocks: textContent.blocks,
    links: textContent.links,
    controls: textContent.controls,
    extractedAt: new Date().toISOString()
  };
}
