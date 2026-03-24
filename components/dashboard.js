// Selway Intelligence — Dashboard Tab

async function renderDashboard(container) {
  const { el, setTrustedHTML, SOURCE_ICONS, TERRITORIES, timeAgo, getDateString, getCycleName } = window.APP;

  // Fetch data in parallel
  const [stats, signals, uccFilings] = await Promise.all([
    getStats(),
    getSignals({ limit: 10 }),
    getUCC({ competitor: '1' }),
  ]);

  container.textContent = '';

  // Page header
  const header = el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'Intelligence Dashboard'),
      el('p', {}, getDateString() + ' \u2014 ' + getCycleName() + ' cycle'),
    ]),
    buildFilters(),
  ]);
  container.appendChild(header);

  // Stat cards
  container.appendChild(buildStatCards(stats));

  // Content grid
  const grid = el('div', { className: 'content-grid' }, [
    buildSignalFeed(signals),
    buildSidebar(stats, uccFilings),
  ]);
  container.appendChild(grid);

  // --- Builder functions ---

  function buildFilters() {
    const filters = el('div', { className: 'filters' });
    const territories = ['All Territories', 'OR / WA', 'N. CA', 'S. CA', 'UT / NV'];
    territories.forEach(function(name, i) {
      const btn = el('button', {
        className: 'filter-btn' + (i === 0 ? ' active' : ''),
        textContent: name,
      });
      btn.addEventListener('click', function() {
        filters.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      filters.appendChild(btn);
    });
    const exportBtn = el('button', { className: 'filter-btn' }, '\u2193 Export');
    filters.appendChild(exportBtn);
    return filters;
  }

  function buildStatCards(s) {
    const row = el('div', { className: 'stats-row' });
    const cards = [
      { label: 'Total Signals', value: s.total_signals, change: s.total_signals_today + ' new today', cls: 'stat-accent', color: '' },
      { label: 'Hot Leads', value: s.hot_leads, change: s.hot_leads_today + ' since morning', cls: 'stat-hot', color: 'var(--hot)' },
      { label: 'UCC Filings', value: s.ucc_filings, change: s.ucc_filings_week + ' this week', cls: 'stat-ucc', color: 'var(--ucc)' },
      { label: 'Job Postings', value: s.job_postings, change: s.job_postings_today + ' new', cls: 'stat-jobs', color: 'var(--job)' },
      { label: 'News & Permits', value: s.news_permits, change: s.news_permits_today + ' today', cls: 'stat-news', color: 'var(--news)' },
    ];
    cards.forEach(function(c) {
      const valStyle = c.color ? { color: c.color } : {};
      const card = el('div', { className: 'stat-card ' + c.cls }, [
        el('div', { className: 'stat-label' }, c.label),
        el('div', { className: 'stat-value', style: valStyle }, String(c.value)),
        el('div', { className: 'stat-change up' }, '\u2191 ' + c.change),
      ]);
      row.appendChild(card);
    });
    return row;
  }

  function buildSignalFeed(signalList) {
    const panel = el('div', { className: 'panel' });
    const panelHeader = el('div', { className: 'panel-header' }, [
      el('span', { className: 'panel-title' }, 'Live Signal Feed'),
      el('a', { className: 'panel-action', href: '#signals' }, 'View All \u2192'),
    ]);
    panel.appendChild(panelHeader);

    signalList.forEach(function(sig) {
      const src = SOURCE_ICONS[sig.source] || { icon: '\u{2753}', bg: '#f3f4f6' };
      var metaItems = [
        el('span', { className: 'tag tag-' + sig.source }, sig.source.toUpperCase()),
        sig.territory ? el('span', { className: 'signal-territory' }, TERRITORIES[sig.territory] || 'Unknown') : null,
        el('span', { className: 'signal-time' }, sig.published || timeAgo(sig.discovered_at)),
      ];
      if (sig.source_url) {
        metaItems.push(el('a', { href: sig.source_url, target: '_blank', style: { fontSize: '10px', color: 'var(--teal)', textDecoration: 'none', fontWeight: '500' } }, 'Source \u2192'));
      }
      const item = el('div', { className: 'signal-item' });
      if (sig.source_url) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function(e) {
          if (e.target.tagName !== 'A') window.open(sig.source_url, '_blank');
        });
      }
      item.appendChild(el('div', { className: 'signal-icon', style: { background: src.bg } }, src.icon));
      item.appendChild(el('div', { className: 'signal-body' }, [
        el('div', { className: 'signal-company' }, [
          el('span', {}, sig.company_name),
          el('span', { className: 'tag tag-' + sig.heat.toLowerCase() }, sig.heat),
        ]),
        el('div', { className: 'signal-detail', title: sig.detail }, sig.detail),
        el('div', { className: 'signal-meta' }, metaItems),
      ]));
      panel.appendChild(item);
    });

    if (signalList.length === 0) {
      panel.appendChild(el('div', { className: 'empty-state' }, [
        el('h3', {}, 'No signals yet'),
        el('p', {}, 'Signals will appear after the next data refresh'),
      ]));
    }

    return panel;
  }

  function buildSidebar(s, uccList) {
    const sidebar = el('div', { className: 'right-col' });

    // UCC Conquest Targets
    const uccPanel = el('div', { className: 'panel' });
    uccPanel.appendChild(el('div', { className: 'panel-header' }, [
      el('span', { className: 'panel-title' }, 'Latest UCC Conquest Targets'),
      el('a', { className: 'panel-action', href: '#ucc' }, 'Scanner \u2192'),
    ]));
    var uccShown = uccList.filter(function(f) { return f.is_competitor; }).slice(0, 5);
    if (uccShown.length === 0) uccShown = uccList.slice(0, 5);
    uccShown.forEach(function(f) {
      const item = el('div', { className: 'ucc-item' }, [
        el('div', { className: 'ucc-company' }, f.company_name + ' \u2014 ' + (f.city || '') + ', ' + f.state),
        el('div', { className: 'ucc-detail' }, 'Filed ' + f.filing_date + (f.file_number ? ' \u00B7 File #' + f.file_number : '')),
        el('div', { className: 'ucc-secured' }, f.secured_party),
      ]);
      uccPanel.appendChild(item);
    });
    sidebar.appendChild(uccPanel);

    // Pipeline mini
    const pipePanel = el('div', { className: 'panel' });
    pipePanel.appendChild(el('div', { className: 'panel-header' }, [
      el('span', { className: 'panel-title' }, 'Lead Pipeline'),
      el('a', { className: 'panel-action', href: '#pipeline' }, 'Full View \u2192'),
    ]));
    const pipeRow = el('div', { className: 'pipeline-row' });
    var stages = [
      { key: 'new', label: 'New', cls: 'stage-new' },
      { key: 'contacted', label: 'Contact', cls: 'stage-contacted' },
      { key: 'engaged', label: 'Engaged', cls: 'stage-engaged' },
      { key: 'quoted', label: 'Quoted', cls: 'stage-quoted' },
      { key: 'won', label: 'Won', cls: 'stage-won' },
    ];
    stages.forEach(function(st) {
      var count = (s.pipeline && s.pipeline[st.key]) || 0;
      pipeRow.appendChild(el('div', { className: 'pipeline-stage ' + st.cls }, [
        el('span', { className: 'pipeline-count' }, String(count)),
        document.createTextNode(st.label),
      ]));
    });
    pipePanel.appendChild(pipeRow);
    sidebar.appendChild(pipePanel);

    // Territory breakdown
    const terrPanel = el('div', { className: 'panel' });
    terrPanel.appendChild(el('div', { className: 'panel-header' }, [
      el('span', { className: 'panel-title' }, 'Signals by Territory'),
    ]));
    const terrList = el('div', { className: 'territory-list' });
    (s.by_territory || []).forEach(function(t) {
      terrList.appendChild(el('div', { className: 'territory-item' }, [
        el('span', { className: 'territory-name' }, 'T' + t.territory + ' \u2014 ' + t.name),
        el('span', { className: 'territory-count' }, String(t.count)),
      ]));
    });
    terrPanel.appendChild(terrList);
    sidebar.appendChild(terrPanel);

    return sidebar;
  }
}
