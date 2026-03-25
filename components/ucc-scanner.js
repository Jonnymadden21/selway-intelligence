// Selway Intelligence — UCC / EDA Scanner Tab

async function renderUCCScanner(container) {
  const { el, TERRITORIES } = window.APP;

  container.textContent = '';
  var currentState = '';

  // Header
  container.appendChild(el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'UCC / EDA Scanner'),
      el('p', {}, (EDA_CONQUEST.length + EDA_TRINITY.length) + ' filings from EDA (2026) \u2014 ' + EDA_CONQUEST.length + ' conquest targets + ' + EDA_TRINITY.length + ' Trinity opportunities'),
    ]),
    buildStateFilter(),
  ]));

  // === CONQUEST TARGETS SECTION ===
  var conquestPanel = el('div', { className: 'panel', style: { marginBottom: '24px' } });
  conquestPanel.appendChild(el('div', { className: 'panel-header', style: { background: 'var(--hot-bg)' } }, [
    el('span', { className: 'panel-title', style: { color: 'var(--hot)' } }, 'CONQUEST TARGETS \u2014 Competitor Machine Purchases (2026)'),
    el('span', { className: 'panel-action conquestCount', style: { cursor: 'default' } }, EDA_CONQUEST.length + ' filings'),
  ]));
  conquestPanel.appendChild(buildTable(EDA_CONQUEST, 'conquest'));
  container.appendChild(conquestPanel);

  // === TRINITY OPPORTUNITIES SECTION ===
  var trinityPanel = el('div', { className: 'panel', style: { marginBottom: '24px' } });
  trinityPanel.appendChild(el('div', { className: 'panel-header', style: { background: 'var(--teal-bg)' } }, [
    el('span', { className: 'panel-title', style: { color: 'var(--teal)' } }, 'TRINITY AUTOMATION OPPORTUNITIES \u2014 Recent Haas Owners (2026)'),
    el('span', { className: 'panel-action trinityCount', style: { cursor: 'default' } }, EDA_TRINITY.length + ' filings'),
  ]));
  trinityPanel.appendChild(buildTable(EDA_TRINITY, 'trinity'));
  container.appendChild(trinityPanel);

  // === STATE DATABASE LINKS ===
  var linksPanel = el('div', { className: 'panel' });
  linksPanel.appendChild(el('div', { className: 'panel-header' }, [el('span', { className: 'panel-title' }, 'Data Sources')]));
  var linkGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' } });
  [
    { name: 'EDA Online', url: 'https://online.edadata.com/', desc: 'All 50 states UCC + contacts', status: 'Primary' },
    { name: 'Oregon SODA API', url: 'https://data.oregon.gov/business/UCC-List-of-Filings-Entered-Last-Month/snfi-f79b', desc: 'Monthly bulk data (automated)', status: 'Automated' },
    { name: 'Washington SOS', url: 'https://www.sos.wa.gov/ucc', desc: 'Manual search', status: 'Manual' },
    { name: 'California SOS', url: 'https://bizfileonline.sos.ca.gov/search/ucc', desc: 'Manual search', status: 'Manual' },
    { name: 'Utah SOS', url: 'https://secure.utah.gov/uccsearch', desc: 'Manual search', status: 'Manual' },
    { name: 'Nevada SOS', url: 'https://www.nvsos.gov/sosentitysearch/UCCSearch.aspx', desc: 'Manual search', status: 'Manual' },
  ].forEach(function(l) {
    var card = el('div', { style: { background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', cursor: 'pointer' } });
    card.addEventListener('click', function() { window.open(l.url, '_blank'); });
    card.appendChild(el('div', { style: { fontWeight: '600', fontSize: '13px', marginBottom: '4px' } }, l.name));
    card.appendChild(el('div', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, l.desc));
    card.appendChild(el('div', { style: { fontSize: '10px', color: 'var(--teal)', fontWeight: '600', marginTop: '4px' } }, l.status));
    linkGrid.appendChild(card);
  });
  linksPanel.appendChild(linkGrid);
  container.appendChild(linksPanel);

  // === HELPER FUNCTIONS ===

  function buildStateFilter() {
    var wrap = el('div', { className: 'filters' });
    ['All', 'OR', 'WA', 'CA', 'UT', 'NV'].forEach(function(s) {
      var btn = el('button', { className: 'filter-btn' + (s === 'All' ? ' active' : '') }, s);
      btn.addEventListener('click', function() {
        wrap.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentState = s === 'All' ? '' : s;
        refreshTables();
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function refreshTables() {
    var cf = currentState ? EDA_CONQUEST.filter(function(r) { return r.state === currentState; }) : EDA_CONQUEST;
    var tf = currentState ? EDA_TRINITY.filter(function(r) { return r.state === currentState; }) : EDA_TRINITY;
    var oldCT = conquestPanel.querySelector('table');
    var oldTT = trinityPanel.querySelector('table');
    if (oldCT) oldCT.replaceWith(buildTable(cf, 'conquest'));
    if (oldTT) oldTT.replaceWith(buildTable(tf, 'trinity'));
    var cc = conquestPanel.querySelector('.conquestCount');
    var tc = trinityPanel.querySelector('.trinityCount');
    if (cc) cc.textContent = cf.length + ' filings';
    if (tc) tc.textContent = tf.length + ' filings';
  }

  function buildTable(data, type) {
    var table = el('table', { className: 'data-table' });
    var thead = el('thead');
    var headerRow = el('tr');
    var cols = type === 'conquest'
      ? ['Location', 'Sold/Financed By', 'Brand', 'Model', 'Description', 'Company', 'Contact', 'Phone', 'Date']
      : ['Location', 'Sold/Financed By', 'Haas Model', 'Description', 'Year', 'Company', 'Contact', 'Phone', 'Date'];
    cols.forEach(function(h) { headerRow.appendChild(el('th', {}, h)); });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    data.forEach(function(r) {
      var row = el('tr');
      // Location first
      row.appendChild(el('td', { style: { fontSize: '11px' } }, r.city + ', ' + r.state));
      // Secured Party
      row.appendChild(el('td', { style: { fontSize: '10px', color: 'var(--ucc)', fontWeight: '500' } }, r.secured_party || '\u2014'));
      // Equipment
      if (type === 'conquest') {
        row.appendChild(el('td', {}, el('span', { className: 'tag tag-hot', style: { fontSize: '9px' } }, r.brand)));
        row.appendChild(el('td', { style: { fontSize: '11px', fontWeight: '500' } }, r.model || '\u2014'));
        row.appendChild(el('td', { style: { fontSize: '10px', color: 'var(--text-muted)' } }, r.description || '\u2014'));
      } else {
        row.appendChild(el('td', { style: { fontSize: '11px', color: 'var(--teal)', fontWeight: '600' } }, 'HAAS ' + (r.model || '')));
        row.appendChild(el('td', { style: { fontSize: '10px', color: 'var(--text-muted)' } }, r.description || '\u2014'));
        row.appendChild(el('td', { style: { fontSize: '10px' } }, r.year || '\u2014'));
      }
      // Company/Contact
      row.appendChild(el('td', { style: { fontWeight: '600', color: 'var(--text-primary)', fontSize: '11px' } }, r.company));
      row.appendChild(el('td', { style: { fontSize: '11px' } }, r.contact || '\u2014'));
      if (r.phone) {
        row.appendChild(el('td', {}, el('a', { href: 'tel:' + r.phone.replace(/[^0-9]/g, ''), style: { color: 'var(--teal)', textDecoration: 'none', fontSize: '11px' } }, r.phone)));
      } else {
        row.appendChild(el('td', { style: { color: 'var(--text-faint)', fontSize: '11px' } }, '\u2014'));
      }
      // Date
      row.appendChild(el('td', { style: { fontSize: '10px', whiteSpace: 'nowrap' } }, r.ucc_date));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    if (data.length === 0) {
      tbody.appendChild(el('tr', {}, [el('td', { colSpan: String(cols.length), style: { textAlign: 'center', padding: '20px', color: 'var(--text-muted)' } }, 'No filings match this filter')]));
    }
    return table;
  }
}
