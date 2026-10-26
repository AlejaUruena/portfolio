#!/usr/bin/env python3
"""Anade a BBH Bartle los glifos que el espanol necesita y la fuente no trae.

Bartle (SIL OFL) trae 121 glifos, solo ASCII: ni n~, ni vocales acentuadas,
ni los signos de apertura. En una pagina en espanol el navegador resuelve
esos caracteres sueltos con la fuente siguiente de la pila, asi que un
titular sale con una letra de otra tipografia en medio.

Todo lo que se anade aqui se DERIVA de formas que ya estan en la fuente, no
se dibuja de cero: la tilde sale de asciitilde, el acento agudo de espejar
grave, la dieresis de dos period, y los signos de apertura de rotar question
y exclam 180 grados. Asi los trazos conservan el grosor y el caracter del
tipo en vez de parecer un injerto.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools.pens.boundsPen import BoundsPen

ENTRADA, SALIDA = sys.argv[1], sys.argv[2]
f = TTFont(ENTRADA)
glyf, hmtx, cmap_mejor = f['glyf'], f['hmtx'], f.getBestCmap()
gs = f.getGlyphSet()

def caja(nombre):
    bp = BoundsPen(gs); gs[nombre].draw(bp); return bp.bounds

def compuesto(nombre, piezas, avance):
    """piezas: lista de (glifo, dx, dy, transform 2x2 o None)"""
    g = Glyph(); g.numberOfContours = -1; g.components = []
    for base, dx, dy, tr in piezas:
        c = GlyphComponent()
        c.glyphName = base; c.x = int(dx); c.y = int(dy)
        c.flags = 0x2 | 0x4  # ARGS_ARE_XY_VALUES | ROUND_XY_TO_GRID
        if tr: c.transform = tr
        g.components.append(c)
    glyf[nombre] = g
    hmtx[nombre] = (int(avance), 0)

CAP = 700
nuevos = {}

# ---- 1. tilde sobre n/N -----------------------------------------------------
tb = caja('asciitilde')                       # (15, 168, 513, 386)
for base, destino, cp in [('n', 'ntilde', 0x00F1), ('N', 'Ntilde', 0x00D1)]:
    bb = caja(base)
    dx = (bb[0] + bb[2]) / 2 - (tb[0] + tb[2]) / 2
    dy = 748 - tb[1]                          # base de la tilde 48 unidades sobre la altura de caja
    compuesto(destino, [(base, 0, 0, None), ('asciitilde', dx, dy, None)], hmtx[base][0])
    nuevos[cp] = destino

# ---- 2. acento agudo = grave espejado --------------------------------------
gb = caja('grave')                            # (50, 569, 312, 731)
ESPEJO = ((-1, 0), (0, 1))   # matriz 2x2, no tupla plana
agudo_ancho = gb[2] - gb[0]
AGUDAS = [('a','aacute',0xE1),('e','eacute',0xE9),('i','iacute',0xED),('o','oacute',0xF3),
          ('u','uacute',0xFA),('A','Aacute',0xC1),('E','Eacute',0xC9),('I','Iacute',0xCD),
          ('O','Oacute',0xD3),('U','Uacute',0xDA)]
for base, destino, cp in AGUDAS:
    bb = caja(base)
    centro_base = (bb[0] + bb[2]) / 2
    # tras espejar, el glifo ocupa (-x2, -x1); su centro es -(x1+x2)/2
    dx = centro_base + (gb[0] + gb[2]) / 2
    dy = 742 - gb[1]
    compuesto(destino, [(base, 0, 0, None), ('grave', dx, dy, ESPEJO)], hmtx[base][0])
    nuevos[cp] = destino

# ---- 3. dieresis = dos period, reducidos -----------------------------------
# A cuerpo de display el punto de esta fuente es un cuadrado grande; dos de
# ellos a tamano natural leen como bloques, no como dieresis. Se escalan al 70%.
pb = caja('period')
ESCALA = ((0.7, 0), (0, 0.7))
pw = (pb[2] - pb[0]) * 0.7
sep = pw * 2.2
for base, destino, cp in [('u','udieresis',0xFC), ('U','Udieresis',0xDC)]:
    bb = caja(base)
    centro = (bb[0] + bb[2]) / 2
    dy = 762 - pb[1] * 0.7
    cp_centro = (pb[0] + pb[2]) / 2 * 0.7
    izq = centro - sep / 2 - cp_centro
    der = centro + sep / 2 - cp_centro
    compuesto(destino, [(base,0,0,None), ('period', izq, dy, ESCALA), ('period', der, dy, ESCALA)], hmtx[base][0])
    nuevos[cp] = destino

# ---- 4. signos de apertura = rotar 180 -------------------------------------
GIRO = ((-1, 0), (0, -1))    # rotacion de 180 grados
for base, destino, cp, baja in [('question','questiondown',0xBF,170), ('exclam','exclamdown',0xA1,170)]:
    bb = caja(base)
    dx = bb[0] + bb[2]
    dy = bb[1] + bb[3] - baja
    compuesto(destino, [(base, dx, dy, GIRO)], hmtx[base][0])
    nuevos[cp] = destino

# ---- 5. registrar en el cmap ------------------------------------------------
for t in f['cmap'].tables:
    if t.isUnicode():
        for cp, nombre in nuevos.items():
            t.cmap[cp] = nombre

f.flavor = 'woff2'
f.save(SALIDA)
print('glifos anadidos: %d' % len(nuevos))
print('  ' + ' '.join(chr(c) for c in sorted(nuevos)))
