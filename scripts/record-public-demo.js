import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.env.DEMO_URL || "https://contextgate-u4dj5xorbq-du.a.run.app/";
await mkdir("recordings", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: "recordings/raw", size: { width: 1440, height: 900 } }
});
const page = await context.newPage();
const video = page.video();

await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.locator("#dbLabel").filter({ hasText: "HydraDB" }).waitFor({ timeout: 120000 });
await page.waitForTimeout(4000);

for (const scene of [
  { title: "Send launch confirmation", verdict: "BLOCK", pause: 11000 },
  { title: "Send corrected launch update", verdict: "ALLOW", pause: 10000 },
  { title: "Change data residency", verdict: "CLARIFY", pause: 10000 }
]) {
  await page.locator(".action-item", { hasText: scene.title }).click();
  await page.waitForTimeout(1800);
  await page.locator("#execute").click();
  await page.locator("#result h3").filter({ hasText: scene.verdict }).waitFor({ timeout: 30000 });
  await page.waitForTimeout(scene.pause);
}

await page.locator(".proof").scrollIntoViewIfNeeded();
await page.waitForTimeout(8000);
await page.goto("https://github.com/lsh2546/contextgate-hack-hydra-2026/actions/runs/32095767381", {
  waitUntil: "domcontentloaded",
  timeout: 120000
});
await page.waitForTimeout(12000);
await context.close();
await video.saveAs("recordings/contextgate-public-demo.webm");
await browser.close();

console.log("Recorded recordings/contextgate-public-demo.webm from", url);
