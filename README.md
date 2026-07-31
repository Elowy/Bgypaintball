# Bgyarmatpaintball – statikus weboldal

A [bgyarmatpaintball.hu](https://bgyarmatpaintball.hu/) modern, statikus alapokon
újradolgozott változata. Külső keretrendszer és build lépés nélkül, tiszta
**HTML + CSS + JavaScript** technológiával készült, így bárhol futtatható és
egyszerűen hostolható (pl. GitHub Pages, Netlify, bármilyen webszerver).

## Felépítés

```
.
├── index.html          # Egyoldalas (one-page) weboldal
├── sitemap.xml         # Keresőknek (Google Search Console)
├── robots.txt          # Indexelési szabályok + sitemap hivatkozás
├── css/
│   └── style.css       # Teljes stílus, reszponzív, sötét téma
├── js/
│   └── main.js         # Mobil menü, scroll-reveal animáció, lábléc év
├── assets/
│   └── img/
│       ├── logo.png    # Logó (átlátszó háttérrel)
│       ├── favicon-64.png, apple-touch-icon.png
│       └── galeria1–5.jpg # Valódi pálya- és akciófotók (hero + galéria)
└── upload/             # Letölthető dokumentumok (szabalyzat.pdf, jatekmodok.pdf)
```

## Szekciók

- **Hero** – szlogen, fő CTA gombok, gyors statisztikák
- **Bemutatkozás** – leírás, szolgáltatások listája, dokumentum linkek
- **Szolgáltatások / Rendezvények** – születésnap, leány-/legénybúcsú, céges, csapatépítő
- **Áraink** – csomagok (100 / 200 golyó), helyfoglalási díj
- **Galéria** – valódi pályaképek (`assets/img/slideshow01–06.png`)
- **Partnerek** – Kürtigold Asztalosipari Kft., Kürti Viktória Műkörmös
- **Kapcsolat** – telefon, e-mail, cím, Facebook, beágyazott térkép

## Testreszabás

- **Saját képek a galériába:** cseréld le az `assets/img/galeria1–5.jpg`
  fájlokat, vagy módosítsd a galéria `<img src="…">` hivatkozásait az
  `index.html`-ben. Ugyanezek a fotók adják a hero diavetítés hátterét is.
- **Dokumentumok:** tedd a `upload/` mappába a `szabalyzat.pdf` és
  `jatekmodok.pdf` fájlokat (a bemutatkozás szekció ezekre hivatkozik).
- **Színek / betűtípus:** a `css/style.css` tetején lévő `:root` változókban
  állítható (pl. `--orange`, `--green`).

## Rejtett admin szerkesztő

Az oldal tartalma (szövegek, árak, elérhetőségek) bejelentkezés után
közvetlenül a böngészőből szerkeszthető — **backend nélkül**.

- **Belépés:** írd a cím végére a `#admin`-t (pl. `bgyarmatpaintball.hu/#admin`).
- **Jelszó:** alapértelmezetten `bgyarmat-admin` — **élesítés előtt cseréld le!**
  A jelszó SHA-256 hashe a `js/admin.js` `PASS_HASH` konstansában van; a fájl
  tetején lévő megjegyzés leírja, hogyan generálj újat.
- **Szerkesztés:** a kijelölt (`data-edit`) mezők szerkeszthetővé válnak.
  A *Mentés* a böngészőbe (localStorage) ment.
- **Csomagok (árak):** a toolbar **🎫 Csomagok** gombjával külön szerkesztő
  nyílik, ahol csomagokat lehet **hozzáadni / törölni**, és mindegyikhez
  megadható **cím, alcím, összeg, jellemzők, extra sor, kiemelés-címke**
  (a „Népszerű" helyett bármi) és **kiemelési szín** (5 opció). Több csomag
  esetén az áraknál **nyilakkal, folyamatosan pörgethető** carousel jelenik meg.

### Hogy lássa MINDENKI a változást?

A localStorage csak a saját böngésződben őrzi a módosítást. Élesítéshez:

1. A szerkesztőben kattints az **Exportálás (JSON)** gombra → letölt egy
   `content.json` fájlt.
2. Tedd ezt a fájlt az oldal gyökerébe (a tárhelyre / a repo gyökerébe).
3. Az oldal betöltéskor beolvassa a `content.json`-t, így a módosítások
   **minden látogatónál** megjelennek.

> ⚠️ Mivel ez statikus oldal, a jelszavas védelem csak a szerkesztő UI-t
> rejti — nem erős biztonság. Valódi tartalom módosításához a `content.json`
> tárhelyre töltése (commit) szükséges, ahhoz pedig hozzáférés kell.

## Süti-elfogadás és adatvédelem

- **Süti-kapu:** az első látogatáskor egy teljes képernyős, animált csata-jelenet
  fogad a süti-elfogadással. A marketing sütik (Facebook feed) **csak elfogadás
  után** töltődnek be. A választás a böngészőben tárolódik; a lábléc „Süti
  beállítások" gombjával újra előhívható.
- **Adatvédelmi tájékoztató:** külön oldal (`adatvedelem.html`). A benne lévő
  adatkezelői adatok (név, cím, e-mail, telefon, tárhelyszolgáltató, dátum stb.)
  az admin szerkesztőben a **🔒 Adatvédelem** gombbal állíthatók, és a megszokott
  módon (Export → `content.json`) tehetők élesbe.

## Automatikus frissítés GitHub merge után (FTP deploy cPanel-re)

A repóban van egy kész GitHub Actions workflow (`.github/workflows/deploy.yml`),
amely **minden `main`/`master` ágra történő push (pl. PR merge) után FTP-n
feltölti a weboldalt a tárhelyre** (`SamKirkland/FTP-Deploy-Action`).

### Ehhez megadandó GitHub Secrets

**GitHub → Settings → Secrets and variables → Actions → New repository secret**,
és hozd létre az alábbi 3 titkot:

| Secret neve      | Érték                                                        |
|------------------|-------------------------------------------------------------|
| `FTP_SERVER`     | az FTP szerver címe (pl. `ftp.bgyarmatpaintball.hu` vagy IP) |
| `FTP_USERNAME`   | az FTP-fiók felhasználóneve (cPanel → FTP-fiókok)            |
| `FTP_PASSWORD`   | az FTP-fiók jelszava                                         |

> A titkokat a GitHub titkosítva tárolja; a naplókban nem jelennek meg.

### A workflow-ban ellenőrizd / állítsd be

- **`server-dir`** – a tárhely webgyökere. cPanel-nél általában `public_html/`
  (ha aldomainre / almappába megy, pl. `public_html/uj/`).
- **`protocol`** – `ftps` (titkosított, ajánlott). Ha a tárhely nem támogatja,
  vagy tanúsítványhiba van, állítsd `ftp`-re.
- **`port`** – általában `21`.

### Használat

1. Add meg a fenti 3 secretet.
2. Igazítsd a `server-dir`-t a tárhelyed webgyökeréhez.
3. Merge-ölj egy PR-t a `main` ágra → a workflow lefut és feltölti a változásokat
   (csak a módosult fájlokat). Állapot: **GitHub → Actions** fül.
4. Az admin szerkesztőből exportált **`content.json`-t** és a feltöltött képeket is
   elég a `main` ágra commitolni – a deploy ezeket is kiteszi, így a
   szövegek/árak/promóció élesben frissülnek.

**Alternatívák:** Netlify/Vercel (kösd össze a repót, push után magától deploy-ol),
vagy GitHub Pages (saját domainnel) – kérésre ezekre is átírható a workflow.

## Helyi futtatás

Nincs build lépés. Elég megnyitni az `index.html`-t böngészőben, vagy egy
egyszerű statikus szerverrel:

```bash
python3 -m http.server 8000
# majd: http://localhost:8000
```

## Elérhetőség

📞 06 30 / 720 84 99 &nbsp;·&nbsp; ✉️ bgyarmatpaintball@gmail.com &nbsp;·&nbsp; 📍 2660 Balassagyarmat, Nyírjes
