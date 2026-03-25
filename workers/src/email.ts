// Email Digest — sends HTML summary of new signals via Resend

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

const TERRITORY_NAMES: Record<number, string> = {
  1: 'Oregon', 2: 'Washington', 3: 'NorCal', 4: 'SoCal', 5: 'Utah', 6: 'Nevada'
};

const SOURCE_LABELS: Record<string, string> = {
  permit: 'Facility Expansion', defense: 'Defense Contract', news: 'Industry News', ucc: 'UCC Filing', job: 'Job Posting'
};

function signalRow(s: Signal): string {
  const heatColor = s.heat === 'HOT' ? '#dc2626' : s.heat === 'WARM' ? '#d97706' : '#6b7280';
  const territory = TERRITORY_NAMES[s.territory] || '';
  const sourceLabel = SOURCE_LABELS[s.source] || s.source;
  return '<tr style="border-bottom:1px solid #f1f5f9;">' +
    '<td style="padding:10px 12px;font-size:13px;font-weight:600;color:#1a1a2e;">' + s.title + '</td>' +
    '<td style="padding:10px 8px;font-size:12px;color:#475569;">' + s.company_name + (s.city ? ', ' + s.city : '') + (s.state ? ' ' + s.state : '') + '</td>' +
    '<td style="padding:10px 8px;"><span style="background:' + heatColor + '20;color:' + heatColor + ';font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;">' + s.heat + '</span></td>' +
    '<td style="padding:10px 8px;font-size:11px;color:#008C9A;font-weight:500;">' + sourceLabel + '</td>' +
    '<td style="padding:10px 8px;font-size:11px;color:#6b7280;">' + territory + '</td>' +
    (s.source_url ? '<td style="padding:10px 8px;"><a href="' + s.source_url + '" style="color:#008C9A;font-size:11px;text-decoration:none;">View &rarr;</a></td>' : '<td></td>') +
    '</tr>';
}

export function buildDigestHTML(signals: Signal[], cycle: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const cycleName = cycle === 'morning' ? 'Morning' : cycle === 'noon' ? 'Midday' : 'Afternoon';

  const hotSignals = signals.filter(s => s.heat === 'HOT');
  const permits = signals.filter(s => s.source === 'permit');
  const defense = signals.filter(s => s.source === 'defense');
  const news = signals.filter(s => s.source === 'news');
  const ucc = signals.filter(s => s.source === 'ucc');

  let html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Inter,-apple-system,sans-serif;background:#f1f5f9;margin:0;padding:20px;">';

  // Header
  html += '<div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">';
  html += '<div style="background:linear-gradient(135deg,#008C9A,#00b4d8);padding:24px 28px;">';
  html += '<h1 style="margin:0;color:white;font-size:20px;font-weight:700;">Selway Market Data</h1>';
  html += '<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">' + cycleName + ' Refresh &mdash; ' + dateStr + '</p>';
  html += '</div>';

  // Summary bar
  html += '<div style="display:flex;padding:16px 28px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">';
  html += '<div style="flex:1;text-align:center;"><div style="font-size:24px;font-weight:700;color:#1a1a2e;">' + signals.length + '</div><div style="font-size:10px;color:#6b7280;text-transform:uppercase;">New Signals</div></div>';
  html += '<div style="flex:1;text-align:center;"><div style="font-size:24px;font-weight:700;color:#dc2626;">' + hotSignals.length + '</div><div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Hot Leads</div></div>';
  html += '<div style="flex:1;text-align:center;"><div style="font-size:24px;font-weight:700;color:#008C9A;">' + permits.length + '</div><div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Permits</div></div>';
  html += '<div style="flex:1;text-align:center;"><div style="font-size:24px;font-weight:700;color:#2563eb;">' + defense.length + '</div><div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Defense</div></div>';
  html += '</div>';

  // HOT signals section
  if (hotSignals.length > 0) {
    html += '<div style="padding:20px 28px 8px;"><h2 style="margin:0 0 12px;font-size:15px;color:#dc2626;font-weight:600;">&#128293; Hot Signals</h2>';
    html += '<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid #e2e8f0;">';
    html += '<th style="text-align:left;padding:8px 12px;font-size:10px;color:#6b7280;text-transform:uppercase;">Signal</th>';
    html += '<th style="text-align:left;padding:8px;font-size:10px;color:#6b7280;text-transform:uppercase;">Company</th>';
    html += '<th style="padding:8px;font-size:10px;color:#6b7280;text-transform:uppercase;">Heat</th>';
    html += '<th style="padding:8px;font-size:10px;color:#6b7280;text-transform:uppercase;">Type</th>';
    html += '<th style="padding:8px;font-size:10px;color:#6b7280;text-transform:uppercase;">Territory</th>';
    html += '<th style="padding:8px;font-size:10px;color:#6b7280;text-transform:uppercase;">Link</th>';
    html += '</tr></thead><tbody>';
    for (const s of hotSignals) { html += signalRow(s); }
    html += '</tbody></table></div>';
  }

  // Permits section
  if (permits.length > 0) {
    html += '<div style="padding:16px 28px 8px;"><h2 style="margin:0 0 12px;font-size:15px;color:#059669;font-weight:600;">&#127959; Facility Expansions &amp; Permits</h2>';
    html += '<table style="width:100%;border-collapse:collapse;"><tbody>';
    for (const s of permits) { html += signalRow(s); }
    html += '</tbody></table></div>';
  }

  // Defense section
  if (defense.length > 0) {
    html += '<div style="padding:16px 28px 8px;"><h2 style="margin:0 0 12px;font-size:15px;color:#2563eb;font-weight:600;">&#128737; Defense Contracts</h2>';
    html += '<table style="width:100%;border-collapse:collapse;"><tbody>';
    for (const s of defense) { html += signalRow(s); }
    html += '</tbody></table></div>';
  }

  // News section
  if (news.length > 0) {
    html += '<div style="padding:16px 28px 8px;"><h2 style="margin:0 0 12px;font-size:15px;color:#7c3aed;font-weight:600;">&#128240; Industry News</h2>';
    html += '<table style="width:100%;border-collapse:collapse;"><tbody>';
    for (const s of news) { html += signalRow(s); }
    html += '</tbody></table></div>';
  }

  // UCC section
  if (ucc.length > 0) {
    html += '<div style="padding:16px 28px 8px;"><h2 style="margin:0 0 12px;font-size:15px;color:#a16207;font-weight:600;">&#128203; UCC Filings</h2>';
    html += '<table style="width:100%;border-collapse:collapse;"><tbody>';
    for (const s of ucc) { html += signalRow(s); }
    html += '</tbody></table></div>';
  }

  // Footer
  html += '<div style="padding:20px 28px;border-top:1px solid #e2e8f0;text-align:center;">';
  html += '<a href="https://jonnymadden21.github.io/selway-intelligence/" style="display:inline-block;background:#008C9A;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Open Full Dashboard</a>';
  html += '<p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">Selway Market Data &mdash; Automated refresh at 6am, 12pm, 5pm Pacific</p>';
  html += '</div></div></body></html>';

  return html;
}

export async function sendDigest(signals: Signal[], cycle: string, resendKey: string, to: string): Promise<boolean> {
  if (!resendKey) { console.error('No Resend API key'); return false; }

  const html = buildDigestHTML(signals, cycle);

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + resendKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Selway Market Data <onboarding@resend.dev>',
        to: [to],
        subject: 'Selway Market Data \u2014 ' + signals.length + ' new signals found',
        html: html,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend error:', err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Email send error:', e);
    return false;
  }
}
