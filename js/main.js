/* ===== Mobile navigation toggle ===== */
(function () {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    });
    // Close menu when a link is clicked
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

/* ===== Current year in footer ===== */
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* ===== Cookie consent gate (battle intro) + deferred Facebook feed ===== */
(function () {
  const KEY = 'bgyp_cookie_consent';
  const gate = document.getElementById('cookieGate');

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Facebook SDK betöltése + a feed kirajzolása (megbízhatóan)
  function ensureFB(cb) {
    if (window.FB && window.FB.XFBML) { cb && cb(); return; }
    if (!window.__fbLoading) {
      window.__fbLoading = true;
      window.fbAsyncInit = function () {
        try { FB.init({ xfbml: false, version: 'v19.0' }); } catch (e) {}
        window.__fbReady = true;
      };
      const s = document.createElement('script');
      s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
      s.src = 'https://connect.facebook.net/hu_HU/sdk.js';
      document.body.appendChild(s);
    }
    let tries = 0;
    const t = setInterval(function () {
      tries++;
      if (window.FB && window.FB.XFBML) { clearInterval(t); cb && cb(); }
      else if (tries > 120) { clearInterval(t); } // ~24s után feladjuk
    }, 200);
  }

  function showFeed() {
    const ph = document.getElementById('fbPlaceholder');
    const page = document.querySelector('.fb-embed .fb-page');
    if (ph) ph.hidden = true;
    if (page) page.style.display = '';
    ensureFB(function () {
      try { FB.XFBML.parse(document.querySelector('.fb-embed')); } catch (e) {}
    });
  }

  function showPlaceholder() {
    const ph = document.getElementById('fbPlaceholder');
    const page = document.querySelector('.fb-embed .fb-page');
    if (page) page.style.display = 'none';
    if (ph) ph.hidden = false;
  }

  // A feed manuális betöltése (placeholder gomb) – egyúttal marketing süti elfogadása
  window.bgypLoadFeed = function () { set('all'); showFeed(); };

  // Süti-újranyitás (footer link)
  window.bgypOpenCookie = function () {
    if (gate) { gate.hidden = false; document.body.classList.add('no-scroll'); }
  };

  const consent = get();

  // Facebook feed állapota a hozzájárulás szerint
  if (consent === 'all') showFeed();
  else showPlaceholder();

  // Süti-kapu kezelése (csak ha van a lapon)
  if (gate) {
    const dismiss = function () { gate.hidden = true; document.body.classList.remove('no-scroll'); };
    if (!consent) { gate.hidden = false; document.body.classList.add('no-scroll'); }
    const all = document.getElementById('cgAll');
    const nec = document.getElementById('cgNec');
    if (all) all.addEventListener('click', function () { set('all'); showFeed(); dismiss(); });
    if (nec) nec.addEventListener('click', function () { set('necessary'); showPlaceholder(); dismiss(); });
  }
})();

/* ===== Hero háttér parallax ===== */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.hero');
  const bg = document.getElementById('heroSlideshow');
  if (!hero || !bg) return;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      const y = window.pageYOffset || 0;
      if (y < hero.offsetHeight + 100) bg.style.transform = 'translate3d(0,' + (y * 0.3) + 'px,0)';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ===== Hero background slideshow ===== */
(function () {
  const slides = Array.prototype.slice.call(
    document.querySelectorAll('#heroSlideshow .hero-slide')
  );
  if (slides.length < 2) return;

  let i = 0;
  const INTERVAL = 5000; // ms between slides

  function next() {
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    // restart the Ken Burns zoom by reflowing the element
    const el = slides[i];
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow
    el.style.animation = '';
    el.classList.add('is-active');
  }

  let timer = setInterval(next, INTERVAL);

  // Pause rotation when the tab is hidden to save resources
  document.addEventListener('visibilitychange', function () {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(next, INTERVAL);
  });
})();

