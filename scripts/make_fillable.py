#!/usr/bin/env python3
# Kitölthető szülői hozzájáruló nyilatkozat (AcroForm) generálása.
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "upload", "szuloi-nyilatkozat-kitoltheto.pdf")
LOGO = os.path.join(ROOT, "assets", "img", "logo.png")
FDIR = "/usr/share/fonts/truetype/dejavu"

pdfmetrics.registerFont(TTFont("DJ", f"{FDIR}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DJB", f"{FDIR}/DejaVuSans-Bold.ttf"))

W, H = A4
M = 50
RIGHT = W - M
INK = HexColor("#15181c")
MUT = HexColor("#555555")
ACC = HexColor("#e2440f")
LINE = HexColor("#999999")
FIELD_BG = HexColor("#f6f6f6")
FIELD_BD = HexColor("#9aa0a6")

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Szülői hozzájáruló nyilatkozat – Bgyarmatpaintball")
form = c.acroForm

def text(x, y, s, font="DJ", size=9, color=INK, right=False):
    c.setFont(font, size); c.setFillColor(color)
    (c.drawRightString if right else c.drawString)(x, y, s)

def para(x, y, width, s, font="DJ", size=9.2, leading=12.4, color=INK):
    c.setFont(font, size); c.setFillColor(color)
    for ln in simpleSplit(s, font, size, width):
        c.drawString(x, y, ln); y -= leading
    return y

def num_item(x, y, width, n, s, size=9.2, leading=12.4):
    # számozott pont, függő behúzással
    text(x, y, n, "DJB", size)
    ix = x + 16
    c.setFont("DJ", size); c.setFillColor(INK)
    for i, ln in enumerate(simpleSplit(s, "DJ", size, width - 16)):
        c.drawString(ix, y, ln); y -= leading
    return y - 2

def tfield(name, x, y, w, h=15):
    form.textfield(name=name, x=x, y=y, width=w, height=h,
                   fontName="Helvetica", fontSize=9.5, borderWidth=0.6,
                   borderColor=FIELD_BD, fillColor=FIELD_BG,
                   textColor=INK, forceBorder=True)

def cell(label, name, x, y_top, w):
    # kis címke felül, alatta beírható mező
    text(x, y_top, label, "DJ", 8.4, MUT)
    tfield(name, x, y_top - 18, w, 15)
    return y_top - 36

# ---------- Fejléc ----------
c.drawImage(LOGO, M, H - 92, width=52, height=52, mask="auto", preserveAspectRatio=True)
text(112, H - 56, "Szülői / törvényes képviselői hozzájáruló", "DJB", 12.5)
text(112, H - 71, "nyilatkozat", "DJB", 12.5)
text(112, H - 85, "16. életévét be nem töltött játékos paintball pályahasználatához", "DJ", 8.6, MUT)
text(RIGHT, H - 50, "Bgyarmatpaintball", "DJB", 9, MUT, right=True)
text(RIGHT, H - 62, "2660 Balassagyarmat, Fenyves út", "DJ", 8.4, MUT, right=True)
text(RIGHT, H - 73, "Tel.: 06 30 / 720 84 99", "DJ", 8.4, MUT, right=True)
text(RIGHT, H - 84, "bgyarmatpaintball@gmail.com", "DJ", 8.4, MUT, right=True)
c.setStrokeColor(ACC); c.setLineWidth(1.5); c.line(M, H - 98, RIGHT, H - 98)

y = H - 116
y = para(M, y, RIGHT - M,
         "Alulírott szülő / törvényes képviselő az alábbi nyilatkozatot teszem a kiskorú gyermekem "
         "paintball játékban való részvételével kapcsolatban. A nyilatkozatot a pályahasználat "
         "megkezdése előtt, a helyszínen kell aláírni.", size=9.2, leading=12.2)

def heading(y, s):
    y -= 6
    text(M, y, s, "DJB", 11, ACC)
    c.setStrokeColor(HexColor("#dddddd")); c.setLineWidth(0.6); c.line(M, y - 4, RIGHT, y - 4)
    return y - 18

COLW = (RIGHT - M - 20) / 2          # két oszlop szélessége
C2X = M + COLW + 20                  # második oszlop X

# ---------- 1. Kiskorú ----------
y = heading(y - 4, "1. A kiskorú játékos adatai")
y = cell("Név", "kiskoru_nev", M, y, RIGHT - M)
yA = cell("Születési hely, idő", "kiskoru_szul", M, y, COLW)
cell("Életkor", "kiskoru_kor", C2X, y, COLW)
y = yA
y = cell("Lakcím", "kiskoru_lakcim", M, y, RIGHT - M)

