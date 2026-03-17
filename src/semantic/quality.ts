import type {
  ContentLabel,
  ContentSummary,
  PageKind,
  WebBlock
} from "../shared/types.js";

const PRIMARY_REGION_ROLES = new Set(["main", "article"]);
const BOILERPLATE_REGION_ROLES = new Set(["navigation", "banner", "contentinfo", "search"]);
const SUPPORTING_REGION_ROLES = new Set(["complementary", "form", "region"]);
const BOILERPLATE_PATTERNS = [
  /privacy policy/i,
  /terms of use/i,
  /creative commons/i,
  /app store/i,
  /google play/i,
  /download .* app/i,
  /cookie/i,
  /all rights reserved/i,
  /^learn more$/i,
  /^read more$/i
];

type QualityWork = {
  primaryBlockIds: string[];
  supportingBlockIds: string[];
  boilerplateBlockIds: string[];
  primaryTextChars: number;
  supportingTextChars: number;
  boilerplateTextChars: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function ownTextChars(block: WebBlock): number {
  return block.text?.length ?? 0;
}

function scoreOwnBlock(block: WebBlock, pageKind: PageKind): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const text = block.text ?? block.name ?? "";
  const lowerText = text.toLowerCase();
  const textChars = text.length;

  switch (block.kind) {
    case "document":
      score += 10;
      reasons.push("document-root");
      break;
    case "region":
      score += 10;
      reasons.push("region");
      break;
    case "section":
      score += 18;
      reasons.push("section");
      break;
    case "heading":
      score += 10;
      reasons.push("heading");
      break;
    case "paragraph":
      score += 10;
      reasons.push("paragraph");
      break;
    case "list":
      score += 8;
      reasons.push("list");
      break;
    case "list_item":
      score += 4;
      reasons.push("list-item");
      break;
    case "code":
    case "quote":
      score += 14;
      reasons.push(block.kind);
      break;
    case "controls":
    case "control":
      score += pageKind === "application" ? 8 : -25;
      reasons.push(pageKind === "application" ? "application-control" : "control-chrome");
      break;
  }

  if (PRIMARY_REGION_ROLES.has(block.role ?? "")) {
    score += 45;
    reasons.push(`primary-role:${block.role}`);
  } else if (BOILERPLATE_REGION_ROLES.has(block.role ?? "")) {
    score -= 45;
    reasons.push(`boilerplate-role:${block.role}`);
  } else if (SUPPORTING_REGION_ROLES.has(block.role ?? "")) {
    score -= 10;
    reasons.push(`supporting-role:${block.role}`);
  }

  if (PRIMARY_REGION_ROLES.has(block.provenance.regionRole ?? "")) {
    score += 16;
    reasons.push(`primary-region:${block.provenance.regionRole}`);
  } else if (BOILERPLATE_REGION_ROLES.has(block.provenance.regionRole ?? "")) {
    score -= 28;
    reasons.push(`boilerplate-region:${block.provenance.regionRole}`);
  }

  if (textChars >= 220) {
    score += 28;
    reasons.push("long-text");
  } else if (textChars >= 120) {
    score += 20;
    reasons.push("substantial-text");
  } else if (textChars >= 60) {
    score += 12;
    reasons.push("moderate-text");
  } else if (textChars >= 20) {
    score += 5;
    reasons.push("short-text");
  } else if (block.kind === "paragraph" || block.kind === "list_item") {
    score -= 6;
    reasons.push("very-short-text");
  }

  if (block.kind === "paragraph" && lowerText.split(/\s+/).length <= 3) {
    score -= 10;
    reasons.push("cta-like-paragraph");
  }

  if (
    pageKind === "document" &&
    !BOILERPLATE_REGION_ROLES.has(block.provenance.regionRole ?? "") &&
    !BOILERPLATE_REGION_ROLES.has(block.role ?? "")
  ) {
    if (block.kind === "heading") {
      score += 10;
      reasons.push("document-heading");
    }

    if (block.kind === "paragraph" && textChars >= 60) {
      score += 10;
      reasons.push("document-body-text");
    }

    if (block.kind === "section") {
      score += 8;
      reasons.push("document-section");
    }
  }

  for (const pattern of BOILERPLATE_PATTERNS) {
    if (pattern.test(text)) {
      score -= 24;
      reasons.push(`boilerplate-text:${pattern.source}`);
    }
  }

  return { score, reasons };
}

function classifyBlockLabel(block: WebBlock, score: number, pageKind: PageKind): ContentLabel {
  if (block.kind === "document") {
    return "supporting";
  }

  if (BOILERPLATE_REGION_ROLES.has(block.role ?? "") || BOILERPLATE_REGION_ROLES.has(block.provenance.regionRole ?? "")) {
    return "boilerplate";
  }

  if (block.kind === "controls" || block.kind === "control") {
    return pageKind === "application" && score >= 20 ? "supporting" : "boilerplate";
  }

  if (PRIMARY_REGION_ROLES.has(block.role ?? "") && score >= 45) {
    return "primary";
  }

  if (score >= 65) {
    return "primary";
  }

  if (score >= 20) {
    return "supporting";
  }

  return "boilerplate";
}

