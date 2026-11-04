/**
 * frame-guard.js — load first in <head> of every page.
 *
 * This site is never meant to be shown inside a frame. The one real case: the
 * demo app's exit button navigates its own window to this site, which would
 * put the whole site inside the phone frame that is showing the demo.
 *
 * When framed we hide the page, stop loading it (no analytics, no banners) and
 * tell the parent. The parent is the same site, so the message is delivered
 * and the demo restarts. Framed by some other origin, the message goes nowhere
 * and the page stays blank, so nobody else can embed this site either.
 */
(function () {
  try { if (window.self === window.top) return; } catch (e) { /* cross-origin: treat as framed */ }
  document.documentElement.style.visibility = 'hidden';
  try { window.parent.postMessage({ type: 'nt-landing-framed' }, window.location.origin); } catch (e) { /* opaque origin */ }
  try { window.stop(); } catch (e) { /* not supported */ }
})();
