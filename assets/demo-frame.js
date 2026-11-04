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
})();
