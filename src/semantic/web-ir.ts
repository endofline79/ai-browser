import { buildDocumentTree } from "./block-tree.js";
import type { ClassificationSignals, PageKind, RawPageSnapshot, WebIR } from "../shared/types.js";

function buildClassificationSignals(snapshot: RawPageSnapshot): ClassificationSignals {
  const controlCount =
    snapshot.controls.summary.buttons +
    snapshot.controls.summary.inputs +
    snapshot.controls.summary.selects +
    snapshot.controls.summary.textareas;

  const textChars = snapshot.blocks.reduce((total, block) => total + block.text.length, 0);
  const headingCount = snapshot.structure.headings.length;
  const landmarkCount = snapshot.structure.landmarks.length;
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

  return {
    textChars,
    controlCount,
    headingCount,
    appRoleCount,
    landmarkCount
  };
}

function classifyPageKind(snapshot: RawPageSnapshot, signals: ClassificationSignals): PageKind {
  if (signals.appRoleCount >= 2 || (signals.controlCount >= 10 && signals.textChars < 1500)) {
    return "application";
  }

  if (signals.controlCount <= 2 && signals.headingCount >= 1 && signals.textChars >= 80) {
    return "document";
  }

  if (
    signals.textChars >= 1500 &&
    signals.headingCount >= 1 &&
    signals.controlCount <= 8 &&
    snapshot.structure.forms <= 2
  ) {
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

  const classificationSignals = buildClassificationSignals(snapshot);
  const kind = classifyPageKind(snapshot, classificationSignals);
  const documentTree = buildDocumentTree(snapshot, snapshot.metadata.title);

  return {
    source: {
      url: snapshot.sourceUrl,
      finalUrl: snapshot.finalUrl,
      fetchedAt: snapshot.extractedAt,
      title: snapshot.metadata.title
    },
    page: {
      kind,
      language: snapshot.metadata.lang,
      description: snapshot.metadata.description,
      classificationSignals
    },
    metadata: snapshot.metadata.meta,
    document: documentTree.document,
    blocks: documentTree.flatBlocks,
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
      strategy: "milestone3",
      warnings
    }
  };
}
