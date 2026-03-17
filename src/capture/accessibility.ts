import type { Page } from "playwright";

import type { RawAccessibilityNode, RawAccessibilitySummary } from "../shared/types.js";

type CdpAXValue = {
  value?: string | number | boolean;
};

type CdpAXNode = {
  ignored?: boolean;
  role?: CdpAXValue;
  name?: CdpAXValue;
  description?: CdpAXValue;
  value?: CdpAXValue;
};

type CdpFullAXTreeResult = {
  nodes: CdpAXNode[];
};

const INTERESTING_ROLES = new Set([
  "rootWebArea",
  "document",
  "article",
  "main",
  "navigation",
  "banner",
  "contentinfo",
  "search",
  "form",
  "heading",
  "paragraph",
  "link",
  "button",
  "textbox",
  "searchbox",
  "checkbox",
  "radioButton",
  "combobox",
  "list",
  "listitem",
  "table",
  "row",
  "cell",
  "grid",
  "tab",
  "tablist",
  "tabpanel",
  "dialog",
  "menu",
  "menuitem"
]);

function toOptionalString(value?: CdpAXValue): string | undefined {
  const raw = value?.value;

  if (raw === undefined || raw === null) {
    return undefined;
  }

  const stringValue = String(raw).trim();
  return stringValue || undefined;
}

function normalizeRole(value?: CdpAXValue): string | undefined {
  const role = toOptionalString(value);

  if (!role) {
    return undefined;
  }

  return `${role[0].toLowerCase()}${role.slice(1)}`;
}

export async function captureAccessibilitySummary(page: Page): Promise<RawAccessibilitySummary> {
  const session = await page.context().newCDPSession(page);

  try {
    const result = (await session.send("Accessibility.getFullAXTree")) as CdpFullAXTreeResult;
    const roleCounts: Record<string, number> = {};
    const nodes: RawAccessibilityNode[] = [];

    for (const node of result.nodes) {
      if (node.ignored) {
        continue;
      }

      const role = normalizeRole(node.role);

      if (!role) {
        continue;
      }

      roleCounts[role] = (roleCounts[role] ?? 0) + 1;

      if (!INTERESTING_ROLES.has(role) || nodes.length >= 80) {
        continue;
      }

      nodes.push({
        role,
        name: toOptionalString(node.name),
        value: toOptionalString(node.value),
        description: toOptionalString(node.description)
      });
    }

    return {
      available: true,
      roleCounts,
      nodes
    };
  } catch {
    return {
      available: false,
      roleCounts: {},
      nodes: []
    };
  } finally {
    await session.detach().catch(() => undefined);
  }
}
