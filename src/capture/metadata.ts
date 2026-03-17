import type { Page } from "playwright";

import type { RawMetadata } from "../shared/types.js";

const METADATA_SCRIPT = `(() => {
  function readMeta(selector) {
    const element = document.querySelector(selector);
    const value = element && element.content ? element.content.trim() : "";
    return value || undefined;
  }

  const canonicalElement = document.querySelector("link[rel='canonical']");
  const metaEntries = Array.from(document.querySelectorAll("meta[name], meta[property]"));
  const meta = {};

  for (const element of metaEntries) {
    const key = element.getAttribute("name") || element.getAttribute("property");
    const value = element.content ? element.content.trim() : "";

    if (!key || !value) {
      continue;
    }

    const existing = meta[key];

    if (existing === undefined) {
      meta[key] = value;
      continue;
    }

    meta[key] = Array.isArray(existing) ? existing.concat(value) : [existing, value];
  }

  return {
    title: document.title || undefined,
    description: readMeta("meta[name='description']") || readMeta("meta[property='og:description']"),
    lang: document.documentElement.lang || undefined,
    canonicalUrl: canonicalElement ? canonicalElement.href : undefined,
    meta
  };
})()`;

export async function captureMetadata(page: Page): Promise<RawMetadata> {
  return page.evaluate(METADATA_SCRIPT) as Promise<RawMetadata>;
}