# ---------- 2. Szülő ----------
y = heading(y - 2, "2. A szülő / törvényes képviselő adatai")
yA = cell("Név", "szulo_nev", M, y, COLW)
cell("Minőség (anya / apa / gyám)", "szulo_minoseg", C2X, y, COLW)
y = yA
y = cell("Lakcím", "szulo_lakcim", M, y, RIGHT - M)
yA = cell("Telefonszám", "szulo_tel", M, y, COLW)
cell("E-mail", "szulo_email", C2X, y, COLW)
y = yA
y = cell("Szem. ig. / okmányszám", "szulo_okmany", M, y, COLW)

# ---------- 3. Nyilatkozat ----------
y = heading(y - 2, "3. Nyilatkozat")
items = [
    ("1.", "Hozzájárulok, hogy a fent megnevezett kiskorú gyermekem a Bgyarmatpaintball pályáján paintball játékban részt vegyen."),
    ("2.", "Tudomásul veszem, hogy a paintball fokozott fizikai igénybevétellel és kockázattal járó szabadidős tevékenység, amely sérülés (pl. zúzódás, horzsolás, esés) veszélyével járhat."),
    ("3.", "Kijelentem, hogy gyermekem egészségi állapota a részvételt lehetővé teszi, és nincs tudomásom olyan betegségéről/állapotáról (pl. szív- és érrendszeri, légzőszervi megbetegedés, epilepszia, közelmúltbeli műtét), amely azt kizárná."),
    ("4.", "A pálya szabályzatát és a játékmódok ismertetését megismertem, elfogadom, és azt gyermekemmel is ismertettem."),
    ("5.", "Vállalom, hogy gyermekem betartja a pálya szabályait és a személyzet utasításait. A védőfelszerelés, különösen a védőmaszk viselése kötelező; a maszk levétele a játéktéren tilos és balesetveszélyes."),
    ("6.", "Tudomásul veszem, hogy az üzemeltető a szabályok betartása mellett, a saját érdekkörén kívül, illetve szabályszegés miatt bekövetkező sérülésekért, károkért nem felel; az ebből eredő károkért a szülő / törvényes képviselő helytáll."),
    ("7.", "A 16. életévét be nem töltött játékos a pályát kizárólag e nyilatkozat aláírásával használhatja."),
]
for n, s in items:
    y = num_item(M, y, RIGHT - M, n, s, size=9.0, leading=11.6)

# ---------- 4. Kép-/videó hozzájárulás ----------
y = heading(y - 4, "4. Hozzájárulás kép- és hangfelvételhez (nem kötelező)")
y = para(M, y, RIGHT - M,
         "Hozzájárulok, hogy a játék során gyermekemről készült felvételeket az üzemeltető a közösségi "
         "média oldalain és weboldalán bemutatás céljából felhasználja:", size=9.0, leading=11.6)
y -= 4
form.checkbox(name="felvetel_igen", x=M, y=y - 11, size=13, borderWidth=1,
              borderColor=INK, fillColor=HexColor("#ffffff"), checked=False)
text(M + 20, y - 8, "Igen, hozzájárulok", "DJ", 9)
form.checkbox(name="felvetel_nem", x=M + 170, y=y - 11, size=13, borderWidth=1,
              borderColor=INK, fillColor=HexColor("#ffffff"), checked=False)
text(M + 190, y - 8, "Nem járulok hozzá", "DJ", 9)
y -= 26
y = para(M, y, RIGHT - M,
         "Az itt megadott személyes adatokat az üzemeltető kizárólag a pályahasználathoz kapcsolódó célból, "
         "a vonatkozó adatvédelmi jogszabályok (GDPR) szerint kezeli, és harmadik félnek nem adja át.",
         size=8.4, leading=10.8, color=MUT)

# ---------- Kelt + aláírások ----------
y -= 10
text(M, y, "Kelt:", "DJ", 9)
tfield("kelt_helyseg", M + 30, y - 4, 120, 15)
text(M + 158, y, "(helység),", "DJ", 9)
tfield("kelt_datum", M + 210, y - 4, 110, 15)
text(M + 328, y, "(dátum)", "DJ", 9)

y -= 48
c.setStrokeColor(INK); c.setLineWidth(0.7)
c.line(M, y, M + 200, y)
c.line(RIGHT - 200, y, RIGHT, y)
c.setFillColor(MUT); c.setFont("DJ", 8.4)
c.drawCentredString(M + 100, y - 11, "szülő / törvényes képviselő aláírása")
c.drawCentredString(RIGHT - 100, y - 11, "játékos aláírása (ha tud írni)")

# ---------- Lábléc ----------
c.setStrokeColor(HexColor("#dddddd")); c.setLineWidth(0.6); c.line(M, 40, RIGHT, 40)
c.setFillColor(HexColor("#777777")); c.setFont("DJ", 8)
c.drawCentredString(W / 2, 30, "Bgyarmatpaintball • 2660 Balassagyarmat, Fenyves út • 06 30 / 720 84 99 • bgyarmatpaintball@gmail.com")

c.showPage()
c.save()
print("kész:", OUT)
