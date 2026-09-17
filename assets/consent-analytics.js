/**
 * Cookie consent banner + consent-gated Google Analytics for the welcome site.
 *
 * Measurement ID G-4X19P4M4PX is the "ברוכים הבאים" stream. The app
 * (aritmetica.nt-school.app) has its own, G-31VT26HS6Y. Both hosts are listed
 * as linker domains so a visitor who clicks through to the app keeps their
 * session instead of arriving as a brand-new referral.
 *
 * Nothing loads until the visitor accepts. Every gtag() call elsewhere on the
 * site is guarded on window.gtag, so declining simply means nothing fires.
 */
(function () {
  var GA_ID = 'G-4X19P4M4PX';
  var KEY = 'cookie_consent_v1';
  var LINKER = [
    'welcome-to-hesbonautika.nt-school.app',
    'aritmetica.nt-school.app',
    'nt-school.app'
  ];

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function loadGA() {
    if (document.getElementById('ga4-tag')) return;
    var s = document.createElement('script');
    s.id = 'ga4-tag';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      send_page_view: true,
      linker: { domains: LINKER }
    });
  }

  function decide(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
    if (value === 'granted') loadGA();
    var el = document.getElementById('cookie-consent-bar');
    if (el) el.remove();
  }

  function renderBanner() {
    var bar = document.createElement('div');
    bar.id = 'cookie-consent-bar';
    bar.setAttribute('dir', 'rtl');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'הודעה על שימוש בעוגיות');
    bar.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px;';
    bar.innerHTML =
      '<div style="max-width:820px;margin:0 auto;background:rgba(6,10,26,0.97);' +
      'border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:16px;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:12px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.5);">' +
      '<p style="flex:1 1 260px;margin:0;font-size:14px;line-height:1.6;color:#e2e8f0;">' +
      'אנחנו משתמשים בעוגיות חיוניות להפעלת האתר, ובעוגיות של Google Analytics כדי להבין ' +
      'איך משתמשים באתר ולשפר אותו. אפשר להמשיך גם בלי עוגיות הסטטיסטיקה. ' +
      '<a href="https://aritmetica.nt-school.app/privacy" target="_blank" rel="noopener" ' +
      'style="color:#8AB4FF;text-decoration:underline;font-weight:700;">מדיניות הפרטיות</a>' +
      '</p>' +
      '<div style="display:flex;gap:8px;flex:0 0 auto;">' +
      '<button type="button" id="cc-deny" style="padding:10px 16px;border-radius:12px;' +
      'border:1px solid rgba(255,255,255,0.25);background:transparent;color:#e2e8f0;' +
      'font-weight:700;font-size:14px;cursor:pointer;">רק עוגיות הכרחיות</button>' +
      '<button type="button" id="cc-allow" style="padding:10px 20px;border-radius:12px;' +
      'border:none;background:#4f46e5;color:#fff;font-weight:800;font-size:14px;' +
      'cursor:pointer;">אישור</button>' +
      '</div></div>';
    document.body.appendChild(bar);
    document.getElementById('cc-allow').addEventListener('click', function () { decide('granted'); });
    document.getElementById('cc-deny').addEventListener('click', function () { decide('denied'); });
  }

  /**
   * Every link into the app is a funnel exit worth counting. Delegated rather
   * than wired per-link, so new CTAs are covered without touching each page.
   */
  function trackAppLinks() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || !window.gtag) return;
      if (a.href.indexOf('aritmetica.nt-school.app') === -1) return;
      window.gtag('event', 'cta_to_app', {
        page: document.title,
        target: a.getAttribute('href')
      });
    });
  }

  function init() {
    trackAppLinks();
    var consent = getConsent();
    if (consent === 'granted') { loadGA(); return; }
    if (consent === 'denied') return;
    renderBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
