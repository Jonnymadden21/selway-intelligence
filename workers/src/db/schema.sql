CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  territory INTEGER CHECK(territory BETWEEN 0 AND 6),
  is_customer INTEGER DEFAULT 0,
  first_seen TEXT DEFAULT (datetime('now')),
  signal_count INTEGER DEFAULT 0,
  heat_score TEXT DEFAULT 'COOL'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_state ON companies(name, state);

CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id),
  source TEXT NOT NULL CHECK(source IN ('ucc','job','defense','news','permit','marketplace')),
  title TEXT NOT NULL,
  detail TEXT,
  url TEXT,
  heat TEXT DEFAULT 'COOL' CHECK(heat IN ('HOT','WARM','COOL')),
  territory INTEGER,
  discovered_at TEXT DEFAULT (datetime('now')),
  refresh_cycle TEXT CHECK(refresh_cycle IN ('morning','noon','afternoon')),
  is_new INTEGER DEFAULT 1,
  source_url TEXT,
  published TEXT
);

CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source);
CREATE INDEX IF NOT EXISTS idx_signals_territory ON signals(territory);
CREATE INDEX IF NOT EXISTS idx_signals_heat ON signals(heat);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id),
  status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','engaged','quoted','won','lost')),
  assigned_rep TEXT,
  score INTEGER DEFAULT 0,
  notes TEXT,
  recommendation TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lead_signals (
  lead_id INTEGER REFERENCES leads(id),
  signal_id INTEGER REFERENCES signals(id),
  PRIMARY KEY (lead_id, signal_id)
);

CREATE TABLE IF NOT EXISTS ucc_filings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id),
  state TEXT NOT NULL,
  file_number TEXT,
  filing_date TEXT,
  lapse_date TEXT,
  secured_party TEXT,
  collateral_description TEXT,
  is_competitor INTEGER DEFAULT 0,
  brand TEXT,
  model TEXT,
  equipment_year TEXT,
  condition TEXT
);

CREATE TABLE IF NOT EXISTS competitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  headquarters TEXT,
  sales_model TEXT,
  strengths TEXT,
  weaknesses TEXT,
  displacement_strategy TEXT,
  lender_names TEXT
);

CREATE TABLE IF NOT EXISTS refresh_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle TEXT CHECK(cycle IN ('morning','noon','afternoon','manual')),
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  source TEXT,
  signals_found INTEGER DEFAULT 0,
  errors TEXT
);
