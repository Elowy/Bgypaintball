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

/* ===== Scroll reveal ===== */
(function () {
  const targets = document.querySelectorAll(
    '.section-head, .card, .price-card, .gallery-item, .partner, .media-card, .price-note'
  );
  targets.forEach(function (el) { el.classList.add('reveal'); });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();
