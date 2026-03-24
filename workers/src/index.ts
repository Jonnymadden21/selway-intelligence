// Selway Intelligence — Main Worker Entry Point

export interface Env {
  DB: D1Database;
  API_KEY: string;
  RESEND_API_KEY: string;
  SERPAPI_KEY: string;
  FRONTEND_URL: string;
}

// CORS headers
function corsHeaders(origin: string | null, env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

function jsonResponse(data: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(null, env),
    },
  });
}

// Auth check
function authCheck(request: Request, env: Env): Response | null {
  const key = request.headers.get('X-API-Key');
  if (!env.API_KEY || key === env.API_KEY) return null;
  return jsonResponse({ error: 'Unauthorized' }, 401, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(null, env) });
    }

    // Auth check
    const authError = authCheck(request, env);
    if (authError) return authError;

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route dispatch
      if (path === '/api/stats' && request.method === 'GET') {
        return await handleStats(env);
      }
      if (path === '/api/signals' && request.method === 'GET') {
        return await handleSignals(url, env);
      }
      if (path.match(/^\/api\/signals\/\d+$/) && request.method === 'GET') {
        const id = path.split('/').pop();
        return await handleSignalById(id!, env);
      }
      if (path === '/api/leads' && request.method === 'GET') {
        return await handleLeads(url, env);
      }
      if (path === '/api/leads' && request.method === 'POST') {
        const body = await request.json();
        return await handleCreateLead(body, env);
      }
      if (path.match(/^\/api\/leads\/\d+$/) && request.method === 'PATCH') {
        const id = path.split('/').pop();
        const body = await request.json();
        return await handleUpdateLead(id!, body, env);
      }
      if (path === '/api/ucc' && request.method === 'GET') {
        return await handleUCC(url, env);
      }
      if (path === '/api/ucc/upload' && request.method === 'POST') {
        const body = await request.json();
        return await handleUCCUpload(body, env);
      }
      if (path === '/api/competitors' && request.method === 'GET') {
        return await handleCompetitors(env);
      }
      if (path === '/api/refresh-log' && request.method === 'GET') {
        return await handleRefreshLog(env);
      }
      if (path.match(/^\/api\/refresh\/\w+$/) && request.method === 'POST') {
        const source = path.split('/').pop();
        return await handleTriggerRefresh(source!, env);
      }

      return jsonResponse({ error: 'Not found' }, 404, env);
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal server error' }, 500, env);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Determine cycle based on cron time
    const hour = new Date(event.scheduledTime).getUTCHours();
    let cycle = 'morning';
    if (hour >= 18) cycle = 'noon';
    else if (hour >= 23 || hour === 0) cycle = 'afternoon';

    console.log(`Cron triggered: ${cycle} cycle at ${new Date(event.scheduledTime).toISOString()}`);

    // TODO: Wire up collectors and processing engine
    // For now, log the trigger
    try {
      await env.DB.prepare(
        'INSERT INTO refresh_log (cycle, source, signals_found) VALUES (?, ?, ?)'
      ).bind(cycle, 'cron', 0).run();
    } catch (err) {
      console.error('Cron handler error:', err);
    }
  },
};

// ---- Route Handlers ----

async function handleStats(env: Env): Promise<Response> {
  const db = env.DB;
  const [totalSignals, hotLeads, uccCount, jobCount, newsPermitCount, byTerritory, pipeline, todaySignals] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM signals').first<{count: number}>(),
    db.prepare("SELECT COUNT(*) as count FROM signals WHERE heat = 'HOT'").first<{count: number}>(),
    db.prepare("SELECT COUNT(*) as count FROM ucc_filings").first<{count: number}>(),
    db.prepare("SELECT COUNT(*) as count FROM signals WHERE source = 'job'").first<{count: number}>(),
    db.prepare("SELECT COUNT(*) as count FROM signals WHERE source IN ('news','permit')").first<{count: number}>(),
    db.prepare('SELECT territory, COUNT(*) as count FROM signals WHERE territory > 0 GROUP BY territory').all<{territory: number, count: number}>(),
    db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all<{status: string, count: number}>(),
    db.prepare("SELECT COUNT(*) as count FROM signals WHERE discovered_at >= date('now')").first<{count: number}>(),
  ]);

  const territoryNames: Record<number, string> = { 1: 'Oregon', 2: 'Washington', 3: 'Northern California', 4: 'Southern California', 5: 'Utah', 6: 'Nevada' };
  const pipelineMap: Record<string, number> = {};
  (pipeline.results || []).forEach(r => { pipelineMap[r.status] = r.count; });

  return jsonResponse({
    total_signals: totalSignals?.count || 0,
    total_signals_today: todaySignals?.count || 0,
    hot_leads: hotLeads?.count || 0,
    hot_leads_today: 0,
    ucc_filings: uccCount?.count || 0,
    ucc_filings_week: 0,
    job_postings: jobCount?.count || 0,
    job_postings_today: 0,
    news_permits: newsPermitCount?.count || 0,
    news_permits_today: 0,
    by_territory: (byTerritory.results || []).map(t => ({
      territory: t.territory,
      name: territoryNames[t.territory] || 'Unknown',
      count: t.count,
    })),
    pipeline: pipelineMap,
  }, 200, env);
}

