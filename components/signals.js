// Selway Intelligence — Market Signals Tab

async function renderSignalsTab(container) {
  const { el, SOURCE_ICONS, TERRITORIES, timeAgo } = window.APP;

  var currentFilters = {};

  container.textContent = '';

  // Header
  container.appendChild(el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'Market Signals'),
      el('p', {}, 'All intelligence signals across every data source'),
    ]),
    el('div', { className: 'filters' }, [
      buildExportBtn(),
    ]),
  ]));

  // Filter bar
  container.appendChild(buildFilterBar());

  // Results panel
  var resultsPanel = el('div', { className: 'panel', id: 'signals-results' });
  container.appendChild(resultsPanel);

  // Initial load
  await loadSignals();

  // --- Builder functions ---

  function buildFilterBar() {
    var bar = el('div', { style: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' } });

    // Source filters
    var sources = ['All', 'UCC', 'Defense', 'News', 'Permit', 'Job'];
    sources.forEach(function(s) {
      var btn = el('button', { className: 'filter-btn' + (s === 'All' ? ' active' : '') }, s);
      btn.addEventListener('click', function() {
        bar.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilters.source = s === 'All' ? undefined : s.toLowerCase();
        loadSignals();
      });
      bar.appendChild(btn);
    });

    // Heat filter
    var heatSelect = el('select', { className: 'form-select' });
    heatSelect.appendChild(el('option', { value: '' }, 'All Heat Levels'));
    ['HOT', 'WARM', 'COOL'].forEach(function(h) {
      heatSelect.appendChild(el('option', { value: h }, h));
    });
    heatSelect.addEventListener('change', function() {
      currentFilters.heat = heatSelect.value || undefined;
      loadSignals();
    });
    bar.appendChild(heatSelect);

    // Territory filter
    var terrSelect = el('select', { className: 'form-select' });
    terrSelect.appendChild(el('option', { value: '' }, 'All Territories'));
    Object.entries(TERRITORIES).forEach(function(entry) {
      terrSelect.appendChild(el('option', { value: entry[0] }, entry[1]));
    });
    terrSelect.addEventListener('change', function() {
      currentFilters.territory = terrSelect.value || undefined;
      loadSignals();
    });
    bar.appendChild(terrSelect);

    return bar;
  }

  function buildExportBtn() {
    var btn = el('button', { className: 'btn btn-secondary' }, '\u2193 Export CSV');
    btn.addEventListener('click', async function() {
      var signals = await getSignals(currentFilters);
      var csv = 'Company,Source,Title,Detail,Heat,Territory,Date\n';
      signals.forEach(function(s) {
        var row = [
          '"' + (s.company_name || '').replace(/"/g, '""') + '"',
          s.source,
          '"' + (s.title || '').replace(/"/g, '""') + '"',
          '"' + (s.detail || '').replace(/"/g, '""') + '"',
          s.heat,
          TERRITORIES[s.territory] || '',
          s.discovered_at,
        ].join(',');
        csv += row + '\n';
      });
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'selway-signals-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
    return btn;
  }

  async function loadSignals() {
    var resultsEl = document.getElementById('signals-results') || resultsPanel;
    resultsEl.textContent = '';
    resultsEl.appendChild(el('div', { className: 'loading' }, [
      el('div', { className: 'loading-spinner' }),
      el('span', {}, 'Loading signals...'),
    ]));

    try {
      var signals = await getSignals(currentFilters);
      resultsEl.textContent = '';

      // Results header
      resultsEl.appendChild(el('div', { className: 'panel-header' }, [
        el('span', { className: 'panel-title' }, signals.length + ' signals found'),
      ]));

      // Signal table
      var table = el('table', { className: 'data-table' });
      var thead = el('thead');
      var headerRow = el('tr');
      ['', 'Company', 'Signal', 'Source', 'Heat', 'Territory', 'Published', 'Link', 'Action'].forEach(function(h) {
        headerRow.appendChild(el('th', {}, h));
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = el('tbody');
      signals.forEach(function(sig) {
        var src = SOURCE_ICONS[sig.source] || { icon: '?', bg: '#f3f4f6' };
        var row = el('tr');
        row.appendChild(el('td', {}, el('span', { style: { fontSize: '16px' } }, src.icon)));
        row.appendChild(el('td', { style: { fontWeight: '600', color: 'var(--text-primary)' } }, sig.company_name || '\u2014'));
        var titleCell = el('td');
        titleCell.appendChild(el('div', { style: { fontWeight: '500', fontSize: '12px' } }, sig.title || ''));
        titleCell.appendChild(el('div', { style: { fontSize: '11px', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, sig.detail || ''));
        row.appendChild(titleCell);
        row.appendChild(el('td', {}, el('span', { className: 'tag tag-' + sig.source }, sig.source.toUpperCase())));
        row.appendChild(el('td', {}, el('span', { className: 'tag tag-' + sig.heat.toLowerCase() }, sig.heat)));
        row.appendChild(el('td', {}, el('span', { className: 'signal-territory' }, TERRITORIES[sig.territory] || 'All')));
        row.appendChild(el('td', { style: { fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' } }, sig.published || timeAgo(sig.discovered_at)));

        // Source link
        if (sig.source_url) {
          row.appendChild(el('td', {}, el('a', { href: sig.source_url, target: '_blank', style: { color: 'var(--teal)', textDecoration: 'none', fontSize: '11px', fontWeight: '500' } }, 'View \u2192')));
        } else {
          row.appendChild(el('td', { style: { color: 'var(--text-faint)', fontSize: '11px' } }, '\u2014'));
        }

        var actionBtn = el('button', { className: 'btn btn-primary btn-sm' }, '+ Lead');
        actionBtn.addEventListener('click', async function() {
          try {
            await createLead(sig.id);
            actionBtn.textContent = 'Added';
            actionBtn.disabled = true;
            actionBtn.className = 'btn btn-secondary btn-sm';
          } catch (err) {
            alert('Failed: ' + err.message);
          }
        });
        row.appendChild(el('td', {}, actionBtn));
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      resultsEl.appendChild(table);

      if (signals.length === 0) {
        resultsEl.appendChild(el('div', { className: 'empty-state' }, [
          el('h3', {}, 'No signals match your filters'),
          el('p', {}, 'Try adjusting your filter criteria'),
        ]));
      }
    } catch (err) {
      resultsEl.textContent = '';
      resultsEl.appendChild(el('div', { className: 'empty-state' }, [
        el('h3', {}, 'Error loading signals'),
        el('p', {}, err.message),
      ]));
    }
  }
}
