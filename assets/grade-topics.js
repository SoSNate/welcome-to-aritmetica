/**
 * grade-topics.js — "בדיוק מה שלומדים בכיתה שלו" section.
 *
 * Grade chips switch a set of topic tiles. Every tile is a small animated
 * scene drawn in SVG/HTML in the visual language of the game that teaches the
 * topic: a fraction pie that simplifies itself, a point that hops across zero,
 * a grid that grows and splits, a balance that solves an equation...
 *
 * One requestAnimationFrame loop drives all tiles and only runs while the
 * section is on screen. Under prefers-reduced-motion each tile shows one
 * meaningful still frame instead.
 *
 * Usage: <div id="gradeTopics"></div> + .grade-chips buttons with data-g,
 * then initGradeTopics('gradeTopics', 5).
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = { teal: '#5EEAD4', blue: '#8AB4FF', violet: '#9D8BFF', flame: '#FF6B4A', gold: '#FBBF24', dim: 'rgba(255,255,255,.10)', ink: '#EAF0FA' };
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── helpers ────────────────────────────────────────────────────────────────
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svg(viz) { var s = el('svg', { viewBox: '0 0 100 70', 'aria-hidden': 'true' }); viz.appendChild(s); return s; }
  function label(viz) { var d = document.createElement('div'); d.className = 'viz-label'; viz.appendChild(d); return d; }
  function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function fr(n, d) { return '<span class="fr"><span>' + n + '</span><span>' + d + '</span></span>'; }
  function num(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace(/\.0$/, ''); }
  function pop(node) { node.classList.remove('pop'); void node.offsetWidth; node.classList.add('pop'); }
  // Cycles through `count` states: each one holds, then transitions to the next.
  function phase(t, count, hold, trans) {
    var per = hold + trans, k = Math.floor(t / per) % count, local = t % per;
    return { i: k, next: (k + 1) % count, p: local < hold ? 0 : ease((local - hold) / trans) };
  }

  // ── scenes ─────────────────────────────────────────────────────────────────

  // Fraction pie. The filled wedge animates continuously; denominator lines
  // fade between states. 3/6 → 1/2 keeps the same wedge and drops the extra
  // lines, so the child literally sees why they are equal.
  function fraction(seq) {
    return function (viz) {
      var s = svg(viz), lab = label(viz), cx = 50, cy = 34, r = 29;
      lab.dir = 'ltr';
      el('circle', { cx: cx, cy: cy, r: r, fill: C.dim }, s);
      var wedge = el('path', { fill: C.teal }, s);
      var groups = seq.map(function (st) {
        var g = el('g', { stroke: '#070C20', 'stroke-width': 1.6 }, s);
        for (var k = 0; k < st[1]; k++) {
          var a = k / st[1] * 2 * Math.PI - Math.PI / 2;
          el('line', { x1: cx, y1: cy, x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a) }, g);
        }
        return g;
      });
      el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: C.ink, 'stroke-opacity': .35, 'stroke-width': 1 }, s);
      var shown = -1;
      function setWedge(f) {
        if (f >= .999) { wedge.setAttribute('d', 'M' + cx + ' ' + (cy - r) + 'A' + r + ' ' + r + ' 0 1 1 ' + (cx - .01) + ' ' + (cy - r) + 'Z'); return; }
        var a = f * 2 * Math.PI - Math.PI / 2;
        wedge.setAttribute('d', 'M' + cx + ' ' + cy + 'L' + cx + ' ' + (cy - r) + 'A' + r + ' ' + r + ' 0 ' + (f > .5 ? 1 : 0) + ' 1 ' + (cx + r * Math.cos(a)) + ' ' + (cy + r * Math.sin(a)) + 'Z');
      }
      return { update: function (t) {
        var ph = phase(t, seq.length, 2.2, 1), a = seq[ph.i], b = seq[ph.next];
        setWedge(lerp(a[0] / a[1], b[0] / b[1], ph.p));
        groups.forEach(function (g, k) { g.setAttribute('opacity', k === ph.i ? 1 - ph.p : k === ph.next ? ph.p : 0); });
        var cur = ph.p > .5 ? ph.next : ph.i;
        if (cur !== shown) {
          var prev = seq[(cur - 1 + seq.length) % seq.length], st = seq[cur];
          var same = shown !== -1 && prev[0] * st[1] === st[0] * prev[1];
          lab.innerHTML = same ? fr(prev[0], prev[1]) + '<span class="eq">=</span>' + fr(st[0], st[1]) : fr(st[0], st[1]);
          if (shown !== -1) pop(lab);
          shown = cur;
        }
      } };
    };
  }

  // Number line from −1 to 1. The red point slides, hops over zero into the
  // negatives and back, then wiggles. The value above it is always live.
  function numberLine(start) {
    var path = [
      { to: 0, dur: 1.2, type: 'slide' }, { to: -0.4, dur: .8, type: 'hop' }, { to: -0.4, dur: .5, type: 'hold' },
      { to: 0, dur: .8, type: 'hop' }, { to: start, dur: 1.2, type: 'slide' }, { to: start, dur: 1.1, type: 'wiggle' }, { to: start, dur: .5, type: 'hold' }
    ];
    var total = path.reduce(function (s, p) { return s + p.dur; }, 0);
    return function (viz) {
      var s = svg(viz), lab = label(viz), y = 44;
      function X(v) { return 50 + v * 42; }
      el('line', { x1: 6, y1: y, x2: 94, y2: y, stroke: C.ink, 'stroke-width': 1.4 }, s);
      for (var k = -10; k <= 10; k++) {
        var big = k % 5 === 0;
        el('line', { x1: X(k / 10), y1: y - (big ? 5 : 3), x2: X(k / 10), y2: y + (big ? 5 : 3), stroke: C.ink, 'stroke-width': big ? 1.4 : .8, 'stroke-opacity': big ? 1 : .6 }, s);
      }
      [[-1, '−1'], [0, '0'], [1, '1']].forEach(function (m) { el('text', { x: X(m[0]), y: y + 15, 'text-anchor': 'middle', fill: C.ink, 'font-size': 7 }, s).textContent = m[1]; });
      var neg = el('rect', { x: X(-1), y: y - 1.2, width: 42, height: 2.4, fill: C.blue, opacity: 0 }, s);
      var dot = el('circle', { r: 4.2, fill: C.flame }, s);
      var val = el('text', { 'text-anchor': 'middle', fill: C.flame, 'font-size': 9, 'font-weight': 700, direction: 'ltr' }, s);
      lab.innerHTML = 'איפה הנקודה?';
      return { update: function (t) {
        t = t % total;
        var v = start, lift = 0, squash = 1, from = start;
        for (var i = 0; i < path.length; i++) {
          var seg = path[i];
          if (t <= seg.dur) {
            var p = t / seg.dur;
            if (seg.type === 'slide') v = lerp(from, seg.to, ease(p));
            else if (seg.type === 'hop') { v = lerp(from, seg.to, p); lift = Math.sin(Math.PI * p) * 18; squash = p > .9 ? 1 - (1 - p) * 3 : 1; }
            else if (seg.type === 'wiggle') v = seg.to + Math.sin(p * Math.PI * 6) * .06 * (1 - p);
            else v = seg.to;
            break;
          }
          t -= seg.dur; from = seg.to;
        }
        dot.setAttribute('cx', X(v)); dot.setAttribute('cy', y - lift);
        dot.setAttribute('r', 4.2 * (squash < 1 ? 1.15 : 1));
        val.setAttribute('x', X(v)); val.setAttribute('y', y - lift - 8);
        val.textContent = num(Math.round(v * 10) / 10);
        neg.setAttribute('opacity', v < -0.01 ? .45 : 0);
      } };
    };
  }

  // Area grid. Rectangles grow, shrink and split into coloured parts; the
  // equation under the grid follows every change.
  function areaGrid(states) {
    return function (viz) {
      var s = svg(viz), lab = label(viz), u = 6.2, maxW = 10, maxH = 7, cells = [];
      var g = el('g', {}, s);
      g.style.transition = 'transform .7s cubic-bezier(.34,1.56,.64,1)';
      for (var i = 0; i < maxH; i++) for (var j = 0; j < maxW; j++) {
        var c = el('rect', { x: j * u, y: i * u, width: u - .8, height: u - .8, rx: 1, fill: C.teal }, g);
        c.style.transition = 'opacity .35s, fill .35s'; c.style.opacity = 0;
        cells.push({ e: c, i: i, j: j });
      }
      var shown = -1, colors = [C.teal, C.violet, C.gold];
      function apply(k) {
        var parts = states[k], W = parts.reduce(function (s, p) { return s + p[0]; }, 0), H = Math.max.apply(null, parts.map(function (p) { return p[1]; }));
        cells.forEach(function (c) {
          var x = 0, part = -1;
          for (var q = 0; q < parts.length; q++) { if (c.j >= x && c.j < x + parts[q][0] && c.i < parts[q][1]) part = q; x += parts[q][0]; }
          c.e.style.transitionDelay = ((c.i + c.j) * 0.025) + 's';
          if (part >= 0) { c.e.style.opacity = 1; c.e.setAttribute('fill', colors[part]); } else c.e.style.opacity = 0;
        });
        g.style.transform = 'translate(' + (50 - W * u / 2) + 'px,' + (32 - H * u / 2) + 'px)';
        var total = parts.reduce(function (s, p) { return s + p[0] * p[1]; }, 0);
        lab.innerHTML = '<span dir="ltr">' + parts.map(function (p, q) { return '<b style="color:' + colors[q] + '">' + p[0] + ' × ' + p[1] + '</b>'; }).join(' + ') + ' = ' + total + '</span>';
        pop(lab);
      }
      return { update: function (t) { var k = Math.floor(t / 2.4) % states.length; if (k !== shown) { apply(k); shown = k; } } };
    };
  }

  // Multiplication array: rows and columns of dots that regroup.
  function dotArray(states) {
    return function (viz) {
      var s = svg(viz), lab = label(viz), u = 8.5, n = 7, dots = [];
      var g = el('g', {}, s);
      g.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)';
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var d = el('circle', { cx: j * u + u / 2, cy: i * u + u / 2, r: u * .32, fill: C.blue }, g);
        d.style.transition = 'opacity .3s, r .3s'; d.style.opacity = 0;
        dots.push({ e: d, i: i, j: j });
      }
      var shown = -1;
      return { update: function (t) {
        var k = Math.floor(t / 2.2) % states.length;
        if (k === shown) return;
        shown = k;
        var rws = states[k][0], cls = states[k][1];
        dots.forEach(function (d) { var on = d.i < rws && d.j < cls; d.e.style.transitionDelay = (d.i * .05 + d.j * .03) + 's'; d.e.style.opacity = on ? 1 : 0; });
        g.style.transform = 'translate(' + (50 - cls * u / 2) + 'px,' + (32 - rws * u / 2) + 'px)';
        lab.innerHTML = '<span dir="ltr">' + rws + ' × ' + cls + ' = <b style="color:' + C.blue + '">' + rws * cls + '</b></span>';
        pop(lab);
      } };
    };
  }

  // Tank that fills and drains with a moving wave. Label is a percent or
  // "fraction of a quantity".
  function tank(states, mode) {
    return function (viz) {
      var s = svg(viz), lab = label(viz), x0 = 34, w = 32, top = 6, h = 52;
      var clip = 'tk' + Math.random().toString(36).slice(2, 7);
      var cp = el('clipPath', { id: clip }, el('defs', {}, s));
      el('rect', { x: x0, y: top, width: w, height: h, rx: 5 }, cp);
      var water = el('path', { fill: C.blue, 'fill-opacity': .85, 'clip-path': 'url(#' + clip + ')' }, s);
      el('rect', { x: x0, y: top, width: w, height: h, rx: 5, fill: 'none', stroke: C.ink, 'stroke-width': 1.4 }, s);
      for (var k = 1; k < 4; k++) el('line', { x1: x0 + w - 5, y1: top + h * k / 4, x2: x0 + w, y2: top + h * k / 4, stroke: C.ink, 'stroke-opacity': .5 }, s);
      var shown = -1;
      function value(st) { return mode === 'frac' ? st[0] / st[1] : st / 100; }
      return { update: function (t) {
        var ph = phase(t, states.length, 1.8, 1.1), f = lerp(value(states[ph.i]), value(states[ph.next]), ph.p);
        var lvl = top + h * (1 - f), d = 'M' + x0 + ' ' + (top + h);
        for (var x = 0; x <= w; x += 2) d += 'L' + (x0 + x) + ' ' + (lvl + Math.sin(x / 5 + t * 4) * 1.4);
        water.setAttribute('d', d + 'L' + (x0 + w) + ' ' + (top + h) + 'Z');
        var cur = ph.p > .5 ? ph.next : ph.i;
        if (mode === 'frac') {
          if (cur !== shown) { var st = states[cur]; lab.innerHTML = fr(st[0], st[1]) + '<span class="eq">מ-' + st[2] + ' =</span><b style="color:' + C.blue + '">' + st[0] * st[2] / st[1] + '</b>'; pop(lab); shown = cur; }
        } else lab.innerHTML = '<b style="color:' + C.blue + '">' + Math.round(f * 100) + '%</b>';
      } };
    };
  }

  // Balance that solves an equation step by step. The beam tips while one
  // side changes, then levels out again.
  function balance(steps) {
    return function (viz) {
      var s = svg(viz), lab = label(viz);
      el('line', { x1: 50, y1: 16, x2: 50, y2: 62, stroke: C.ink, 'stroke-width': 2 }, s);
      el('path', { d: 'M40 66 H60 L50 58Z', fill: C.ink }, s);
      var beam = el('g', {}, s);
      el('line', { x1: 12, y1: 18, x2: 88, y2: 18, stroke: C.violet, 'stroke-width': 3, 'stroke-linecap': 'round' }, beam);
      function pan(x) {
        el('line', { x1: x, y1: 18, x2: x, y2: 26, stroke: C.violet, 'stroke-width': 1 }, beam);
        el('rect', { x: x - 17, y: 26, width: 34, height: 16, rx: 4, fill: C.dim, stroke: C.violet }, beam);
        return el('text', { x: x, y: 37, 'text-anchor': 'middle', fill: C.ink, 'font-size': 8.5, 'font-weight': 700, direction: 'ltr' }, beam);
      }
      var L = pan(22), R = pan(78), shown = -1;
      return { update: function (t) {
        var ph = phase(t, steps.length, 2, 1.1), cur = ph.p > .5 ? ph.next : ph.i;
        var tilt = Math.sin(Math.PI * ph.p) * 9 * (ph.i % 2 ? -1 : 1);
        beam.setAttribute('transform', 'rotate(' + tilt + ' 50 18)');
        if (cur !== shown) {
          L.textContent = steps[cur][0]; R.textContent = steps[cur][1];
          lab.innerHTML = steps[cur][2]; pop(lab); shown = cur;
        }
      } };
    };
  }

  // Expression that evaluates itself, one highlighted step at a time.
  function expression(steps) {
    return function (viz) {
      var box = document.createElement('div'); box.className = 'viz-expr'; box.dir = 'ltr'; viz.appendChild(box);
      var lab = label(viz), shown = -1;
      return { update: function (t) {
        var k = Math.floor(t / 1.7) % (steps.length + 1);
        if (k === shown) return;
        shown = k;
        var st = steps[Math.min(k, steps.length - 1)];
        box.innerHTML = st; pop(box);
        lab.textContent = k >= steps.length - 1 ? 'פתרנו!' : 'צעד ' + (k + 1);
      } };
    };
  }

  // Word problem whose numbers keep rolling to new values, and the answer
  // follows them.
  function wordProblem(make) {
    return function (viz) {
      var box = document.createElement('div'); box.className = 'viz-word'; viz.appendChild(box);
      var lab = label(viz), shown = -1, rolling = null, q = null;
      function render(vals, ans) { box.innerHTML = '<p>' + q.text.replace(/\{(\d)\}/g, function (_, i) { return '<b class="rn">' + vals[i] + '</b>'; }) + '</p>'; lab.innerHTML = 'תשובה: <b style="color:' + C.teal + '">' + ans + '</b>'; }
      return { update: function (t) {
        var k = Math.floor(t / 3);
        if (k !== shown) {
          shown = k; q = make(); var start = performance.now();
          clearInterval(rolling);
          if (REDUCED) { render(q.vals, q.ans); return; }
          rolling = setInterval(function () {
            if (performance.now() - start > 650) { clearInterval(rolling); render(q.vals, q.ans); pop(lab); return; }
            render(q.vals.map(function (v) { return Math.max(1, Math.round(v * (0.5 + Math.random()))); }), '?');
          }, 70);
        }
      } };
    };
  }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var words = {
    oneStep: function () { var a = rnd(3, 9), b = rnd(3, 9); return { text: 'לנועה {0} שקיות, ובכל אחת {1} סוכריות. כמה סוכריות יש לה?', vals: [a, b], ans: a * b }; },
    change: function () { var a = rnd(2, 6), b = rnd(4, 12), c = Math.ceil(a * b / 50) * 50 + 50; return { text: 'דני קנה {0} מחברות ב-{1} ₪ כל אחת, ושילם ב-{2} ₪. כמה עודף קיבל?', vals: [a, b, c], ans: (c - a * b) + ' ₪' }; },
    twoStep: function () { var a = rnd(3, 8), b = rnd(2, 5), c = rnd(2, 6); return { text: 'בכיתה {0} שולחנות, ליד כל שולחן {1} כיסאות, ועוד {2} כיסאות בפינה. כמה כיסאות?', vals: [a, b, c], ans: a * b + c }; },
    percent: function () { var p = [10, 20, 25, 50][rnd(0, 3)], x = rnd(2, 9) * 20; return { text: 'חולצה עולה {0} ₪ ויש עליה הנחה של {1} אחוז. כמה משלמים?', vals: [x, p], ans: (x - x * p / 100) + ' ₪' }; }
  };

  // ── grade map (covered skills from the grade catalog) ──────────────────────
  var GRADES = {
    3: [['לוח הכפל', 'אלוף הכפל', dotArray([[3, 4], [4, 4], [5, 3], [6, 2]])],
        ['שבר יחידה', 'מעבדת השברים', fraction([[1, 2], [1, 3], [1, 4], [1, 6]])],
        ['שטח בריצוף', 'מהנדסי הצורות', areaGrid([[[4, 3]], [[5, 3]], [[5, 4]], [[3, 4]]])],
        ['בעיה בפעולה אחת', 'שאלות מילוליות', wordProblem(words.oneStep)]],
    4: [['סדר פעולות', 'כאן בונים בכיף', expression(['3 + <mark>4 × 2</mark>', '<mark>3 + 8</mark>', '<b>11</b>'])],
        ['חוק הפילוג', 'מהנדסי הצורות', areaGrid([[[6, 4]], [[4, 4], [2, 4]], [[6, 3]], [[3, 3], [3, 3]]])],
        ['שבר מכמות', 'חצי הכוס המלאה', tank([[1, 4, 20], [1, 2, 20], [3, 4, 20]], 'frac')],
        ['כסף ועודף', 'שאלות מילוליות', wordProblem(words.change)]],
    5: [['הרחבה וצמצום', 'מעבדת השברים', fraction([[3, 6], [1, 2], [2, 4], [4, 8]])],
        ['שברים עשרוניים', 'תפוס את הנקודה', numberLine(0.7)],
        ['שטחים', 'מהנדסי הצורות', areaGrid([[[7, 3]], [[5, 3], [2, 3]], [[7, 4]], [[4, 4], [3, 4]]])],
        ['בעיות דו-שלביות', 'שאלות מילוליות', wordProblem(words.twoStep)]],
    6: [['אחוזים', 'מעבדת אחוזים', tank([25, 60, 40, 75, 10], 'pct')],
        ['עשרוניים', 'תפוס את הנקודה', numberLine(0.35)],
        ['חיבור שברים', 'מעבדת השברים', fraction([[1, 4], [2, 4], [3, 4], [6, 8]])],
        ['אחוזים בחיים', 'שאלות מילוליות', wordProblem(words.percent)]],
    7: [['משוואות', 'שומרים על איזון', balance([['2x + 3', '11', '2x + 3 = 11'], ['2x', '8', '−3 משני הצדדים'], ['x', '4', '÷2 משני הצדדים'], ['x', '4', 'x = 4 ✓']])],
        ['מספרים מכוונים', 'תבניות הקסם', expression(['(−4) + 7', '7 <mark>− 4</mark>', '<b>3</b>'])],
        ['אחוזים ויחס', 'מעבדת אחוזים', tank([40, 15, 90, 55], 'pct')],
        ['שאלות אחוזים', 'שאלות מילוליות', wordProblem(words.percent)]]
  };

  // ── runtime ────────────────────────────────────────────────────────────────
  var scenes = [], t0 = 0, running = false, visible = false;
  function loop(now) {
    if (!running) return;
    var t = Math.max(0, (now - t0) / 1000);
    scenes.forEach(function (sc) { sc.update(t); });
    requestAnimationFrame(loop);
  }
  function setRunning(on) {
    if (REDUCED) return;
    if (on && !running) { running = true; requestAnimationFrame(loop); }
    if (!on) running = false;
  }

  window.initGradeTopics = function (containerId, firstGrade) {
    var box = document.getElementById(containerId);
    if (!box) return;
    function show(g) {
      box.innerHTML = '';
      scenes = GRADES[g].map(function (topic) {
        var card = document.createElement('div');
        card.className = 'glass-panel topic-card';
        var viz = document.createElement('div'); viz.className = 'viz';
        card.appendChild(viz);
        var txt = document.createElement('div'); txt.className = 'p-3 sm:p-4 text-right';
        txt.innerHTML = '<h3 class="font-bold">' + topic[0] + '</h3><p class="text-xs sm:text-sm" style="color:var(--text-muted);">במשחק "' + topic[1] + '"</p>';
        card.appendChild(txt);
        box.appendChild(card);
        return topic[2](viz);
      });
      t0 = performance.now();
      // Reduced motion: one still frame that already shows the idea.
      scenes.forEach(function (sc) { sc.update(REDUCED ? 2.6 : 0); });
    }
    document.querySelectorAll('.grade-chips button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.grade-chips button').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('active'); b.setAttribute('aria-selected', 'true');
        show(b.dataset.g);
        if (window.gtag) window.gtag('event', 'grade_select', { grade: b.dataset.g });
      });
    });
    show(firstGrade);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; setRunning(visible && !document.hidden); }, { threshold: .1 }).observe(box);
    } else setRunning(true);
    document.addEventListener('visibilitychange', function () { setRunning(visible && !document.hidden); });
  };
})();
