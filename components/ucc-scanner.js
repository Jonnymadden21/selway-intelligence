// Selway Market Data — UCC / EDA Tab

async function renderUCCScanner(container) {
  const { el, TERRITORIES } = window.APP;

  container.textContent = '';
  var currentState = '';
  var allData = EDA_CONQUEST.concat(EDA_TRINITY);
  var sortCol = null;
  var sortDir = 0; // 0=none, 1=asc, 2=desc

  // Column definitions with sort keys
  var columns = [
    { label: 'Location', key: function(r) { return (r.city || '') + ', ' + r.state; } },
    { label: 'Brand', key: function(r) { return r.brand || 'HAAS'; } },
    { label: 'Model', key: function(r) { return r.model || ''; } },
    { label: 'Description', key: function(r) { return r.description || ''; } },
    { label: 'Company', key: function(r) { return r.company || ''; } },
    { label: 'Contact', key: function(r) { return r.contact || ''; } },
    { label: 'Phone', key: function(r) { return r.phone || ''; } },
    { label: 'Date', key: function(r) { return r.ucc_date || ''; } },
    { label: 'New/Used', key: function(r) { return getCondition(r); } },
  ];

  // Header
  container.appendChild(el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'UCC / EDA Data'),
      el('p', {}, allData.length + ' equipment filings (past 3 months) \u2014 click any column header to sort'),
    ]),
    buildStateFilter(),
  ]));

  // Single panel for all data
  var mainPanel = el('div', { className: 'panel', style: { marginBottom: '24px' } });
  mainPanel.appendChild(el('div', { className: 'panel-header' }, [
    el('span', { className: 'panel-title' }, 'All Equipment Filings'),
    el('span', { className: 'panel-action filingCount', style: { cursor: 'default' } }, allData.length + ' records'),
  ]));
  mainPanel.appendChild(buildTable(getFilteredData()));
  container.appendChild(mainPanel);


  // === HELPERS ===

  function getFilteredData() {
    var data = currentState ? allData.filter(function(r) { return r.state === currentState; }) : allData;
    if (sortCol !== null && sortDir > 0) {
      var keyFn = columns[sortCol].key;
      data = data.slice().sort(function(a, b) {
        var va = (keyFn(a) || '').toString().toLowerCase();
        var vb = (keyFn(b) || '').toString().toLowerCase();
        // Try numeric sort first
        var na = parseFloat(va);
        var nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) {
          return sortDir === 1 ? na - nb : nb - na;
        }
        // String sort
        if (va < vb) return sortDir === 1 ? -1 : 1;
        if (va > vb) return sortDir === 1 ? 1 : -1;
        return 0;
      });
    }
    return data;
  }

  function refreshTable() {
    var data = getFilteredData();
    var oldTable = mainPanel.querySelector('table');
    if (oldTable) oldTable.replaceWith(buildTable(data));
    var fc = mainPanel.querySelector('.filingCount');
    if (fc) fc.textContent = data.length + ' records';
  }

  function buildStateFilter() {
    var wrap = el('div', { className: 'filters' });
    ['All', 'OR', 'WA', 'CA', 'UT', 'NV'].forEach(function(s) {
      var btn = el('button', { className: 'filter-btn' + (s === 'All' ? ' active' : '') }, s);
      btn.addEventListener('click', function() {
        wrap.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentState = s === 'All' ? '' : s;
        refreshTable();
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function getCondition(r) {
    var status = (r.ucc_status || '').toUpperCase();
    var yr = parseInt(r.year) || 0;
    if (status === 'LEASE' || status === 'REFINANCE') return 'Used';
    if (yr >= 2025) return 'New';
    if (yr > 0 && yr < 2025) return 'Used';
    var desc = (r.description || '').toUpperCase();
    if (desc.includes('USED') || desc.includes('REFURB')) return 'Used';
    if (desc.includes('NEW')) return 'New';
    return yr > 0 ? (yr >= 2024 ? 'New' : 'Used') : '\u2014';
  }

  function getSortArrow(colIdx) {
    if (sortCol !== colIdx) return ' \u2195'; // up-down arrow (unsorted)
    if (sortDir === 1) return ' \u2191'; // up arrow (A-Z / low-high)
    if (sortDir === 2) return ' \u2193'; // down arrow (Z-A / high-low)
    return ' \u2195';
  }

  function buildTable(data) {
    var table = el('table', { className: 'data-table' });
    var thead = el('thead');
    var headerRow = el('tr');

    columns.forEach(function(col, idx) {
      var thText = col.label + getSortArrow(idx);
      var th = el('th', {
        style: { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' },
      }, thText);
      th.addEventListener('click', function() {
        if (sortCol === idx) {
          sortDir = (sortDir + 1) % 3; // cycle: 0 -> 1 -> 2 -> 0
          if (sortDir === 0) sortCol = null;
        } else {
          sortCol = idx;
          sortDir = 1;
        }
        refreshTable();
      });
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    data.forEach(function(r) {
      var row = el('tr');
      var condition = getCondition(r);
      var condStyle = condition === 'New'
        ? { fontSize: '10px', color: 'var(--permit)', fontWeight: '600' }
        : condition === 'Used'
          ? { fontSize: '10px', color: 'var(--warm)', fontWeight: '500' }
          : { fontSize: '10px', color: 'var(--text-faint)' };

      var isHaas = (r.brand || '').toUpperCase() === 'HAAS';
      var brandStyle = isHaas
        ? { fontSize: '9px', background: 'var(--teal-bg)', color: 'var(--teal)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', display: 'inline-block' }
        : { fontSize: '9px', background: 'var(--hot-bg)', color: 'var(--hot)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', display: 'inline-block' };

      // Location
      row.appendChild(el('td', { style: { fontSize: '11px' } }, (r.city || '') + ', ' + r.state));
      // Brand
      row.appendChild(el('td', {}, el('span', { style: brandStyle }, r.brand || 'HAAS')));
      // Model
      row.appendChild(el('td', { style: { fontSize: '11px', fontWeight: '500' } }, r.model || '\u2014'));
      // Description
      row.appendChild(el('td', { style: { fontSize: '10px', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, r.description || '\u2014'));
      // Company
      row.appendChild(el('td', { style: { fontWeight: '600', color: 'var(--text-primary)', fontSize: '11px' } }, r.company));
      // Contact
      row.appendChild(el('td', { style: { fontSize: '11px' } }, r.contact || '\u2014'));
      // Phone
      if (r.phone) {
        row.appendChild(el('td', {}, el('a', { href: 'tel:' + r.phone.replace(/[^0-9]/g, ''), style: { color: 'var(--teal)', textDecoration: 'none', fontSize: '11px' } }, r.phone)));
      } else {
        row.appendChild(el('td', { style: { color: 'var(--text-faint)', fontSize: '11px' } }, '\u2014'));
      }
      // Date
      row.appendChild(el('td', { style: { fontSize: '10px', whiteSpace: 'nowrap' } }, r.ucc_date));
      // New/Used (far right)
      row.appendChild(el('td', { style: condStyle }, condition));

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    if (data.length === 0) {
      tbody.appendChild(el('tr', {}, [el('td', { colSpan: String(columns.length), style: { textAlign: 'center', padding: '20px', color: 'var(--text-muted)' } }, 'No filings match this filter')]));
    }
    return table;
  }
}
