import type { Page } from "playwright";

import type { RawControl, RawControlSummary, RawDomStructure } from "../shared/types.js";

type DomCapture = {
  structure: RawDomStructure;
  controls: {
    summary: RawControlSummary;
    items: RawControl[];
  };
};

const DOM_CAPTURE_SCRIPT = `(() => {
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

  function firstNonEmpty(values) {
    for (const value of values) {
      const normalized = value ? normalize(value) : "";

      if (normalized) {
        return normalized;
      }
    }

    return undefined;
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

  function readLabel(element) {
    const ariaLabel = element.getAttribute("aria-label");
    const labelledBy = readAriaLabelledBy(element);
    const id = element.id;
    let forLabel;

    if (id) {
      const escapedId = id.replace(/"/g, '\\"');
      const labelElement = document.querySelector('label[for="' + escapedId + '"]');
      forLabel = labelElement ? normalize(labelElement.textContent || "") : undefined;
    }

    const parentLabel = element.closest("label");
    const wrappedLabel = parentLabel ? normalize(parentLabel.textContent || "") : undefined;

    return firstNonEmpty([ariaLabel, labelledBy, forLabel, wrappedLabel]);
  }

  function detectControlKind(element) {
    if (element.tagName === "BUTTON") {
      return "button";
    }

    if (element.tagName === "SELECT") {
      return "select";
    }

    if (element.tagName === "TEXTAREA") {
      return "textarea";
    }

    if (element.tagName === "INPUT") {
      const type = (element.getAttribute("type") || "").toLowerCase();

      if (type === "checkbox") {
        return "checkbox";
      }

      if (type === "radio") {
        return "radio";
      }
    }

    return "input";
  }

  function detectLandmarkRole(element) {
    const explicitRole = element.getAttribute("role");

    if (explicitRole && [
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

  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
    .filter((element) => isVisible(element))
    .map((element) => ({
      level: Number(element.tagName[1]),
      text: normalize(element.textContent || "")
    }))
    .filter((heading) => heading.text.length > 0);

  const landmarks = [];
  const seenLandmarks = new Set();
  const landmarkCandidates = Array.from(document.querySelectorAll("main,nav,header,footer,aside,form,[role]"));

  for (const element of landmarkCandidates) {
    if (!isVisible(element)) {
      continue;
    }

    const role = detectLandmarkRole(element);

    if (!role) {
      continue;
    }

    const name = firstNonEmpty([
      element.getAttribute("aria-label"),
      readAriaLabelledBy(element)
    ]);

    const key = role + "::" + (name || "");

    if (seenLandmarks.has(key)) {
      continue;
    }

    seenLandmarks.add(key);
    landmarks.push({ role, name });
  }

  const controlElements = Array.from(document.querySelectorAll("button,input,select,textarea")).filter((element) =>
    isVisible(element)
  );

  const controlItems = controlElements.map((element) => ({
    kind: detectControlKind(element),
    type: element.getAttribute("type") || undefined,
    name: firstNonEmpty([element.getAttribute("name"), element.textContent]),
    label: readLabel(element),
    placeholder: element.getAttribute("placeholder") || undefined,
    value: "value" in element ? String(element.value || "") || undefined : undefined,
    disabled: "disabled" in element ? Boolean(element.disabled) : false
  }));

  const controls = {
    summary: {
      buttons: controlItems.filter((item) => item.kind === "button").length,
      inputs: controlItems.filter((item) => item.kind === "input" || item.kind === "checkbox" || item.kind === "radio").length,
      selects: controlItems.filter((item) => item.kind === "select").length,
      textareas: controlItems.filter((item) => item.kind === "textarea").length
    },
    items: controlItems
  };

  return {
    structure: {
      headings,
      landmarks,
      forms: Array.from(document.querySelectorAll("form")).filter((element) => isVisible(element)).length,
      lists: Array.from(document.querySelectorAll("ul,ol")).filter((element) => isVisible(element)).length,
      tables: Array.from(document.querySelectorAll("table")).filter((element) => isVisible(element)).length
    },
    controls
  };
})()`;

export async function captureDomStructure(page: Page): Promise<DomCapture> {
  return page.evaluate(DOM_CAPTURE_SCRIPT) as Promise<DomCapture>;
}
