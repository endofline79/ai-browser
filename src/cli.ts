import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { closeBrowserSession, createBrowserSession } from "./browser/runtime.js";
import { waitForBasicStability } from "./browser/stability.js";
import { capturePageSnapshot } from "./capture/snapshot.js";
import { renderJson } from "./output/json.js";
import { renderMarkdown } from "./output/markdown.js";
import { buildWebIR } from "./semantic/web-ir.js";

type CliOptions = {
  url: string;
  outDir?: string;
  format: "json" | "markdown";
};

function parseArgs(argv: string[]): CliOptions {
  const args = [...argv];
  const url = args.shift();

  if (!url) {
    throw new Error("Usage: npm run extract -- <url> [--out <dir>] [--format json|markdown]");
  }

  let outDir: string | undefined;
  let format: "json" | "markdown" = "json";

  while (args.length > 0) {
    const current = args.shift();

    if (current === "--out") {
      outDir = args.shift();

      if (!outDir) {
        throw new Error("Expected a directory path after --out");
      }

      continue;
    }

    if (current === "--format") {
      const value = args.shift();

      if (value !== "json" && value !== "markdown") {
        throw new Error("Expected --format json or --format markdown");
      }

      format = value;
      continue;
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return { url, outDir, format };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const session = await createBrowserSession();

  try {
    await session.page.goto(options.url, {
      timeout: 30000,
      waitUntil: "domcontentloaded"
    });

    const stable = await waitForBasicStability(session.page);
    const snapshot = await capturePageSnapshot(session.page, options.url);
    const webIR = buildWebIR(snapshot, stable);

    const json = renderJson(webIR);
    const markdown = renderMarkdown(webIR);

    if (options.outDir) {
      await mkdir(options.outDir, { recursive: true });
      await writeFile(path.join(options.outDir, "page.json"), json, "utf8");
      await writeFile(path.join(options.outDir, "page.md"), markdown, "utf8");
      process.stdout.write(`Wrote ${path.join(options.outDir, "page.json")}\n`);
      process.stdout.write(`Wrote ${path.join(options.outDir, "page.md")}\n`);
      return;
    }

    process.stdout.write(options.format === "markdown" ? markdown : json);
  } finally {
    await closeBrowserSession(session);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
