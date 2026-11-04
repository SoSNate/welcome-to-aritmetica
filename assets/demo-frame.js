/**
 * demo-frame.js — the live demo inside a phone frame.
 *
 *   initDemoFrame({ screenId: 'demoScreen', playId: 'demoPlay', page: 'home' })
 *
 * - The demo loads only on tap, so the page stays light in in-app browsers.
 * - The app is laid out at a real phone viewport (390px wide) and scaled down
 *   to the frame, so it is responsive exactly as on a phone, never squeezed
 *   into 280px.
 * - ?embed=1 tells the app to drop its exit buttons and cookie banner.
 * - If the app still navigates the frame to this site, frame-guard.js in that
 *   page messages us and the demo restarts instead of nesting the site.
 * - Nothing here touches the app's code or data: the frame is the public /demo.
 */
(function () {
  var DEMO_URL = 'https://aritmetica.nt-school.app/demo?embed=1';
  var VIEW_W = 390;

  function track(name, page) { if (window.gtag) window.gtag('event', name, { page: page }); }

  window.initDemoFrame = function (opts) {
    var screen = document.getElementById(opts.screenId);
    var play = document.getElementById(opts.playId);
    if (!screen || !play) return;
    var url = opts.url || DEMO_URL, frame = null;

    function fit() {
      if (!frame) return;
      var scale = screen.clientWidth / VIEW_W;
      frame.style.width = VIEW_W + 'px';
      frame.style.height = (screen.clientHeight / scale) + 'px';
      frame.style.transform = 'scale(' + scale + ')';
    }

    play.addEventListener('click', function () {
      frame = document.createElement('iframe');
      frame.src = url;
      frame.title = 'משחק לדוגמה מחשבונאוטיקה';
      frame.allow = 'fullscreen';
      screen.replaceChildren(frame);
      fit();
      if (window.ResizeObserver) new ResizeObserver(fit).observe(screen);
      else window.addEventListener('resize', fit);
      track('demo_play_start', opts.page);
    });

    window.addEventListener('message', function (e) {
      if (e.origin !== window.location.origin || !e.data || e.data.type !== 'nt-landing-framed') return;
      if (!frame) return;
      frame.src = url;
      track('demo_restart', opts.page);
    });
  };
  /**
   * initDemoModal({ openIds: [...], page })
   * A partial-screen sheet with the demo at phone size, an X to close and a
   * link to the full-screen demo. The iframe is created on open and destroyed
   * on close, so nothing loads (or keeps running) until the visitor asks.
   */
  window.initDemoModal = function (opts) {
    var url = opts.url || DEMO_URL, overlay = null, frame = null, screen = null, lastFocus = null, ro = null;

    function css() {
      if (document.getElementById('demoModalCss')) return;
      var st = document.createElement('style'); st.id = 'demoModalCss';
      st.textContent =
        '.dm-ov{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(3,6,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);direction:rtl}' +
        '.dm-box{display:flex;flex-direction:column;width:min(400px,100%);height:min(88vh,780px);border-radius:28px;background:#070C20;box-shadow:0 0 0 2px rgba(138,180,255,.28),0 30px 80px rgba(0,0,0,.6);overflow:hidden}' +
        '.dm-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;color:#EAF0FA;font:700 14px/1 Heebo,system-ui,sans-serif}' +
        '.dm-bar a{color:#8AB4FF;font-weight:700;text-decoration:underline;font-size:13px}' +
        '.dm-x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;line-height:1;cursor:pointer}' +
        '.dm-x:hover,.dm-x:focus-visible{background:rgba(255,255,255,.2);outline:2px solid #8AB4FF}' +
        '.dm-screen{position:relative;flex:1;min-height:0;overflow:hidden;background:radial-gradient(circle at 30% 20%,#1E2A66 0%,#070C20 65%)}' +
        '.dm-screen iframe{position:absolute;top:0;left:0;border:0;transform-origin:top left}';
      document.head.appendChild(st);
    }

    function fit() {
      if (!frame || !screen) return;
      var scale = screen.clientWidth / VIEW_W;
      frame.style.width = VIEW_W + 'px';
      frame.style.height = (screen.clientHeight / scale) + 'px';
      frame.style.transform = 'scale(' + scale + ')';
    }

    function close() {
      if (!overlay) return;
      if (ro) { ro.disconnect(); ro = null; }
      overlay.remove(); overlay = null; frame = null; screen = null;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', fit);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      track('demo_modal_close', opts.page);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    function open() {
      if (overlay) return;
      css(); lastFocus = document.activeElement;
      overlay = document.createElement('div'); overlay.className = 'dm-ov';
      overlay.innerHTML =
        '<div class="dm-box" role="dialog" aria-modal="true" aria-label="משחק לדוגמה">' +
        '<div class="dm-bar"><button type="button" class="dm-x" aria-label="סגירה וחזרה לדף">&times;</button>' +
        '<a href="https://aritmetica.nt-school.app/demo" target="_blank" rel="noopener">פתיחה במסך מלא</a></div>' +
        '<div class="dm-screen"></div></div>';
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      screen = overlay.querySelector('.dm-screen');
      frame = document.createElement('iframe');
      frame.src = url; frame.title = 'משחק לדוגמה מחשבונאוטיקה'; frame.allow = 'fullscreen';
      screen.appendChild(frame); fit();
      if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(screen); } else window.addEventListener('resize', fit);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      overlay.querySelector('.dm-x').addEventListener('click', close);
      overlay.querySelector('.dm-x').focus();
      document.addEventListener('keydown', onKey);
      track('demo_play_start', opts.page);
    }

    window.addEventListener('message', function (e) {
      if (e.origin !== window.location.origin || !e.data || e.data.type !== 'nt-landing-framed') return;
      if (frame) { frame.src = url; track('demo_restart', opts.page); }
    });

    (opts.openIds || []).forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      el.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    document.querySelectorAll('[data-open-demo]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
  };
})();
