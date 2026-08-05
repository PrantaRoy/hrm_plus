import puppeteer, { Browser } from "puppeteer";

let browserPromise: Promise<Browser> | undefined;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  }
  return browserPromise;
}

/**
 * Renders a full HTML document to a PDF buffer. Reuses a single lazily-launched
 * Chromium instance across calls (one page per render, not one browser per render) —
 * launching Chromium per request would be far too slow for a request/preview flow.
 */
export async function renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise;
  await browser.close();
  browserPromise = undefined;
}
