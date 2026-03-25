#!/usr/bin/env node
// EDA Refresh — One command to pull fresh UCC data and update the dashboard
// Usage: node eda-refresh.js
// What it does: Login to EDA → Export CSV → Parse → Update eda-data.js → Push live

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const EMAIL = 'kgray@selwaytool.com';
const PASSWORD = 'Selway*1234';
const DOWNLOAD_DIR = path.join(__dirname, 'eda-downloads');
const CUTOFF_DATE = new Date('2025-11-15');

async function main() {
  console.log('=== Selway EDA Refresh ===');
  console.log('Starting at ' + new Date().toLocaleString());

  // Ensure download dir exists
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

  console.log('\n1. Launching browser and logging into EDA...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Set download behavior
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_DIR,
  });

  try {
    // Login
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
      console.log('Login failed! URL: ' + page.url());
      await browser.close();
      return;
    }
    console.log('   Logged in successfully!');

    // Look for export/download option
    console.log('\n2. Navigating to export...');
    await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'eda-dashboard.png') });

    // Check if there's a way to trigger a full export from the dashboard
    // The user previously exported EDA_Export_FullFile — let's see if we can trigger that
    console.log('   Looking for export functionality...');

    // Navigate to search/query page
    await page.goto('https://online.edadata.com/Query', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });
    await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'eda-search.png') });

    console.log('\n   NOTE: EDA requires manual export from the web interface.');
    console.log('   The browser is open — please do the following:');
    console.log('   1. Run your search or go to your saved search');
    console.log('   2. Click Export / Download');
    console.log('   3. Save the CSV file');
    console.log('   4. Close the browser when done');
    console.log('\n   Waiting for you to export and close the browser...');

    // Wait for browser to close (user closes it when done)
    await new Promise(function(resolve) {
      browser.on('disconnected', resolve);
    });

    console.log('\n3. Browser closed. Looking for new CSV export...');

  } catch (err) {
    console.error('Browser error:', err.message);
    await browser.close();
  }

  // Look for the most recent EDA export CSV
  var csvPath = findLatestCSV();
  if (!csvPath) {
    console.log('   No new CSV found. Checking Downloads folder...');
    csvPath = findLatestCSV('/Users/madden/Downloads');
  }

  if (!csvPath) {
    console.log('   No EDA CSV found. Place the export in ~/Downloads and re-run.');
    return;
  }

  console.log('   Found: ' + csvPath);
  console.log('\n4. Parsing CSV...');
  var records = parseEDACSV(csvPath);
  console.log('   ' + records.length + ' total records parsed');

  // Filter by date and states
  var filtered = records.filter(function(r) { return r._date >= CUTOFF_DATE; });
  console.log('   ' + filtered.length + ' records since Nov 15 2025');

  var conquest = filtered.filter(function(r) { return r.brand && r.brand !== 'HAAS'; });
  var trinity = filtered.filter(function(r) { return r.brand === 'HAAS'; });
  console.log('   ' + conquest.length + ' conquest + ' + trinity.length + ' Trinity');

  console.log('\n5. Updating eda-data.js...');
  conquest.sort(function(a, b) { return (b.ucc_date || '').localeCompare(a.ucc_date || ''); });
  trinity.sort(function(a, b) { return (b.ucc_date || '').localeCompare(a.ucc_date || ''); });

  // Remove internal _date field before saving
  conquest.forEach(function(r) { delete r._date; });
  trinity.forEach(function(r) { delete r._date; });

  var js = '// EDA UCC Data — Updated ' + new Date().toISOString().split('T')[0] + '\n';
  js += '// Source: online.edadata.com | States: OR, WA, CA, UT, NV\n';
  js += '// ' + conquest.length + ' conquest + ' + trinity.length + ' Haas = ' + (conquest.length + trinity.length) + ' total\n\n';
  js += 'const EDA_CONQUEST = ' + JSON.stringify(conquest) + ';\n\n';
  js += 'const EDA_TRINITY = ' + JSON.stringify(trinity) + ';\n';

  fs.writeFileSync(path.join(__dirname, 'eda-data.js'), js);
  console.log('   eda-data.js updated!');

  // Also update CSV on desktop
  console.log('\n6. Updating desktop CSV...');
  updateDesktopCSV(filtered);
  console.log('   Desktop CSV updated!');

  // Git commit and push
  console.log('\n7. Pushing to GitHub Pages...');
  var spawn = require('child_process').spawnSync;
  spawn('git', ['add', 'eda-data.js'], { cwd: __dirname, stdio: 'inherit' });
  spawn('git', ['commit', '-m', 'data: EDA refresh ' + new Date().toISOString().split('T')[0]], { cwd: __dirname, stdio: 'inherit' });
  spawn('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'inherit' });

  console.log('\n=== Done! Dashboard updated at https://jonnymadden21.github.io/selway-intelligence/ ===');
}

