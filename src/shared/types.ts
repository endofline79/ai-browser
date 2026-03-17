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
};

export type RawLink = {
  text: string;
  href: string;
};

export type RawControlSummary = {
  buttons: number;
  inputs: number;
  selects: number;
  textareas: number;
};

export type RawPageSnapshot = {
  sourceUrl: string;
  finalUrl: string;
  metadata: RawMetadata;
  blocks: RawTextBlock[];
  links: RawLink[];
  controls: RawControlSummary;
  extractedAt: string;
};

export type WebBlock = {
  id: string;
  kind: RawBlockKind;
  text: string;
  level?: number;
};

export type WebLink = {
  id: string;
  text: string;
  href: string;
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
  };
  metadata: Record<string, MetadataValue>;
  blocks: WebBlock[];
  links: WebLink[];
  controls: RawControlSummary;
  extraction: {
    stable: boolean;
    strategy: "milestone1";
    warnings: string[];
  };
};
