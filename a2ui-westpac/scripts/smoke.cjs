// Drives the four scenarios in a headless browser and fails on any console
// error or renderer validation error. Needs a server on :4173 (`npm run
// preview`) and Playwright with Chromium available.
//
//   node scripts/smoke.cjs
const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const problems = [];
  page.on('console', m => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));

  await page.goto(process.env.URL ?? 'http://localhost:4173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(4000);
  for (const chip of ['Move $500', 'recognise', 'term deposit']) {
    await page.click(`button.chip:has-text("${chip}")`);
    await page.waitForTimeout(4500);
  }
  await page.locator('a2w-button md-filled-button', {hasText: 'Confirm'}).last().click();
  await page.waitForTimeout(3000);
  for (const renderer of ['Material baseline', 'A2UI reference', 'Westpac GEL']) {
    await page.click(`.seg button:has-text("${renderer}")`);
    await page.waitForTimeout(600);
  }
  await page.click('.tabs button:has-text("Stream")');
  await page.waitForTimeout(300);
  const errors = await page.$$eval('.entry.error pre', els => els.map(e => e.textContent?.slice(0, 200)));
  problems.push(...errors.map(e => `stream: ${e}`));
  const surfaces = await page.locator('a2ui-surface').count();
  await browser.close();

  console.log(`surfaces rendered: ${surfaces}`);
  if (surfaces < 4) problems.push(`expected at least 4 surfaces, saw ${surfaces}`);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log('smoke: ok');
})();
