import type { Page } from "playwright";

import type { RawLink, RawTextBlock } from "../shared/types.js";

type TextCapture = {
  blocks: RawTextBlock[];
  links: RawLink[];
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

  function readAriaLabelledBy(element) {
    const labelledBy = element.getAttribute("aria-labelledby");

    if (!labelledBy) {
      return undefined;
    }

    const text = labelledBy
      .split(/\\s+/)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((label) => normalize(label.textContent || ""))
      .filter(Boolean)
      .join(" ");

    return text || undefined;
  }

  function detectLandmarkRole(element) {
    if (!element) {
      return undefined;
    }

    const explicitRole = element.getAttribute("role");

    if (explicitRole && [
      "article",
      "main",
      "navigation",
      "banner",
      "contentinfo",
      "complementary",
      "search",
      "form",
      "region"
    ].includes(explicitRole)) {
      return explicitRole;
    }

    switch (element.tagName) {
      case "ARTICLE":
        return "article";
      case "MAIN":
        return "main";
      case "NAV":
        return "navigation";
      case "HEADER":
        return "banner";
      case "FOOTER":
        return "contentinfo";
      case "ASIDE":
        return "complementary";
      case "FORM":
        return "form";
      default:
        return undefined;
    }
  }

  function detectRegion(element) {
    const landmark = element.closest("main,nav,header,footer,aside,form,[role]");
    const regionRole = detectLandmarkRole(landmark);

    if (!regionRole) {
      return {};
    }

    const regionName = normalize(
      (landmark.getAttribute("aria-label") || readAriaLabelledBy(landmark) || "")
    );

    return {
      regionRole,
      regionName: regionName || undefined
    };
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

    blocks.push({
      kind,
      text,
      level,
      order: blocks.length + 1,
      sourceTag: element.tagName.toLowerCase(),
      ...detectRegion(element)
    });
  }

  const links = Array.from(document.querySelectorAll("a[href]"))
    .filter((element) => isVisible(element))
    .map((element) => ({
      text: normalize(element.textContent || ""),
      href: element.href
    }))
    .filter((link) => link.href.length > 0);

  return { blocks, links };
})()`;

export async function captureTextContent(page: Page): Promise<TextCapture> {
  return page.evaluate(TEXT_CAPTURE_SCRIPT) as Promise<TextCapture>;
}
