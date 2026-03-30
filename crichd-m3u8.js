#!/usr/bin/env node
const { chromium } = require('playwright');

const CHANNELS = {
  starsp1:     'Star Sports 1',
  willow:      'Willow',
  starsp2:     'Star Sports 2',
  starsp3:     'Star Sports 1 Hindi',
  willowextra: 'Willow 2',
  willowhd:    'Willow HD',
  starsp1tam:  'Star Sports 1 Tamil',
  starsp1tel:  'Star Sports 1 Telugu',
};

const REFERER = 'https://player0003.com/';
const BASE_URL = 'https://stream.crichd.com.ua/stream.php?id=';

async function scrapeChannel(browser, channelId) {
  const context = await browser.newContext();
  const page = await context.newPage();

  return new Promise(async (resolve) => {
    let m3u8Url = null;

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('.m3u8') && url.includes('bhalocast')) {
        m3u8Url = url;
      }
    });

    try {
      await page.goto(BASE_URL + channelId, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const start = Date.now();
      while (!m3u8Url && Date.now() - start < 25000) {
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    await context.close();
    resolve(m3u8Url);
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const results = {};

  for (const [id, name] of Object.entries(CHANNELS)) {
    process.stderr.write(`  ⏳ ${name}...`);
    const url = await scrapeChannel(browser, id);
    if (url) {
      results[id] = { name, url };
      process.stderr.write(' ✅\n');
    } else {
      process.stderr.write(' ❌\n');
    }
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
