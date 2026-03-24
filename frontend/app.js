// Selway Intelligence — App Router

(function() {
  const contentEl = document.getElementById('app-content');
  const navTabs = document.querySelectorAll('.nav-tab');
  const refreshBadge = document.getElementById('refresh-badge');

  // Source icons
  const SOURCE_ICONS = {
    ucc: { icon: '\u{1F4CB}', bg: 'var(--ucc-bg)' },
    job: { icon: '\u{1F4BC}', bg: 'var(--job-bg)' },
    defense: { icon: '\u{1F6E1}\uFE0F', bg: 'var(--defense-bg)' },
    news: { icon: '\u{1F4F0}', bg: 'var(--news-bg)' },
    permit: { icon: '\u{1F3D7}\uFE0F', bg: 'var(--permit-bg)' },
    marketplace: { icon: '\u{1F527}', bg: 'var(--marketplace-bg)' },
  };

  // Territory names
  const TERRITORIES = {
    1: 'Territory 1 \u2014 OR',
    2: 'Territory 2 \u2014 WA',
    3: 'Territory 3 \u2014 N.CA',
    4: 'Territory 4 \u2014 S.CA',
    5: 'Territory 5 \u2014 UT',
    6: 'Territory 6 \u2014 NV',
  };

  // Relative time helper
  function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return date.toLocaleDateString();
  }

  // Get current date string
  function getDateString() {
    const d = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  // Get cycle name
  function getCycleName() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  // Safe DOM helper — creates elements without innerHTML for untrusted data
  function el(tag, attrs, children) {
    const element = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([key, val]) => {
        if (key === 'className') element.className = val;
        else if (key === 'textContent') element.textContent = val;
        else if (key.startsWith('on')) element.addEventListener(key.slice(2).toLowerCase(), val);
        else if (key === 'style' && typeof val === 'object') Object.assign(element.style, val);
        else element.setAttribute(key, val);
      });
    }
    if (children) {
      if (typeof children === 'string') element.textContent = children;
      else if (Array.isArray(children)) children.forEach(c => { if (c) element.appendChild(c); });
      else element.appendChild(children);
    }
    return element;
  }

  // Trusted HTML render — only used for content we fully control (no user input)
  // All dynamic data (company names, signal details, etc.) uses textContent via el()
  function setTrustedHTML(element, html) {
    element.textContent = '';
    const template = document.createElement('template');
    template.innerHTML = html;
    element.appendChild(template.content);
  }

  // Update refresh badge
  async function updateRefreshBadge() {
    try {
      const logs = await getRefreshLog();
      if (logs && logs.length > 0) {
        const last = logs[0];
        const time = new Date(last.completed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
        refreshBadge.querySelector('span').textContent = 'Last refresh: ' + time;
      } else {
        refreshBadge.querySelector('span').textContent = getCycleName() + ' cycle';
      }
    } catch {
      refreshBadge.querySelector('span').textContent = 'Offline mode';
    }
  }

  // Expose helpers globally for components
  window.APP = {
    SOURCE_ICONS,
    TERRITORIES,
    timeAgo,
    getDateString,
    getCycleName,
    el,
    setTrustedHTML,
    contentEl,
  };

  // Tab routing
  function getActiveTab() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    return hash;
  }

  function setActiveNav(tab) {
    navTabs.forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
  }

  // Show loading state
  function showLoading(container) {
    container.textContent = '';
    const wrap = el('div', { className: 'loading' }, [
      el('div', { className: 'loading-spinner' }),
      el('span', {}, 'Loading...'),
    ]);
    container.appendChild(wrap);
  }

  // Show error state
  function showError(container, message) {
    container.textContent = '';
    const wrap = el('div', { className: 'empty-state' }, [
      el('h3', {}, 'Connection Error'),
      el('p', {}, message),
      el('button', { className: 'btn btn-primary', style: { marginTop: '16px' }, onClick: function() { location.reload(); } }, 'Retry'),
    ]);
    container.appendChild(wrap);
  }

  async function renderTab(tab) {
    setActiveNav(tab);
    showLoading(contentEl);

    try {
      switch (tab) {
        case 'dashboard':
          await renderDashboard(contentEl);
          break;
        case 'ucc':
          await renderUCCScanner(contentEl);
          break;
        case 'pipeline':
          await renderPipeline(contentEl);
          break;
        case 'signals':
          await renderSignalsTab(contentEl);
          break;
        case 'competitors':
          await renderCompetitorsTab(contentEl);
          break;
        default:
          container.textContent = '';
          container.appendChild(el('div', { className: 'empty-state' }, [el('h3', {}, 'Page not found')]));
      }
    } catch (err) {
      showError(contentEl, err.message);
    }
  }

  // Handle navigation
  window.addEventListener('hashchange', function() { renderTab(getActiveTab()); });

  // Initialize
  updateRefreshBadge();
  renderTab(getActiveTab());
})();
