export type PageKind = "document" | "application" | "mixed";

export type MetadataValue = string | string[];

export type RawMetadata = {
  title?: string;
  description?: string;
  lang?: string;
  canonicalUrl?: string;
  meta: Record<string, MetadataValue>;
};

export type RawBlockKind =
  | "heading"
  | "paragraph"
  | "list_item"
  | "code"
  | "quote";

export type RawTextBlock = {
  kind: RawBlockKind;
  text: string;
  level?: number;
  order: number;
  sourceTag: string;
  regionRole?: string;
  regionName?: string;
};

export type RawLink = {
  text: string;
  href: string;
};

export type RawControlKind =
  | "button"
  | "input"
  | "select"
  | "textarea"
  | "checkbox"
  | "radio";

export type RawControl = {
  kind: RawControlKind;
  type?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  disabled: boolean;
};

export type RawControlSummary = {
  buttons: number;
  inputs: number;
  selects: number;
  textareas: number;
};

export type RawHeading = {
  level: number;
  text: string;
};

export type RawLandmark = {
  role: string;
  name?: string;
};

export type RawDomStructure = {
  headings: RawHeading[];
  landmarks: RawLandmark[];
  forms: number;
  lists: number;
  tables: number;
};

export type RawAccessibilityNode = {
  role: string;
  name?: string;
  value?: string;
  description?: string;
};

export type RawAccessibilitySummary = {
  available: boolean;
  roleCounts: Record<string, number>;
  nodes: RawAccessibilityNode[];
};

export type RawPageSnapshot = {
  sourceUrl: string;
  finalUrl: string;
  metadata: RawMetadata;
  blocks: RawTextBlock[];
  links: RawLink[];
  controls: {
    summary: RawControlSummary;
    items: RawControl[];
  };
  structure: RawDomStructure;
  accessibility: RawAccessibilitySummary;
  extractedAt: string;
};

export type WebSource = "text" | "dom" | "accessibility";

export type WebBlockKind =
  | "document"
  | "region"
  | "section"
  | "list"
  | "controls"
  | "heading"
  | "paragraph"
  | "list_item"
  | "code"
  | "quote"
  | "control";

export type WebProvenance = {
  sources: WebSource[];
  order?: number;
  sourceTag?: string;
  regionRole?: string;
  regionName?: string;
};

export type WebBlock = {
  id: string;
  kind: WebBlockKind;
  text?: string;
  name?: string;
  role?: string;
  level?: number;
  provenance: WebProvenance;
  children: WebBlock[];
};

export type WebLink = {
  id: string;
  text: string;
  href: string;
};

export type WebControl = RawControl & {
  id: string;
};

export type ClassificationSignals = {
  textChars: number;
  controlCount: number;
  headingCount: number;
  appRoleCount: number;
  landmarkCount: number;
};

export type WebIR = {
  source: {
    url: string;
    finalUrl: string;
    fetchedAt: string;
    title?: string;
  };
  page: {
    kind: PageKind;
    language?: string;
    description?: string;
    classificationSignals: ClassificationSignals;
  };
  metadata: Record<string, MetadataValue>;
  document: WebBlock;
  blocks: WebBlock[];
  links: WebLink[];
  controls: {
    summary: RawControlSummary;
    items: WebControl[];
  };
  structure: RawDomStructure;
  accessibility: RawAccessibilitySummary;
  extraction: {
    stable: boolean;
    strategy: "milestone3";
    warnings: string[];
  };
};
