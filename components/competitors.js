// Selway Intelligence — Competitors Tab

async function renderCompetitorsTab(container) {
  const { el } = window.APP;

  var competitors = await getCompetitors();

  container.textContent = '';

  // Header
  container.appendChild(el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'Competitor Intelligence'),
      el('p', {}, 'Profiles, displacement strategies, and UCC tracking for primary competitors'),
    ]),
  ]));

  // Competitor cards
  var grid = el('div', { className: 'competitor-grid' });

  competitors.forEach(function(comp) {
    var card = el('div', { className: 'competitor-card' });

    // Header
    card.appendChild(el('div', { className: 'competitor-header' }, [
      el('div', {}, [
        el('div', { className: 'competitor-name' }, comp.name),
        el('div', { className: 'competitor-hq' }, comp.headquarters + ' \u2022 ' + comp.sales_model),
      ]),
      el('a', { className: 'panel-action', href: '#ucc' }, 'UCC Filings \u2192'),
    ]));

    var body = el('div', { className: 'competitor-body' });

    // Strengths
    var strSection = el('div', { className: 'competitor-section str' });
    strSection.appendChild(el('div', { className: 'competitor-section-title strengths' }, 'Strengths'));
    var strList = el('ul');
    (comp.strengths || '').split(',').forEach(function(s) {
      var trimmed = s.trim();
      if (trimmed) strList.appendChild(el('li', {}, trimmed));
    });
    strSection.appendChild(strList);
    body.appendChild(strSection);

    // Weaknesses
    var weakSection = el('div', { className: 'competitor-section weak' });
    weakSection.appendChild(el('div', { className: 'competitor-section-title weaknesses' }, 'Weaknesses'));
    var weakList = el('ul');
    (comp.weaknesses || '').split(',').forEach(function(s) {
      var trimmed = s.trim();
      if (trimmed) weakList.appendChild(el('li', {}, trimmed));
    });
    weakSection.appendChild(weakList);
    body.appendChild(weakSection);

    // Displacement strategy
    var stratSection = el('div', { className: 'competitor-section' });
    stratSection.appendChild(el('div', { className: 'competitor-section-title strategy' }, 'Displacement Strategy'));
    stratSection.appendChild(el('div', { className: 'displacement-box' }, comp.displacement_strategy || ''));
    body.appendChild(stratSection);

    // Lender names
    if (comp.lender_names) {
      var lenderSection = el('div', { className: 'competitor-section', style: { marginTop: '12px' } });
      lenderSection.appendChild(el('div', { style: { fontSize: '10px', fontWeight: '600', color: 'var(--ucc)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' } }, 'UCC Search Names'));
      var lenderTags = el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } });
      comp.lender_names.split(',').forEach(function(name) {
        var trimmed = name.trim();
        if (trimmed) {
          lenderTags.appendChild(el('span', {
            className: 'tag tag-ucc',
            style: { fontSize: '10px' },
          }, trimmed));
        }
      });
      lenderSection.appendChild(lenderTags);
      body.appendChild(lenderSection);
    }

    card.appendChild(body);
    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Additional tracked competitors
  var additionalPanel = el('div', { className: 'panel', style: { marginTop: '24px' } });
  additionalPanel.appendChild(el('div', { className: 'panel-header' }, [
    el('span', { className: 'panel-title' }, 'Additional Tracked Competitors (UCC Only)'),
  ]));

  var additionalGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '16px' } });
  var additional = [
    { name: 'Matsuura Machinery', lender: 'Matsuura Machinery' },
    { name: 'Kitamura Machinery', lender: 'Kitamura Machinery' },
    { name: 'Toyoda Americas', lender: 'Toyoda Americas' },
    { name: 'Methods Machine Tools', lender: 'Methods Machine Tools' },
    { name: 'Ellison Technologies', lender: 'Ellison Technologies' },
    { name: 'Hurco Companies', lender: 'Hurco Companies' },
  ];

  additional.forEach(function(a) {
    var item = el('div', { style: { background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' } }, [
      el('div', { style: { fontWeight: '600', fontSize: '13px', marginBottom: '4px' } }, a.name),
      el('div', { style: { fontSize: '10px', color: 'var(--ucc)' } }, 'UCC: ' + a.lender),
    ]);
    additionalGrid.appendChild(item);
  });

  additionalPanel.appendChild(additionalGrid);
  container.appendChild(additionalPanel);
}
