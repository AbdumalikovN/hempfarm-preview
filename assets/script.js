/* HEMP FARM — дизайн-версия: интерактив (vanilla JS, работает с file:// и на любом хостинге) */
(function () {
  'use strict';
  var ASSETS = ((document.currentScript && document.currentScript.src) || '').replace(/script\.js.*$/, '') || '/hempfarm-preview/assets/';

  /* ---- шапка: прозрачная над героем → сплошная при скролле ---- */
  var top = document.querySelector('.top');
  var bar = document.getElementById('scrollbar');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (top) top.classList.toggle('is-solid', y > 40);
    if (bar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- мобильное меню ---- */
  var burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
  document.querySelectorAll('.mobile-nav a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('nav-open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }); });

  /* ---- мега-меню: на сенсорных экранах первый тап открывает панель, второй — переходит ---- */
  document.querySelectorAll('.nav-item').forEach(function (item) {
    var link = item.querySelector('.nav-link');
    link.addEventListener('click', function (ev) {
      var touch = window.matchMedia('(hover: none)').matches;
      if (touch && !item.classList.contains('open')) {
        ev.preventDefault();
        document.querySelectorAll('.nav-item.open').forEach(function (o) { o.classList.remove('open'); });
        item.classList.add('open'); link.setAttribute('aria-expanded', 'true');
      }
    });
    item.addEventListener('mouseenter', function () { link.setAttribute('aria-expanded', 'true'); });
    item.addEventListener('mouseleave', function () { link.setAttribute('aria-expanded', 'false'); item.classList.remove('open'); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav-item')) document.querySelectorAll('.nav-item.open').forEach(function (o) { o.classList.remove('open'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.nav-item.open').forEach(function (o) { o.classList.remove('open'); }); });


  /* ---- появление при скролле ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- язык страницы: подписи и формат чисел ---- */
  var LANG = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var I18N = {
    ru: { skip: 'Пропустить', tag: 'Техническая конопля · полный цикл', video: 'Видео Hemp Farm', texture: 'Текстура', sending: 'Отправляем…', dec: ',', grp: ' ' },
    en: { skip: 'Skip', tag: 'Industrial hemp · full cycle', video: 'Hemp Farm video', texture: 'Texture', sending: 'Sending…', dec: '.', grp: ',' },
    uz: { skip: "O'tkazib yuborish", tag: "Texnik kanop · to'liq jarayon", video: 'Hemp Farm videosi', texture: 'Tekstura', sending: 'Yuborilmoqda…', dec: ',', grp: ' ' }
  }[LANG] || null;
  if (!I18N) I18N = { skip: 'Skip', tag: 'Hemp Farm', video: 'Hemp Farm', texture: 'Texture', sending: '…', dec: ',', grp: ' ' };

  /* ---- карусель продукции в первом экране ---- */
  document.querySelectorAll('[data-hero-slides]').forEach(function (box) {
    var slides = box.querySelectorAll('.hs'), dots = box.querySelectorAll('.hs-dot'), i = 0, timer = null, DUR = 5500;
    if (slides.length < 2) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.style.setProperty('--hs-dur', DUR + 'ms');
    function go(n) {
      slides[i].classList.remove('is-active'); if (dots[i]) dots[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      if (dots[i]) { dots[i].classList.remove('is-active'); void dots[i].offsetWidth; dots[i].classList.add('is-active'); }
      var im = slides[i].querySelector('img'); if (im && im.loading === 'lazy') im.loading = 'eager';
    }
    function play() { stop(); if (!reduce) timer = setInterval(function () { go(i + 1); }, DUR); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); play(); }); });
    box.addEventListener('mouseenter', function () { stop(); box.classList.add('is-paused'); });
    box.addEventListener('mouseleave', function () { box.classList.remove('is-paused'); play(); });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); play(); }
    }, { passive: true });
    setTimeout(function () { slides.forEach(function (s) { var im = s.querySelector('img'); if (im) im.loading = 'eager'; }); }, 2500);
    play();
  });

  /* ---- счётчики ---- */
  function animateCount(el) {
    var raw = String(el.getAttribute('data-count'));
    var target = parseFloat(raw.replace(',', '.'));
    var decimals = (raw.split(/[.,]/)[1] || '').length;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = parseInt(el.getAttribute('data-duration') || '2800', 10), t0 = null;
    /* фиксируем ширину по итоговому значению — соседний текст не сдвигается во время счёта */
    var w = el.getBoundingClientRect().width;
    if (window.getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
    el.style.minWidth = w + 'px';
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      /* плавный разгон и плавное торможение */
      var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var parts = (target * eased).toFixed(decimals).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, I18N.grp);
      var val = parts.join(I18N.dec);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  /* Итоговое значение всегда стоит в HTML (его видят поисковые роботы, браузеры без JS
     и посетитель при быстрой прокрутке). Анимация от нуля запускается только в момент,
     когда цифра появилась на экране, и заканчивается тем же значением. */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ioc = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); ioc.unobserve(e.target); } });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(function (el) { ioc.observe(el); });
  }

  /* ---- табы ---- */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = root.querySelectorAll('.tab[data-tab]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        root.querySelectorAll('[data-panel]').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === tab.getAttribute('data-tab'));
        });
      });
    });
  });

  /* ---- фильтры ---- */
  document.querySelectorAll('[data-filter-root]').forEach(function (root) {
    var chips = root.querySelectorAll('.tab[data-filter]');
    var all = root.querySelectorAll('[data-cat]');
    chips.forEach(function (chip) {
      var f0 = chip.getAttribute('data-filter'), n = 0;
      all.forEach(function (it) { if (f0 === 'all' || (it.getAttribute('data-cat') || '').split(/\s+/).indexOf(f0) !== -1) n++; });
      if (!chip.querySelector('.tab-n')) chip.insertAdjacentHTML('beforeend', ' <span class="tab-n">' + n + '</span>');
    });
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var f = chip.getAttribute('data-filter');
        root.querySelectorAll('[data-cat]').forEach(function (item) {
          var cats = (item.getAttribute('data-cat') || '').split(/\s+/);
          item.classList.toggle('hidden-by-filter', f !== 'all' && cats.indexOf(f) === -1);
        });
      });
    });
  });

  /* ---- степпер этапов: табы, панели, автопрокрутка с прогрессом, пауза при наведении ---- */
  document.querySelectorAll('[data-stepper]').forEach(function (st) {
    var tabs = [].slice.call(st.querySelectorAll('.st-tab')), panels = [].slice.call(st.querySelectorAll('.st-panel'));
    var dur = parseInt(st.getAttribute('data-autoplay') || '7000', 10), cur = 0, timer = null, auto = true, visible = false;
    st.style.setProperty('--st-dur', dur + 'ms');
    function show(i, user) {
      i = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) { t.classList.toggle('is-active', k === i); t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.classList.toggle('is-done', k < i); });
      panels.forEach(function (p, k) { if (k === i) { p.hidden = false; p.classList.add('is-active'); } else { p.hidden = true; p.classList.remove('is-active'); } });
      cur = i;
      if (tabs[i].scrollIntoView && window.innerWidth < 640) tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      restart(user);
    }
    function restart(user) {
      clearTimeout(timer);
      if (user) { auto = false; st.classList.remove('is-playing'); }
      if (auto && visible) {
        st.classList.remove('is-playing'); void st.offsetWidth; st.classList.add('is-playing');
        timer = setTimeout(function () { show(cur + 1, false); }, dur);
      }
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { show(k, true); }); });
    st.querySelectorAll('.st-next').forEach(function (b) { b.addEventListener('click', function () { show(cur + 1, true); }); });
    st.querySelectorAll('.st-prev').forEach(function (b) { b.addEventListener('click', function () { show(cur - 1, true); }); });
    st.addEventListener('mouseenter', function () { st.classList.add('is-paused'); clearTimeout(timer); });
    st.addEventListener('mouseleave', function () { st.classList.remove('is-paused'); if (auto) restart(false); });
    st.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(cur + 1, true); tabs[cur].focus(); }
      if (e.key === 'ArrowLeft') { show(cur - 1, true); tabs[cur].focus(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; if (visible && auto) restart(false); else clearTimeout(timer); }); }, { threshold: 0.35 }).observe(st);
    } else { visible = true; restart(false); }
  });

  /* ---- «прожектор» за курсором на карточках преимуществ ---- */
  document.querySelectorAll('[data-spot]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  /* ---- карта: наведение на пункт назначения подсвечивает маршрут ---- */
  document.querySelectorAll('.map--geo').forEach(function (map) {
    var pins = map.querySelectorAll('.pin[data-route]');
    function focus(pin) {
      map.classList.add('routes-focus');
      pins.forEach(function (p) { p.classList.remove('active'); });
      map.querySelectorAll('.routes .rt').forEach(function (r) { r.classList.remove('active'); });
      pin.classList.add('active');
      var r = map.querySelector('#' + pin.getAttribute('data-route'));
      if (r) r.classList.add('active');
    }
    function blur() { map.classList.remove('routes-focus'); pins.forEach(function (p) { p.classList.remove('active'); }); map.querySelectorAll('.routes .rt.active').forEach(function (r) { r.classList.remove('active'); }); }
    pins.forEach(function (pin) {
      pin.addEventListener('mouseenter', function () { focus(pin); });
      pin.addEventListener('focus', function () { focus(pin); });
      pin.addEventListener('mouseleave', blur);
      pin.addEventListener('blur', blur);
      pin.addEventListener('click', function () { if (pin.classList.contains('active') && map.classList.contains('routes-focus')) blur(); else focus(pin); });
    });
  });

  /* ---- слайдер «было / стало» ---- */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var range = ba.querySelector('input[type=range]');
    var after = ba.querySelector('.ba-after');
    var handle = ba.querySelector('.ba-handle');
    if (!range || !after || !handle) return;
    function upd() { after.style.clipPath = 'inset(0 0 0 ' + range.value + '%)'; handle.style.left = range.value + '%'; }
    range.addEventListener('input', upd); upd();
  });



  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });


  /* ---- интро-лоадер: только при первом визите; ?loader=1|2|3 — просмотр варианта ---- */
  (function () {
    var root = document.documentElement, box = document.getElementById('intro');
    if (!box) return;
    if (!root.classList.contains('intro')) { box.parentNode.removeChild(box); return; }
    var v = root.getAttribute('data-intro') || '1';
    var portrait = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    var clip = { '1': 'intro-field', '2': 'intro-irrigation' }[v];
    var file = clip ? ASSETS + 'video/' + clip + (portrait ? '-m' : '') : '';
    var html = '';
    if (v === '3') html = '<div class="in-lines"></div>';
    else html = '<div class="in-media" style="background-image:url(\'' + file + '.jpg\')"><video muted playsinline preload="auto" disablepictureinpicture></video></div><div class="in-shade"></div>' + (v === '2' ? '<i class="in-lb t"></i><i class="in-lb b"></i>' : '');
    html += '<div class="in-brand"><img src="' + ASSETS + (v === '3' ? 'logo.svg' : 'logo-light.svg') + '" alt=""><span class="in-tag">' + I18N.tag + '</span><span class="in-bar"><i></i></span></div>';
    if (v !== '3') html += '<button type="button" class="in-skip">' + I18N.skip + '</button>';
    box.setAttribute('data-v', v);
    box.innerHTML = html;
    try { localStorage.setItem('hf_intro', String(Date.now())); } catch (e) {}

    var barI = box.querySelector('.in-bar i'), done = false, t0 = Date.now();
    var total = v === '3' ? 1700 : (v === '2' ? 7000 : 5500);
    function prog(p) { if (barI) barI.style.transform = 'scaleX(' + Math.min(1, p) + ')'; }
    function finish() {
      if (done) return; done = true;
      prog(1); box.classList.add('out');
      root.classList.remove('intro-lock');
      setTimeout(function () { root.classList.remove('intro'); if (box.parentNode) box.parentNode.removeChild(box); }, 1300);
    }
    box.addEventListener('click', finish);
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { finish(); document.removeEventListener('keydown', k); } });
    window.addEventListener('wheel', finish, { passive: true, once: true });

    if (v === '3') {
      var tick3 = setInterval(function () { var p = (Date.now() - t0) / total; prog(p); if (p >= 1) { clearInterval(tick3); } }, 60);
      var ready = function () { setTimeout(finish, Math.max(0, total - (Date.now() - t0))); };
      if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
      setTimeout(finish, 4000);
      return;
    }
    var vid = box.querySelector('video');
    vid.src = file + (vid.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : '.webm');
    var started = false;
    vid.addEventListener('playing', function () { if (!started) { started = true; t0 = Date.now(); vid.classList.add('is-on'); } });
    vid.addEventListener('timeupdate', function () { if (vid.duration) prog(vid.currentTime / vid.duration); if (vid.duration && vid.currentTime > vid.duration - 0.35) finish(); });
    vid.addEventListener('ended', finish);
    vid.addEventListener('error', function () { setTimeout(finish, 1600); });
    var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
    /* нет автозапуска (режим энергосбережения) или медленная сеть: показываем кадр и открываем сайт */
    setTimeout(function () {
      if (started) return;
      var m = box.querySelector('.in-media'); if (m) m.style.transform = 'scale(1.06)';
      var s0 = Date.now(), tk = setInterval(function () { var p = (Date.now() - s0) / 1600; prog(p); if (p >= 1) clearInterval(tk); }, 60);
      setTimeout(finish, 1700);
    }, 2200);
    setTimeout(finish, total + 3500);
  })();


  /* ---- всплывающая карточка: 30–60 с на сайте, не чаще раза в 30 дней; закрывается смахиванием; ?promo=1 — показать сразу.
     Многоразовая: для новости поменяйте PROMO (id, path, img, text) — новый id покажется всем заново. ---- */
  (function () {
    var PROMO = {
      id: 'legal-1', path: '/industrial-hemp', img: 'photos/promo-legal.jpg', delay: [30, 60], every: 30,
      text: {
        ru: { k: 'Важно знать', t: 'Техническая конопля ≠ наркотик', d: 'Чем отличается, как контролируется и почему это законно.', c: 'Читать', h: 'смахните, чтобы скрыть' },
        en: { k: 'Good to know', t: 'Industrial hemp ≠ drug', d: 'How it differs, how it is controlled and why it is legal.', c: 'Read', h: 'swipe to dismiss' },
        uz: { k: "Bilib qo'ying", t: 'Texnik kanop ≠ giyohvand modda', d: 'Farqi nimada, qanday nazorat qilinadi va nega bu qonuniy.', c: "O'qish", h: 'yopish uchun suring' }
      }
    };
    function st(store, k, v) { try { var S = window[store]; if (v === undefined) return S.getItem(k); S.setItem(k, v); } catch (e) { return null; } }
    var tx = PROMO.text[LANG] || PROMO.text.ru;
    var pre = '/hempfarm-preview' + (LANG === 'ru' ? '' : '/' + LANG);
    var href = pre + PROMO.path;
    var here = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    var key = 'hf_promo_' + PROMO.id, force = /[?&]promo=1/.test(location.search);
    if (here === href) { st('localStorage', key, String(Date.now())); if (!force) return; }
    var last = +st('localStorage', key) || 0;
    if (!force && last && Date.now() - last < PROMO.every * 864e5) return;
    var target = +st('sessionStorage', 'hf_promo_target');
    if (!target) { target = Math.round((PROMO.delay[0] + Math.random() * (PROMO.delay[1] - PROMO.delay[0])) * 1000); st('sessionStorage', 'hf_promo_target', String(target)); }
    if (force) target = 1500;
    var spent = force ? 0 : (+st('sessionStorage', 'hf_promo_t') || 0);
    var iv = setInterval(function () {
      var R = document.documentElement;
      if (document.hidden || R.classList.contains('intro') || document.body.classList.contains('nav-open') || document.querySelector('.lightbox.open')) return;
      spent += 500; if (!force) st('sessionStorage', 'hf_promo_t', String(spent));
      if (spent >= target) { clearInterval(iv); show(); }
    }, 500);

    function show() {
      st('localStorage', key, String(Date.now()));
      var el = document.createElement('aside');
      el.className = 'promo'; el.setAttribute('aria-label', tx.k);
      el.innerHTML = '<a class="promo-card" href="' + href + '" draggable="false"><i class="promo-grip" aria-hidden="true"></i>' +
        '<img src="' + ASSETS + PROMO.img + '" alt="" width="76" height="76" draggable="false">' +
        '<span><span class="promo-k">' + tx.k + '</span><span class="promo-t">' + tx.t + '</span><span class="promo-d">' + tx.d + '</span>' +
        '<span class="promo-cta">' + tx.c + ' <span aria-hidden="true">→</span></span></span><span class="promo-hint" aria-hidden="true">' + tx.h + '</span></a>';
      document.body.appendChild(el); document.body.classList.add('promo-open');
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-in'); }); });
      var card = el.querySelector('.promo-card'), sx = 0, sy = 0, dx = 0, dy = 0, drag = false, moved = false, pid = null;
      function mobile() { return window.matchMedia('(max-width: 640px)').matches; }
      function place() {
        el.style.transform = mobile() ? 'translate(' + (dx * 0.9) + 'px,' + Math.max(0, dy) + 'px)'
                                      : 'translate(' + Math.max(-14, dx) + 'px,' + (dy > 0 ? dy : dy * 0.2) + 'px)';
      }
      card.addEventListener('pointerdown', function (e) { if (e.button) return; drag = true; moved = false; sx = e.clientX; sy = e.clientY; dx = dy = 0; pid = e.pointerId; });
      window.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== pid) return;
        dx = e.clientX - sx; dy = e.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) > 6) { moved = true; el.classList.add('is-drag'); try { card.setPointerCapture(pid); } catch (x) {} }
        if (moved) place();
      });
      function up() {
        if (!drag) return; drag = false; el.classList.remove('is-drag');
        if (!moved) return;
        var m = mobile();
        if (m && dy > 60) dismiss('d');
        else if (m && Math.abs(dx) > 90) dismiss(dx > 0 ? 'r' : 'l');
        else if (!m && dx > 80) dismiss('r');
        else if (!m && dy > 70) dismiss('d');
        else el.style.transform = '';
      }
      window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      card.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.parentNode) dismiss('r'); });
      function dismiss(dir) {
        el.classList.add('is-gone');
        el.style.transform = dir === 'd' ? 'translateY(130%)' : (dir === 'l' ? 'translateX(-120%)' : 'translateX(120%)');
        document.body.classList.remove('promo-open');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
      }
    }
  })();


  /* ---- стопка документов (Партнёрам): наведение/тап выводит документ вперёд, остальные уходят назад ---- */
  document.querySelectorAll('[data-docstack]').forEach(function (dk) {
    var docs = [].slice.call(dk.querySelectorAll('.dk-doc')), dots = [].slice.call(dk.querySelectorAll('.dk-dots button'));
    var cap = dk.querySelector('.dk-cap'), n = docs.length, cur = 0, timer = null, hover = false, seen = false;
    var narrow = window.matchMedia('(max-width: 760px)');
    function layout() {
      var step = narrow.matches ? 15 : 19;
      docs.forEach(function (d, i) {
        var k = i - cur; if (k > n / 2) k -= n; if (k < -n / 2) k += n;
        var a = Math.abs(k), vis = a <= 2;
        d.style.setProperty('--x', (k * step) + '%');
        d.style.setProperty('--y', (a * 3.5 - (k === 0 ? 2 : 0)) + '%');
        d.style.setProperty('--r', (k === 0 ? 0 : k * 5 + (k > 0 ? 1 : -1)) + 'deg');
        d.style.setProperty('--s', k === 0 ? 1.1 : (0.86 - a * 0.05).toFixed(3));
        d.style.setProperty('--z', String(20 - a));
        d.style.setProperty('--b', k === 0 ? 1 : (0.8 - a * 0.06).toFixed(2));
        d.style.setProperty('--o', vis ? 1 : 0);
        d.classList.toggle('is-front', k === 0);
        d.tabIndex = vis ? 0 : -1;
        d.setAttribute('aria-pressed', k === 0 ? 'true' : 'false');
      });
      dots.forEach(function (b, i) { b.classList.toggle('is-on', i === cur); });
      var f = docs[cur];
      if (cap) {
        cap.innerHTML = '<span class="dk-st">' + f.getAttribute('data-status') + '</span><b>' + f.getAttribute('data-title') + '</b><span class="dk-desc">' + f.getAttribute('data-desc') + '</span>';
        cap.classList.remove('is-swap'); void cap.offsetWidth; cap.classList.add('is-swap');
      }
    }
    function go(i) { i = (i + n) % n; if (i === cur) return; cur = i; layout(); }
    function auto() { clearInterval(timer); timer = setInterval(function () { if (!hover && seen && !document.hidden) go(cur + 1); }, 3800); }
    docs.forEach(function (d, i) {
      d.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) { hover = true; go(i); } });
      d.addEventListener('focus', function () { go(i); });
      d.addEventListener('click', function () { go(i); auto(); });
    });
    dk.addEventListener('mouseleave', function () { hover = false; auto(); });
    dots.forEach(function (b, i) { b.addEventListener('click', function () { go(i); auto(); }); });
    dk.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dk.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var sx = null;
    dk.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    dk.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); auto(); }
    }, { passive: true });
    dk.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(cur + 1); auto(); } if (e.key === 'ArrowLeft') { go(cur - 1); auto(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.3 }).observe(dk); else seen = true;
    if (narrow.addEventListener) narrow.addEventListener('change', layout);
    layout(); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto();
  });


  /* ---- горизонтальная галерея отгрузок: стрелки, перетаскивание мышью ---- */
  document.querySelectorAll('[data-hscroll]').forEach(function (sc) {
    var sec = sc.closest('section'), btns = sec ? [].slice.call(sec.querySelectorAll('.hs-btn')) : [];
    function stepW() { var c = sc.querySelector('.hs-card'); return c ? c.getBoundingClientRect().width + 16 : 300; }
    function upd() {
      var max = sc.scrollWidth - sc.clientWidth - 2;
      btns.forEach(function (b) { b.disabled = (+b.getAttribute('data-dir') < 0) ? sc.scrollLeft <= 2 : sc.scrollLeft >= max; });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { sc.scrollBy({ left: stepW() * 2 * (+b.getAttribute('data-dir')), behavior: 'smooth' }); }); });
    sc.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    var down = false, x0 = 0, s0 = 0, moved = false;
    sc.addEventListener('mousedown', function (e) { down = true; moved = false; x0 = e.pageX; s0 = sc.scrollLeft; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!down) return; var dx = e.pageX - x0; if (Math.abs(dx) > 4) { moved = true; sc.classList.add('is-drag'); } sc.scrollLeft = s0 - dx; });
    window.addEventListener('mouseup', function () { if (!down) return; down = false; sc.classList.remove('is-drag'); });
    sc.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });


  /* ---- таблицы: подписи столбцов для мобильной раскладки ---- */
  document.querySelectorAll('table.spec-table').forEach(function (t) {
    var hs = [].slice.call(t.querySelectorAll('thead th')).map(function (h) { return h.textContent.trim(); });
    if (!hs.length) return;
    if (hs.length > 3 || t.classList.contains('lh-table')) t.classList.add('st-lbl');
    t.querySelectorAll('tbody tr').forEach(function (tr) { [].slice.call(tr.children).forEach(function (td, i) { if (hs[i] && !td.hasAttribute('data-label')) td.setAttribute('data-label', hs[i]); }); });
  });

  /* ---- плавное появление фото после загрузки ---- */
  document.querySelectorAll('.img.has-img img').forEach(function (im) {
    if (im.complete && im.naturalWidth > 0) im.classList.add('loaded');
    else {
      im.addEventListener('load', function () { im.classList.remove('broken'); im.classList.add('loaded'); });
      im.addEventListener('error', function () { im.classList.remove('loaded'); im.classList.add('broken'); });
    }
  });

  /* ---- лёгкий параллакс изображения первого экрана ---- */
  var heroMedia = document.querySelector('.hero-media');
  if (heroMedia && window.matchMedia('(min-width: 1080px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var raf = null;
    window.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var y = window.scrollY || 0;
        heroMedia.style.transform = 'translateY(' + Math.min(y * 0.12, 90) + 'px)';
        raf = null;
      });
    }, { passive: true });
  }

  /* ---- кнопка «наверх» ---- */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () { toTop.classList.toggle('show', (window.scrollY || 0) > 700); }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---- лайтбокс для галереи и медиа ---- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    function openLb(src, alt) { lbImg.src = src.replace(/-sm\.jpg(\?.*)?$/, '.jpg'); lbImg.alt = alt || ''; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
    function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    document.querySelectorAll('.gallery .img.has-img img, .prod .img.has-img img, .g-item .img.has-img img, .hs-card .img.has-img img').forEach(function (im) {
      im.style.cursor = 'zoom-in';
      im.addEventListener('click', function () { openLb(im.currentSrc || im.src, im.alt); });
    });
    /* видео: слот .img.video с data-video="https://www.youtube.com/watch?v=..." открывает плеер */
    var lbVideo = document.createElement('div'); lbVideo.className = 'lb-video'; lb.appendChild(lbVideo);
    function ytEmbed(url) {
      var m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
      if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0';
      return url;
    }
    document.querySelectorAll('.img.video[data-video]').forEach(function (slot) {
      var url = slot.getAttribute('data-video');
      if (!url) return;
      slot.style.cursor = 'pointer';
      slot.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); slot.click(); } });
      slot.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        lbImg.style.display = 'none'; lbImg.removeAttribute('src');
        lbVideo.innerHTML = /\.(mp4|webm)(\?|$)/i.test(url)
          ? '<video src="' + url + '" controls autoplay playsinline preload="auto" title="' + I18N.video + '"></video>'
          : '<iframe src="' + ytEmbed(url) + '" title="' + I18N.video + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
        lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
      });
    });
    var closeLbBase = closeLb;
    closeLb = function () { closeLbBase(); lbVideo.innerHTML = ''; lbImg.style.display = ''; };
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lb-close')) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  /* ---- лупа на фото продукции (увеличение текстуры ×2.4 при наведении) ---- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.prod-media .img.has-img').forEach(function (box) {
      var im = box.querySelector('img'); if (!im) return;
      var loupe = document.createElement('div'); loupe.className = 'loupe'; box.appendChild(loupe);
      var hint = document.createElement('span'); hint.className = 'loupe-hint';
      hint.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M11 8.5v5M8.5 11h5"/></svg>' + I18N.texture;
      box.appendChild(hint);
      var Z = 2.4;
      function setBg() { loupe.style.backgroundImage = 'url("' + (im.currentSrc || im.src) + '")'; }
      box.addEventListener('mouseenter', function () { setBg(); loupe.classList.add('on'); });
      box.addEventListener('mouseleave', function () { loupe.classList.remove('on'); });
      box.addEventListener('mousemove', function (e) {
        var r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        var nw = im.naturalWidth || r.width, nh = im.naturalHeight || r.height;
        // как object-fit:cover отобразил картинку в контейнере
        var sc = Math.max(r.width / nw, r.height / nh), dw = nw * sc, dh = nh * sc, ox = (r.width - dw) / 2, oy = (r.height - dh) / 2;
        var L = loupe.offsetWidth, half = L / 2;
        loupe.style.left = (x - half) + 'px'; loupe.style.top = (y - half) + 'px';
        loupe.style.backgroundSize = (dw * Z) + 'px ' + (dh * Z) + 'px';
        loupe.style.backgroundPosition = (-((x - ox) * Z - half)) + 'px ' + (-((y - oy) * Z - half)) + 'px';
      });
    });
  }

  /* ---- WeChat: показать/скрыть подсказку с номером ---- */
  document.querySelectorAll('.wechat').forEach(function (w) {
    var btn = w.querySelector('.wechat-btn');
    btn.addEventListener('click', function (e) { e.stopPropagation(); var open = w.classList.toggle('open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.wechat')) document.querySelectorAll('.wechat.open').forEach(function (w) { w.classList.remove('open'); w.querySelector('.wechat-btn').setAttribute('aria-expanded', 'false'); }); });

  /* ---- подгонка размера шрифта: значение всегда в одну строку (телефон, email) ---- */
  function fitText() {
    document.querySelectorAll('[data-fit], .contact-val').forEach(function (el) {
      el.style.fontSize = '';
      var size = parseFloat(getComputedStyle(el).fontSize), min = 13;
      while (el.scrollWidth > el.clientWidth + 1 && size > min) { size -= 0.5; el.style.fontSize = size + 'px'; }
    });
  }
  fitText();
  window.addEventListener('resize', fitText);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);

  /* ---- кастомный select «Цель обращения» ---- */
  document.querySelectorAll('[data-select]').forEach(function (sel) {
    var native = sel.querySelector('select'), btn = sel.querySelector('.sel-btn'), list = sel.querySelector('.sel-list');
    var opts = [].slice.call(list.querySelectorAll('.sel-opt')), focusI = 0;
    function open() { document.querySelectorAll('[data-select].open').forEach(function (o) { if (o !== sel) close(o); }); sel.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); focusI = opts.findIndex(function (o) { return o.classList.contains('is-selected'); }); mark(); }
    function close(el) { (el || sel).classList.remove('open'); ((el || sel).querySelector('.sel-btn')).setAttribute('aria-expanded', 'false'); }
    function mark() { opts.forEach(function (o, i) { o.classList.toggle('is-focus', i === focusI); }); }
    function choose(i) {
      var o = opts[i]; if (!o) return;
      opts.forEach(function (x) { x.classList.remove('is-selected'); x.setAttribute('aria-selected', 'false'); });
      o.classList.add('is-selected'); o.setAttribute('aria-selected', 'true');
      native.value = o.getAttribute('data-value');
      btn.querySelector('.sel-val').textContent = o.getAttribute('data-value');
      btn.querySelector('.sel-ico').innerHTML = o.querySelector('.sel-ico').innerHTML;
      close(); btn.focus();
    }
    btn.addEventListener('click', function () { sel.classList.contains('open') ? close() : open(); });
    opts.forEach(function (o, i) { o.addEventListener('click', function () { choose(i); }); o.addEventListener('mousemove', function () { focusI = i; mark(); }); });
    sel.addEventListener('keydown', function (e) {
      if (!sel.classList.contains('open')) { if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].indexOf(e.key) > -1) { e.preventDefault(); open(); } return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); focusI = Math.min(opts.length - 1, focusI + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusI = Math.max(0, focusI - 1); mark(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(focusI); }
      else if (e.key === 'Escape' || e.key === 'Tab') { close(); }
    });
    document.addEventListener('click', function (e) { if (!sel.contains(e.target)) close(); });
  });

  /* ---- формы: проверка → заявка в Telegram (/api/lead.php); если сервер недоступен — запасная отправка на почту (FormSubmit) ---- */
  var LEAD_API = '/api/lead.php';
  document.querySelectorAll('form[action]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        f.style.borderColor = bad ? '#c0604a' : '';
        if (bad) ok = false;
      });
      ev.preventDefault();
      if (!ok) return;
      var btn = form.querySelector('button[type=submit]'), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = I18N.sending; }
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
      var fields = {};
      ['name', 'email', 'phone', 'company', 'purpose', 'dates', 'message'].forEach(function (n) { var v = get(n); if (v) fields[n] = v; });
      var checked = [];
      form.querySelectorAll('input[type=checkbox]:checked').forEach(function (c) { var t = (c.closest('label') || c.parentNode).textContent.trim(); checked.push(t || c.name); });
      var next = get('_next');
      var payload = { form: get('_subject') || document.title, fields: fields, checked: checked, honey: get('_honey'),
        page: location.href.split('#')[0], title: document.title, lang: LANG };
      var fallback = function () { if (btn) { btn.disabled = false; btn.innerHTML = label; } HTMLFormElement.prototype.submit.call(form); };
      if (!window.fetch) { fallback(); return; }
      var ctl = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
      fetch(LEAD_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined, credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : { ok: false }; })
        .then(function (j) {
          clearTimeout(t);
          if (j && j.ok) { location.href = next ? next.replace(/^https?:\/\/[^/]+/, '') : '/hempfarm-preview/thanks'; }
          else fallback();
        })
        .catch(function () { clearTimeout(t); fallback(); });
    });
  });

  /* ---- бургер: aria ---- */
  if (burger) burger.addEventListener('click', function () { burger.setAttribute('aria-expanded', document.body.classList.contains('nav-open') ? 'true' : 'false'); });
})();
