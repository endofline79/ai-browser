import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

export type BrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

export async function createBrowserSession(): Promise<BrowserSession> {
  const executablePath = process.env.CHROME_PATH;

  const browser = executablePath
    ? await chromium.launch({
        executablePath,
        headless: true
      })
    : await chromium.launch({
        channel: "chrome",
        headless: true
      });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1200 }
  });

  const page = await context.newPage();

  return { browser, context, page };
}

export async function closeBrowserSession(session: BrowserSession): Promise<void> {
  await session.context.close();
  await session.browser.close();
}
