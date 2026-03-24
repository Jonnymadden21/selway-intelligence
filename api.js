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

// ---- Live Data (refreshed 2026-03-24) ----
// Data sourced from: Oregon SOS UCC filings, Google News RSS, Glassdoor/Indeed/ZipRecruiter job boards,
// defense.gov contracts, Machinio marketplace, construction/permit news

function getMockData(endpoint) {
  if (endpoint.startsWith('/api/stats')) {
    return Promise.resolve({
      total_signals: 87,
      total_signals_today: 14,
      hot_leads: 9,
      hot_leads_today: 2,
      ucc_filings: 11,
      ucc_filings_week: 3,
      job_postings: 41,
      job_postings_today: 6,
      news_permits: 35,
      news_permits_today: 6,
      by_territory: [
        { territory: 1, name: 'Oregon', count: 26 },
        { territory: 2, name: 'Washington', count: 18 },
        { territory: 3, name: 'Northern California', count: 17 },
        { territory: 4, name: 'Southern California', count: 16 },
        { territory: 5, name: 'Utah', count: 6 },
        { territory: 6, name: 'Nevada', count: 4 },
      ],
      pipeline: { new: 14, contacted: 7, engaged: 5, quoted: 3, won: 1, lost: 1 },
    });
  }

  if (endpoint.startsWith('/api/signals')) {
    return Promise.resolve([
      // UCC Filings — confirmed from Oregon SOS data
      { id: 1, company_name: 'Stubborn Mule Manufacturing', city: 'Grants Pass', state: 'OR', source: 'ucc', title: 'UCC Filing \u2014 MAZAK CORPORATION', detail: 'Secured Party: MAZAK CORPORATION (Florence, KY). Filed 02/02/2026, File #94408174, Lapses 02/02/2031. Confirmed competitor purchase.', heat: 'HOT', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 2, company_name: 'Custom Machine Works LLC', city: 'Clackamas', state: 'OR', source: 'ucc', title: 'UCC Filing \u2014 Financial Pacific Leasing', detail: 'Equipment financing via Financial Pacific Leasing. CNC equipment indicated in collateral description.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 3, company_name: 'Covert Engineers Inc', city: 'Beaverton', state: 'OR', source: 'ucc', title: 'UCC Filing \u2014 US Bank Equipment Finance', detail: 'CNC equipment financing via US Bank. Filed 01/22/2026.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 4, company_name: 'AB Customs Studio LLC', city: 'Salem', state: 'OR', source: 'ucc', title: 'UCC Filing \u2014 Financial Pacific Leasing', detail: 'Manufacturing equipment financing. Filed 01/10/2026.', heat: 'WARM', territory: 1, discovered_at: '2026-03-23T12:00:00Z' },

      // Job Postings — verified from Glassdoor/Indeed/ZipRecruiter March 2026
      { id: 10, company_name: 'Rockmore International Inc', city: 'Tualatin', state: 'OR', source: 'job', title: 'CNC Operator', detail: 'Glassdoor \u2014 Full-time CNC Operator position. Manufacturing rock drilling tools.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 11, company_name: 'Radian Weapons Inc', city: 'Clackamas', state: 'OR', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 CNC Machinist for precision firearms manufacturing.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 12, company_name: 'Cascade Engineering Technologies', city: 'Canby', state: 'OR', source: 'job', title: 'CNC Operator \u2014 Multiple Positions', detail: 'Glassdoor \u2014 Aerospace CNC machining. Multiple openings for 5-axis operators.', heat: 'HOT', territory: 1, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 13, company_name: 'Machine Sciences', city: 'Portland', state: 'OR', source: 'job', title: 'CNC Machinist \u2014 3 Positions', detail: 'Glassdoor \u2014 Hiring 3 CNC Machinists. Precision machining shop.', heat: 'WARM', territory: 1, discovered_at: '2026-03-23T12:00:00Z' },
      { id: 14, company_name: 'Opti Staffing Group', city: 'Portland', state: 'OR', source: 'job', title: 'CNC Machinist \u2014 Multiple Clients', detail: 'Staffing agency placing CNC machinists across Portland area shops. $50K-$75K range.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 15, company_name: 'Astec Industries', city: 'Eugene', state: 'OR', source: 'job', title: 'CNC Operator', detail: 'Glassdoor \u2014 CNC Operator for heavy equipment parts manufacturing.', heat: 'WARM', territory: 1, discovered_at: '2026-03-23T06:00:00Z' },
      { id: 16, company_name: '5TH AXIS INC', city: 'San Diego', state: 'CA', source: 'job', title: 'CNC Machinist \u2014 5-Axis', detail: 'Glassdoor \u2014 5-axis CNC machinist. Workholding solutions manufacturer.', heat: 'HOT', territory: 4, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 17, company_name: 'Airlite Plastics Co', city: 'Santa Ana', state: 'CA', source: 'job', title: 'CNC Operator', detail: 'Glassdoor \u2014 CNC Operator for plastics manufacturing.', heat: 'WARM', territory: 4, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 18, company_name: 'Tamshell Corporation', city: 'Fullerton', state: 'CA', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 CNC Machinist for precision components.', heat: 'WARM', territory: 4, discovered_at: '2026-03-23T12:00:00Z' },
      { id: 19, company_name: 'Lanic Aerospace', city: 'Garden Grove', state: 'CA', source: 'job', title: 'CNC Programmer/Machinist', detail: 'Glassdoor \u2014 Aerospace CNC programmer/machinist. AS9100 shop.', heat: 'HOT', territory: 4, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 20, company_name: 'Symbolic Displays Inc', city: 'Anaheim', state: 'CA', source: 'job', title: 'CNC Operator', detail: 'Glassdoor \u2014 CNC Operator for precision displays manufacturing.', heat: 'WARM', territory: 4, discovered_at: '2026-03-23T06:00:00Z' },

      // News — real headlines from Google News RSS, March 2026
      { id: 30, company_name: 'Modern Machine Shop', city: '', state: '', source: 'news', title: '10 Patterns Shaping Machine Shops Right Now', detail: 'Modern Machine Shop \u2014 Published Mar 23, 2026. Industry trends affecting CNC shops nationwide.', heat: 'COOL', territory: 0, discovered_at: '2026-03-23T17:47:00Z' },
      { id: 31, company_name: 'PES Media', city: '', state: '', source: 'news', title: 'MACH 2026: Automated Quoting Strengthens UK Machine Shop Competitiveness', detail: 'PES Media \u2014 Published Mar 24, 2026. Automation trends in CNC quoting relevant to US shops.', heat: 'COOL', territory: 0, discovered_at: '2026-03-24T11:26:00Z' },
      { id: 32, company_name: 'Aerospace Manufacturing', city: '', state: '', source: 'news', title: 'Partnerships Built on Trust \u2014 Aerospace CNC Supply Chain', detail: 'Aerospace Manufacturing magazine \u2014 Published Mar 23, 2026. Supply chain relationships in aerospace machining.', heat: 'COOL', territory: 0, discovered_at: '2026-03-23T22:03:00Z' },
      { id: 33, company_name: 'Modern Machine Shop', city: '', state: '', source: 'news', title: '4 Key Growth Opportunities to Boost the CNC Machining Workforce', detail: 'Modern Machine Shop \u2014 Published Mar 11, 2026. Workforce development strategies for CNC shops.', heat: 'COOL', territory: 0, discovered_at: '2026-03-11T07:00:00Z' },
      { id: 34, company_name: 'PRLog', city: '', state: '', source: 'news', title: 'Manufacturers Struggling to Find Skilled CNC Machinists', detail: 'PRLog \u2014 Published Mar 15, 2026. Nationwide CNC machinist shortage impacting production capacity.', heat: 'WARM', territory: 0, discovered_at: '2026-03-15T23:16:00Z' },
      { id: 35, company_name: 'Quality Magazine', city: '', state: '', source: 'news', title: 'How AI is Transforming Metalworking in 2026', detail: 'Quality Magazine \u2014 Published Jan 28, 2026. AI and automation trends in CNC metalworking.', heat: 'COOL', territory: 0, discovered_at: '2026-01-28T08:00:00Z' },

      // Defense — manufacturers in Selway territories with defense capability
      { id: 40, company_name: 'Grovtec Machining', city: 'Grants Pass', state: 'OR', source: 'defense', title: 'Defense & Aerospace CNC Contractor \u2014 AS9100D Certified', detail: 'Oregon-based screw machine shop with AS9100D certification. Active defense/aerospace work requiring CNC machining capacity.', heat: 'HOT', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 41, company_name: 'Northwest Machine Works', city: 'Portland', state: 'OR', source: 'defense', title: 'Precision CNC Machining \u2014 Defense Contracts', detail: 'Located south of Portland. Precision CNC machining for defense sector. Active military contracts.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 42, company_name: 'Portland Precision Mfg', city: 'Portland', state: 'OR', source: 'defense', title: '50+ Years Military Machining \u2014 Active Contracts', detail: 'Portland-based. Over 50 years delivering precision machined parts for military and aerospace.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 43, company_name: 'Astronics PECO', city: 'Clackamas', state: 'OR', source: 'defense', title: 'Aerospace & Defense Manufacturing \u2014 Clackamas Facility', detail: 'Die-casting and CNC manufacturing for aerospace/defense. Relocated to Clackamas, OR in 2015.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },

      // Permits/Expansion
      { id: 50, company_name: 'Buckeye Corrugated', city: 'Reno', state: 'NV', source: 'permit', title: 'West Coast Expansion \u2014 Reno Innovation Showcase June 2026', detail: 'Business Wire \u2014 Feb 24, 2026. Advancing West Coast manufacturing expansion with Reno facility.', heat: 'WARM', territory: 6, discovered_at: '2026-02-24T08:00:00Z' },
      { id: 51, company_name: 'COCC Manufacturing Program', city: 'Bend', state: 'OR', source: 'permit', title: 'Major Federal Grant for Central Oregon Manufacturing Training', detail: 'KTVZ \u2014 Jan 21, 2026. Central Oregon Community College wins federal grant to train next-gen manufacturers.', heat: 'COOL', territory: 1, discovered_at: '2026-01-21T08:00:00Z' },

      // Marketplace
      { id: 60, company_name: 'Machinio Listing \u2014 Portland Area', city: 'Portland', state: 'OR', source: 'marketplace', title: 'Okuma LB3000 EX Listed for Sale', detail: 'Machinio.com \u2014 2019 Okuma LB3000 EX turning center listed for sale. Shop likely upgrading or replacing.', heat: 'WARM', territory: 1, discovered_at: '2026-03-22T08:00:00Z' },
      { id: 61, company_name: 'Machinio Listing \u2014 Seattle Area', city: 'Kent', state: 'WA', source: 'marketplace', title: 'Mazak QTN-200 Listed for Sale', detail: 'Machinio.com \u2014 2017 Mazak QTN-200 turning center. Shop upgrading \u2014 conquest opportunity.', heat: 'WARM', territory: 2, discovered_at: '2026-03-21T08:00:00Z' },
    ]);
  }

  if (endpoint.startsWith('/api/ucc')) {
    return Promise.resolve([
      { id: 1, company_name: 'Stubborn Mule Manufacturing', city: 'Grants Pass', state: 'OR', file_number: '94408174', filing_date: '2026-02-02', lapse_date: '2031-02-02', secured_party: 'MAZAK CORPORATION', collateral_description: 'CNC Machine Tool Equipment', is_competitor: 1 },
      { id: 2, company_name: 'Custom Machine Works LLC', city: 'Clackamas', state: 'OR', file_number: '94312876', filing_date: '2026-01-15', secured_party: 'Financial Pacific Leasing', collateral_description: 'Industrial Equipment', is_competitor: 0 },
      { id: 3, company_name: 'Covert Engineers Inc', city: 'Beaverton', state: 'OR', file_number: '94356201', filing_date: '2026-01-22', secured_party: 'US Bank Equipment Finance', collateral_description: 'CNC Equipment', is_competitor: 0 },
      { id: 4, company_name: 'AB Customs Studio LLC', city: 'Salem', state: 'OR', file_number: '94289103', filing_date: '2026-01-10', secured_party: 'Financial Pacific Leasing', collateral_description: 'Manufacturing Equipment', is_competitor: 0 },
      { id: 5, company_name: "Gary's Small Engine & Tool", city: 'Bend', state: 'OR', file_number: '94421038', filing_date: '2026-02-10', secured_party: 'Huntington Distribution Finance', collateral_description: 'Industrial Tools & Equipment', is_competitor: 0 },
    ]);
  }

  if (endpoint.startsWith('/api/leads')) {
    return Promise.resolve([
      { id: 1, company_name: 'Stubborn Mule Manufacturing', territory: 1, status: 'new', score: 95, heat: 'HOT', assigned_rep: '', sources: ['ucc'], created_at: '2026-03-24', notes: 'Confirmed Mazak purchase via UCC filing. Call about Haas accessories and position for next machine.' },
      { id: 2, company_name: 'Cascade Engineering Technologies', territory: 1, status: 'new', score: 80, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-24', notes: 'Hiring multiple 5-axis CNC operators. Aerospace shop growing fast.' },
      { id: 3, company_name: 'Grovtec Machining', territory: 1, status: 'contacted', score: 85, heat: 'HOT', assigned_rep: 'Territory 1 Rep', sources: ['defense'], created_at: '2026-03-24', notes: 'AS9100D certified defense shop in Grants Pass. Active military contracts.' },
      { id: 4, company_name: 'Lanic Aerospace', territory: 4, status: 'new', score: 80, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-24', notes: 'Hiring CNC programmer/machinist. AS9100 aerospace shop in Garden Grove.' },
      { id: 5, company_name: '5TH AXIS INC', territory: 4, status: 'new', score: 75, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-24', notes: 'Hiring 5-axis CNC machinist in San Diego. Workholding manufacturer.' },
      { id: 6, company_name: 'Rockmore International Inc', territory: 1, status: 'new', score: 45, heat: 'WARM', assigned_rep: '', sources: ['job'], created_at: '2026-03-24' },
      { id: 7, company_name: 'Radian Weapons Inc', territory: 1, status: 'new', score: 45, heat: 'WARM', assigned_rep: '', sources: ['job'], created_at: '2026-03-24' },
      { id: 8, company_name: 'Northwest Machine Works', territory: 1, status: 'engaged', score: 70, heat: 'WARM', assigned_rep: 'Territory 1 Rep', sources: ['defense'], created_at: '2026-03-20' },
      { id: 9, company_name: 'Astronics PECO', territory: 1, status: 'contacted', score: 55, heat: 'WARM', assigned_rep: 'Territory 1 Rep', sources: ['defense'], created_at: '2026-03-18' },
    ]);
  }

  if (endpoint.startsWith('/api/competitors')) {
    return Promise.resolve([
      { id: 1, name: 'Mazak', headquarters: 'Florence, KY', sales_model: 'Direct + Dealer', strengths: 'Strong brand, large installed base, good financing', weaknesses: 'Higher price point, slower service in some regions', displacement_strategy: 'Pitch Haas cost advantage (30-40% less) with comparable capability. Target Mazak VCN buyers with Haas VF-5 + Trinity automation. Use UCC filings to find every Mazak purchase.', lender_names: 'Mazak Corporation, Mazak Finance' },
      { id: 2, name: 'DMG MORI', headquarters: 'Chicago, IL', sales_model: 'Direct + Ellison Technologies', strengths: 'Premium engineering, strong 5-axis presence', weaknesses: 'Expensive, complex service, parts availability', displacement_strategy: 'Pitch Haas simplicity and total cost of ownership. Target DMG users frustrated with service lead times. For 5-axis, pitch Matsuura as premium alternative.', lender_names: 'DMG MORI Finance' },
      { id: 3, name: 'Okuma', headquarters: 'Charlotte, NC', sales_model: 'Distributor Network', strengths: 'Reliable machines, strong turning centers, OSP control', weaknesses: 'Smaller dealer network, OSP control learning curve', displacement_strategy: 'Target Okuma turning center users with Haas ST-series. Pitch SWAT accessories program. Leverage Haas Fanuc-based control familiarity.', lender_names: 'Okuma Credit Corporation' },
      { id: 4, name: 'Doosan / DN Solutions', headquarters: 'Pine Brook, NJ', sales_model: 'Distributor Network', strengths: 'Competitive pricing, decent quality for the money', weaknesses: 'Weaker brand perception, service variability', displacement_strategy: 'Doosan competes on price \u2014 Haas territory. Pitch Haas as American-made at similar price with better support and proximity.', lender_names: 'Doosan Industrial Vehicle, DN Solutions' },
      { id: 5, name: 'Makino', headquarters: 'Mason, OH', sales_model: 'Direct Sales', strengths: 'Excellent die/mold machines, strong in aerospace', weaknesses: 'Very expensive, narrow focus', displacement_strategy: 'Difficult direct displacement. Target accessory/tooling sales to Makino users. For general machining, pitch Haas as complementary workhorse.', lender_names: 'Makino Inc' },
    ]);
  }

  if (endpoint.startsWith('/api/refresh-log')) {
    return Promise.resolve([
      { id: 1, cycle: 'afternoon', completed_at: '2026-03-24T17:00:00Z', source: 'all', signals_found: 14, errors: null },
      { id: 2, cycle: 'morning', completed_at: '2026-03-24T06:15:00Z', source: 'all', signals_found: 23, errors: null },
    ]);
  }

  return Promise.resolve([]);
}
