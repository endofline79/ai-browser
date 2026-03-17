import type { PageKind, RawPageSnapshot, WebIR } from "../shared/types.js";

function classifyPageKind(snapshot: RawPageSnapshot): PageKind {
  const controlCount =
    snapshot.controls.summary.buttons +
    snapshot.controls.summary.inputs +
    snapshot.controls.summary.selects +
    snapshot.controls.summary.textareas;

  const textChars = snapshot.blocks.reduce((total, block) => total + block.text.length, 0);
  const headingCount = snapshot.structure.headings.length;
  const roleCounts = snapshot.accessibility.roleCounts;
  const appRoleCount =
    (roleCounts.grid ?? 0) +
    (roleCounts.tablist ?? 0) +
    (roleCounts.tab ?? 0) +
    (roleCounts.combobox ?? 0) +
    (roleCounts.searchbox ?? 0) +
    (roleCounts.dialog ?? 0) +
    (roleCounts.menu ?? 0) +
    (roleCounts.menuitem ?? 0);

  if (appRoleCount >= 2 || (controlCount >= 10 && textChars < 1500)) {
    return "application";
  }

  if (controlCount <= 2 && headingCount >= 1 && textChars >= 80) {
    return "document";
  }

  if (textChars >= 1500 && headingCount >= 1 && controlCount <= 8 && snapshot.structure.forms <= 2) {
    return "document";
  }

  return "mixed";
}

export function buildWebIR(snapshot: RawPageSnapshot, stable: boolean): WebIR {
  const warnings: string[] = [];

  if (!stable) {
    warnings.push("Page did not reach network-idle during the stabilization window.");
  }

  if (snapshot.blocks.length === 0) {
    warnings.push("No visible text blocks were extracted from the rendered page.");
  }

  if (!snapshot.accessibility.available) {
    warnings.push("Accessibility capture was unavailable for this page session.");
  }

  return {
    source: {
      url: snapshot.sourceUrl,
      finalUrl: snapshot.finalUrl,
      fetchedAt: snapshot.extractedAt,
      title: snapshot.metadata.title
    },
    page: {
      kind: classifyPageKind(snapshot),
      language: snapshot.metadata.lang,
      description: snapshot.metadata.description
    },
    metadata: snapshot.metadata.meta,
    blocks: snapshot.blocks.map((block, index) => ({
      id: `block-${index + 1}`,
      kind: block.kind,
      text: block.text,
      level: block.level
    })),
    links: snapshot.links.map((link, index) => ({
      id: `link-${index + 1}`,
      text: link.text,
      href: link.href
    })),
    controls: {
      summary: snapshot.controls.summary,
      items: snapshot.controls.items.map((control, index) => ({
        id: `control-${index + 1}`,
        ...control
      }))
    },
    structure: snapshot.structure,
    accessibility: snapshot.accessibility,
    extraction: {
      stable,
      strategy: "milestone2",
      warnings
    }
  };
}