async function handleSignals(url: URL, env: Env): Promise<Response> {
  const source = url.searchParams.get('source');
  const territory = url.searchParams.get('territory');
  const heat = url.searchParams.get('heat');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = 'SELECT s.*, c.name as company_name, c.city, c.state FROM signals s LEFT JOIN companies c ON s.company_id = c.id WHERE 1=1';
  const params: unknown[] = [];

  if (source) { query += ' AND s.source = ?'; params.push(source); }
  if (territory) { query += ' AND s.territory = ?'; params.push(parseInt(territory)); }
  if (heat) { query += ' AND s.heat = ?'; params.push(heat); }

  query += ' ORDER BY s.discovered_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const results = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(results.results || [], 200, env);
}

async function handleSignalById(id: string, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    'SELECT s.*, c.name as company_name, c.city, c.state FROM signals s LEFT JOIN companies c ON s.company_id = c.id WHERE s.id = ?'
  ).bind(parseInt(id)).first();
  if (!result) return jsonResponse({ error: 'Signal not found' }, 404, env);
  return jsonResponse(result, 200, env);
}

async function handleLeads(url: URL, env: Env): Promise<Response> {
  const status = url.searchParams.get('status');
  const territory = url.searchParams.get('territory');

  let query = 'SELECT l.*, c.name as company_name, c.city, c.state, c.territory, c.heat_score as heat FROM leads l LEFT JOIN companies c ON l.company_id = c.id WHERE 1=1';
  const params: unknown[] = [];

  if (status) { query += ' AND l.status = ?'; params.push(status); }
  if (territory) { query += ' AND c.territory = ?'; params.push(parseInt(territory)); }

  query += ' ORDER BY l.score DESC';

  const results = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(results.results || [], 200, env);
}

async function handleCreateLead(body: any, env: Env): Promise<Response> {
  const signalId = body.signal_id;
  if (!signalId) return jsonResponse({ error: 'signal_id required' }, 400, env);

  const signal = await env.DB.prepare('SELECT * FROM signals WHERE id = ?').bind(signalId).first<any>();
  if (!signal) return jsonResponse({ error: 'Signal not found' }, 404, env);

  const result = await env.DB.prepare(
    'INSERT INTO leads (company_id, score, status) VALUES (?, ?, ?)'
  ).bind(signal.company_id, signal.heat === 'HOT' ? 80 : signal.heat === 'WARM' ? 50 : 20, 'new').run();

  const leadId = result.meta.last_row_id;
  await env.DB.prepare(
    'INSERT INTO lead_signals (lead_id, signal_id) VALUES (?, ?)'
  ).bind(leadId, signalId).run();

  return jsonResponse({ id: leadId, status: 'created' }, 201, env);
}

async function handleUpdateLead(id: string, body: any, env: Env): Promise<Response> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.status) { updates.push('status = ?'); params.push(body.status); }
  if (body.notes !== undefined) { updates.push('notes = ?'); params.push(body.notes); }
  if (body.assigned_rep !== undefined) { updates.push('assigned_rep = ?'); params.push(body.assigned_rep); }

  if (updates.length === 0) return jsonResponse({ error: 'No updates provided' }, 400, env);

  updates.push("updated_at = datetime('now')");
  params.push(parseInt(id));

  await env.DB.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  return jsonResponse({ id: parseInt(id), status: 'updated' }, 200, env);
}

async function handleUCC(url: URL, env: Env): Promise<Response> {
  const state = url.searchParams.get('state');
  const competitor = url.searchParams.get('competitor');

  let query = 'SELECT u.*, c.name as company_name, c.city FROM ucc_filings u LEFT JOIN companies c ON u.company_id = c.id WHERE 1=1';
  const params: unknown[] = [];

  if (state) { query += ' AND u.state = ?'; params.push(state); }
  if (competitor === '1') { query += ' AND u.is_competitor = 1'; }

  query += ' ORDER BY u.filing_date DESC';

  const results = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(results.results || [], 200, env);
}

