// Data Collectors — fetch fresh signals from public sources
// Priority: permits/expansions > defense > news > Oregon UCC

interface Signal {
  company_name: string;
  city: string;
  state: string;
  source: string;
  title: string;
  detail: string;
  heat: string;
  territory: number;
  source_url: string;
  published: string;
}

function assignTerritory(state: string): number {
  const s = (state || '').toUpperCase().trim();
  if (s === 'OR' || s === 'OREGON') return 1;
  if (s === 'WA' || s === 'WASHINGTON') return 2;
  if (s === 'UT' || s === 'UTAH') return 5;
  if (s === 'NV' || s === 'NEVADA') return 6;
  if (s === 'CA' || s === 'CALIFORNIA') return 4;
  return 0;
}

function parseRSS(xml: string): Array<{title: string, link: string, pubDate: string, source: string}> {
  const items: Array<{title: string, link: string, pubDate: string, source: string}> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const source = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
    if (title && link) {
      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        source: source.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      });
    }
  }
  return items;
}

export async function collectNews(): Promise<Signal[]> {
  const signals: Signal[] = [];
  const feeds = [
    { url: 'https://news.google.com/rss/search?q=manufacturing+facility+expansion+Oregon+Washington+California+Utah+Nevada&hl=en-US&gl=US&ceid=US:en', focus: 'permit' },
    { url: 'https://news.google.com/rss/search?q=defense+contract+manufacturing+machining+Oregon+Washington+California&hl=en-US&gl=US&ceid=US:en', focus: 'defense' },
    { url: 'https://news.google.com/rss/search?q=CNC+machine+tool+manufacturing+West+Coast&hl=en-US&gl=US&ceid=US:en', focus: 'news' },
    { url: 'https://news.google.com/rss/search?q=building+permit+industrial+manufacturing+Oregon+Washington+California&hl=en-US&gl=US&ceid=US:en', focus: 'permit' },
    { url: 'https://news.google.com/rss/search?q=aerospace+defense+manufacturing+expansion+Southern+California&hl=en-US&gl=US&ceid=US:en', focus: 'permit' },
  ];

  for (const feed of feeds) {
    try {
      const resp = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelwayBot/1.0)' }
      });
      if (!resp.ok) continue;
      const xml = await resp.text();
      const items = parseRSS(xml);
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const item of items.slice(0, 15)) {
        const pubDate = new Date(item.pubDate);
        if (pubDate < cutoff) continue;

        let state = '';
        let territory = 0;
        const tl = item.title.toLowerCase();
        if (tl.includes('oregon') || tl.includes('portland') || tl.includes('bend')) { state = 'OR'; territory = 1; }
        else if (tl.includes('washington') || tl.includes('seattle') || tl.includes('everett')) { state = 'WA'; territory = 2; }
        else if (tl.includes('california') || tl.includes('los angeles') || tl.includes('san diego')) { state = 'CA'; territory = 4; }
        else if (tl.includes('utah') || tl.includes('salt lake')) { state = 'UT'; territory = 5; }
        else if (tl.includes('nevada') || tl.includes('las vegas') || tl.includes('reno')) { state = 'NV'; territory = 6; }

        const heat = tl.includes('billion') || tl.includes('million') || tl.includes('expansion') || tl.includes('defense') ? 'HOT' : 'WARM';

        signals.push({
          company_name: item.source || 'News',
          city: '', state, source: feed.focus, title: item.title,
          detail: (item.source || 'Google News') + ' \u2014 ' + pubDate.toLocaleDateString('en-US'),
          heat, territory, source_url: item.link,
          published: pubDate.toISOString().split('T')[0],
        });
      }
    } catch (e) { console.error('RSS error:', e); }
  }
  return signals;
}

export async function collectOregonUCC(): Promise<Signal[]> {
  const signals: Signal[] = [];
  const competitors = ['mazak', 'dmg', 'mori', 'okuma', 'doosan', 'makino', 'matsuura', 'kitamura', 'toyoda', 'hurco'];

  try {
    const resp = await fetch(
      'https://data.oregon.gov/resource/snfi-f79b.json?$where=party_typ=%27SP%27&$limit=200&$order=filing_date%20DESC',
      { headers: { 'Accept': 'application/json' } }
    );
    if (!resp.ok) return signals;
    const data = await resp.json() as any[];

    for (const row of data) {
      const entity = (row.entity || '').toLowerCase();
      const isCompetitor = competitors.some(c => entity.includes(c));
      signals.push({
        company_name: row.entity || 'Unknown', city: row.city || '', state: 'OR',
        source: 'ucc', title: 'UCC Filing \u2014 ' + (row.entity || 'Unknown'),
        detail: 'File #' + (row.file_number || '') + ' Filed ' + (row.filing_date || '') + (isCompetitor ? ' \u2014 COMPETITOR' : ''),
        heat: isCompetitor ? 'HOT' : 'WARM', territory: 1,
        source_url: 'https://data.oregon.gov/resource/snfi-f79b.json',
        published: row.filing_date || '',
      });
    }
  } catch (e) { console.error('Oregon UCC error:', e); }
  return signals;
}

export async function runAllCollectors(): Promise<Signal[]> {
  const [news, ucc] = await Promise.all([collectNews(), collectOregonUCC()]);
  return [...news, ...ucc];
}
