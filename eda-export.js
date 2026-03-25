// EDA Export Script — Login, explore watches, capture data. READ ONLY.
const puppeteer = require('puppeteer');
const fs = require('fs');

const EMAIL = process.env.EDA_EMAIL || 'kgray@selwaytool.com';
const PASSWORD = process.env.EDA_PASSWORD || '';

async function login(page) {
  await page.goto('https://online.edadata.com', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', EMAIL, { delay: 30 });
  await new Promise(function(r) { setTimeout(r, 500); });
  await page.click('#loginButton, .btnGreen, .btnOrange, #loginForm button');
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  await page.type('input[type="password"]', PASSWORD, { delay: 30 });
  await new Promise(function(r) { setTimeout(r, 500); });
  await page.click('#loginButton');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(function() {});
  return page.url().includes('edadata.com');
}

(async () => {
  var browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox'],
  });

  var page = await browser.newPage();

  // Capture JSON API responses
  var captured = [];
  page.on('response', async function(resp) {
    var url = resp.url();
    var ct = resp.headers()['content-type'] || '';
    if (ct.includes('json') && (url.includes('edadata') || url.includes('fusable'))) {
      try {
        var text = await resp.text();
        if (text.length > 50) {
          captured.push({ url: url, size: text.length });
          fs.appendFileSync('/Users/madden/selway-intelligence/eda-api-log.jsonl', JSON.stringify({ url: url, body: text.substring(0, 100000) }) + '\n');
        }
      } catch (e) {}
    }
  });

  try {
    console.log('Logging in...');
    var ok = await login(page);
    if (!ok) { console.log('Login failed'); await browser.close(); return; }
    console.log('LOGIN OK');

    // Load the Doosan watch results
    console.log('Loading Doosan watch...');
    await page.goto('https://online.edadata.com/Watch/Index/32dbf08e88c14dcebf2f0d527c1aae4a', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 3000); });
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-doosan-watch.png', fullPage: true });

    // Load the 5-Axis NorCal watch
    console.log('Loading 5-Axis NorCal watch...');
    await page.goto('https://online.edadata.com/Watch/Index/632fdce67c6f46428be5bc7f9f4d58ea', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 3000); });
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-5axis-watch.png', fullPage: true });

    // Try search page — type MAZAK and search
    console.log('Running MAZAK search...');
    await page.goto('https://online.edadata.com/Query', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });

    var searchInput = await page.$('#SimpleSearchAutoSuggest');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type('MAZAK', { delay: 50 });
      await new Promise(function(r) { setTimeout(r, 1500); });
      await page.keyboard.press('Enter');
      await new Promise(function(r) { setTimeout(r, 5000); });
      await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-mazak-search.png', fullPage: true });
      console.log('Mazak search screenshot saved');

      // Save page HTML
      var html = await page.content();
      fs.writeFileSync('/Users/madden/selway-intelligence/eda-mazak-results.html', html.substring(0, 50000));
    }

    // Log captured API calls
    console.log('\nCaptured ' + captured.length + ' API responses:');
    captured.forEach(function(c) { console.log('  ' + c.url.substring(0, 100) + ' (' + c.size + ' bytes)'); });

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-error.png' }).catch(function() {});
  }

  await browser.close();
  console.log('Done.');
})();
