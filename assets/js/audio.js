/* Skull Darts 71 · Sound design 100 % synthétisé (Web Audio API, 0 fichier audio) */
(function () {
  'use strict';

  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master, sfxBus, ambBus, reverb, noiseBuf;
  var enabled = false;
  var ambient = null;

  try { enabled = localStorage.getItem('sd71-sound') === 'on'; } catch (e) {}

  function init() {
    if (ctx || !AC) return !!ctx;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0; ambBus.connect(master);

    // Bruit blanc partagé
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // Réverbération « crypte » générée
    reverb = ctx.createConvolver();
    var len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var ch = ir.getChannelData(c);
      for (var j = 0; j < len; j++) ch[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 3.2);
    }
    reverb.buffer = ir;
    var wet = ctx.createGain(); wet.gain.value = 0.35;
    reverb.connect(wet); wet.connect(master);

    document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else if (enabled) ctx.resume();
    });
    return true;
  }

  function ready() { return enabled && ctx && ctx.state !== 'closed'; }
  function now() { return ctx.currentTime; }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function pan(node, v) {
    if (!ctx.createStereoPanner) return node;
    var p = ctx.createStereoPanner(); p.pan.value = v; node.connect(p); return p;
  }
  function noise(t, dur) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s;
  }
  function tone(type, f, t, dur, peak, dest, wetSend) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    env(g, t, 0.005, peak, dur);
    o.connect(g); g.connect(dest || sfxBus);
    if (wetSend) g.connect(reverb);
    o.start(t); o.stop(t + dur + 0.1);
    return o;
  }

  var S = {
    /* Fléchette qui fend l'air */
    whoosh: function (dur) {
      if (!ready()) return; dur = dur || 0.6;
      var t = now(), n = noise(t, dur), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      bp.type = 'bandpass'; bp.Q.value = 2.2;
      bp.frequency.setValueAtTime(350, t);
      bp.frequency.exponentialRampToValueAtTime(2800, t + dur * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + dur * 0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(bp); bp.connect(g);
      var out = g;
      if (ctx.createStereoPanner) {
        var p = ctx.createStereoPanner();
        p.pan.setValueAtTime(0.9, t); p.pan.linearRampToValueAtTime(0, t + dur);
        g.connect(p); out = p;
      }
      out.connect(sfxBus);
    },
    /* Impact dans la cible + vibration de la fléchette */
    impact: function () {
      if (!ready()) return;
      var t = now();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
      env(g, t, 0.003, 1, 0.4); o.connect(g); g.connect(sfxBus); g.connect(reverb);
      o.start(t); o.stop(t + 0.5);
      var n = noise(t, 0.08), lp = ctx.createBiquadFilter(), ng = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 1800;
      env(ng, t, 0.002, 0.8, 0.07); n.connect(lp); lp.connect(ng); ng.connect(sfxBus);
      // « Twang » : vibrato amorti
      var tw = ctx.createOscillator(), tg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      tw.type = 'triangle'; tw.frequency.value = 210;
      lfo.frequency.value = 22; lg.gain.setValueAtTime(40, t); lg.gain.exponentialRampToValueAtTime(1, t + 0.6);
      lfo.connect(lg); lg.connect(tw.frequency);
      env(tg, t + 0.01, 0.01, 0.22, 0.6); tw.connect(tg); tg.connect(sfxBus);
      tw.start(t); lfo.start(t); tw.stop(t + 0.8); lfo.stop(t + 0.8);
    },
    /* Fissures de l'écran */
    crack: function () {
      if (!ready()) return;
      var t = now();
      for (var i = 0; i < 9; i++) {
        var st = t + Math.random() * 0.28, n = noise(st, 0.04), hp = ctx.createBiquadFilter(), g = ctx.createGain();
        hp.type = 'highpass'; hp.frequency.value = 1500 + Math.random() * 3000;
        env(g, st, 0.001, 0.5 + Math.random() * 0.4, 0.03 + Math.random() * 0.04);
        n.connect(hp); hp.connect(g); pan(g, Math.random() * 1.6 - 0.8).connect(sfxBus);
      }
    },
    /* Explosion de verre */
    shatter: function () {
      if (!ready()) return;
      var t = now();
      // Boom grave
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.8);
      env(g, t, 0.005, 0.9, 0.9); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1);
      // Souffle de verre
      var n = noise(t, 1.2), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
      hp.type = 'highpass'; hp.frequency.setValueAtTime(2500, t); hp.frequency.linearRampToValueAtTime(6000, t + 1);
      env(ng, t, 0.004, 0.7, 1.1); n.connect(hp); hp.connect(ng); ng.connect(sfxBus); ng.connect(reverb);
      // Éclats tintants
      for (var i = 0; i < 34; i++) {
        var st = t + Math.pow(Math.random(), 1.6) * 1.3, f = 2200 + Math.random() * 5200;
        var p = ctx.createOscillator(), pg = ctx.createGain();
        p.type = Math.random() > 0.5 ? 'sine' : 'triangle'; p.frequency.value = f;
        env(pg, st, 0.001, 0.05 + Math.random() * 0.12, 0.05 + Math.random() * 0.25);
        p.connect(pg); var out = pan(pg, Math.random() * 2 - 1); out.connect(sfxBus); pg.connect(reverb);
        p.start(st); p.stop(st + 0.4);
      }
    },
    click: function () {
      if (!ready()) return; var t = now();
      tone('square', 520, t, 0.05, 0.08); tone('sine', 1040, t + 0.02, 0.06, 0.06);
    },
    hover: function () { if (!ready()) return; tone('sine', 1400 + Math.random() * 300, now(), 0.04, 0.025); },
    toggle: function (on) {
      if (!ready()) return; var t = now();
      tone('triangle', on ? 440 : 660, t, 0.08, 0.12); tone('triangle', on ? 660 : 440, t + 0.08, 0.1, 0.12);
    },
    tick: function () { if (!ready()) return; tone('sine', 1800, now(), 0.02, 0.015); },
    /* Mini-jeu */
    throwDart: function () { S.whoosh(0.32); },
    hit: function (pts) {
      if (!ready()) return; var t = now();
      S.impact();
      var base = 330 + Math.min(pts, 60) * 12;
      tone('sine', base, t + 0.08, 0.25, 0.12, null, true);
      tone('sine', base * 1.5, t + 0.16, 0.3, 0.1, null, true);
    },
    bull: function () {
      if (!ready()) return; var t = now();
      S.impact();
      [440, 523.25, 659.25, 880, 1046.5].forEach(function (f, i) { tone('triangle', f, t + 0.1 + i * 0.08, 0.5, 0.12, null, true); });
      // Petit rire de fantôme
      for (var k = 0; k < 4; k++) {
        var o = ctx.createOscillator(), g = ctx.createGain(), st = t + 0.6 + k * 0.16;
        o.type = 'sawtooth'; o.frequency.setValueAtTime(320 - k * 25, st); o.frequency.exponentialRampToValueAtTime(220 - k * 25, st + 0.12);
        var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
        env(g, st, 0.01, 0.07, 0.12); o.connect(lp); lp.connect(g); g.connect(sfxBus); g.connect(reverb);
        o.start(st); o.stop(st + 0.2);
      }
    },
    miss: function () {
      if (!ready()) return; var t = now();
      [0, 0.22, 0.44].forEach(function (d, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(300 - i * 40, t + d); o.frequency.linearRampToValueAtTime(260 - i * 45, t + d + 0.2);
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t + d); lp.frequency.linearRampToValueAtTime(1400, t + d + 0.1); lp.frequency.linearRampToValueAtTime(300, t + d + 0.2);
        env(g, t + d, 0.01, 0.1, 0.22); o.connect(lp); lp.connect(g); g.connect(sfxBus);
        o.start(t + d); o.stop(t + d + 0.3);
      });
    }
  };

  /* ---------- Ambiance : drone + vent + boîte à musique hantée ---------- */
  var MELODY = [69, 72, 76, 75, 76, 72, 69, 68, 69, 72, 76, 81, 80, 76, 72, 71];
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function startAmbient() {
    if (!ctx || ambient) return;
    var t = now(), nodes = [];
    ambBus.gain.cancelScheduledValues(t);
    ambBus.gain.setValueAtTime(ambBus.gain.value, t);
    ambBus.gain.linearRampToValueAtTime(1, t + 2.5);

    // Drone
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 6;
    var dg = ctx.createGain(); dg.gain.value = 0.045;
    [55, 55.35, 82.4].forEach(function (f) {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); nodes.push(o);
    });
    var lfo = ctx.createOscillator(), lfg = ctx.createGain();
    lfo.frequency.value = 0.07; lfg.gain.value = 140; lfo.connect(lfg); lfg.connect(lp.frequency); lfo.start(); nodes.push(lfo);
    lp.connect(dg); dg.connect(ambBus);

    // Vent
    var wn = ctx.createBufferSource(); wn.buffer = noiseBuf; wn.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.value = 500;
    var wl = ctx.createOscillator(), wlg = ctx.createGain(); wl.frequency.value = 0.11; wlg.gain.value = 300;
    wl.connect(wlg); wlg.connect(bp.frequency);
    var wg = ctx.createGain(); wg.gain.value = 0.035;
    wn.connect(bp); bp.connect(wg); wg.connect(ambBus); wn.start(); wl.start(); nodes.push(wn, wl);

    // Boîte à musique
    var step = 0, next = now() + 0.5, beat = 0.42;
    var timer = setInterval(function () {
      while (next < now() + 0.3) {
        var m = MELODY[step % MELODY.length], f = midi(m);
        [1, 2.01, 3.98].forEach(function (h, i) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f * h;
          env(g, next, 0.004, [0.05, 0.018, 0.008][i], 1.3 / (i + 1));
          o.connect(g); g.connect(ambBus); g.connect(reverb);
          o.start(next); o.stop(next + 1.5);
        });
        step++; next += (step % 8 === 0) ? beat * 2 : beat;
      }
    }, 100);
    ambient = { nodes: nodes, timer: timer };
  }
  function stopAmbient() {
    if (!ambient) return;
    var a = ambient, t = now(); ambient = null;
    clearInterval(a.timer);
    ambBus.gain.cancelScheduledValues(t);
    ambBus.gain.setValueAtTime(ambBus.gain.value, t);
    ambBus.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(function () { a.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); }, 700);
  }

  S.unlock = function () {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
  };
  S.setEnabled = function (on, opts) {
    enabled = !!on;
    try { localStorage.setItem('sd71-sound', on ? 'on' : 'off'); } catch (e) {}
    if (on) { S.unlock(); if (!opts || opts.ambient !== false) startAmbient(); }
    else stopAmbient();
    document.dispatchEvent(new CustomEvent('soundchange', { detail: enabled }));
  };
  S.startAmbient = function () { if (ready()) startAmbient(); };
  Object.defineProperty(S, 'enabled', { get: function () { return enabled; } });
  S.supported = !!AC;

  window.SFX = S;
})();
