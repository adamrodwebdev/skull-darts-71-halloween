/* Skull Darts 71 · Intro : fléchette → impact → écran fissuré → explosion en éclats */
(function () {
  'use strict';

  var B = window.SD71Board;
  var root = document.getElementById('intro');
  var canvas = document.getElementById('intro-canvas');
  var ui = document.getElementById('intro-ui');
  if (!root || !canvas || !B) return;

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;
  var state = 'idle'; // idle | playing | done
  var raf = 0;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAIL = 0.62; // angle de la queue (bas-droite)

  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2;
    cy = Math.min(H * 0.34, H * 0.62 - 150);
    R = Math.max(70, Math.min(W * 0.34, H * 0.2, 210));
    cy = Math.max(cy, R * 1.3 + 20);
  }

  function bg(c) {
    var g = c.createRadialGradient(cx, H * 0.4, 0, cx, H * 0.4, Math.max(W, H) * 0.95);
    g.addColorStop(0, '#2b1550'); g.addColorStop(0.55, '#120a22'); g.addColorStop(1, '#07030f');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  function readyPos() {
    var sc = 1.55 * R / 170, len = B.DART_LEN * sc;
    return { x: Math.min(cx + R * 1.15, W - len * Math.cos(TAIL) - 12), y: Math.min(cy + R * 1.05, H - len * Math.sin(TAIL) - 12), s: sc };
  }

  function drawIdle() {
    bg(ctx); B.draw(ctx, cx, cy, R);
    var p = readyPos();
    B.dart(ctx, p.x, p.y, TAIL, p.s, 0.4);
  }

  /* ---------- Fissures & éclats ---------- */
  var rays = [], rings = [], shards = [], parts = [], rMax = 0, ringDraw = [];

  function buildCracks() {
    rays = []; rings = []; shards = []; ringDraw = [];
    rMax = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) * 1.08;
    var N = W < 600 ? 11 : 14;
    var radii = [];
    var r = Math.max(18, R * 0.16);
    while (r < rMax) { radii.push(r); r *= 1.75; }
    radii.push(rMax);
    rings = radii;
    var base = Math.random() * Math.PI * 2;
    for (var i = 0; i < N; i++) {
      var a = base + i * (Math.PI * 2 / N) + (Math.random() - 0.5) * (Math.PI * 2 / N) * 0.55;
      var pts = [];
      for (var k = 0; k < radii.length; k++) {
        var last = k === radii.length - 1;
        var rr = radii[k] * (last ? 1 : 0.88 + Math.random() * 0.24);
        var aa = a + (last ? 0 : (Math.random() - 0.5) * 0.18);
        pts.push({ x: cx + Math.cos(aa) * rr, y: cy + Math.sin(aa) * rr, r: rr });
      }
      rays.push(pts);
    }
    // Quels segments d'anneaux sont visibles comme fissures
    for (var k2 = 0; k2 < radii.length - 1; k2++) {
      ringDraw.push(rays.map(function () { return Math.random() < (k2 < 2 ? 0.85 : 0.55); }));
    }
    // Éclats : (centre) triangles puis quadrilatères
    for (var j = 0; j < N; j++) {
      var A = rays[j], Bn = rays[(j + 1) % N];
      shards.push(makeShard([{ x: cx, y: cy }, A[0], Bn[0]]));
      for (var q = 0; q < radii.length - 1; q++) shards.push(makeShard([A[q], Bn[q], Bn[q + 1], A[q + 1]]));
    }
  }

  function makeShard(poly) {
    var sx = 0, sy = 0;
    poly.forEach(function (p) { sx += p.x; sy += p.y; });
    sx /= poly.length; sy /= poly.length;
    var dx = sx - cx, dy = sy - cy, d = Math.hypot(dx, dy) || 1;
    var speed = (0.35 + Math.random() * 0.5) * (1.6 - Math.min(d / rMax, 1));
    return {
      poly: poly, x: sx, y: sy, d: d,
      vx: dx / d * speed, vy: dy / d * speed - 0.25,
      rot: 0, vr: (Math.random() - 0.5) * 0.006,
      delay: (d / rMax) * 180 + Math.random() * 60,
      ox: 0, oy: 0, s: 1, a: 1
    };
  }

  function prerenderShards() {
    shards.forEach(function (s) {
      var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      s.poly.forEach(function (p) { minx = Math.min(minx, p.x); miny = Math.min(miny, p.y); maxx = Math.max(maxx, p.x); maxy = Math.max(maxy, p.y); });
      minx = Math.max(-2, Math.floor(minx) - 2); miny = Math.max(-2, Math.floor(miny) - 2);
      maxx = Math.min(W + 2, Math.ceil(maxx) + 2); maxy = Math.min(H + 2, Math.ceil(maxy) + 2);
      var bw = maxx - minx, bh = maxy - miny;
      if (bw <= 0 || bh <= 0) return;
      var c = document.createElement('canvas');
      c.width = Math.ceil(bw * DPR); c.height = Math.ceil(bh * DPR);
      var g = c.getContext('2d');
      g.setTransform(DPR, 0, 0, DPR, -minx * DPR, -miny * DPR);
      g.beginPath();
      g.moveTo(s.poly[0].x, s.poly[0].y);
      for (var i = 1; i < s.poly.length; i++) g.lineTo(s.poly[i].x, s.poly[i].y);
      g.closePath();
      g.save(); g.clip();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(snap, -minx * DPR, -miny * DPR);
      g.restore();
      g.strokeStyle = 'rgba(220,240,255,.6)'; g.lineWidth = 1.2; g.stroke();
      s.img = c; s.bx = minx; s.by = miny; s.bw = bw; s.bh = bh;
    });
  }

  function strokeCracks(c, progress) {
    var reach = rMax * Math.pow(progress, 0.7);
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass === 0 ? 'rgba(10,4,20,.65)' : 'rgba(235,245,255,.92)';
      c.lineWidth = pass === 0 ? 3.2 : 1.3;
      if (pass === 1) { c.shadowColor = 'rgba(180,220,255,.9)'; c.shadowBlur = 6; }
      c.beginPath();
      rays.forEach(function (pts) {
        c.moveTo(cx, cy);
        var px = cx, py = cy, pr = 0;
        for (var k = 0; k < pts.length; k++) {
          var p = pts[k];
          if (p.r <= reach) { c.lineTo(p.x, p.y); px = p.x; py = p.y; pr = p.r; }
          else { var t = (reach - pr) / (p.r - pr); c.lineTo(px + (p.x - px) * t, py + (p.y - py) * t); break; }
        }
      });
      for (var k2 = 0; k2 < ringDraw.length; k2++) {
        if (rings[k2] > reach) break;
        for (var i = 0; i < rays.length; i++) {
          if (!ringDraw[k2][i]) continue;
          var a = rays[i][k2], b = rays[(i + 1) % rays.length][k2];
          c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
        }
      }
      c.stroke();
    }
    c.restore();
  }

  function spawnParticles(n, kind, x, y, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = (0.3 + Math.random()) * power;
      parts.push({
        kind: kind, x: x + (kind === 'glass' ? (Math.random() - 0.5) * R * 0.6 : 0), y: y + (kind === 'glass' ? (Math.random() - 0.5) * R * 0.6 : 0),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'ember' ? 0.12 : 0.05),
        life: 0, max: 900 + Math.random() * 900, size: kind === 'glass' ? 2 + Math.random() * 6 : 1.5 + Math.random() * 3,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.02,
        hue: kind === 'ember' ? (18 + Math.random() * 30) : (190 + Math.random() * 60)
      });
    }
  }

  function drawParticles(c, dt) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      p.vy += (p.kind === 'ember' ? -0.00002 : 0.0011) * dt;
      p.vx *= 0.995;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      var alpha = 1 - p.life / p.max;
      if (p.kind === 'ember') {
        c.fillStyle = 'hsla(' + p.hue + ',100%,60%,' + alpha + ')';
        c.beginPath(); c.arc(p.x, p.y, p.size * (0.6 + alpha * 0.6), 0, Math.PI * 2); c.fill();
      } else {
        var tw = 0.5 + 0.5 * Math.sin(p.life * 0.03 + p.rot);
        c.fillStyle = 'hsla(' + p.hue + ',90%,' + (75 + tw * 20) + '%,' + alpha * 0.9 + ')';
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.beginPath(); c.moveTo(0, -p.size); c.lineTo(p.size * 0.6, p.size * 0.5); c.lineTo(-p.size * 0.5, p.size * 0.7); c.closePath(); c.fill();
        c.restore();
      }
    }
    c.restore();
  }

  /* ---------- Séquence ---------- */
  var T_ANTIC = 150, T_FLY = 520, T_IMPACT = T_ANTIC + T_FLY, T_CRACK = T_IMPACT + 140, T_CRACK_D = 360, T_SHATTER = T_IMPACT + 760, T_END = T_SHATTER + 1700;
  var start = 0, lastT = 0, flags = {}, snap = null, snapCtx = null;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInQuad(t) { return t * t; }

  function dartAt(t, wobbleT) {
    var p = readyPos(), endS = R / 170;
    if (t < T_ANTIC) {
      var k = easeOutCubic(t / T_ANTIC);
      return { x: p.x + Math.cos(TAIL) * 22 * k, y: p.y + Math.sin(TAIL) * 22 * k, s: p.s * (1 + 0.08 * k), a: TAIL, spin: 0.4 };
    }
    if (t < T_IMPACT) {
      var u = (t - T_ANTIC) / T_FLY, e = easeInQuad(u) * 0.35 + u * 0.65;
      var sx = p.x + Math.cos(TAIL) * 22, sy = p.y + Math.sin(TAIL) * 22;
      return {
        x: sx + (cx - sx) * e,
        y: sy + (cy - sy) * e - Math.sin(Math.PI * e) * R * 0.35,
        s: p.s * 1.08 + (endS - p.s * 1.08) * e,
        a: TAIL - Math.sin(Math.PI * e) * 0.18,
        spin: u * 22
      };
    }
    var w = wobbleT / 1000;
    return { x: cx, y: cy, s: endS, a: TAIL + Math.exp(-w * 6) * Math.sin(w * 55) * 0.09, spin: 0.4 };
  }

  function scene(c, t, shake) {
    bg(c);
    c.save();
    if (shake) c.translate(shake.x, shake.y);
    B.draw(c, cx, cy, R);
    if (t >= T_CRACK) strokeCracks(c, Math.min(1, (t - T_CRACK) / T_CRACK_D));
    var d = dartAt(t, Math.max(0, t - T_IMPACT));
    if (t < T_IMPACT && t > T_ANTIC) {
      // Traînée de vitesse
      for (var g = 3; g >= 1; g--) {
        var dg = dartAt(t - g * 22, 0);
        c.globalAlpha = 0.12 * (4 - g);
        B.dart(c, dg.x, dg.y, dg.a, dg.s, dg.spin);
      }
      c.globalAlpha = 1;
    }
    B.dart(c, d.x, d.y, d.a, d.s, d.spin);
    c.restore();
  }

  function frame(ts) {
    if (!start) { start = ts; lastT = ts; }
    var t = ts - start, dt = Math.min(48, ts - lastT); lastT = ts;

    if (t >= T_IMPACT && !flags.impact) {
      flags.impact = true;
      window.SFX && SFX.impact();
      spawnParticles(46, 'ember', cx, cy, 0.55);
      if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
    }
    if (t >= T_CRACK && !flags.crack) { flags.crack = true; window.SFX && SFX.crack(); }

    if (t < T_SHATTER) {
      var shake = null;
      if (t > T_IMPACT) {
        var k = Math.max(0, 1 - (t - T_IMPACT) / 380);
        shake = { x: (Math.random() - 0.5) * 16 * k, y: (Math.random() - 0.5) * 16 * k };
      }
      scene(ctx, t, shake);
      // Flash d'impact
      if (t > T_IMPACT && t < T_IMPACT + 260) {
        var fa = 1 - (t - T_IMPACT) / 260;
        var fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2);
        fg.addColorStop(0, 'rgba(255,240,200,' + 0.85 * fa + ')'); fg.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
      }
      drawParticles(ctx, dt);
    } else {
      if (!flags.shatter) {
        flags.shatter = true;
        snap = document.createElement('canvas');
        snap.width = canvas.width; snap.height = canvas.height;
        snapCtx = snap.getContext('2d');
        snapCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
        scene(snapCtx, T_SHATTER - 1, null);
        strokeCracks(snapCtx, 1);
        root.classList.add('is-playing');
        document.dispatchEvent(new CustomEvent('intro:reveal'));
        window.SFX && SFX.shatter();
        prerenderShards();
        spawnParticles(110, 'glass', cx, cy, 0.9);
        spawnParticles(50, 'ember', cx, cy, 0.7);
        if (navigator.vibrate) { try { navigator.vibrate([30, 40, 60]); } catch (e) {} }
      }
      var st = t - T_SHATTER;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < shards.length; i++) {
        var s = shards[i], lt = st - s.delay;
        if (lt > 0) {
          s.vy += 0.0016 * dt;
          s.ox += s.vx * dt; s.oy += s.vy * dt; s.rot += s.vr * dt;
          s.s = 1 + Math.min(lt, 1200) * 0.00028;
          s.a = lt < 650 ? 1 : Math.max(0, 1 - (lt - 650) / 700);
        }
        if (s.a <= 0) continue;
        ctx.save();
        ctx.globalAlpha = s.a;
        ctx.translate(s.x + s.ox, s.y + s.oy); ctx.rotate(s.rot); ctx.scale(s.s, s.s); ctx.translate(-s.x, -s.y);
        if (s.img) ctx.drawImage(s.img, s.bx, s.by, s.bw, s.bh);
        ctx.restore();
      }
      drawParticles(ctx, dt);
    }

    if (t < T_END || parts.length) raf = requestAnimationFrame(frame);
    else finish();
  }

  function play() {
    if (state !== 'idle') return;
    state = 'playing';
    ui.classList.add('is-hidden');
    layout(); buildCracks();
    parts = []; flags = {}; start = 0;
    window.SFX && SFX.whoosh(0.62);
    if (reduced) { quickExit(); return; }
    raf = requestAnimationFrame(frame);
  }

  function quickExit() {
    state = 'playing';
    ui.classList.add('is-hidden');
    root.style.transition = 'opacity .45s';
    root.style.opacity = '0';
    document.dispatchEvent(new CustomEvent('intro:reveal'));
    setTimeout(finish, 460);
  }

  function finish() {
    cancelAnimationFrame(raf);
    state = 'done';
    root.classList.add('is-done');
    root.classList.remove('is-playing');
    root.style.opacity = ''; root.style.transition = '';
    document.body.classList.remove('is-locked');
    snap = null; parts = []; shards = [];
    ctx.clearRect(0, 0, W, H);
    document.dispatchEvent(new CustomEvent('intro:done'));
    var main = document.getElementById('main');
    if (main && (root.contains(document.activeElement) || document.activeElement === document.body)) main.focus({ preventScroll: true });
  }

  function reset() {
    state = 'idle';
    root.classList.remove('is-done', 'is-playing');
    ui.classList.remove('is-hidden');
    document.body.classList.add('is-locked');
    layout(); drawIdle();
    var b = document.getElementById('intro-throw'); if (b) b.focus();
  }

  /* ---------- Branchements ---------- */
  document.getElementById('intro-throw').addEventListener('click', function () {
    if (window.SFX) SFX.setEnabled(true, { ambient: false });
    play();
    setTimeout(function () { window.SFX && SFX.startAmbient(); }, 2600);
  });
  document.getElementById('intro-mute').addEventListener('click', function () {
    if (window.SFX) SFX.setEnabled(false);
    play();
  });
  document.getElementById('intro-skip').addEventListener('click', quickExit);
  canvas.addEventListener('click', function () { if (state === 'idle') document.getElementById('intro-throw').click(); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state === 'idle') quickExit();
    if (e.key === 'Tab') { // piège de focus simple
      var f = ui.querySelectorAll('button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var rz;
  window.addEventListener('resize', function () {
    if (state !== 'idle') return;
    cancelAnimationFrame(rz); rz = requestAnimationFrame(function () { layout(); drawIdle(); });
  }, { passive: true });

  window.SD71Intro = { replay: reset, skip: quickExit, get state() { return state; } };

  // Démarrage
  if (reduced) {
    root.classList.add('is-done'); state = 'done';
    document.dispatchEvent(new CustomEvent('intro:reveal'));
    document.dispatchEvent(new CustomEvent('intro:done'));
  } else {
    document.body.classList.add('is-locked');
    layout(); drawIdle();
    // Redessine quand la police des numéros est chargée
    if (document.fonts && document.fonts.load) document.fonts.load('600 20px Fredoka').then(function () { if (state === 'idle') drawIdle(); });
  }
})();
