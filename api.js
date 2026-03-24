// Selway Intelligence — API Client
// Update these after deploying Cloudflare Workers
const API_BASE = ''; // e.g., 'https://selway-intelligence.xxxxx.workers.dev'
const API_KEY = '';   // Set after creating worker secret

async function fetchAPI(endpoint, options = {}) {
  if (!API_BASE) {
    // Return mock data when API is not yet connected
    return getMockData(endpoint);
  }

  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication failed');
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    console.error(`API call failed: ${endpoint}`, err);
    throw err;
  }
}

// ---- Public API Functions ----

function getStats() {
  return fetchAPI('/api/stats');
}

function getSignals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.source) params.set('source', filters.source);
  if (filters.territory) params.set('territory', filters.territory);
  if (filters.heat) params.set('heat', filters.heat);
  if (filters.limit) params.set('limit', filters.limit);
  if (filters.offset) params.set('offset', filters.offset);
  const qs = params.toString();
  return fetchAPI(`/api/signals${qs ? '?' + qs : ''}`);
}

function getSignalById(id) {
  return fetchAPI(`/api/signals/${id}`);
}

function getLeads(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.territory) params.set('territory', filters.territory);
  const qs = params.toString();
  return fetchAPI(`/api/leads${qs ? '?' + qs : ''}`);
}

function createLead(signalId) {
  return fetchAPI('/api/leads', {
    method: 'POST',
    body: JSON.stringify({ signal_id: signalId }),
  });
}

