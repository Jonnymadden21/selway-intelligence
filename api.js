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
      total_signals: 156,
      total_signals_today: 31,
      hot_leads: 18,
      hot_leads_today: 5,
      ucc_filings: 11,
      ucc_filings_week: 3,
      job_postings: 37,
      job_postings_today: 12,
      news_permits: 108,
      news_permits_today: 14,
      by_territory: [
        { territory: 1, name: 'Oregon', count: 34 },
        { territory: 2, name: 'Washington', count: 28 },
        { territory: 3, name: 'Northern California', count: 14 },
        { territory: 4, name: 'Southern California', count: 42 },
        { territory: 5, name: 'Utah', count: 22 },
        { territory: 6, name: 'Nevada', count: 16 },
      ],
      pipeline: { new: 22, contacted: 9, engaged: 6, quoted: 4, won: 1, lost: 1 },
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

      // Defense Contracts — verified from defense.gov March 2026
      { id: 40, company_name: 'Vigor Marine LLC', city: 'Portland', state: 'OR', source: 'defense', title: '$17.9M Shipyard Maintenance Contract', detail: 'defense.gov Mar 20, 2026 \u2014 Shipyard availability, maintenance and repair. Fabrication/CNC machining capacity required.', heat: 'HOT', territory: 1, discovered_at: '2026-03-20T12:00:00Z' },
      { id: 41, company_name: 'Boeing Co.', city: 'Tukwila', state: 'WA', source: 'defense', title: '$38.6M P-8A Software Development', detail: 'defense.gov Mar 17, 2026 \u2014 Republic of Korea P-8A aircraft software. Work in Seattle (45%) and Huntington Beach (30%).', heat: 'HOT', territory: 2, discovered_at: '2026-03-17T12:00:00Z' },
      { id: 42, company_name: 'Fluke Electronics Corp.', city: 'Everett', state: 'WA', source: 'defense', title: '$22.5M Multifunction Calibrator Production', detail: 'defense.gov Mar 19, 2026 \u2014 IDIQ contract for multifunction calibrators. Manufacturing work at Everett, WA.', heat: 'HOT', territory: 2, discovered_at: '2026-03-19T12:00:00Z' },
      { id: 43, company_name: 'Hadrian Automation Inc.', city: 'Torrance', state: 'CA', source: 'defense', title: '$39.2M Advanced Automation Manufacturing', detail: 'defense.gov Mar 18, 2026 \u2014 Defense manufacturing automation systems. Cumulative value $80M. CNC automation.', heat: 'HOT', territory: 4, discovered_at: '2026-03-18T12:00:00Z' },
      { id: 44, company_name: 'L3Harris Interstate Electronics', city: 'Anaheim', state: 'CA', source: 'defense', title: '$77.8M Tracking Mount Sustainment', detail: 'defense.gov Mar 18, 2026 \u2014 Kineto tracking mount subassemblies for DoD/DOE/NASA test ranges. Completion Mar 2031.', heat: 'HOT', territory: 4, discovered_at: '2026-03-18T12:00:00Z' },
      { id: 45, company_name: 'Aerovironment Inc.', city: 'Simi Valley', state: 'CA', source: 'defense', title: '$117.3M Long Range Reconnaissance Systems', detail: 'defense.gov Mar 19, 2026 \u2014 P550 Long Range Reconnaissance procurement. Major manufacturing contract.', heat: 'HOT', territory: 4, discovered_at: '2026-03-19T12:00:00Z' },
      { id: 46, company_name: 'Aerovironment Inc.', city: 'Simi Valley', state: 'CA', source: 'defense', title: '$17.5M Red Dragon Systems Procurement', detail: 'defense.gov Mar 19, 2026 \u2014 Red Dragon systems, battery chargers, ground control stations, launchers.', heat: 'WARM', territory: 4, discovered_at: '2026-03-19T12:00:00Z' },
      { id: 47, company_name: 'Northrop Grumman Systems', city: 'Magna', state: 'UT', source: 'defense', title: '$9.8M Defense Systems Contract', detail: 'defense.gov Mar 18, 2026 \u2014 Defense systems work at Magna, UT facility. Likely propulsion/munitions manufacturing.', heat: 'WARM', territory: 5, discovered_at: '2026-03-18T12:00:00Z' },
      { id: 48, company_name: 'Utah State University SDL', city: 'Logan', state: 'UT', source: 'defense', title: '$414M Missile Defense Agency Support', detail: 'defense.gov Mar 17, 2026 \u2014 Sole-source UARC for MDA technical/analytical support. Massive Utah defense investment.', heat: 'HOT', territory: 5, discovered_at: '2026-03-17T12:00:00Z' },
      { id: 49, company_name: 'C. Martin Co. Inc.', city: 'North Las Vegas', state: 'NV', source: 'defense', title: '$47.9M Facility & Equipment Support', detail: 'defense.gov Mar 2, 2026 \u2014 Civil engineering facility and equipment support services.', heat: 'WARM', territory: 6, discovered_at: '2026-03-02T12:00:00Z' },

      // Additional Job Postings — verified from Glassdoor/Indeed/ZipRecruiter March 2026
      { id: 70, company_name: 'Parker Hannifin Corporation', city: 'Kent', state: 'WA', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 CNC Machinist for aerospace/industrial components manufacturing.', heat: 'WARM', territory: 2, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 71, company_name: 'Saxon Aerospace', city: 'Seattle', state: 'WA', source: 'job', title: 'CNC Machinist', detail: 'LinkedIn \u2014 Aerospace CNC machinist position in Seattle.', heat: 'HOT', territory: 2, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 72, company_name: 'Accurus Aerospace Kent LLC', city: 'Kent', state: 'WA', source: 'job', title: 'CNC Machinist \u2014 Aerospace', detail: 'Indeed \u2014 Aerospace precision CNC machining. AS9100 certified shop.', heat: 'HOT', territory: 2, discovered_at: '2026-03-23T12:00:00Z' },
      { id: 73, company_name: 'Boeing', city: 'Auburn', state: 'WA', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 CNC Machinist at Boeing Auburn fabrication facility.', heat: 'HOT', territory: 2, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 74, company_name: 'Karman Space & Defense', city: 'Mukilteo', state: 'WA', source: 'job', title: 'CNC Machinist', detail: 'SimplyHired \u2014 Space and defense CNC machining.', heat: 'HOT', territory: 2, discovered_at: '2026-03-23T06:00:00Z' },
      { id: 75, company_name: 'Solar Turbines', city: 'San Diego', state: 'CA', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Turbine components CNC machining. Caterpillar subsidiary.', heat: 'WARM', territory: 4, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 76, company_name: 'L3Harris', city: 'Los Angeles', state: 'CA', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Defense electronics CNC machinist.', heat: 'HOT', territory: 4, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 77, company_name: 'Prime Machine Inc.', city: 'Salt Lake City', state: 'UT', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Precision CNC machining shop in SLC.', heat: 'WARM', territory: 5, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 78, company_name: 'JD Machine Corp.', city: 'Ogden', state: 'UT', source: 'job', title: 'CNC Machinist', detail: 'Indeed \u2014 Defense/aerospace CNC machining. Major Utah shop.', heat: 'HOT', territory: 5, discovered_at: '2026-03-23T12:00:00Z' },
      { id: 79, company_name: 'Boart Longyear', city: 'West Valley City', state: 'UT', source: 'job', title: 'CNC Machinist', detail: 'Indeed \u2014 Mining/drilling equipment manufacturer.', heat: 'WARM', territory: 5, discovered_at: '2026-03-23T06:00:00Z' },
      { id: 80, company_name: 'ENTEK', city: 'Henderson', state: 'NV', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Battery separator manufacturing.', heat: 'WARM', territory: 6, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 81, company_name: 'Aerospace Machine & Supply', city: 'Las Vegas', state: 'NV', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Aerospace CNC precision machining.', heat: 'HOT', territory: 6, discovered_at: '2026-03-24T12:00:00Z' },
      { id: 82, company_name: 'Davis Tool, Inc.', city: 'Portland', state: 'OR', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Precision machining job shop in Portland.', heat: 'WARM', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },
      { id: 83, company_name: 'Van\'s Aircraft, Inc.', city: 'Aurora', state: 'OR', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Kit aircraft manufacturer. CNC machining for airframe parts.', heat: 'WARM', territory: 1, discovered_at: '2026-03-23T12:00:00Z' },
      { id: 84, company_name: 'Arnprior Aerospace Portland', city: 'Portland', state: 'OR', source: 'job', title: 'CNC Machinist', detail: 'Glassdoor \u2014 Aerospace precision machining.', heat: 'HOT', territory: 1, discovered_at: '2026-03-24T06:00:00Z' },

      // Marketplace — verified from Machinio search results March 2026
      { id: 60, company_name: 'Machinio \u2014 Mazak VCC 5X 20K', city: '', state: 'CA', source: 'marketplace', title: 'Mazak VCC 5X 20K \u2014 5-Axis Machining Center for Sale', detail: 'Machinio.com \u2014 Used Mazak 5-axis VMC listed in California. Seller upgrading \u2014 conquest opportunity.', heat: 'WARM', territory: 4, discovered_at: '2026-03-22T08:00:00Z' },
      { id: 61, company_name: "Machinio \u2014 Turner's Machinery", city: 'Fillmore', state: 'CA', source: 'marketplace', title: 'Mazak Power Center V-12 for Sale \u2014 $383/mo', detail: "Machinio.com \u2014 Turner's Machinery (Fillmore, CA). 2003-2011 Mazak Power Center V-12 VMC.", heat: 'WARM', territory: 4, discovered_at: '2026-03-21T08:00:00Z' },
      { id: 62, company_name: 'Machinio \u2014 Okuma GENOS M560-V', city: 'Los Angeles', state: 'CA', source: 'marketplace', title: 'Okuma GENOS M560-V for Sale \u2014 Los Angeles', detail: 'Machinio.com \u2014 Okuma GENOS M560 with OSP-P300MA, Renishaw Probe, 1000 PSI TSC. Trusted seller in LA.', heat: 'HOT', territory: 4, discovered_at: '2026-03-23T08:00:00Z' },
      { id: 63, company_name: 'Machinio \u2014 DMG Mori DMU 50', city: 'Santa Ana', state: 'CA', source: 'marketplace', title: 'DMG Mori DMU 50 5-Axis for Sale \u2014 Santa Ana', detail: 'Machinio.com \u2014 DMG Mori DMU 50, Siemens control, 5-axis, 14000 RPM. Shop selling competitor machine.', heat: 'HOT', territory: 4, discovered_at: '2026-03-22T08:00:00Z' },
      { id: 64, company_name: 'Machinio \u2014 DMG Mori CMX 1100V', city: '', state: 'CA', source: 'marketplace', title: 'DMG Mori CMX1100V for Sale \u2014 $2,531/mo', detail: 'Machinio.com \u2014 2019 DMG Mori CMX1100V, 21hp, 12k RPM, CT40, Slimline Control. California listing.', heat: 'WARM', territory: 4, discovered_at: '2026-03-21T08:00:00Z' },
      { id: 65, company_name: 'Machinio \u2014 Mazak Nexus 410A', city: '', state: 'CA', source: 'marketplace', title: 'Mazak Nexus 410A for Sale \u2014 1200 Hours', detail: 'Machinio.com \u2014 Low-hour Mazak Nexus 410A with Mazatrol 640M CNC. California listing.', heat: 'WARM', territory: 4, discovered_at: '2026-03-20T08:00:00Z' },
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
      { id: 10, company_name: 'Vigor Marine LLC', territory: 1, status: 'new', score: 85, heat: 'HOT', assigned_rep: '', sources: ['defense'], created_at: '2026-03-24', notes: '$17.9M shipyard contract. Fabrication/CNC machining capacity needed.' },
      { id: 11, company_name: 'Boeing Co.', territory: 2, status: 'new', score: 90, heat: 'HOT', assigned_rep: '', sources: ['defense', 'job'], created_at: '2026-03-24', notes: '$38.6M P-8A contract + hiring CNC machinists at Auburn. Multi-signal.' },
      { id: 12, company_name: 'Fluke Electronics Corp.', territory: 2, status: 'new', score: 80, heat: 'HOT', assigned_rep: '', sources: ['defense'], created_at: '2026-03-24', notes: '$22.5M calibrator production contract. Everett, WA. Manufacturing growth.' },
      { id: 13, company_name: 'Hadrian Automation Inc.', territory: 4, status: 'new', score: 95, heat: 'HOT', assigned_rep: '', sources: ['defense'], created_at: '2026-03-24', notes: '$39.2M defense manufacturing automation. Torrance, CA. CNC automation focus.' },
      { id: 14, company_name: 'L3Harris Interstate Electronics', territory: 4, status: 'new', score: 85, heat: 'HOT', assigned_rep: '', sources: ['defense', 'job'], created_at: '2026-03-24', notes: '$77.8M tracking mount contract + hiring CNC machinists. Multi-signal.' },
      { id: 15, company_name: 'JD Machine Corp.', territory: 5, status: 'new', score: 80, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-24', notes: 'Major Utah defense/aerospace CNC shop hiring machinists.' },
      { id: 16, company_name: 'Saxon Aerospace', territory: 2, status: 'new', score: 75, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-24', notes: 'Seattle aerospace CNC machinist position. Growing shop.' },
      { id: 17, company_name: 'Aerospace Machine & Supply', territory: 6, status: 'new', score: 75, heat: 'HOT', assigned_rep: '', sources: ['job'], created_at: '2026-03-24', notes: 'Las Vegas aerospace CNC shop hiring. Nevada conquest opportunity.' },
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
