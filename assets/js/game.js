/* Skull Darts 71 · Mini-jeu de fléchettes */
(function () {
  'use strict';

  var B = window.SD71Board;
  var canvas = document.getElementById('game-canvas');
  if (!canvas || !B) return;
  var ctx = canvas.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var elDarts = $('g-darts'), elScore = $('g-score'), elBest = $('g-best'), elLast = $('g-last');
  var t = function (k, v) { return window.I18N ? I18N.t(k, v) : k; };

  var size = 520, DPR = 1, cx, cy, R, boardCache = null;
  var darts = [], flying = null, parts = [], score = 0, left = 3, best = 0, over = false;
  var running = false, visible = false, raf = 0, t0 = performance.now(), lastFrame = 0;
  var lastMsg = null;

  try { best = parseInt(localStorage.getItem('sd71-best') || '0', 10) || 0; } catch (e) {}
  elBest.textContent = best;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    size = Math.max(200, Math.round(rect.width || 520));
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * DPR); canvas.height = Math.round(size * DPR);
    cx = cy = size / 2; R = size * 0.38;
    boardCache = document.createElement('canvas');
    boardCache.width = canvas.width; boardCache.height = canvas.height;
    var bc = boardCache.getContext('2d');
    bc.setTransform(DPR, 0, 0, DPR, 0, 0);
    var g = bc.createRadialGradient(cx, cy, 0, cx, cy, size * 0.72);
    g.addColorStop(0, '#2b1550'); g.addColorStop(1, '#0b0614');
    bc.fillStyle = g; bc.fillRect(0, 0, size, size);
    B.draw(bc, cx, cy, R);
    if (!running) render(performance.now());
  }

  function aim(now) {
    var k = (now - t0) * (0.001 + (3 - left) * 0.00025);
    return {
      x: cx + Math.sin(k * 1.3) * R * 0.92,
      y: cy + Math.sin(k * 1.7 + 1.1) * R * 0.92
    };
  }

  function render(now) {
    var dt = lastFrame ? Math.min(48, now - lastFrame) : 16; lastFrame = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(boardCache, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var s = R / 170 * 0.8;

    darts.forEach(function (d) {
      var w = Math.min(1, (now - d.at) / 600);
      var wob = (1 - w) * Math.sin((now - d.at) * 0.06) * 0.12;
      B.dart(ctx, d.x, d.y, 0.62 + wob, s, 0.4);
    });

    if (flying) {
      var u = Math.min(1, (now - flying.start) / 260), e = u * (2 - u);
      var sx = size * 1.05, sy = size * 1.1;
      var x = sx + (flying.tx - sx) * e, y = sy + (flying.ty - sy) * e - Math.sin(Math.PI * e) * size * 0.08;
      B.dart(ctx, x, y, 0.62, s * (1.8 - 0.8 * e), u * 18);
      if (u >= 1) land();
    } else if (!over) {
      var a = aim(now);
      ctx.save();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.shadowColor = '#ff7a18'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(a.x, a.y, 14, 0, Math.PI * 2);
      ctx.moveTo(a.x - 22, a.y); ctx.lineTo(a.x - 6, a.y); ctx.moveTo(a.x + 6, a.y); ctx.lineTo(a.x + 22, a.y);
      ctx.moveTo(a.x, a.y - 22); ctx.lineTo(a.x, a.y - 6); ctx.moveTo(a.x, a.y + 6); ctx.lineTo(a.x, a.y + 22);
      ctx.stroke(); ctx.restore();
    }

    // Particules
    if (parts.length) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life += dt;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        p.vy += 0.0009 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        var al = 1 - p.life / p.max;
        ctx.fillStyle = 'hsla(' + p.h + ',100%,62%,' + al + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * al + 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function loop(now) {
    render(now);
    if (running) raf = requestAnimationFrame(loop);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { lastFrame = 0; raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf);
  }
  function update() { setRunning(visible && !document.hidden); }

  function burst(x, y, n, hue) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 0.05 + Math.random() * 0.25;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.12, life: 0, max: 500 + Math.random() * 600, r: 1.5 + Math.random() * 2.5, h: hue + Math.random() * 30 });
    }
  }

  function say(msgKey, vars) {
    lastMsg = [msgKey, vars];
    elLast.textContent = t(msgKey, vars);
    elLast.classList.remove('pop'); void elLast.offsetWidth; elLast.classList.add('pop');
  }

  function throwDart() {
    if (flying) return;
    if (over) reset();
    if (window.SFX) { SFX.unlock(); SFX.throwDart(); }
    var a = aim(performance.now());
    // Petite imprécision humaine
    flying = { start: performance.now(), tx: a.x + (Math.random() - 0.5) * 6, ty: a.y + (Math.random() - 0.5) * 6 };
    if (!running) { setRunning(true); setTimeout(update, 1200); }
  }

  function land() {
    var f = flying; flying = null;
    var res = B.score(f.tx - cx, f.ty - cy, R);
    darts.push({ x: f.tx, y: f.ty, at: performance.now() });
    left--; score += res.pts;
    elDarts.textContent = left; elScore.textContent = score;
    if (res.kind === 'bull') { say('game.bull'); window.SFX && SFX.bull(); burst(f.tx, f.ty, 60, 10); }
    else if (res.kind === 'obull') { say('game.outer'); window.SFX && SFX.hit(25); burst(f.tx, f.ty, 36, 100); }
    else if (res.kind === 'miss') { say('game.miss'); window.SFX && SFX.miss(); burst(f.tx, f.ty, 10, 260); }
    else {
      var label = t(res.mult === 3 ? 'game.triple' : res.mult === 2 ? 'game.double' : 'game.single') + ' ' + res.num;
      say('game.hit', { label: label, pts: res.pts }); window.SFX && SFX.hit(res.pts); burst(f.tx, f.ty, 14 + res.mult * 10, 25);
    }
    if (navigator.vibrate) { try { navigator.vibrate(res.kind === 'bull' ? [40, 30, 80] : 20); } catch (e) {} }
    if (left === 0) {
      over = true;
      setTimeout(function () {
        if (score > best) {
          best = score; elBest.textContent = best;
          try { localStorage.setItem('sd71-best', String(best)); } catch (e) {}
          say('game.record', { score: score });
        } else say('game.end', { score: score });
      }, 700);
    }
  }

  function reset() {
    darts = []; score = 0; left = 3; over = false; flying = null; t0 = performance.now();
    elDarts.textContent = left; elScore.textContent = score; elLast.innerHTML = '&nbsp;'; lastMsg = null;
  }

  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); throwDart(); });
  canvas.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); throwDart(); }
  });
  $('g-throw').addEventListener('click', throwDart);
  $('g-reset').addEventListener('click', function () { reset(); window.SFX && SFX.click(); });
  document.addEventListener('langchange', function () { if (lastMsg) elLast.textContent = t(lastMsg[0], lastMsg[1]); });

  var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; update(); }, { rootMargin: '100px' });
  io.observe(canvas);
  document.addEventListener('visibilitychange', update);
  var ro = new ResizeObserver(function () { resize(); });
  ro.observe(canvas);
})();