function updateLead(id, data) {
  return fetchAPI(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

function getUCC(filters = {}) {
  const params = new URLSearchParams();
  if (filters.state) params.set('state', filters.state);
  if (filters.competitor) params.set('competitor', filters.competitor);
  const qs = params.toString();
  return fetchAPI(`/api/ucc${qs ? '?' + qs : ''}`);
}

function uploadUCC(filings) {
  return fetchAPI('/api/ucc/upload', {
    method: 'POST',
    body: JSON.stringify({ filings }),
  });
}

function getCompetitors() {
  return fetchAPI('/api/competitors');
}

function getRefreshLog() {
  return fetchAPI('/api/refresh-log');
}

function triggerRefresh(source) {
  return fetchAPI(`/api/refresh/${source}`, { method: 'POST' });
}

// ---- Mock Data (used before Workers are deployed) ----

function getMockData(endpoint) {
  if (endpoint.startsWith('/api/stats')) {
    return Promise.resolve({
      total_signals: 142,
      total_signals_today: 23,
      hot_leads: 14,
      hot_leads_today: 3,
      ucc_filings: 28,
      ucc_filings_week: 5,
      job_postings: 53,
      job_postings_today: 8,
      news_permits: 47,
      news_permits_today: 7,
      by_territory: [
        { territory: 1, name: 'Oregon', count: 38 },
        { territory: 2, name: 'Washington', count: 29 },
        { territory: 3, name: 'Northern California', count: 31 },
        { territory: 4, name: 'Southern California', count: 26 },
        { territory: 5, name: 'Utah', count: 11 },
        { territory: 6, name: 'Nevada', count: 7 },
      ],
      pipeline: { new: 24, contacted: 12, engaged: 8, quoted: 5, won: 3, lost: 2 },
    });
  }

  if (endpoint.startsWith('/api/signals')) {
    return Promise.resolve([
      { id: 1, company_name: 'Stubborn Mule Manufacturing', city: 'Grants Pass', state: 'OR', source: 'ucc', title: 'UCC Filing — Mazak Corporation', detail: 'Secured Party: MAZAK CORPORATION, Florence KY. Filed 02/02/2026, File #94408174', heat: 'HOT', territory: 1, discovered_at: new Date(Date.now() - 2*3600000).toISOString() },
      { id: 2, company_name: 'Precision Castparts Corp', city: 'Portland', state: 'OR', source: 'job', title: 'Hiring 5 CNC Machinists', detail: 'Indeed posting — Portland, OR — Full-time CNC Machinist positions', heat: 'WARM', territory: 1, discovered_at: new Date(Date.now() - 4*3600000).toISOString() },
      { id: 3, company_name: 'Vigor Industrial', city: 'Seattle', state: 'WA', source: 'defense', title: '$14.2M Navy Contract', detail: 'Ship repair contract requiring CNC machining capacity', heat: 'HOT', territory: 2, discovered_at: new Date(Date.now() - 6*3600000).toISOString() },
      { id: 4, company_name: 'Arcimoto Inc', city: 'Eugene', state: 'OR', source: 'permit', title: '40,000 sq ft Manufacturing Expansion', detail: 'Building permit filed — Eugene, OR — New manufacturing facility', heat: 'WARM', territory: 1, discovered_at: new Date(Date.now() - 24*3600000).toISOString() },
      { id: 5, company_name: 'Northwest Precision Inc', city: 'Kent', state: 'WA', source: 'marketplace', title: 'Listed 2019 Okuma LB3000 EX', detail: 'Machinio listing — likely replacing with new machine', heat: 'WARM', territory: 2, discovered_at: new Date(Date.now() - 24*3600000).toISOString() },
      { id: 6, company_name: 'AMT Industry Report', city: '', state: '', source: 'news', title: 'West Coast Machine Tool Orders Up 12% Q1 2026', detail: 'Strongest growth in aerospace sector — AMT USMTO data', heat: 'COOL', territory: 0, discovered_at: new Date(Date.now() - 48*3600000).toISOString() },
      { id: 7, company_name: 'Custom Machine Works LLC', city: 'Clackamas', state: 'OR', source: 'ucc', title: 'UCC Filing — Financial Pacific Leasing', detail: 'Equipment financing — CNC equipment indicated', heat: 'WARM', territory: 1, discovered_at: new Date(Date.now() - 72*3600000).toISOString() },
      { id: 8, company_name: 'Boeing Fabrication Auburn', city: 'Auburn', state: 'WA', source: 'job', title: 'Hiring 3 CNC Programmers', detail: 'LinkedIn posting — 5-axis programming experience required', heat: 'WARM', territory: 2, discovered_at: new Date(Date.now() - 5*3600000).toISOString() },
      { id: 9, company_name: 'SpaceX Hawthorne', city: 'Hawthorne', state: 'CA', source: 'job', title: 'Hiring 12 CNC Machinists', detail: 'Multiple CNC positions — high-precision aerospace machining', heat: 'HOT', territory: 4, discovered_at: new Date(Date.now() - 8*3600000).toISOString() },
      { id: 10, company_name: 'Covert Engineers Inc', city: 'Beaverton', state: 'OR', source: 'ucc', title: 'UCC Filing — US Bank Equipment Finance', detail: 'CNC equipment financing via US Bank', heat: 'WARM', territory: 1, discovered_at: new Date(Date.now() - 96*3600000).toISOString() },
    ]);
  }

  if (endpoint.startsWith('/api/ucc')) {
    return Promise.resolve([
      { id: 1, company_name: 'Stubborn Mule Manufacturing', city: 'Grants Pass', state: 'OR', file_number: '94408174', filing_date: '2026-02-02', lapse_date: '2031-02-02', secured_party: 'MAZAK CORPORATION', collateral_description: 'CNC Machine Tool Equipment', is_competitor: 1 },
      { id: 2, company_name: 'Custom Machine Works LLC', city: 'Clackamas', state: 'OR', file_number: '94312876', filing_date: '2026-01-15', secured_party: 'Financial Pacific Leasing', collateral_description: 'Industrial Equipment', is_competitor: 0 },
      { id: 3, company_name: 'Covert Engineers Inc', city: 'Beaverton', state: 'OR', file_number: '94356201', filing_date: '2026-01-22', secured_party: 'US Bank Equipment Finance', collateral_description: 'CNC Equipment', is_competitor: 0 },
      { id: 4, company_name: 'AB Customs Studio LLC', city: 'Salem', state: 'OR', file_number: '94289103', filing_date: '2026-01-10', secured_party: 'Financial Pacific Leasing', collateral_description: 'Manufacturing Equipment', is_competitor: 0 },
    ]);
  }

  if (endpoint.startsWith('/api/leads')) {
    return Promise.resolve([
      { id: 1, company_name: 'Stubborn Mule Manufacturing', territory: 1, status: 'new', score: 95, heat: 'HOT', assigned_rep: '', sources: ['ucc'], created_at: '2026-03-20' },
      { id: 2, company_name: 'Precision Castparts Corp', territory: 1, status: 'contacted', score: 60, heat: 'WARM', assigned_rep: 'Territory 1 Rep', sources: ['job'], created_at: '2026-03-18' },
      { id: 3, company_name: 'Vigor Industrial', territory: 2, status: 'engaged', score: 85, heat: 'HOT', assigned_rep: 'Territory 2 Rep', sources: ['defense', 'job'], created_at: '2026-03-15' },
      { id: 4, company_name: 'SpaceX Hawthorne', territory: 4, status: 'new', score: 80, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-22' },
      { id: 5, company_name: 'Northwest Precision Inc', territory: 2, status: 'quoted', score: 70, heat: 'WARM', assigned_rep: 'Territory 2 Rep', sources: ['marketplace', 'job'], created_at: '2026-03-10' },
    ]);
  }

  if (endpoint.startsWith('/api/competitors')) {
    return Promise.resolve([
      { id: 1, name: 'Mazak', headquarters: 'Florence, KY', sales_model: 'Direct + Dealer', strengths: 'Strong brand, large installed base, good financing', weaknesses: 'Higher price point, slower service in some regions', displacement_strategy: 'Pitch Haas cost advantage (30-40% less) with comparable capability. Target Mazak VCN buyers with Haas VF-5 + Trinity automation. Use UCC filings to find every Mazak purchase.', lender_names: 'Mazak Corporation, Mazak Finance' },
      { id: 2, name: 'DMG MORI', headquarters: 'Chicago, IL', sales_model: 'Direct + Ellison Technologies', strengths: 'Premium engineering, strong 5-axis presence', weaknesses: 'Expensive, complex service, parts availability', displacement_strategy: 'Pitch Haas simplicity and total cost of ownership. Target DMG users frustrated with service lead times. For 5-axis, pitch Matsuura as premium alternative.', lender_names: 'DMG MORI Finance' },
      { id: 3, name: 'Okuma', headquarters: 'Charlotte, NC', sales_model: 'Distributor Network', strengths: 'Reliable machines, strong turning centers, OSP control', weaknesses: 'Smaller dealer network, OSP control learning curve', displacement_strategy: 'Target Okuma turning center users with Haas ST-series. Pitch SWAT accessories program. Leverage Haas Fanuc-based control familiarity.', lender_names: 'Okuma Credit Corporation' },
      { id: 4, name: 'Doosan / DN Solutions', headquarters: 'Pine Brook, NJ', sales_model: 'Distributor Network', strengths: 'Competitive pricing, decent quality for the money', weaknesses: 'Weaker brand perception, service variability', displacement_strategy: 'Doosan competes on price — Haas territory. Pitch Haas as American-made at similar price with better support and proximity.', lender_names: 'Doosan Industrial Vehicle, DN Solutions' },
      { id: 5, name: 'Makino', headquarters: 'Mason, OH', sales_model: 'Direct Sales', strengths: 'Excellent die/mold machines, strong in aerospace', weaknesses: 'Very expensive, narrow focus', displacement_strategy: 'Difficult direct displacement. Target accessory/tooling sales to Makino users. For general machining, pitch Haas as complementary workhorse.', lender_names: 'Makino Inc' },
    ]);
  }

  if (endpoint.startsWith('/api/refresh-log')) {
    return Promise.resolve([
      { id: 1, cycle: 'morning', completed_at: new Date().toISOString(), source: 'all', signals_found: 8, errors: null },
    ]);
  }

  return Promise.resolve([]);
}