function annotateBlockQuality(block: WebBlock, pageKind: PageKind): void {
  for (const child of block.children) {
    annotateBlockQuality(child, pageKind);
  }

  const own = scoreOwnBlock(block, pageKind);
  const childTextChars = block.children.reduce((total, child) => total + child.quality.textChars, 0);
  const childPrimaryCount = block.children.filter((child) => child.quality.label === "primary").length;
  const childSupportingCount = block.children.filter((child) => child.quality.label === "supporting").length;
  const childBoilerplateCount = block.children.filter((child) => child.quality.label === "boilerplate").length;
  let score = own.score;

  if (childTextChars > 0) {
    score += Math.min(28, Math.floor(childTextChars / 35));
  }

  score += childPrimaryCount * 10;
  score += childSupportingCount * 4;
  score -= childBoilerplateCount * 3;

  if (block.kind === "section" && childTextChars >= 80) {
    score += 12;
    own.reasons.push("section-with-body");
  }

  if (
    pageKind === "document" &&
    block.kind === "section" &&
    childTextChars >= 80 &&
    !BOILERPLATE_REGION_ROLES.has(block.provenance.regionRole ?? "") &&
    !BOILERPLATE_REGION_ROLES.has(block.role ?? "")
  ) {
    score += 16;
    own.reasons.push("document-section-with-body");
  }

  if (block.kind === "region" && PRIMARY_REGION_ROLES.has(block.role ?? "") && childTextChars >= 80) {
    score += 18;
    own.reasons.push("primary-region-with-body");
  }

  if (block.kind === "region" && BOILERPLATE_REGION_ROLES.has(block.role ?? "")) {
    score = Math.min(score, 12);
    own.reasons.push("boilerplate-region-cap");
  }

  if (block.kind === "controls") {
    score = pageKind === "application" ? Math.min(score, 40) : Math.min(score, 10);
  }

  const textChars = ownTextChars(block) + childTextChars;
  const label = classifyBlockLabel(block, score, pageKind);

  block.quality = {
    label,
    score,
    textChars,
    reasons: own.reasons
  };
}

function collectLeafContent(block: WebBlock, work: QualityWork): void {
  const isLeaf = block.children.length === 0;
  const isTextualLeaf =
    block.kind === "heading" ||
    block.kind === "paragraph" ||
    block.kind === "list_item" ||
    block.kind === "code" ||
    block.kind === "quote";

  if (isLeaf && isTextualLeaf) {
    const textChars = block.quality.textChars;

    if (block.quality.label === "primary") {
      work.primaryBlockIds.push(block.id);
      work.primaryTextChars += textChars;
    } else if (block.quality.label === "supporting") {
      work.supportingBlockIds.push(block.id);
      work.supportingTextChars += textChars;
    } else {
      work.boilerplateBlockIds.push(block.id);
      work.boilerplateTextChars += textChars;
    }
  }

  for (const child of block.children) {
    collectLeafContent(child, work);
  }
}

export function annotateDocumentQuality(document: WebBlock, pageKind: PageKind, stable: boolean): ContentSummary {
  annotateBlockQuality(document, pageKind);

  const work: QualityWork = {
    primaryBlockIds: [],
    supportingBlockIds: [],
    boilerplateBlockIds: [],
    primaryTextChars: 0,
    supportingTextChars: 0,
    boilerplateTextChars: 0
  };

  collectLeafContent(document, work);

  const totalTextChars =
    work.primaryTextChars + work.supportingTextChars + work.boilerplateTextChars;
  const usefulTextChars = work.primaryTextChars + work.supportingTextChars;
  const usefulRatio = totalTextChars > 0 ? usefulTextChars / totalTextChars : 0;
  const primaryRatio = totalTextChars > 0 ? work.primaryTextChars / totalTextChars : 0;

  let confidence = 0.2;
  confidence += stable ? 0.2 : 0.08;
  confidence += totalTextChars > 0 ? 0.1 : 0;
  confidence += usefulRatio * 0.3;
  confidence += primaryRatio * 0.15;
  confidence += work.primaryBlockIds.length > 0 ? 0.05 : 0;
  confidence += pageKind === "document" && work.primaryTextChars >= 120 ? 0.05 : 0;

  return {
    primaryBlockIds: work.primaryBlockIds,
    supportingBlockIds: work.supportingBlockIds,
    boilerplateBlockIds: work.boilerplateBlockIds,
    primaryTextChars: work.primaryTextChars,
    supportingTextChars: work.supportingTextChars,
    boilerplateTextChars: work.boilerplateTextChars,
    confidence: clamp(Number(confidence.toFixed(3)), 0, 0.98)
  };
}
