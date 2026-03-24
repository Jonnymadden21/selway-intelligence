// Selway Intelligence — UCC Scanner Tab

async function renderUCCScanner(container) {
  const { el, TERRITORIES, timeAgo } = window.APP;

  const uccFilings = await getUCC();

  container.textContent = '';

  // Header
  container.appendChild(el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'UCC Scanner'),
      el('p', {}, 'Track competitor machine purchases via UCC-1 financing statements'),
    ]),
  ]));

  // State database links
  var stateLinks = [
    { name: 'Oregon', abbr: 'OR', status: 'Automated', statusColor: '#22c55e', url: 'https://data.oregon.gov' },
    { name: 'Washington', abbr: 'WA', status: 'Semi-Manual', statusColor: '#f59e0b', url: 'https://www.sos.wa.gov/ucc' },
    { name: 'California', abbr: 'CA', status: 'Semi-Manual', statusColor: '#f59e0b', url: 'https://bizfileonline.sos.ca.gov/search/ucc' },
    { name: 'Utah', abbr: 'UT', status: 'Semi-Manual', statusColor: '#f59e0b', url: 'https://secure.utah.gov/uccsearch' },
    { name: 'Nevada', abbr: 'NV', status: 'Semi-Manual', statusColor: '#f59e0b', url: 'https://www.nvsos.gov/sosentitysearch/UCCSearch.aspx' },
  ];

  var stateGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' } });
  stateLinks.forEach(function(s) {
    var card = el('div', { className: 'panel', style: { padding: '16px', cursor: 'pointer' } });
    card.addEventListener('click', function() { window.open(s.url, '_blank'); });
    card.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
      el('span', { style: { fontWeight: '700', fontSize: '14px' } }, s.abbr),
      el('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: s.statusColor, display: 'inline-block' } }),
    ]));
    card.appendChild(el('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, s.name));
    card.appendChild(el('div', { style: { fontSize: '10px', color: s.statusColor, fontWeight: '600', marginTop: '4px' } }, s.status));
    stateGrid.appendChild(card);
  });
  container.appendChild(stateGrid);

  // Competitor lender names
  var lenderPanel = el('div', { className: 'panel', style: { marginBottom: '24px' } });
  lenderPanel.appendChild(el('div', { className: 'panel-header' }, [
    el('span', { className: 'panel-title' }, 'Competitor Lender Names to Search'),
  ]));
  var lenderGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '16px' } });
  var lenders = ['Mazak Corporation', 'DMG MORI Finance', 'Okuma Credit Corporation', 'Doosan Industrial Vehicle', 'DN Solutions', 'Makino Inc', 'Matsuura Machinery', 'Kitamura Machinery', 'Toyoda Americas', 'Methods Machine Tools', 'Ellison Technologies', 'Hurco Companies'];
  lenders.forEach(function(name) {
    lenderGrid.appendChild(el('div', {
      style: { background: 'var(--ucc-bg)', color: 'var(--ucc)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textAlign: 'center' },
    }, name));
  });
  lenderPanel.appendChild(lenderGrid);
  container.appendChild(lenderPanel);

  // Filing log
  var filingPanel = el('div', { className: 'panel', style: { marginBottom: '24px' } });
  filingPanel.appendChild(el('div', { className: 'panel-header' }, [
    el('span', { className: 'panel-title' }, 'UCC Filing Log'),
    el('span', { className: 'panel-action', style: { cursor: 'default' } }, uccFilings.length + ' filings'),
  ]));

  var table = el('table', { className: 'data-table' });
  var thead = el('thead');
  var headerRow = el('tr');
  ['Company', 'Location', 'File #', 'Filed', 'Secured Party', 'Competitor'].forEach(function(h) {
    headerRow.appendChild(el('th', {}, h));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  var tbody = el('tbody');
  uccFilings.forEach(function(f) {
    var row = el('tr');
    row.appendChild(el('td', { style: { fontWeight: '600', color: 'var(--text-primary)' } }, f.company_name));
    row.appendChild(el('td', {}, (f.city || '') + ', ' + f.state));
    row.appendChild(el('td', { style: { fontFamily: 'monospace', fontSize: '11px' } }, f.file_number || '\u2014'));
    row.appendChild(el('td', {}, f.filing_date || '\u2014'));
    row.appendChild(el('td', { style: { color: 'var(--ucc)', fontWeight: '500' } }, f.secured_party));
    var badge = f.is_competitor
      ? el('span', { className: 'tag tag-hot' }, 'YES')
      : el('span', { className: 'tag tag-cool' }, 'NO');
    row.appendChild(el('td', {}, badge));
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  filingPanel.appendChild(table);
  container.appendChild(filingPanel);

  // Upload form
  var uploadPanel = el('div', { className: 'panel' });
  uploadPanel.appendChild(el('div', { className: 'panel-header' }, [
    el('span', { className: 'panel-title' }, 'Manual UCC Upload (Non-Oregon States)'),
  ]));
  var formWrap = el('div', { className: 'upload-section' });
  formWrap.appendChild(el('p', { style: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' } },
    'Paste UCC filing data from CA, WA, UT, or NV state portals. Format: one filing per line \u2014 Company Name | State | File Number | Filing Date | Secured Party | Collateral Description'));
  var textarea = el('textarea', { className: 'form-input', placeholder: 'Stubborn Mule Mfg | OR | 94408174 | 2026-02-02 | MAZAK CORPORATION | CNC Machine Equipment' });
  formWrap.appendChild(textarea);
  var uploadBtn = el('button', { className: 'btn btn-primary', style: { marginTop: '12px' } }, 'Parse & Import');
  uploadBtn.addEventListener('click', async function() {
    var text = textarea.value.trim();
    if (!text) return;
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    var filings = lines.map(function(line) {
      var parts = line.split('|').map(function(p) { return p.trim(); });
      return {
        company_name: parts[0] || '',
        state: parts[1] || '',
        file_number: parts[2] || '',
        filing_date: parts[3] || '',
        secured_party: parts[4] || '',
        collateral_description: parts[5] || '',
      };
    });
    try {
      await uploadUCC(filings);
      textarea.value = '';
      renderUCCScanner(container);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  });
  formWrap.appendChild(uploadBtn);
  uploadPanel.appendChild(formWrap);
  container.appendChild(uploadPanel);
}
