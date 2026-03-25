// EDA Scraper — READ ONLY — searches online.edadata.com for competitor UCC filings
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
    // Step 1: Navigate to EDA login
    console.log('Navigating to EDA...');
    await page.goto('https://online.edadata.com', { waitUntil: 'networkidle2', timeout: 30000 });

    // Step 2: Enter email
    console.log('Entering email...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', EMAIL, { delay: 30 });

    // Step 3: Click CONTINUE button (try multiple selectors)
    console.log('Clicking Continue...');
    await new Promise(function(r) { setTimeout(r, 500); });
    // Click any visible button in the login form
    await page.click('#loginButton, #btnContinue, .btnGreen, .btnOrange, #loginForm button, .login-form button');

    // Wait for password field to appear (two-step flow)
    console.log('Waiting for password field...');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });

    // Step 4: Enter password
    console.log('Entering password...');
    await page.type('input[type="password"]', PASSWORD, { delay: 30 });

    // Step 5: Click LOGIN button
    console.log('Clicking LOGIN...');
    await new Promise(function(r) { setTimeout(r, 500); });
    // The LOGIN button is visible now - click it
    await page.click('#loginButton');
    console.log('LOGIN clicked');

    // Wait for redirect to EDA dashboard
    console.log('Waiting for login redirect...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(function() {});

    const url = page.url();
    console.log('Current URL: ' + url);
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-after-login.png', fullPage: true });

    if (url.includes('edadata.com')) {
      console.log('LOGIN SUCCESSFUL!');

      // Save dashboard HTML to understand the search interface
      const html = await page.content();
      fs.writeFileSync('/Users/madden/selway-intelligence/eda-dashboard.html', html);
      console.log('Dashboard HTML saved');

      // Screenshot the dashboard
      await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-dashboard.png', fullPage: true });
      console.log('Dashboard screenshot saved');

      // Get all links on the page to understand navigation
      const linkTexts = await page.$$eval('a', function(els) {
        return els.map(function(a) { return a.textContent.trim() + ' -> ' + a.href; }).filter(function(l) { return l.length > 5; });
      });
      console.log('Navigation links found:');
      linkTexts.slice(0, 30).forEach(function(l) { console.log('  ' + l); });

    } else {
      console.log('May not be fully logged in yet. URL: ' + url);
      await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-state.png', fullPage: true });
      const html = await page.content();
      fs.writeFileSync('/Users/madden/selway-intelligence/eda-state.html', html);
    }

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/Users/madden/selway-intelligence/eda-error.png' }).catch(function() {});
  }

  await browser.close();
  console.log('Done.');
})();
