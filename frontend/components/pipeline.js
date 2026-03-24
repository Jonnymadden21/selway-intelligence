// Selway Intelligence — Lead Pipeline Tab

async function renderPipeline(container) {
  const { el, TERRITORIES } = window.APP;

  var leads = await getLeads();

  container.textContent = '';

  // Header
  container.appendChild(el('div', { className: 'page-header' }, [
    el('div', {}, [
      el('h1', {}, 'Lead Pipeline'),
      el('p', {}, 'Track conquest leads from identification through close'),
    ]),
  ]));

  // Pipeline board
  var stages = [
    { key: 'new', label: 'New', cls: 'stage-new' },
    { key: 'contacted', label: 'Contacted', cls: 'stage-contacted' },
    { key: 'engaged', label: 'Engaged', cls: 'stage-engaged' },
    { key: 'quoted', label: 'Quoted', cls: 'stage-quoted' },
    { key: 'won', label: 'Won', cls: 'stage-won' },
    { key: 'lost', label: 'Lost', cls: 'stage-lost' },
  ];

  var board = el('div', { className: 'pipeline-board' });

  stages.forEach(function(stage) {
    var stageLeads = leads.filter(function(l) { return l.status === stage.key; });
    var col = el('div', { className: 'pipeline-column' });

    // Column header
    var colHeader = el('div', { className: 'pipeline-col-header ' + stage.cls }, [
      el('span', {}, stage.label),
      el('span', { className: 'pipeline-col-count' }, String(stageLeads.length)),
    ]);
    col.appendChild(colHeader);

    // Lead cards
    stageLeads.forEach(function(lead) {
      var card = el('div', { className: 'lead-card' });

      card.appendChild(el('div', { className: 'lead-card-company' }, lead.company_name));

      var meta = el('div', { className: 'lead-card-meta' });
      if (lead.territory) {
        meta.appendChild(el('span', { className: 'signal-territory' }, TERRITORIES[lead.territory] || ''));
      }
      meta.appendChild(el('span', { className: 'tag tag-' + (lead.heat || 'cool').toLowerCase() }, lead.heat || 'COOL'));
      if (lead.score) {
        meta.appendChild(el('span', { style: { fontSize: '10px', color: 'var(--text-muted)' } }, 'Score: ' + lead.score));
      }
      card.appendChild(meta);

      // Source tags
      if (lead.sources && lead.sources.length > 0) {
        var srcRow = el('div', { style: { marginTop: '6px', display: 'flex', gap: '4px' } });
        lead.sources.forEach(function(s) {
          srcRow.appendChild(el('span', { className: 'tag tag-' + s, style: { fontSize: '9px' } }, s.toUpperCase()));
        });
        card.appendChild(srcRow);
      }

      if (lead.assigned_rep) {
        card.appendChild(el('div', { style: { fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px' } }, lead.assigned_rep));
      }

      // Action buttons
      var actions = el('div', { style: { marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' } });
      var stageIndex = stages.findIndex(function(s) { return s.key === stage.key; });

      // Advance button
      if (stageIndex < stages.length - 2) { // Don't advance from Won or Lost
        var nextStage = stages[stageIndex + 1];
        var advBtn = el('button', { className: 'btn btn-primary btn-sm' }, '\u2192 ' + nextStage.label);
        advBtn.addEventListener('click', async function() {
          try {
            await updateLead(lead.id, { status: nextStage.key });
            renderPipeline(container);
          } catch (err) {
            alert('Failed to update: ' + err.message);
          }
        });
        actions.appendChild(advBtn);
      }

      card.appendChild(actions);
      col.appendChild(card);
    });

    if (stageLeads.length === 0) {
      col.appendChild(el('div', { style: { fontSize: '11px', color: 'var(--text-faint)', textAlign: 'center', padding: '20px' } }, 'No leads'));
    }

    board.appendChild(col);
  });

  container.appendChild(board);
}