/* ===== Back to top floating button ===== */
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const SHOW_AT = 300; // px görgetés után jelenik meg

  function onScroll() {
    if (window.pageYOffset > SHOW_AT) btn.classList.add('show');
    else btn.classList.remove('show');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();

/* ===== Info toggles (pl. Tippmann 98 magyarázat) ===== */
(function () {
  document.querySelectorAll('.info-btn').forEach(function (btn) {
    const li = btn.closest('.info-li');
    if (!li) return;
    btn.addEventListener('click', function () {
      const open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
})();

/* ===== Call button: stick figure shoots it, color changes on hit ===== */
(function () {
  const widget = document.querySelector('.call-widget');
  if (!widget) return;
  const btn = widget.querySelector('.call-btn');
  const pb = widget.querySelector('.cw-pb');
  if (!btn || !pb) return;

  const colors = ['#ff5a1f', '#39ff7a', '#1fb6ff', '#b14bff', '#ffd400'];
  let i = 0;
  btn.style.background = colors[0];
  pb.style.background = colors[1];

  // Minden lövedék-kör végén = találat -> új szín
  pb.addEventListener('animationiteration', function () {
    i = (i + 1) % colors.length;
    btn.style.background = colors[i];
    pb.style.background = colors[(i + 1) % colors.length];
    btn.classList.add('hit');
    setTimeout(function () { btn.classList.remove('hit'); }, 300);
  });
})();

/* ===== Ajándékutalvány rendelő modal (mailto) ===== */
(function () {
  var openBtn = document.getElementById('voucherOrderBtn');
  var modal = document.getElementById('voucherModal');
  if (!openBtn || !modal) return;
  var form = document.getElementById('voucherForm');
  var closeBtn = document.getElementById('voucherClose');
  var err = document.getElementById('vmErr');
  var EMAIL = 'bgyarmatpaintball@gmail.com';

  function open() {
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { modal.classList.add('show'); });
    var n = document.getElementById('vmName');
    if (n) setTimeout(function () { n.focus(); }, 60);
  }
  function close() {
    modal.classList.remove('show');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { modal.hidden = true; }, 300);
  }

  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var name = v('vmName'), phone = v('vmPhone');
    if (!name || !phone) { if (err) err.hidden = false; return; }
    if (err) err.hidden = true;

    var payEl = form.querySelector('input[name="pay"]:checked');
    var pay = payEl ? payEl.value : '';
    var lines = [
      'Ajándékutalvány megrendelés',
      '----------------------------',
      'Név: ' + name,
      'Telefon: ' + phone,
      'E-mail: ' + (v('vmEmail') || '-'),
      'Utalvány értéke / csomag: ' + (v('vmValue') || '-'),
      'Darabszám: ' + (v('vmQty') || '1'),
      'Fizetési mód: ' + pay,
      'Megjegyzés: ' + (v('vmMsg') || '-')
    ];
    var subject = 'Ajándékutalvány rendelés – ' + name;
    var href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
    close();
  });
})();

/* ===== Lightbox (gallery image zoom) ===== */
(function () {
  const imgs = Array.prototype.slice.call(
    document.querySelectorAll('#gallery .gallery-item img')
  );
  const lb = document.getElementById('lightbox');
  if (!imgs.length || !lb) return;

  const lbImg = document.getElementById('lbImg');
  const counter = document.getElementById('lbCounter');
  let idx = 0;

  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    const src = imgs[idx];
    lbImg.src = src.currentSrc || src.src;
    lbImg.alt = src.alt || '';
    counter.textContent = (idx + 1) + ' / ' + imgs.length;
  }
  function open(i) {
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  imgs.forEach(function (im, i) {
    im.addEventListener('click', function () { open(i); });
  });
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
  document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();

/* ===== Paintball splatter on scroll ===== */
(function () {
  const paints = document.querySelectorAll('.paint');
  if (!paints.length) return;
  if (!('IntersectionObserver' in window)) {
    paints.forEach(function (p) { p.classList.add('in'); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  paints.forEach(function (p) { io.observe(p); });
})();

/* ===== Scroll reveal (lépcsőzetes) ===== */
(function () {
  const targets = document.querySelectorAll(
    '.section-head, .card, .price-card, .gm-card, .gallery-item, .partner, .media-card, .price-note, .fb-feed, .voucher-visual, .voucher-info'
  );
  targets.forEach(function (el) { el.classList.add('reveal'); });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    // Egyszerre megjelenő elemek dokumentum-sorrendben, kis késleltetéssel
    const showing = entries.filter(function (e) { return e.isIntersecting; })
      .sort(function (a, b) {
        return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    showing.forEach(function (entry, i) {
      const el = entry.target;
      const d = Math.min(i, 6) * 75;
      el.style.transitionDelay = d + 'ms';
      el.classList.add('in');
      io.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = ''; }, 1000 + d);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();
