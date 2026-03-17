import type {
  RawPageSnapshot,
  RawTextBlock,
  WebBlock,
  WebBlockKind,
  WebProvenance,
  WebSource
} from "../shared/types.js";

type BlockFactory = (input: {
  kind: WebBlockKind;
  text?: string;
  name?: string;
  role?: string;
  level?: number;
  provenance: WebProvenance;
  children?: WebBlock[];
}) => WebBlock;

type TreeBuildResult = {
  document: WebBlock;
  flatBlocks: WebBlock[];
};

type SectionFrame = {
  block: WebBlock;
  level: number;
};

function provenanceFromRawBlock(rawBlock: RawTextBlock, sources: WebSource[]): WebProvenance {
  return {
    sources,
    order: rawBlock.order,
    sourceTag: rawBlock.sourceTag,
    regionRole: rawBlock.regionRole,
    regionName: rawBlock.regionName
  };
}

function appendTextBlocksToContainer(
  rawBlocks: RawTextBlock[],
  container: WebBlock,
  createBlock: BlockFactory,
  flatBlocks: WebBlock[]
): void {
  const sectionStack: SectionFrame[] = [{ block: container, level: 0 }];
  let currentList: WebBlock | undefined;

  for (const rawBlock of rawBlocks) {
    if (rawBlock.kind === "heading") {
      currentList = undefined;
      const headingLevel = rawBlock.level ?? 1;

      while (sectionStack.length > 1 && sectionStack[sectionStack.length - 1]!.level >= headingLevel) {
        sectionStack.pop();
      }

      const sectionBlock = createBlock({
        kind: "section",
        name: rawBlock.text,
        level: headingLevel,
        provenance: provenanceFromRawBlock(rawBlock, ["text", "dom"])
      });

      const headingBlock = createBlock({
        kind: "heading",
        text: rawBlock.text,
        level: headingLevel,
        provenance: provenanceFromRawBlock(rawBlock, ["text", "dom"])
      });

      sectionBlock.children.push(headingBlock);
      sectionStack[sectionStack.length - 1]!.block.children.push(sectionBlock);
      sectionStack.push({ block: sectionBlock, level: headingLevel });
      flatBlocks.push(headingBlock);
      continue;
    }

    const parent = sectionStack[sectionStack.length - 1]!.block;

    if (rawBlock.kind === "list_item") {
      if (!currentList) {
        currentList = createBlock({
          kind: "list",
          provenance: provenanceFromRawBlock(rawBlock, ["text", "dom"])
        });
        parent.children.push(currentList);
      }

      const listItemBlock = createBlock({
        kind: "list_item",
        text: rawBlock.text,
        provenance: provenanceFromRawBlock(rawBlock, ["text", "dom"])
      });

      currentList.children.push(listItemBlock);
      flatBlocks.push(listItemBlock);
      continue;
    }

    currentList = undefined;

    const contentBlock = createBlock({
      kind: rawBlock.kind,
      text: rawBlock.text,
      level: rawBlock.level,
      provenance: provenanceFromRawBlock(rawBlock, ["text", "dom"])
    });

    parent.children.push(contentBlock);
    flatBlocks.push(contentBlock);
  }
}

function groupByRegionSegments(rawBlocks: RawTextBlock[]): Array<{
  role?: string;
  name?: string;
  blocks: RawTextBlock[];
}> {
  const segments: Array<{
    role?: string;
    name?: string;
    blocks: RawTextBlock[];
  }> = [];

  for (const rawBlock of rawBlocks) {
    const previous = segments[segments.length - 1];

    if (
      previous &&
      previous.role === rawBlock.regionRole &&
      previous.name === rawBlock.regionName
    ) {
      previous.blocks.push(rawBlock);
      continue;
    }

    segments.push({
      role: rawBlock.regionRole,
      name: rawBlock.regionName,
      blocks: [rawBlock]
    });
  }

  return segments;
}

export function buildDocumentTree(
  snapshot: RawPageSnapshot,
  pageTitle: string | undefined
): TreeBuildResult {
  let nextId = 1;
  const flatBlocks: WebBlock[] = [];

  const createBlock: BlockFactory = ({ kind, text, name, role, level, provenance, children = [] }) => ({
    id: `block-${nextId++}`,
    kind,
    text,
    name,
    role,
    level,
    provenance,
    children
  });

  const documentBlock = createBlock({
    kind: "document",
    name: pageTitle ?? snapshot.finalUrl,
    provenance: {
      sources: ["dom"]
    }
  });

  const orderedBlocks = [...snapshot.blocks].sort((left, right) => left.order - right.order);
  const hasExplicitRegions = orderedBlocks.some((block) => block.regionRole || block.regionName);

  if (hasExplicitRegions) {
    const regionSegments = groupByRegionSegments(orderedBlocks);

    for (const segment of regionSegments) {
      const regionBlock = createBlock({
        kind: "region",
        name: segment.name ?? segment.role ?? "content",
        role: segment.role ?? "content",
        provenance: {
          sources: ["dom", "text"],
          order: segment.blocks[0]?.order,
          regionRole: segment.role,
          regionName: segment.name
        }
      });

      appendTextBlocksToContainer(segment.blocks, regionBlock, createBlock, flatBlocks);
      documentBlock.children.push(regionBlock);
    }
  } else {
    appendTextBlocksToContainer(orderedBlocks, documentBlock, createBlock, flatBlocks);
  }

  if (snapshot.controls.items.length > 0) {
    const controlsBlock = createBlock({
      kind: "controls",
      name: "controls",
      provenance: {
        sources: snapshot.accessibility.available ? ["dom", "accessibility"] : ["dom"]
      }
    });

    for (const control of snapshot.controls.items) {
      const controlLabel =
        control.label ??
        control.name ??
        control.placeholder ??
        control.value ??
        control.kind;

      controlsBlock.children.push(
        createBlock({
          kind: "control",
          name: controlLabel,
          role: control.kind,
          provenance: {
            sources: snapshot.accessibility.available ? ["dom", "accessibility"] : ["dom"]
          }
        })
      );
    }

    documentBlock.children.push(controlsBlock);
  }

  return {
    document: documentBlock,
    flatBlocks
  };
}
