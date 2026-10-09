/* Skull Darts 71 · Application */
(function () {
  'use strict';

  var doc = document, html = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var t = function (k, v) { return I18N.t(k, v); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var sfx = window.SFX || { enabled: false };

  I18N.init();

  /* ---------- Titre lettre par lettre ---------- */
  var title = $('[data-split]');
  if (title) {
    var txt = title.textContent;
    title.innerHTML = '<span class="sr-only">' + txt + '</span>' + txt.split('').map(function (c, i) {
      return '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + c + '</span>';
    }).join('');
  }

  /* ---------- Révélation du héro après l'intro ---------- */
  var hero = $('.hero');
  function revealHero() { hero.classList.add('is-in'); }
  doc.addEventListener('intro:reveal', revealHero);
  if (!window.SD71Intro || SD71Intro.state === 'done') revealHero();

  /* ---------- En-tête ---------- */
  var header = $('.header'), lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.8);
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  onScroll();

  // Lien actif
  var links = $$('.nav a');
  var secIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(function (s) { secIO.observe(s); });

  /* ---------- Révélations au défilement ---------- */
  var revIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach(function (el) {
    var sib = $$('.reveal', el.parentElement).filter(function (x) { return x.parentElement === el.parentElement; });
    el.style.setProperty('--stagger', Math.max(0, sib.indexOf(el)));
    revIO.observe(el);
  });

  /* ---------- Compte à rebours ---------- */
  var START = Date.parse('2026-10-31T17:00:00+01:00');
  var END = Date.parse('2026-11-01T02:00:00+01:00');
  var cdEls = {}; $$('[data-cd]').forEach(function (el) { cdEls[el.dataset.cd] = el; });
  var cdBox = $('#countdown'), cdMsg = $('#countdown-msg'), cdTimer = 0;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function setCd(k, v) {
    var el = cdEls[k], s = pad(v);
    if (el.textContent !== s) { el.textContent = s; if (!reduced) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } }
  }
  function countdown() {
    var now = Date.now(), d = START - now;
    if (d <= 0) {
      cdBox.hidden = true; cdMsg.hidden = false;
      cdMsg.textContent = now < END ? t('cd.live') : t('cd.over');
      clearInterval(cdTimer); return;
    }
    var s = Math.floor(d / 1000);
    setCd('d', Math.floor(s / 86400)); setCd('h', Math.floor(s % 86400 / 3600));
    setCd('m', Math.floor(s % 3600 / 60)); setCd('s', s % 60);
  }
  countdown();
  cdTimer = setInterval(countdown, 1000);
  doc.addEventListener('langchange', countdown);

  /* ---------- Transitions (View Transitions API) ---------- */
  function withTransition(btn, fn) {
    if (!doc.startViewTransition || reduced) { fn(); return; }
    var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    html.style.setProperty('--vt-x', x + 'px'); html.style.setProperty('--vt-y', y + 'px');
    html.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
    doc.startViewTransition(fn);
  }

  /* ---------- Thème ---------- */
  var themeBtn = $('#theme-toggle');
  function metaTheme() {
    var c = html.dataset.theme === 'light' ? '#f3e3c3' : '#120a22';
    $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  }
  themeBtn.addEventListener('click', function () {
    var next = html.dataset.theme === 'light' ? 'dark' : 'light';
    sfx.toggle && sfx.toggle(next === 'dark');
    withTransition(themeBtn, function () {
      html.dataset.theme = next; metaTheme();
      try { localStorage.setItem('sd71-theme', next); } catch (e) {}
    });
  });
  try { if (localStorage.getItem('sd71-theme')) metaTheme(); } catch (e) {}

  /* ---------- Langue ---------- */
  var langBtn = $('#lang-toggle');
  langBtn.addEventListener('click', function () {
    var next = I18N.lang === 'fr' ? 'en' : 'fr';
    sfx.click && sfx.click();
    withTransition(langBtn, function () {
      I18N.apply(next);
      var u = new URL(location.href);
      if (next === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang');
      history.replaceState(null, '', u);
    });
  });

  /* ---------- Son ---------- */
  var soundBtn = $('#sound-toggle');
  function syncSound() { soundBtn.setAttribute('aria-pressed', sfx.enabled ? 'true' : 'false'); }
  doc.addEventListener('soundchange', syncSound);
  syncSound();
  if (!sfx.supported) soundBtn.hidden = true;
  soundBtn.addEventListener('click', function () {
    var on = !sfx.enabled;
    sfx.setEnabled(on);
    if (on) sfx.toggle(true);
    toast(t(on ? 'toast.soundOn' : 'toast.soundOff'));
  });

  // Micro-sons d'interface
  $$('.btn, .nav a, .ctrl, .faq summary, .linkbtn').forEach(function (el) {
    if (finePointer) el.addEventListener('pointerenter', function () { sfx.hover && sfx.hover(); });
  });
  $$('[data-sfx], .nav a, .faq summary').forEach(function (el) {
    el.addEventListener('click', function () { sfx.click && sfx.click(); });
  });

  /* ---------- Effets pointeur ---------- */
  if (finePointer && !reduced) {
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.transform = 'rotateX(' + ((0.5 - py) * 10) + 'deg) rotateY(' + ((px - 0.5) * 12) + 'deg) translateZ(0)';
        c.style.setProperty('--gx', px * 100 + '%'); c.style.setProperty('--gy', py * 100 + '%');
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
    // Parallaxe douce du ciel
    var sky = $('.hero__sky'), pend = false, mx = 0, my = 0;
    hero.addEventListener('pointermove', function (e) {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      if (pend) return; pend = true;
      requestAnimationFrame(function () { sky.style.transform = 'translate3d(' + mx * -18 + 'px,' + my * -12 + 'px,0)'; pend = false; });
    });
  }

  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  /* ---------- Agenda (.ics) ---------- */
  $('#add-cal').addEventListener('click', function () {
    var en = I18N.lang === 'en';
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Skull Darts 71//Halloween Party//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:halloween-2026@skulldarts71',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
      'DTSTART:20261031T160000Z',
      'DTEND:20261101T010000Z',
      'SUMMARY:' + (en ? 'Halloween Party – Skull Darts 71' : 'Halloween Party – Skull Darts 71'),
      'LOCATION:' + (en ? 'Bellevesvre village hall\\, 71270 Bellevesvre\\, France' : 'Salle des fêtes de Bellevesvre\\, 71270 Bellevesvre'),
      'DESCRIPTION:' + (en
        ? 'Kids from 5 pm: snacks & disco. Adults from 7:30 pm: happy hour (7:30–8:30 pm) & DJ. Bar & food. Fancy dress. Entry €3.'
        : 'Enfants dès 17h : goûter & boom. Adultes dès 19h30 : happy hour (19h30–20h30) & animation DJ. Buvette & petite restauration. Soirée déguisée. Entrée 3 €.'),
      'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:Halloween Party 🎃', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    var a = doc.createElement('a'); a.href = url; a.download = 'halloween-party-skull-darts-71.ics';
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast(t('toast.cal'));
  });

  /* ---------- Partage ---------- */
  $('#share').addEventListener('click', function () {
    var data = { title: 'Halloween Party · Skull Darts 71', text: t('share.text'), url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { toast(t('toast.copied')); });
  });

  /* ---------- Lightbox affiche ---------- */
  var lb = $('#lightbox'), lbImg = $('#lightbox-img');
  $('#poster-open').addEventListener('click', function () {
    var src = $('#poster-open img');
    lbImg.src = src.currentSrc || src.src; lbImg.alt = src.alt;
    if (lb.showModal) lb.showModal(); else window.open(lbImg.src, '_blank');
  });
  $('#lightbox-close').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });

  /* ---------- Rejouer l'intro ---------- */
  $('#replay-intro').addEventListener('click', function () {
    if (!window.SD71Intro) return;
    html.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); html.style.scrollBehavior = '';
    hero.classList.remove('is-in');
    SD71Intro.replay();
  });

  /* ---------- Service worker (hors-ligne) ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