function findLatestCSV(dir) {
  dir = dir || DOWNLOAD_DIR;
  if (!fs.existsSync(dir)) return null;
  var files = fs.readdirSync(dir).filter(function(f) {
    return f.startsWith('EDA_Export') && f.endsWith('.csv');
  });
  if (files.length === 0) return null;
  files.sort(function(a, b) {
    return fs.statSync(path.join(dir, b)).mtime - fs.statSync(path.join(dir, a)).mtime;
  });
  return path.join(dir, files[0]);
}

function parseEDACSV(csvPath) {
  var content = fs.readFileSync(csvPath, 'utf-8');
  var lines = content.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  var header = parseCSVLine(lines[0]);
  var records = [];
  var states = ['OR', 'WA', 'CA', 'UT', 'NV'];

  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var cols = parseCSVLine(lines[i]);
    var row = {};
    for (var j = 0; j < header.length; j++) {
      row[header[j]] = (cols[j] || '').trim();
    }

    var state = row['BUYSTATE'] || '';
    if (states.indexOf(state) === -1) continue;

    var phone = (row['BUYPHONE'] || '').trim();
    if (phone && phone !== '0000000000' && phone.length === 10) {
      phone = '(' + phone.substring(0, 3) + ') ' + phone.substring(3, 6) + '-' + phone.substring(6);
    } else if (phone === '0000000000') {
      phone = '';
    }

    var uccDate = (row['UCCDATE'] || '').trim();
    var parsedDate = null;
    if (uccDate) {
      var parts = uccDate.split('/');
      if (parts.length === 3) {
        parsedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
    }

    records.push({
      company: (row['BUYCOMP1'] || '').trim(),
      contact: ((row['BUYC1FIRST'] || '') + ' ' + (row['BUYC1LAST'] || '')).trim(),
      title: (row['BUYC1TITLE'] || '').trim(),
      city: (row['BUYCITY'] || '').trim(),
      state: state,
      phone: phone,
      industry: (row['BUYSICDESC'] || '').trim(),
      ucc_date: uccDate,
      ucc_status: (row['UCCSTATUS'] || '').trim(),
      secured_party: (row['SPCOMP'] || '').trim(),
      brand: (row['EQTMAN'] || '').toUpperCase().trim(),
      model: (row['EQTMODEL'] || '').trim(),
      description: (row['EQTDESC'] || '').trim(),
      year: (row['EQTUCCYR'] || '').trim(),
      value: (row['EQTVALUE'] || '').trim() !== '0' ? (row['EQTVALUE'] || '').trim() : '',
      serial: (row['EQTSN'] || '').trim(),
      _date: parsedDate,
    });
  }
  return records;
}

function parseCSVLine(line) {
  var result = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function updateDesktopCSV(records) {
  var header = 'Territory,State,City,Secured Party,Equipment Brand,Equipment Model,Equipment Description,Equipment Year,Equipment Value,Serial Number,Company,Contact Name,Contact Title,Phone,Industry (SIC),UCC Filing Date,UCC Status\n';
  var territoryMap = { OR: 'T1 — Oregon', WA: 'T2 — Washington', UT: 'T5 — Utah', NV: 'T6 — Nevada', CA: 'California' };

  records.sort(function(a, b) { return (a.brand || 'ZZZ').localeCompare(b.brand || 'ZZZ'); });

  var rows = records.map(function(r) {
    return [territoryMap[r.state] || '', r.state, r.city, r.secured_party, r.brand, r.model, r.description, r.year, r.value, r.serial, r.company, r.contact, r.title, r.phone, r.industry, r.ucc_date, r.ucc_status]
      .map(function(v) { return '"' + (v || '').replace(/"/g, '""') + '"'; }).join(',');
  });

  fs.writeFileSync('/Users/madden/Desktop/Selway_EDA_Intelligence_Master.csv', header + rows.join('\n'));
}

main().catch(function(err) { console.error('Fatal error:', err); });
