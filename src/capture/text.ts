import type { Page } from "playwright";

import type { RawLink, RawTextBlock, RawControlSummary } from "../shared/types.js";

type TextCapture = {
  blocks: RawTextBlock[];
  links: RawLink[];
  controls: RawControlSummary;
};

const TEXT_CAPTURE_SCRIPT = `(() => {
  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      rect.width > 0 &&
      rect.height > 0 &&
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true"
    );
  }

  function normalize(value) {
    return value.replace(/\\s+/g, " ").trim();
  }

  const blocks = [];
  const blockElements = Array.from(document.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,pre,blockquote"));

  for (const element of blockElements) {
    if (!isVisible(element)) {
      continue;
    }

    const text = normalize(element.textContent || "");

    if (text.length < 2) {
      continue;
    }

    let kind = "paragraph";
    let level;

    if (/^H[1-6]$/.test(element.tagName)) {
      kind = "heading";
      level = Number(element.tagName[1]);
    } else if (element.tagName === "LI") {
      kind = "list_item";
    } else if (element.tagName === "PRE") {
      kind = "code";
    } else if (element.tagName === "BLOCKQUOTE") {
      kind = "quote";
    }

    blocks.push({ kind, text, level });
  }

  const links = Array.from(document.querySelectorAll("a[href]"))
    .filter((element) => isVisible(element))
    .map((element) => ({
      text: normalize(element.textContent || ""),
      href: element.href
    }))
    .filter((link) => link.href.length > 0);

  const controls = {
    buttons: Array.from(document.querySelectorAll("button")).filter((element) => isVisible(element)).length,
    inputs: Array.from(document.querySelectorAll("input")).filter((element) => isVisible(element)).length,
    selects: Array.from(document.querySelectorAll("select")).filter((element) => isVisible(element)).length,
    textareas: Array.from(document.querySelectorAll("textarea")).filter((element) => isVisible(element)).length
  };

  return { blocks, links, controls };
})()`;

export async function captureTextContent(page: Page): Promise<TextCapture> {
  return page.evaluate(TEXT_CAPTURE_SCRIPT) as Promise<TextCapture>;
}
