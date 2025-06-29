import { readFile } from 'fs/promises';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
// import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { writeToPath } from 'fast-csv';

const urlsToCheck = JSON.parse(await readFile(new URL('./urls.json', import.meta.url), 'utf-8'));
console.log(`✅ Loaded ${urlsToCheck.length} URLs`);

const results = [];
let imageGlobalIndex = 1;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const calculateBlurScore = async (buffer) => {
  try {
    const { data } = await sharp(buffer)
      .resize(64, 64, { fit: 'inside' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.round(variance);
  } catch {
    return null;
  }
};

async function safeGoto(page, url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      return;
    } catch (err) {
      console.warn(`⚠️ Retry ${i + 1}/${retries} failed for ${url}: ${err.message}`);
      if (i === retries - 1) throw err;
      await delay(3000);
    }
  }
}

async function simulateTouchInteraction(page) {
  await page.mouse.move(10, 10);
  await page.mouse.down();
  await delay(100);
  await page.mouse.move(20, 20);
  await delay(100);
  await page.mouse.up();
}

async function autoScrollAndTouch(page, deviceLabel) {
  try {
    if (deviceLabel === 'Desktop') {
      // Scroll-based lazy load (Desktop)
      await page.evaluate(async () => {
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        let y = 0;
        while (y < document.body.scrollHeight) {
          window.scrollTo({ top: y, behavior: 'smooth' });
          await delay(250);
          y += window.innerHeight / 2;
        }
      });
    } else if (deviceLabel === 'Mobile') {
      // Touch-based lazy load (Mobile)
      await page.touchscreen.tap(30, 200);
      await page.touchscreen.tap(50, 400);
      await page.touchscreen.tap(80, 600);
      await page.evaluate(async () => {
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        await delay(1000);
      });
    }

    // Force full visibility of lazy-loaded elements
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.style.opacity = '1';
        img.style.visibility = 'visible';
        img.style.filter = 'none';
        const lazySrc =
          img.getAttribute('data-src') ||
          img.getAttribute('data-original') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-lazy');
        if (lazySrc && !img.src.includes(lazySrc)) {
          img.src = lazySrc;
        }
      });
    });

    await delay(2000);
  } catch (err) {
    console.warn('⚠️ Scroll/Touch interaction failed:', err.message);
  }
}


async function processImages(page, pageUrl, deviceLabel) {
  const images = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).map((img) => ({
      src:
        img.getAttribute('src') ||
        img.getAttribute('data-src') ||
        img.getAttribute('data-original') ||
        img.getAttribute('data-lazy-src') ||
        img.getAttribute('data-lazy') ||
        '',
      alt: img.alt || img.getAttribute('aria-label') || 'Image',
      displayedWidth: img.clientWidth,
      displayedHeight: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }))
  );

  for (const img of images) {
    if (!img.src?.startsWith('http') || /\.(gif)$/i.test(img.src)) continue;
    if (!/\.(jpe?g|png|webp)$/i.test(img.src)) continue;

    const sizeMismatch = img.naturalWidth < img.displayedWidth || img.naturalHeight < img.displayedHeight;
    let blurry = false;

    try {
      if (!sizeMismatch) {
        const res = await fetch(img.src);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const score = await calculateBlurScore(buffer);
        blurry = score !== null && score < 50;
      }

      results.push({
        Image_Index: imageGlobalIndex++,
        Page_URL: pageUrl,
        Device: deviceLabel,
        Image_Alt_or_Desc: img.alt,
        imageUrl: img.src,
        Displayed_Width_px: img.displayedWidth,
        Displayed_Height_px: img.displayedHeight,
        Natural_Width_px: img.naturalWidth,
        Natural_Height_px: img.naturalHeight,
        Pixelation_Issues: blurry
          ? 'Yes – blurry'
          : sizeMismatch
            ? 'Yes – pixelated'
            : 'No',
      });
    } catch (err) {
      console.warn(`⚠️ Failed to process ${img.src}: ${err.message}`);
    }
  }
}

async function processURL(browser, pageUrl) {
  for (const device of [
    { name: 'Desktop', viewport: { width: 1366, height: 768 } },
    { name: 'Mobile', viewport: { width: 375, height: 812, isMobile: true } },
  ]) {
    const page = await browser.newPage();
    await page.setViewport(device.viewport);
    try {
      console.log(`🔍 Checking ${device.name} → ${pageUrl}`);
      await safeGoto(page, pageUrl);
      await delay(2000);
      await autoScrollAndTouch(page, device.name);
      await delay(2000);
      await processImages(page, pageUrl, device.name);
    } catch (err) {
      console.error(`❌ Error on ${device.name} ${pageUrl}: ${err.message}`);
    } finally {
      await page.close();
    }
  }
}

const CONCURRENCY = 2;
const chunked = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    protocolTimeout: 120000,
  });

  for (const batch of chunked(urlsToCheck, CONCURRENCY)) {
    await Promise.all(batch.map((url) => processURL(browser, url)));
  }

  await browser.close();

  const outputPath = './image-check-report.csv';
  if (results.length === 0) {
    console.log('⚠️ No reportable issues found.');
  } else {
    writeToPath(outputPath, results, { headers: true }).on('finish', () => {
      console.log(`✅ Report written to ${outputPath}`);
    });
  }
})();
