// EDA Full Scraper — READ ONLY — navigates search page and captures interface
const puppeteer = require('puppeteer');
const fs = require('fs');

const EMAIL = process.env.EDA_EMAIL || 'kgray@selwaytool.com';
const PASSWORD = process.env.EDA_PASSWORD || '';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // LOGIN
    console.log('Logging into EDA...');
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

    if (!page.url().includes('edadata.com')) {
      console.log('Login failed. URL: ' + page.url());
      await browser.close();
      return;
    }
    console.log('LOGIN SUCCESSFUL!');

    // NAVIGATE TO SEARCH
    console.log('Navigating to Search page...');
    await page.goto('https://online.edadata.com/Query', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });

    // Screenshot the search page
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-search-page.png', fullPage: true });
    console.log('Search page screenshot saved');

    // Save the search page HTML
    const searchHtml = await page.content();
    fs.writeFileSync('/Users/madden/selway-intelligence/eda-search.html', searchHtml.substring(0, 30000));
    console.log('Search page HTML saved');

    // Get all input/select/button info using page.evaluate
    const formInfo = await page.$$eval('input, select, button, textarea, label', function(els) {
      return els.map(function(el) {
        return [el.tagName, el.type || '', el.id || '', el.name || '', el.placeholder || '', (el.textContent || '').trim().substring(0, 60)].join(' | ');
      });
    });
    console.log('Form elements on search page:');
    formInfo.forEach(function(line) { console.log('  ' + line); });

    // Also check for existing watches we can pull data from
    console.log('\nChecking existing watches...');
    await page.goto('https://online.edadata.com/Watch', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-watches.png', fullPage: true });
    console.log('Watches page screenshot saved');

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-error.png' }).catch(function() {});
  }

  await browser.close();
  console.log('Done.');
})();
