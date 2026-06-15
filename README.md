# Bgyarmatpaintball – statikus weboldal

A [bgyarmatpaintball.hu](https://bgyarmatpaintball.hu/) modern, statikus alapokon
újradolgozott változata. Külső keretrendszer és build lépés nélkül, tiszta
**HTML + CSS + JavaScript** technológiával készült, így bárhol futtatható és
egyszerűen hostolható (pl. GitHub Pages, Netlify, bármilyen webszerver).

## Felépítés

```
.
├── index.html          # Egyoldalas (one-page) weboldal
├── css/
│   └── style.css       # Teljes stílus, reszponzív, sötét téma
├── js/
│   └── main.js         # Mobil menü, scroll-reveal animáció, lábléc év
├── assets/
│   └── img/
│       ├── logo.png    # Logó (átlátszó háttérrel)
│       ├── favicon-64.png, apple-touch-icon.png
│       ├── galeria1–6.jpg # Galéria fotók (régi logó nélkül)
│       └── slideshow01–06.png # Eredeti bannerek (forrás)
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

- **Saját képek a galériába:** cseréld le az `assets/img/slideshow01–06.png`
  fájlokat, vagy módosítsd a galéria `<img src="…">` hivatkozásait az
  `index.html`-ben (a szélesvásznú, ~880×274 arányú képek vágás nélkül jelennek meg).
- **Dokumentumok:** tedd a `upload/` mappába a `szabalyzat.pdf` és
  `jatekmodok.pdf` fájlokat (a bemutatkozás szekció ezekre hivatkozik).
- **Színek / betűtípus:** a `css/style.css` tetején lévő `:root` változókban
  állítható (pl. `--orange`, `--green`).

## Helyi futtatás

Nincs build lépés. Elég megnyitni az `index.html`-t böngészőben, vagy egy
egyszerű statikus szerverrel:

```bash
python3 -m http.server 8000
# majd: http://localhost:8000
```

## Elérhetőség

📞 06 30 / 720 84 99 &nbsp;·&nbsp; ✉️ bgyarmatpaintball@gmail.com &nbsp;·&nbsp; 📍 2660 Balassagyarmat, Nyírjes
