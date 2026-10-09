/* Skull Darts 71 · Dessin de la cible et de la fléchette (partagé intro + jeu) */
(function () {
  'use strict';

  var ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  // Rayons normalisés (cible réglementaire, 170 mm = 1)
  var R_BULL = 6.35 / 170, R_OBULL = 15.9 / 170, R_T1 = 99 / 170, R_T2 = 107 / 170, R_D1 = 162 / 170;
  var COL = {
    dark: '#1a0f2e', light: '#f3e3c3', a: '#ff7a18', b: '#7b3fc4',
    bull: '#ff3d5a', obull: '#2f9e5b', wire: 'rgba(214,200,170,.55)', rim: '#0b0614', num: '#f6ead2'
  };
  var SEG = Math.PI * 2 / 20;
  var START = -Math.PI / 2 - SEG / 2; // segment 20 centré en haut

  function ring(ctx, cx, cy, r0, r1, a0, a1, fill) {
    ctx.beginPath();
    ctx.arc(cx, cy, r1, a0, a1);
    ctx.arc(cx, cy, r0, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }

  /**
   * Dessine une cible complète.
   * R = rayon de la zone de score (double extérieur). Les numéros sont tracés jusqu'à ~1.22 R.
   */
  function draw(ctx, cx, cy, R, opts) {
    opts = opts || {};
    ctx.save();
    // Halo
    var halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.6);
    halo.addColorStop(0, 'rgba(255,122,24,.35)'); halo.addColorStop(1, 'rgba(255,122,24,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2); ctx.fill();
    // Bordure noire + numéros
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.26, 0, Math.PI * 2); ctx.fillStyle = COL.rim; ctx.fill();
    ctx.lineWidth = Math.max(2, R * 0.025); ctx.strokeStyle = '#ff7a18'; ctx.stroke();

    for (var i = 0; i < 20; i++) {
      var a0 = START + i * SEG, a1 = a0 + SEG, even = i % 2 === 0;
      ring(ctx, cx, cy, R_OBULL * R, R_T1 * R, a0, a1, even ? COL.dark : COL.light);
      ring(ctx, cx, cy, R_T1 * R, R_T2 * R, a0, a1, even ? COL.a : COL.b);
      ring(ctx, cx, cy, R_T2 * R, R_D1 * R, a0, a1, even ? COL.dark : COL.light);
      ring(ctx, cx, cy, R_D1 * R, R, a0, a1, even ? COL.a : COL.b);
    }
    ctx.beginPath(); ctx.arc(cx, cy, R_OBULL * R, 0, Math.PI * 2); ctx.fillStyle = COL.obull; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(R_BULL * R, 2.5), 0, Math.PI * 2); ctx.fillStyle = COL.bull; ctx.fill();

    // Fils métalliques
    ctx.strokeStyle = COL.wire; ctx.lineWidth = Math.max(0.6, R * 0.006);
    [R_OBULL, R_T1, R_T2, R_D1, 1].forEach(function (r) { ctx.beginPath(); ctx.arc(cx, cy, r * R, 0, Math.PI * 2); ctx.stroke(); });
    ctx.beginPath();
    for (var k = 0; k < 20; k++) {
      var a = START + k * SEG;
      ctx.moveTo(cx + Math.cos(a) * R_OBULL * R, cy + Math.sin(a) * R_OBULL * R);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    ctx.stroke();

    // Numéros
    if (R > 60) {
      ctx.fillStyle = COL.num;
      ctx.font = '600 ' + Math.round(R * 0.13) + 'px Fredoka, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var n = 0; n < 20; n++) {
        var an = START + (n + 0.5) * SEG;
        ctx.fillText(String(ORDER[n]), cx + Math.cos(an) * R * 1.13, cy + Math.sin(an) * R * 1.13);
      }
    }
    // Léger vernis
    var gloss = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    gloss.addColorStop(0, 'rgba(255,255,255,.10)'); gloss.addColorStop(.5, 'rgba(255,255,255,0)'); gloss.addColorStop(1, 'rgba(0,0,0,.18)');
    ctx.fillStyle = gloss; ctx.beginPath(); ctx.arc(cx, cy, R * 1.26, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** Score pour un point (dx, dy) relatif au centre, R = rayon du double. */
  function score(dx, dy, R) {
    var d = Math.hypot(dx, dy) / R;
    if (d <= R_BULL) return { pts: 50, kind: 'bull' };
    if (d <= R_OBULL) return { pts: 25, kind: 'obull' };
    if (d > 1) return { pts: 0, kind: 'miss' };
    var ang = Math.atan2(dy, dx) - START;
    ang = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var num = ORDER[Math.floor(ang / SEG) % 20];
    var mult = (d >= R_T1 && d <= R_T2) ? 3 : (d >= R_D1 ? 2 : 1);
    return { pts: num * mult, num: num, mult: mult, kind: 'seg' };
  }

  /**
   * Fléchette. (x, y) = pointe ; angle = direction de la queue ; s = échelle ;
   * spin ∈ [0, 2π[ fait « tourner » les ailettes.
   */
  function dart(ctx, x, y, angle, s, spin) {
    var f = Math.abs(Math.cos(spin || 0)) * 0.75 + 0.25;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(s, s);
    // Ombre portée
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
    // Pointe
    ctx.fillStyle = '#d8dde6';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(24, -2); ctx.lineTo(24, 2); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    // Fût moleté
    var g = ctx.createLinearGradient(0, -6, 0, 6);
    g.addColorStop(0, '#9aa3b5'); g.addColorStop(.45, '#f0f3f8'); g.addColorStop(1, '#4b5160');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(22, -3); ctx.lineTo(30, -5.5); ctx.lineTo(62, -5.5); ctx.lineTo(66, -3); ctx.lineTo(66, 3); ctx.lineTo(62, 5.5); ctx.lineTo(30, 5.5); ctx.lineTo(22, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,40,.5)'; ctx.lineWidth = 1;
    for (var k = 34; k < 60; k += 4) { ctx.beginPath(); ctx.moveTo(k, -5.5); ctx.lineTo(k, 5.5); ctx.stroke(); }
    ctx.fillStyle = '#ff7a18'; ctx.fillRect(40, -5.6, 3, 11.2); ctx.fillRect(52, -5.6, 3, 11.2);
    // Tige
    ctx.fillStyle = '#7b3fc4'; ctx.fillRect(66, -2.4, 40, 4.8);
    // Ailettes
    ctx.fillStyle = '#ff7a18';
    ctx.beginPath(); ctx.moveTo(86, -2); ctx.lineTo(132, -22 * f); ctx.lineTo(136, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c2410c';
    ctx.beginPath(); ctx.moveTo(86, 2); ctx.lineTo(132, 22 * f); ctx.lineTo(136, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a0f2e';
    ctx.beginPath(); ctx.moveTo(100, -2); ctx.lineTo(126, -14 * f); ctx.lineTo(128, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f3e3c3'; ctx.beginPath(); ctx.arc(118, -6 * f, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  window.SD71Board = { draw: draw, score: score, dart: dart, DART_LEN: 136 };
})();
