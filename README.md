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

## Helyi futtatás

Nincs build lépés. Elég megnyitni az `index.html`-t böngészőben, vagy egy
egyszerű statikus szerverrel:

```bash
python3 -m http.server 8000
# majd: http://localhost:8000
```

## Elérhetőség

📞 06 30 / 720 84 99 &nbsp;·&nbsp; ✉️ bgyarmatpaintball@gmail.com &nbsp;·&nbsp; 📍 2660 Balassagyarmat, Nyírjes
