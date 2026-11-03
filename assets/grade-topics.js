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
    var r = local < hold ? 0 : (local - hold) / trans;
    return { i: k, next: (k + 1) % count, p: ease(r), r: r };
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

  // Number line. The AXIS travels: the window slides from 0–1 to 1–2 and back
  // to −1–0 while the ticks and labels glide past. The red dot only moves
  // left and right (never up): it springs to a new spot, overshoots, settles.
  // The number above it always reads the value currently under the dot.
  function numberLine(start) {
    var STEP = 1.7, PAN = 1.2, U = 42, N = 8;
    // c = centre of the visible window, dx = where the dot sits relative to it.
    var steps = [
      { c: .5, dx: start - .5 }, { c: .5, dx: -.3 }, { c: .5, dx: .4 },
      { c: 1.5, dx: -.2 }, { c: 1.5, dx: .3 },
      { c: -.5, dx: .1 }, { c: -.5, dx: -.3 },
      { c: .5, dx: start - .5 }
    ];
    return function (viz) {
      var s = svg(viz), lab = label(viz), y = 36;
      lab.innerHTML = 'איפה הנקודה?';
      var clip = 'nl' + Math.random().toString(36).slice(2, 7);
      el('rect', { x: 6, y: 0, width: 88, height: 70 }, el('clipPath', { id: clip }, el('defs', {}, s)));
      var g = el('g', { 'clip-path': 'url(#' + clip + ')' }, s);
      var neg = el('rect', { x: 6, y: y - 1.6, width: 0, height: 3.2, fill: C.blue, opacity: 0 }, g);
      el('line', { x1: 6, y1: y, x2: 94, y2: y, stroke: C.ink, 'stroke-width': 1.4 }, g);
      var ticks = [], labels = [];
      for (var k = -30; k <= 40; k++) ticks.push({ k: k, e: el('line', { stroke: k === 0 ? C.teal : C.ink, 'stroke-width': k === 0 ? 2 : (k % 5 ? .8 : 1.4) }, g) });
      for (var q = -3; q <= 4; q++) labels.push({ q: q, e: el('text', { 'text-anchor': 'middle', fill: q === 0 ? C.teal : C.ink, 'font-size': 7.5, 'font-weight': q === 0 ? 700 : 400 }, g) });
      labels.forEach(function (l) { l.e.textContent = (l.q < 0 ? '−' : '') + Math.abs(l.q); });
      var dot = el('ellipse', { cy: y, rx: 4.4, ry: 4.4, fill: C.flame }, s);
      var val = el('text', { 'text-anchor': 'middle', fill: C.flame, 'font-size': 9.5, 'font-weight': 700, y: y - 12 }, s);
      function fade(x) { return Math.max(0, Math.min(1, Math.min(x - 6, 94 - x) / 12)); }
      function state(t) {
        t = t % (steps.length * STEP);
        var idx = Math.floor(t / STEP), local = t - idx * STEP, a = steps[(idx - 1 + N) % N], b = steps[idx];
        var c = a.c === b.c ? b.c : lerp(a.c, b.c, ease(Math.min(1, local / PAN)));
        var dx = b.dx + (a.dx - b.dx) * Math.exp(-5 * local) * Math.cos(13 * local);
        return { c: c, dx: dx };
      }
      return { update: function (t) {
        var st = state(t), prev = state(Math.max(0, t - .016)), c = st.c;
        ticks.forEach(function (tk) {
          var x = 50 + (tk.k / 10 - c) * U, big = tk.k % 10 === 0 ? 6 : (tk.k % 5 === 0 ? 4.5 : 3);
          tk.e.setAttribute('x1', x); tk.e.setAttribute('x2', x);
          tk.e.setAttribute('y1', y - big); tk.e.setAttribute('y2', y + big);
          tk.e.setAttribute('opacity', fade(x) * (tk.k % 5 ? .65 : 1));
        });
        labels.forEach(function (l) {
          var x = 50 + (l.q - c) * U;
          l.e.setAttribute('x', x); l.e.setAttribute('y', y + 17); l.e.setAttribute('opacity', fade(x));
        });
        var x0 = 50 + (0 - c) * U;
        neg.setAttribute('width', Math.max(0, Math.min(94, x0) - 6)); neg.setAttribute('opacity', x0 > 6 ? .5 : 0);
        var x = 50 + st.dx * U, speed = Math.abs(st.dx - prev.dx) * 60, stretch = 1 + Math.min(.55, speed * .12);
        dot.setAttribute('cx', x); dot.setAttribute('rx', 4.4 * stretch); dot.setAttribute('ry', 4.4 / Math.sqrt(stretch));
        val.setAttribute('x', x);
        var v = Math.round((c + st.dx) * 10) / 10;
        val.textContent = (v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace(/\.0$/, '');
      } };
    };
  }

  // Elevator / parking garage: the car rides above and below ground level,
  // bounces when it arrives, and the equation under it shows the signed result.
  function elevator(stops) {
    function sn(v) { return (v < 0 ? '−' : '') + Math.abs(v); }
    function back(x) { var c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
    return function (viz) {
      var s = svg(viz), lab = label(viz), top = 3, y0 = 3, gap = 9;
      lab.dir = 'ltr';
      function Y(f) { return y0 + (top - f) * gap; }
      el('rect', { x: 34, y: Y(0) + gap, width: 34, height: gap * 3, fill: C.ink, 'fill-opacity': .09 }, s);
      el('text', { x: 78, y: Y(-2) + 6, fill: C.ink, 'fill-opacity': .6, 'font-size': 6, 'text-anchor': 'start' }, s).textContent = 'חניון';
      for (var f = 3; f >= -3; f--) {
        el('line', { x1: 34, y1: Y(f) + gap, x2: 68, y2: Y(f) + gap, stroke: C.ink, 'stroke-opacity': f === 0 ? .9 : .25, 'stroke-width': f === 0 ? 1.6 : .7 }, s);
        el('text', { x: 30, y: Y(f) + gap - 2.2, 'text-anchor': 'end', fill: f === 0 ? C.teal : C.ink, 'font-size': 6.5, 'font-weight': 700 }, s).textContent = sn(f);
      }
      el('line', { x1: 34, y1: y0, x2: 34, y2: Y(-3) + gap, stroke: C.ink, 'stroke-opacity': .5 }, s);
      el('line', { x1: 68, y1: y0, x2: 68, y2: Y(-3) + gap, stroke: C.ink, 'stroke-opacity': .5 }, s);
      var car = el('g', {}, s);
      el('rect', { x: 40, y: 0.8, width: 22, height: gap - 1.6, rx: 1.5, fill: C.teal }, car);
      el('line', { x1: 51, y1: 1.2, x2: 51, y2: gap - 1.2, stroke: '#070C20', 'stroke-width': .9 }, car);
      var arrow = el('text', { x: 73, 'font-size': 7.5, 'font-weight': 700, 'text-anchor': 'start' }, s);
      var shown = -1;
      return { update: function (t) {
        var ph = phase(t, stops.length, 1.3, 1.5), a = stops[ph.i], b = stops[ph.next], d = b - a;
        var yy = lerp(Y(a), Y(b), back(ph.r));
        car.setAttribute('transform', 'translate(0,' + yy + ')');
        arrow.setAttribute('y', yy + gap / 2 + 2.5); arrow.setAttribute('fill', d < 0 ? C.flame : C.teal);
        arrow.textContent = (d < 0 ? '▼ ' : '▲ ') + Math.abs(d);
        var key = ph.i * 2 + (ph.r > .55 ? 1 : 0);
        if (key !== shown) {
          shown = key;
          lab.innerHTML = '<span dir="ltr">' + sn(a) + (d < 0 ? ' − ' : ' + ') + Math.abs(d) + ' = <b style="color:' + C.teal + '">' + (ph.r > .55 ? sn(b) : '?') + '</b></span>';
          pop(lab);
        }
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
        ['מספרים שליליים בחניון', 'מעלית ומדרגות', elevator([2, -3, 1, -2, 3])],
        ['בעיה בפעולה אחת', 'שאלות מילוליות', wordProblem(words.oneStep)]],
    4: [['סדר פעולות', 'כאן בונים בכיף', expression(['3 + <mark>4 × 2</mark>', '<mark>3 + 8</mark>', '<b>11</b>'])],
        ['חוק הפילוג', 'מהנדסי הצורות', areaGrid([[[6, 4]], [[4, 4], [2, 4]], [[6, 3]], [[3, 3], [3, 3]]])],
        ['שבר מכמות', 'חצי הכוס המלאה', tank([[1, 4, 20], [1, 2, 20], [3, 4, 20]], 'frac')],
        ['כסף ועודף', 'שאלות מילוליות', wordProblem(words.change)]],
    5: [['הרחבה וצמצום', 'מעבדת השברים', fraction([[3, 6], [1, 2], [2, 4], [4, 8]])],
        ['שברים עשרוניים', 'תפוס את הנקודה', numberLine(0.7)],
        ['שטחים', 'מהנדסי הצורות', areaGrid([[[7, 3]], [[5, 3], [2, 3]], [[7, 4]], [[4, 4], [3, 4]]])],
        ['בעיות דו-שלביות', 'שאלות מילוליות', wordProblem(words.twoStep)]],
    6: [['עשרוניים', 'תפוס את הנקודה', numberLine(0.4)],
        ['חיבור שברים', 'מעבדת השברים', fraction([[1, 4], [2, 4], [3, 4], [6, 8]])],
        ['שטח והיקף', 'מהנדסי הצורות', areaGrid([[[8, 4]], [[5, 4], [3, 4]], [[8, 5]], [[4, 5], [4, 5]]])],
        ['אחוזים בחיים', 'שאלות מילוליות', wordProblem(words.percent)]],
    7: [['משוואות', 'שומרים על איזון', balance([['2x + 3', '11', '2x + 3 = 11'], ['2x', '8', '−3 משני הצדדים'], ['x', '4', '÷2 משני הצדדים'], ['x', '4', 'x = 4 ✓']])],
        ['נעלם בשני הצדדים', 'שומרים על איזון', balance([['3x', 'x + 6', '3x = x + 6'], ['2x', '6', '−x משני הצדדים'], ['x', '3', '÷2 משני הצדדים'], ['x', '3', 'x = 3 ✓']])],
        ['שטח והיקף', 'מהנדסי הצורות', areaGrid([[[8, 5]], [[5, 5], [3, 5]], [[8, 4]], [[4, 4], [4, 4]]])],
        ['אחוזים בחיים', 'שאלות מילוליות', wordProblem(words.percent)]]
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
