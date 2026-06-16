/* =====================================================================
 * Bgyarmatpaintball – rejtett admin szerkesztő (statikus, kliensoldali)
 * ---------------------------------------------------------------------
 * Belépés:  az oldal címe után írd be a #admin-t  ->  bgyarmatpaintball.hu/#admin
 * Jelszó:   alapértelmezetten "bgyarmat-admin"  (CSERÉLD le élesítés előtt!)
 *
 * Jelszócsere: generálj SHA-256 hasht az új jelszóból, és írd be a
 *   PASS_HASH konstansba. Pl. böngésző konzolban:
 *     await (async p => { const b = await crypto.subtle.digest('SHA-256',
 *       new TextEncoder().encode(p)); return [...new Uint8Array(b)]
 *       .map(x=>x.toString(16).padStart(2,'0')).join(''); })('UJ_JELSZO')
 *
 * FONTOS: ez NEM erős védelem (statikus oldal). A nyilvános látogatók a
 * tartalmat csak akkor látják módosítva, ha a content.json a tárhelyen van.
 * Munkafolyamat: szerkeszt -> Exportálás -> content.json a repóba/tárhelyre.
 * ===================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'bgyp_content_v1';
  // sha256("bgyarmat-admin")
  var PASS_HASH = '4e6ed4660963acb50553558c3061e2ce3ddfc4ea81f6fb9c43596db26b0bc380';

  function fields() { return Array.prototype.slice.call(document.querySelectorAll('[data-edit]')); }

  function syncLink(el) {
    var t = el.getAttribute('data-edit-link');
    if (!t) return;
    var txt = (el.textContent || '').trim();
    if (t === 'tel') el.setAttribute('href', 'tel:' + txt.replace(/[^\d+]/g, ''));
    else if (t === 'mailto') el.setAttribute('href', 'mailto:' + txt);
  }

  function applyContent(map) {
    if (!map) return;
    fields().forEach(function (el) {
      var k = el.getAttribute('data-edit');
      if (Object.prototype.hasOwnProperty.call(map, k) && map[k] != null) {
        el.innerHTML = map[k];
        syncLink(el);
      }
    });
  }

  function getStored() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setStored(map) { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); }

  function collectAll() {
    var map = {};
    fields().forEach(function (el) { map[el.getAttribute('data-edit')] = el.innerHTML.trim(); });
    return map;
  }
  // teljes tartalom-térkép (szövegek + csomagok)
  function buildMap() { var m = collectAll(); m.packages = packages; return m; }

  /* ---------- Csomagok (árazás) ---------- */
  var COLORS = [['none', 'Nincs'], ['orange', 'Narancs'], ['green', 'Zöld'], ['blue', 'Kék'], ['purple', 'Lila'], ['yellow', 'Sárga']];
  var DEFAULT_PACKAGES = [
    { name: 'Alap csomag', sub: '100 db golyóval', amount: '6 000', unit: 'Ft / fő',
      features: ['4 órás pályahasználat', 'Tippmann 98 marker', 'Overál & védőmaszk', 'Lányoknak védőmellény', '100 db golyó'],
      extra: 'További golyó: 17 Ft / db', badge: '', color: 'none' },
    { name: 'Alap csomag', sub: '200 db golyóval', amount: '8 000', unit: 'Ft / fő',
      features: ['4 órás pályahasználat', 'Tippmann 98 marker', 'Overál & védőmaszk', 'Lányoknak védőmellény', '200 db golyó'],
      extra: 'További golyó: 15 Ft / db', badge: 'Népszerű', color: 'orange' }
  ];
  var packages = DEFAULT_PACKAGES.slice();

  function esc(s) { s = (s == null ? '' : String(s)); return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

  function pkgCardHTML(p) {
    var cls = (p.color && p.color !== 'none') ? ' hl hl-' + p.color : '';
    var badge = p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '';
    var unit = p.unit ? ' <span>' + esc(p.unit) + '</span>' : '';
    var feats = (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var extra = p.extra ? '<p class="price-extra">' + esc(p.extra) + '</p>' : '';
    return '<article class="price-card' + cls + '">' + badge +
      '<h3 class="price-name">' + esc(p.name) + '</h3>' +
      '<p class="price-sub">' + esc(p.sub) + '</p>' +
      '<p class="price-value">' + esc(p.amount) + unit + '</p>' +
      '<ul class="price-feat">' + feats + '</ul>' + extra +
      '<a href="#kapcsolat" class="btn btn-primary btn-block">Foglalok</a></article>';
  }

  function renderPackages() {
    var track = document.getElementById('priceTrack');
    if (!track) return;
    track.innerHTML = packages.map(pkgCardHTML).join('');
    setupCarousel();
  }

  function setupCarousel() {
    var track = document.getElementById('priceTrack');
    var arrows = document.getElementById('priceArrows');
    var prev = document.getElementById('pcPrev');
    var next = document.getElementById('pcNext');
    if (!track || !arrows || !prev || !next) return;
    var viewport = track.parentElement;
    var animating = false;

    function overflowing() { return track.scrollWidth > viewport.clientWidth + 2; }
    function stepPx() {
      var c = track.firstElementChild; if (!c) return 320;
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      return c.getBoundingClientRect().width + gap;
    }
    function update() {
      if (overflowing()) { track.classList.add('is-carousel'); arrows.hidden = false; }
      else { track.classList.remove('is-carousel'); arrows.hidden = true; track.style.transform = ''; }
    }
    update();
    window.removeEventListener('resize', track._upd || function () {});
    track._upd = update;
    window.addEventListener('resize', update);

    next.onclick = function () {
      if (animating || !overflowing()) return; animating = true;
      var s = stepPx();
      track.style.transition = 'transform .4s ease';
      track.style.transform = 'translateX(-' + s + 'px)';
      track.addEventListener('transitionend', function h() {
        track.removeEventListener('transitionend', h);
        track.style.transition = 'none';
        track.appendChild(track.firstElementChild);
        track.style.transform = 'translateX(0)';
        void track.offsetWidth; animating = false;
      });
    };
    prev.onclick = function () {
      if (animating || !overflowing()) return; animating = true;
      var s = stepPx();
      track.style.transition = 'none';
      track.insertBefore(track.lastElementChild, track.firstElementChild);
      track.style.transform = 'translateX(-' + s + 'px)';
      void track.offsetWidth;
      track.style.transition = 'transform .4s ease';
      track.style.transform = 'translateX(0)';
      track.addEventListener('transitionend', function h() {
        track.removeEventListener('transitionend', h);
        track.style.transition = 'none'; animating = false;
      });
    };
  }

  function persistPackages() { var m = getStored(); m.packages = packages; setStored(m); }

  function openPackageEditor() {
    if (document.getElementById('pkgEditor')) return;
    var wrap = document.createElement('div');
    wrap.className = 'pkg-editor'; wrap.id = 'pkgEditor';
    wrap.innerHTML =
      '<div class="pkg-card">' +
      '  <div class="pkg-head"><h3>Csomagok szerkesztése</h3>' +
      '    <button type="button" class="btn btn-ghost" id="pkgAdd">＋ Új csomag</button></div>' +
      '  <div class="pkg-body" id="pkgList"></div>' +
      '  <div class="pkg-foot"><button type="button" class="btn btn-primary" id="pkgSave">Mentés</button>' +
      '    <button type="button" class="btn btn-ghost" id="pkgCancel">Mégse</button></div>' +
      '</div>';
    document.body.appendChild(wrap);
    var listEl = wrap.querySelector('#pkgList');
    var work = JSON.parse(JSON.stringify(packages));

    function rowHTML(p, i) {
      var sw = COLORS.map(function (c) {
        return '<span class="pkg-sw' + (p.color === c[0] ? ' sel' : '') + '" data-c="' + c[0] + '" data-i="' + i + '" title="' + c[1] + '"></span>';
      }).join('');
      return '<div class="pkg-item" data-i="' + i + '">' +
        '<button type="button" class="pkg-del" data-i="' + i + '" title="Csomag törlése">✕</button>' +
        '<div><label>Cím</label><input data-f="name" data-i="' + i + '" value="' + attr(p.name) + '"></div>' +
        '<div><label>Alcím</label><input data-f="sub" data-i="' + i + '" value="' + attr(p.sub) + '"></div>' +
        '<div><label>Összeg</label><input data-f="amount" data-i="' + i + '" value="' + attr(p.amount) + '"></div>' +
        '<div><label>Mértékegység</label><input data-f="unit" data-i="' + i + '" value="' + attr(p.unit) + '"></div>' +
        '<div class="full"><label>Jellemzők (soronként egy)</label><textarea data-f="features" data-i="' + i + '">' + esc((p.features || []).join('\n')) + '</textarea></div>' +
        '<div class="full"><label>Extra sor</label><input data-f="extra" data-i="' + i + '" value="' + attr(p.extra) + '"></div>' +
        '<div><label>Kiemelés címke (üres = nincs)</label><input data-f="badge" data-i="' + i + '" value="' + attr(p.badge) + '"></div>' +
        '<div><label>Kiemelés színe</label><div class="pkg-swatches">' + sw + '</div></div>' +
        '</div>';
    }
    function draw() { listEl.innerHTML = work.map(rowHTML).join(''); }
    draw();

    listEl.addEventListener('input', function (e) {
      var t = e.target, f = t.getAttribute('data-f');
      if (!f) return;
      var i = +t.getAttribute('data-i');
      if (f === 'features') work[i].features = t.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      else work[i][f] = t.value;
    });
    listEl.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('pkg-sw')) {
        var i = +t.getAttribute('data-i');
        work[i].color = t.getAttribute('data-c');
        t.parentElement.querySelectorAll('.pkg-sw').forEach(function (s) { s.classList.remove('sel'); });
        t.classList.add('sel');
      } else if (t.classList.contains('pkg-del')) {
        work.splice(+t.getAttribute('data-i'), 1); draw();
      }
    });
    wrap.querySelector('#pkgAdd').onclick = function () {
      work.push({ name: 'Új csomag', sub: '', amount: '0', unit: 'Ft / fő', features: [], extra: '', badge: '', color: 'none' });
      draw(); listEl.scrollTop = listEl.scrollHeight;
    };
    function close() { wrap.remove(); }
    wrap.querySelector('#pkgCancel').onclick = close;
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#pkgSave').onclick = function () {
      packages = work; persistPackages(); renderPackages(); close();
      toast('Csomagok mentve ebben a böngészőben. Az élesítéshez exportálj!');
    };
  }

  async function sha256(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.prototype.map.call(new Uint8Array(b), function (x) {
      return x.toString(16).padStart(2, '0');
    }).join('');
  }

  /* ---------- Tartalom betöltése (content.json + localStorage) ---------- */
  async function init() {
    var base = null;
    try {
      var r = await fetch('content.json', { cache: 'no-store' });
      if (r.ok) base = await r.json();
    } catch (e) { /* nincs content.json – alapértelmezett szövegek maradnak */ }
    if (base) applyContent(base);
    applyContent(getStored());

    // Csomagok: stored > content.json > alapértelmezett
    var merged = Object.assign({}, base || {}, getStored());
    if (Array.isArray(merged.packages) && merged.packages.length) packages = merged.packages;
    renderPackages();

    if (location.hash === '#admin') openLogin();
    window.addEventListener('hashchange', function () {
      if (location.hash === '#admin') openLogin();
    });
  }

  /* ---------- Belépő ablak ---------- */
  function openLogin() {
    if (document.getElementById('adminLogin') || document.body.classList.contains('admin-editing')) return;
    var wrap = document.createElement('div');
    wrap.className = 'admin-login';
    wrap.id = 'adminLogin';
    wrap.innerHTML =
      '<form class="admin-card" autocomplete="off">' +
      '  <h3>Admin belépés</h3>' +
      '  <input type="password" id="adminPass" placeholder="Jelszó" autocomplete="current-password" />' +
      '  <p class="admin-err" id="adminErr" hidden>Hibás jelszó.</p>' +
      '  <div class="admin-row">' +
      '    <button type="submit" class="btn btn-primary">Belépés</button>' +
      '    <button type="button" class="btn btn-ghost" id="adminCancel">Mégse</button>' +
      '  </div>' +
      '</form>';
    document.body.appendChild(wrap);
    var pass = wrap.querySelector('#adminPass');
    pass.focus();

    function close() {
      wrap.remove();
      if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search);
    }
    wrap.querySelector('#adminCancel').addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var ok = (await sha256(pass.value)) === PASS_HASH;
      if (ok) { wrap.remove(); enterEdit(); }
      else { wrap.querySelector('#adminErr').hidden = false; pass.select(); }
    });
  }

  /* ---------- Szerkesztő mód ---------- */
  function enterEdit() {
    document.body.classList.add('admin-editing');
    fields().forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.classList.add('admin-field');
    });
    buildToolbar();
    toast('Szerkesztő mód bekapcsolva. Kattints bármelyik kijelölt szövegre.');
  }

  function buildToolbar() {
    if (document.getElementById('adminBar')) return;
    var bar = document.createElement('div');
    bar.className = 'admin-toolbar';
    bar.id = 'adminBar';
    bar.innerHTML =
      '<span class="ttl">🎯 Admin szerkesztő</span>' +
      '<button type="button" class="btn btn-ghost" id="abPackages">🎫 Csomagok</button>' +
      '<button type="button" class="btn btn-primary" id="abSave">Mentés</button>' +
      '<button type="button" class="btn btn-ghost" id="abExport">Exportálás (JSON)</button>' +
      '<label class="btn btn-ghost" for="abImportFile">Importálás</label>' +
      '<input type="file" id="abImportFile" accept="application/json" hidden />' +
      '<button type="button" class="btn btn-ghost" id="abReset">Alaphelyzet</button>' +
      '<button type="button" class="btn btn-ghost" id="abExit">Kilépés</button>';
    document.body.appendChild(bar);

    bar.querySelector('#abPackages').addEventListener('click', openPackageEditor);
    bar.querySelector('#abSave').addEventListener('click', save);
    bar.querySelector('#abExport').addEventListener('click', exportJSON);
    bar.querySelector('#abReset').addEventListener('click', resetAll);
    bar.querySelector('#abExit').addEventListener('click', exitEdit);
    bar.querySelector('#abImportFile').addEventListener('change', importJSON);
  }

  function save() {
    fields().forEach(syncLink);
    setStored(buildMap());
    toast('Mentve ebben a böngészőben. Az élesítéshez exportálj és töltsd fel a content.json-t.');
  }

  function exportJSON() {
    save();
    var data = JSON.stringify(buildMap(), null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
    toast('content.json letöltve. Töltsd fel a tárhelyre, hogy mindenki lássa!');
  }

  function importJSON(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var map = JSON.parse(reader.result);
        applyContent(map);
        if (Array.isArray(map.packages) && map.packages.length) { packages = map.packages; renderPackages(); }
        setStored(buildMap());
        toast('Tartalom importálva és mentve.');
      } catch (err) { toast('Hibás JSON fájl.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetAll() {
    if (!confirm('Biztosan visszaállítod az eredeti szövegeket? A böngészőben mentett módosítások törlődnek.')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function exitEdit() {
    save();
    fields().forEach(function (el) {
      el.removeAttribute('contenteditable');
      el.classList.remove('admin-field');
    });
    document.body.classList.remove('admin-editing');
    var bar = document.getElementById('adminBar'); if (bar) bar.remove();
    if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search);
    toast('Kiléptél a szerkesztőből.');
  }

  /* ---------- Apró visszajelzés ---------- */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('adminToast');
    if (!t) { t = document.createElement('div'); t.id = 'adminToast'; t.className = 'admin-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
