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
      '<button type="button" class="btn btn-primary" id="abSave">Mentés</button>' +
      '<button type="button" class="btn btn-ghost" id="abExport">Exportálás (JSON)</button>' +
      '<label class="btn btn-ghost" for="abImportFile">Importálás</label>' +
      '<input type="file" id="abImportFile" accept="application/json" hidden />' +
      '<button type="button" class="btn btn-ghost" id="abReset">Alaphelyzet</button>' +
      '<button type="button" class="btn btn-ghost" id="abExit">Kilépés</button>';
    document.body.appendChild(bar);

    bar.querySelector('#abSave').addEventListener('click', save);
    bar.querySelector('#abExport').addEventListener('click', exportJSON);
    bar.querySelector('#abReset').addEventListener('click', resetAll);
    bar.querySelector('#abExit').addEventListener('click', exitEdit);
    bar.querySelector('#abImportFile').addEventListener('change', importJSON);
  }

  function save() {
    fields().forEach(syncLink);
    setStored(collectAll());
    toast('Mentve ebben a böngészőben. Az élesítéshez exportálj és töltsd fel a content.json-t.');
  }

  function exportJSON() {
    save();
    var data = JSON.stringify(collectAll(), null, 2);
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
        setStored(collectAll());
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
