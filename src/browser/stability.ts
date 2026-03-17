import type { Page } from "playwright";

export async function waitForBasicStability(page: Page): Promise<boolean> {
  let sawNetworkIdle = false;

  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
  } catch {
    return false;
  }

  try {
    await page.waitForLoadState("load", { timeout: 15000 });
  } catch {
    // Some pages never complete full load cleanly. Continue with best effort.
  }

  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
    sawNetworkIdle = true;
  } catch {
    // Many modern apps never truly go network-idle.
  }

  await page.waitForTimeout(750);

  return sawNetworkIdle;
}
