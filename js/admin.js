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
  // sha256("bgyarmat-admin")  – csak a szerver nélküli (statikus) tartalék belépéshez
  var PASS_HASH = '4e6ed4660963acb50553558c3061e2ce3ddfc4ea81f6fb9c43596db26b0bc380';

  // Szerveroldali backend (PHP). Ha elérhető, innen tölt és ide ment -> mindenki azonnal látja.
  var API = 'content.php';
  var apiAvailable = false;   // az init() állítja be, ha a content.php válaszol
  var adminPassword = null;   // belépés után memóriában, a szerverre mentéshez

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
  // A betöltött content.json (más oldalak kulcsai is: pl. privacy.*), hogy
  // mentés/export során ne vesszenek el a jelenlegi oldalon nem szereplő mezők.
  var baseContent = {};

  // teljes tartalom-térkép: content.json + localStorage + a jelenlegi oldal
  // [data-edit] mezői (ez utóbbi nyer), plusz csomagok és promó.
  function buildMap() {
    var m = Object.assign({}, baseContent, getStored(), collectAll());
    m.packages = packages; m.promo = promo; return m;
  }

  // Mentés a szerverre (ha van backend és be vagyunk lépve). Promise<bool>.
  function saveToServer() {
    if (!apiAvailable || !adminPassword) return Promise.resolve(null);
    return fetch(API + '?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, content: buildMap() })
    }).then(function (r) { return r.json(); })
      .then(function (j) { return !!(j && j.ok); })
      .catch(function () { return false; });
  }

  // Egységes mentés: helyi (localStorage) + ha van, a szerverre is.
  function commit(okMsg) {
    fields().forEach(syncLink);
    setStored(buildMap());
    if (apiAvailable && adminPassword) {
      saveToServer().then(function (ok) {
        toast(ok ? (okMsg || 'Mentve a szerverre – mindenki látja! ✅')
                 : 'Szerverre mentés sikertelen (jelszó vagy írási jog?).');
      });
    } else {
      toast('Mentve ebben a böngészőben. Éles megjelenéshez: tölts fel content.php-t, vagy exportálj.');
    }
  }

  /* ---------- Promóciós popup ---------- */
  var DEFAULT_PROMO = { enabled: false, title: '🎯 Nyári akció!', text: 'Foglalj most és hozz egy barátot ingyen! Az ajánlat a hónap végéig él.', btnLabel: 'Foglalok', btnLink: '#kapcsolat', color: 'orange' };
  var promo = Object.assign({}, DEFAULT_PROMO);

  function promoHash(p) { try { return JSON.stringify(p); } catch (e) { return ''; } }

  function maybeShowPromo() {
    var pop = document.getElementById('promoPop');
    if (!pop || !promo || !promo.enabled) { if (pop) pop.hidden = true; return; }
    var gate = document.getElementById('cookieGate');
    if (gate && !gate.hidden) { setTimeout(maybeShowPromo, 700); return; } // várunk a süti-elfogadásra
    var h = promoHash(promo);
    try { if (localStorage.getItem('bgyp_promo_dismissed') === h) return; } catch (e) {}
    fillPromo(pop, h);
  }

  function fillPromo(pop, h) {
    var t = document.getElementById('promoTitle');
    var x = document.getElementById('promoText');
    var btn = document.getElementById('promoBtn');
    if (t) t.textContent = promo.title || '';
    if (x) x.textContent = promo.text || '';
    if (btn) {
      if (promo.btnLabel) { btn.textContent = promo.btnLabel; btn.href = promo.btnLink || '#'; btn.style.display = ''; }
      else { btn.style.display = 'none'; }
    }
    pop.className = 'promo-pop' + (promo.color && promo.color !== 'none' ? ' hl hl-' + promo.color : '');
    pop.hidden = false;
    requestAnimationFrame(function () { pop.classList.add('show'); });

    var close = document.getElementById('promoClose');
    if (close) close.onclick = function () {
      pop.classList.remove('show');
      try { localStorage.setItem('bgyp_promo_dismissed', h); } catch (e) {}
      setTimeout(function () { pop.hidden = true; }, 400);
    };
    if (btn) btn.onclick = function () {
      try { localStorage.setItem('bgyp_promo_dismissed', h); } catch (e) {}
      pop.classList.remove('show');
    };
  }

  function refreshPromo() {
    // admin mentés után: töröljük az elrejtést, hogy azonnal látszódjon
    try { localStorage.removeItem('bgyp_promo_dismissed'); } catch (e) {}
    var pop = document.getElementById('promoPop');
    if (pop) { pop.classList.remove('show'); pop.hidden = true; }
    maybeShowPromo();
  }

  function openPromoEditor() {
    if (document.getElementById('promoEditor')) return;
    var p = promo;
    var sw = COLORS.map(function (c) {
      return '<span class="pkg-sw' + (p.color === c[0] ? ' sel' : '') + '" data-c="' + c[0] + '" title="' + c[1] + '"></span>';
    }).join('');
    var wrap = document.createElement('div');
    wrap.className = 'pkg-editor'; wrap.id = 'promoEditor';
    wrap.innerHTML =
      '<div class="pkg-card"><div class="pkg-head"><h3>Promóciós popup</h3></div>' +
      '<div class="pkg-body" style="gap:.8rem">' +
      '  <label style="display:flex;align-items:center;gap:.6rem;color:var(--text);font-weight:600;cursor:pointer">' +
      '    <input type="checkbox" id="prEnabled"' + (p.enabled ? ' checked' : '') + '> Popup bekapcsolva</label>' +
      '  <div class="priv-row"><label>Cím</label><input id="prTitle" value="' + attr(p.title) + '"></div>' +
      '  <div class="priv-row"><label>Szöveg</label><textarea id="prText">' + esc(p.text) + '</textarea></div>' +
      '  <div class="priv-row"><label>Gomb felirata (üres = nincs gomb)</label><input id="prBtn" value="' + attr(p.btnLabel) + '"></div>' +
      '  <div class="priv-row"><label>Gomb linkje</label><input id="prLink" value="' + attr(p.btnLink) + '"></div>' +
      '  <div class="priv-row"><label>Kiemelés színe</label><div class="pkg-swatches" id="prSwatches">' + sw + '</div></div>' +
      '</div>' +
      '<div class="pkg-foot"><button type="button" class="btn btn-primary" id="prSave">Mentés</button>' +
      '<button type="button" class="btn btn-ghost" id="prCancel">Mégse</button></div></div>';
    document.body.appendChild(wrap);
    var chosen = p.color || 'none';
    wrap.querySelector('#prSwatches').addEventListener('click', function (e) {
      if (!e.target.classList.contains('pkg-sw')) return;
      chosen = e.target.getAttribute('data-c');
      wrap.querySelectorAll('#prSwatches .pkg-sw').forEach(function (s) { s.classList.remove('sel'); });
      e.target.classList.add('sel');
    });
    function close() { wrap.remove(); }
    wrap.querySelector('#prCancel').onclick = close;
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#prSave').onclick = function () {
      promo = {
        enabled: wrap.querySelector('#prEnabled').checked,
        title: wrap.querySelector('#prTitle').value.trim(),
        text: wrap.querySelector('#prText').value.trim(),
        btnLabel: wrap.querySelector('#prBtn').value.trim(),
        btnLink: wrap.querySelector('#prLink').value.trim(),
        color: chosen
      };
      refreshPromo();
      close();
      commit('Promóció mentve a szerverre – mindenki látja! ✅');
    };
  }

  /* ---------- Adatvédelmi adatok (más oldalon jelennek meg) ---------- */
  var PRIVACY_FIELDS = [
    ['privacy.controllerName', 'Adatkezelő neve', 'text', 'Bgyarmatpaintball'],
    ['privacy.controllerAddress', 'Cím / székhely', 'text', '2660 Balassagyarmat, Fenyves út'],
    ['privacy.email', 'E-mail', 'text', 'bgyarmatpaintball@gmail.com'],
    ['privacy.phone', 'Telefon', 'text', '06 30 720 84 99'],
    ['privacy.website', 'Weboldal', 'text', 'bgyarmatpaintball.hu'],
    ['privacy.regInfo', 'Nyilvántartási / adószám', 'text', '(egyéni vállalkozó vagy cég nyilvántartási száma, adószáma)'],
    ['privacy.hosting', 'Tárhelyszolgáltató', 'area', '(a tárhelyszolgáltató neve és elérhetősége)'],
    ['privacy.updated', 'Hatály / frissítés dátuma', 'text', '2026.']
  ];

  function openPrivacyEditor() {
    if (document.getElementById('privEditor')) return;
    var stored = getStored();
    var rows = PRIVACY_FIELDS.map(function (f) {
      // sorrend: localStorage > content.json > alapértelmezett (ne írjuk felül a valós értékeket)
      var v = (stored[f[0]] != null) ? stored[f[0]] : (baseContent[f[0]] != null ? baseContent[f[0]] : f[3]);
      var input = f[2] === 'area'
        ? '<textarea data-k="' + f[0] + '">' + esc(v) + '</textarea>'
        : '<input data-k="' + f[0] + '" value="' + attr(v) + '">';
      return '<div class="priv-row"><label>' + f[1] + '</label>' + input + '</div>';
    }).join('');
    var wrap = document.createElement('div');
    wrap.className = 'pkg-editor'; wrap.id = 'privEditor';
    wrap.innerHTML =
      '<div class="pkg-card"><div class="pkg-head"><h3>Adatvédelmi adatok</h3></div>' +
      '<div class="pkg-body" style="gap:.8rem">' + rows + '</div>' +
      '<div class="pkg-foot"><button type="button" class="btn btn-primary" id="privSave">Mentés</button>' +
      '<button type="button" class="btn btn-ghost" id="privCancel">Mégse</button></div></div>';
    document.body.appendChild(wrap);
    function close() { wrap.remove(); }
    wrap.querySelector('#privCancel').onclick = close;
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#privSave').onclick = function () {
      var m = getStored();
      wrap.querySelectorAll('[data-k]').forEach(function (el) { m[el.getAttribute('data-k')] = el.value.trim(); });
      setStored(m);
      applyContent(m);
      close();
      commit('Adatvédelmi adatok mentve a szerverre! ✅');
    };
  }

  /* ---------- Csomagok (árazás) ---------- */
  var COLORS = [['none', 'Nincs'], ['orange', 'Narancs'], ['green', 'Zöld'], ['blue', 'Kék'], ['purple', 'Lila'], ['yellow', 'Sárga'], ['gold', 'Arany']];
  var DEFAULT_PACKAGES = [
    { name: 'Újonc csomag', sub: '100 db golyóval', amount: '6 000', unit: 'Ft / fő',
      features: ['4 órás pályahasználat', 'Tippmann 98 marker', 'Overál & védőmaszk', 'Lányoknak védőmellény', '100 db golyó'],
      extra: 'További golyó: 17 Ft / db', badge: '', color: 'none' },
    { name: 'Veterán csomag', sub: '200 db golyóval', amount: '8 000', unit: 'Ft / fő',
      features: ['4 órás pályahasználat', 'Tippmann 98 marker', 'Overál & védőmaszk', 'Lányoknak védőmellény', '200 db golyó'],
      extra: 'További golyó: 15 Ft / db', badge: 'Népszerű', color: 'orange' },
    { name: 'Rambo csomag', sub: '500 db golyóval', amount: '12 000', unit: 'Ft / fő',
      features: ['4 órás pályahasználat', 'Tippmann 98 marker', 'Overál & védőmaszk', 'Lányoknak védőmellény', '500 db golyó'],
      extra: 'További golyó: 13 Ft / db', badge: '', color: 'gold' }
  ];
  var packages = DEFAULT_PACKAGES.slice();

  // Biztosítja, hogy a Rambo (arany) csomag mindig megjelenjen – akkor is, ha
  // egy korábban elmentett, régi (2 csomagos) lista van tárolva a böngészőben
  // vagy a szerveren (az felülírná az alapértelmezést, és eltűnne a Rambo).
  function ensureRambo() {
    var has = packages.some(function (p) {
      return p && (p.color === 'gold' || /rambo/i.test(p.name || ''));
    });
    if (has) return;
    var rambo = null;
    for (var i = 0; i < DEFAULT_PACKAGES.length; i++) {
      if (DEFAULT_PACKAGES[i].color === 'gold') { rambo = DEFAULT_PACKAGES[i]; break; }
    }
    if (rambo) packages = packages.concat([JSON.parse(JSON.stringify(rambo))]);
  }

  function esc(s) { s = (s == null ? '' : String(s)); return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

  // "Rambo" pálcika-figura, ami az arany (gold) csomag kártyája mögül néha
  // kibújik, össze-vissza lövöldöz és egy felhőcskén kiírja: ratatatatata!
  var RAMBO_SCENE =
    '<div class="rambo" aria-hidden="true">' +
      '<div class="rambo-cloud"><span>ratatatatata!</span></div>' +
      '<div class="rambo-fig">' +
        '<svg viewBox="0 0 180 120" width="164" height="109">' +
          '<circle class="rb-pb rb-pb1" cx="140" cy="30" r="4"/>' +
          '<circle class="rb-pb rb-pb2" cx="140" cy="30" r="4"/>' +
          '<circle class="rb-pb rb-pb3" cx="140" cy="30" r="4"/>' +
          '<circle class="rb-pb rb-pb4" cx="140" cy="30" r="4"/>' +
          '<path class="rb-flash" d="M140 30 l16 -6 l-11 6 l14 3 l-15 1 l7 9 l-10 -7 l-2 12 l-2 -13 z"/>' +
          '<g class="rb-body">' +
            '<line class="rb-limb" x1="74" y1="90" x2="64" y2="118"/>' +
            '<line class="rb-limb" x1="74" y1="90" x2="86" y2="118"/>' +
            '<line class="rb-torso" x1="74" y1="52" x2="74" y2="90"/>' +
            '<line class="rb-belt" x1="60" y1="58" x2="90" y2="82"/>' +
            '<line class="rb-limb" x1="74" y1="60" x2="96" y2="52"/>' +
            '<circle class="rb-head" cx="74" cy="40" r="12"/>' +
            '<path class="rb-bandana" d="M61 38 q13 -8 26 0"/>' +
            '<line class="rb-bandtail" x1="61" y1="39" x2="49" y2="44"/>' +
            '<line class="rb-bandtail" x1="61" y1="42" x2="50" y2="51"/>' +
            '<g class="rb-gunarm">' +
              '<line class="rb-limb" x1="74" y1="56" x2="98" y2="44"/>' +
              '<line class="rb-marker" x1="90" y1="46" x2="140" y2="30"/>' +
              '<line class="rb-hopper" x1="112" y1="40" x2="110" y2="29"/>' +
            '</g>' +
          '</g>' +
        '</svg>' +
      '</div>' +
    '</div>';

  function pkgCardHTML(p) {
    var isGold = p.color === 'gold';
    var cls = (p.color && p.color !== 'none') ? ' hl hl-' + p.color : '';
    if (isGold) cls += ' has-rambo';
    var badge = p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '';
    var unit = p.unit ? ' <span>' + esc(p.unit) + '</span>' : '';
    var feats = (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var extra = p.extra ? '<p class="price-extra">' + esc(p.extra) + '</p>' : '';
    return '<article class="price-card' + cls + '">' + (isGold ? RAMBO_SCENE : '') + badge +
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
      track.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
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
      track.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
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
      packages = work; renderPackages(); close();
      commit('Csomagok mentve a szerverre – mindenki látja! ✅');
    };
  }

  async function sha256(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.prototype.map.call(new Uint8Array(b), function (x) {
      return x.toString(16).padStart(2, '0');
    }).join('');
  }

  /* ---------- Tartalom betöltése (szerver -> content.json -> localStorage) ---------- */
  async function init() {
    var base = null;
    // 1) Szerveroldali backend (ha feltöltötted a content.php-t) – ez a mérvadó
    try {
      var ra = await fetch(API + '?action=load', { cache: 'no-store' });
      if (ra.ok) {
        var txt = await ra.text();
        var parsed = JSON.parse(txt || '{}');
        if (parsed && typeof parsed === 'object') { base = parsed; apiAvailable = true; }
      }
    } catch (e) { /* nincs backend – megyünk a statikus fájlra */ }
    // 2) Statikus content.json (ha nincs backend)
    if (!apiAvailable) {
      try {
        var r = await fetch('content.json', { cache: 'no-store' });
        if (r.ok) base = await r.json();
      } catch (e) { /* nincs content.json – alapértelmezett szövegek maradnak */ }
    }
    if (base) { baseContent = base; applyContent(base); }
    applyContent(getStored());

    // Csomagok: stored > content.json > alapértelmezett
    var merged = Object.assign({}, base || {}, getStored());
    if (Array.isArray(merged.packages) && merged.packages.length) packages = merged.packages;
    ensureRambo();
    renderPackages();

    // Promóció: stored > content.json > alapértelmezett
    if (merged.promo && typeof merged.promo === 'object') promo = Object.assign({}, DEFAULT_PROMO, merged.promo);
    setTimeout(maybeShowPromo, 1800);

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
      var pw = pass.value;
      var ok;
      if (apiAvailable) {
        // Szerveroldali ellenőrzés (valódi védelem)
        try {
          var r = await fetch(API + '?action=auth', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw })
          });
          var j = await r.json();
          ok = !!(j && j.ok);
        } catch (err) { ok = false; }
      } else {
        // Statikus tartalék: kliensoldali hash
        ok = (await sha256(pw)) === PASS_HASH;
      }
      if (ok) { adminPassword = pw; wrap.remove(); enterEdit(); }
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
      '<button type="button" class="btn btn-ghost" id="abPromo">📣 Promóció</button>' +
      '<button type="button" class="btn btn-ghost" id="abPrivacy">🔒 Adatvédelem</button>' +
      '<button type="button" class="btn btn-primary" id="abSave">Mentés</button>' +
      '<button type="button" class="btn btn-ghost" id="abExport">Exportálás (JSON)</button>' +
      '<label class="btn btn-ghost" for="abImportFile">Importálás</label>' +
      '<input type="file" id="abImportFile" accept="application/json" hidden />' +
      '<button type="button" class="btn btn-ghost" id="abReset">Alaphelyzet</button>' +
      '<button type="button" class="btn btn-ghost" id="abExit">Kilépés</button>';
    document.body.appendChild(bar);

    bar.querySelector('#abPackages').addEventListener('click', openPackageEditor);
    bar.querySelector('#abPromo').addEventListener('click', openPromoEditor);
    bar.querySelector('#abPrivacy').addEventListener('click', openPrivacyEditor);
    bar.querySelector('#abSave').addEventListener('click', save);
    bar.querySelector('#abExport').addEventListener('click', exportJSON);
    bar.querySelector('#abReset').addEventListener('click', resetAll);
    bar.querySelector('#abExit').addEventListener('click', exitEdit);
    bar.querySelector('#abImportFile').addEventListener('change', importJSON);
  }

  function save() {
    commit('Mentve a szerverre – mindenki látja! ✅');
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
        if (map.promo && typeof map.promo === 'object') { promo = Object.assign({}, DEFAULT_PROMO, map.promo); refreshPromo(); }
        // A teljes importált térképet megőrizzük (kereszt-oldali kulcsok is: pl.
        // privacy.*), a jelenlegi oldal élő mezői pedig felülírják a sajátjaikat.
        var merged = Object.assign({}, getStored(), map, collectAll());
        merged.packages = packages; merged.promo = promo;
        setStored(merged);
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