async function handleUCCUpload(body: any, env: Env): Promise<Response> {
  const filings = body.filings;
  if (!Array.isArray(filings) || filings.length === 0) {
    return jsonResponse({ error: 'filings array required' }, 400, env);
  }

  const competitorNames = [
    'mazak', 'dmg mori', 'okuma', 'doosan', 'dn solutions', 'makino',
    'matsuura', 'kitamura', 'toyoda', 'methods', 'ellison', 'hurco'
  ];

  let imported = 0;
  for (const f of filings) {
    if (!f.company_name || !f.state) continue;

    // Upsert company
    await env.DB.prepare(
      'INSERT OR IGNORE INTO companies (name, state, city, territory) VALUES (?, ?, ?, ?)'
    ).bind(f.company_name, f.state, f.city || '', assignTerritory(f.state, f.zip)).run();

    const company = await env.DB.prepare(
      'SELECT id FROM companies WHERE name = ? AND state = ?'
    ).bind(f.company_name, f.state).first<{id: number}>();

    if (!company) continue;

    const isCompetitor = competitorNames.some(cn =>
      (f.secured_party || '').toLowerCase().includes(cn)
    ) ? 1 : 0;

    await env.DB.prepare(
      'INSERT INTO ucc_filings (company_id, state, file_number, filing_date, lapse_date, secured_party, collateral_description, is_competitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(company.id, f.state, f.file_number || '', f.filing_date || '', f.lapse_date || '', f.secured_party || '', f.collateral_description || '', isCompetitor).run();

    // Also create a signal
    const heat = isCompetitor ? 'HOT' : 'WARM';
    await env.DB.prepare(
      "INSERT INTO signals (company_id, source, title, detail, heat, territory, refresh_cycle) VALUES (?, 'ucc', ?, ?, ?, ?, 'morning')"
    ).bind(
      company.id,
      'UCC Filing \u2014 ' + (f.secured_party || 'Unknown'),
      'Filed ' + (f.filing_date || 'unknown') + ' in ' + f.state + (f.collateral_description ? '. ' + f.collateral_description : ''),
      heat,
      assignTerritory(f.state, f.zip),
    ).run();

    imported++;
  }

  return jsonResponse({ imported, total: filings.length }, 201, env);
}

async function handleCompetitors(env: Env): Promise<Response> {
  const results = await env.DB.prepare('SELECT * FROM competitors ORDER BY id').all();
  return jsonResponse(results.results || [], 200, env);
}

async function handleRefreshLog(env: Env): Promise<Response> {
  const results = await env.DB.prepare(
    'SELECT * FROM refresh_log ORDER BY started_at DESC LIMIT 20'
  ).all();
  return jsonResponse(results.results || [], 200, env);
}

async function handleTriggerRefresh(source: string, env: Env): Promise<Response> {
  // Rate limit: 1 per source per hour
  const lastRefresh = await env.DB.prepare(
    "SELECT * FROM refresh_log WHERE source = ? AND started_at > datetime('now', '-1 hour') ORDER BY started_at DESC LIMIT 1"
  ).bind(source).first();

  if (lastRefresh) {
    return jsonResponse({ error: 'Rate limited. Try again later.' }, 429, env);
  }

  await env.DB.prepare(
    'INSERT INTO refresh_log (cycle, source, signals_found) VALUES (?, ?, ?)'
  ).bind('manual', source, 0).run();

  // TODO: Wire up actual collector dispatch
  return jsonResponse({ status: 'triggered', source }, 200, env);
}

// Territory assignment helper
function assignTerritory(state: string, zip?: string): number {
  const s = (state || '').toUpperCase().trim();
  if (s === 'OR' || s === 'OREGON') return 1;
  if (s === 'WA' || s === 'WASHINGTON') return 2;
  if (s === 'UT' || s === 'UTAH') return 5;
  if (s === 'NV' || s === 'NEVADA') return 6;
  if (s === 'CA' || s === 'CALIFORNIA') {
    if (zip) {
      const zipNum = parseInt(zip.substring(0, 5));
      if (zipNum >= 90000 && zipNum <= 93599) return 4; // SoCal
      return 3; // NorCal
    }
    return 3; // Default NorCal if no ZIP
  }
  return 0;
}
