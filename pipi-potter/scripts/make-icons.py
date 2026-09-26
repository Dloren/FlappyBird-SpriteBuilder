# Genera iconos y splash de Android a partir de las plantillas del sprite de Pipi
import re, os
from PIL import Image, ImageDraw, ImageColor
rgba = lambda c: ImageColor.getrgb(c) + (255,)
src = open('src/assets/sprites.js').read()
blk = src[src.index('export const PIPI_ROWS'):src.index('const PIPI_FEET')]
rows = re.findall(r"'([^']{16})'", blk[blk.index('down:'):blk.index('up:')])
hand_blk = open('src/scenes/menus.js').read()
hand_blk = hand_blk[hand_blk.index('const HAND = ['):]
hand = re.findall(r"'([^']{11})'", hand_blk[:hand_blk.index('];')])
pal = {'o': '#1e1428', 'e': '#1e1428', 'h': '#6a4226', 'd': '#3c2416', 'm': '#3c2416',
       's': '#f6c8a2', 't': '#f2f2f6', 'p': '#3e5078', 'k': '#2a2224'}
# lienzo 24x20: Pipi (16x16) + mano con la peineta a su derecha
spr = Image.new('RGBA', (24, 20), (0, 0, 0, 0))
for y, r in enumerate(rows):
    for x, c in enumerate(r):
        if c in pal: spr.putpixel((x + 1, y + 3), rgba(pal[c]))
# mancha de pota
for (x, y) in [(8, 14), (9, 15), (8, 15)]: spr.putpixel((x, y), rgba('#8cb030'))
for y, r in enumerate(hand):
    for x, c in enumerate(r):
        if c in pal and y < 9: spr.putpixel((x + 13, y + 1), rgba(pal[c]))
BG = '#1b1426'
def icon(size, pad, round_=False, bg=True):
    im = Image.new('RGBA', (size, size), BG if bg else (0, 0, 0, 0))
    s = (size - 2 * pad) // 24
    big = spr.resize((24 * s, 20 * s), Image.NEAREST)
    im.alpha_composite(big, ((size - 24 * s) // 2, (size - 20 * s) // 2))
    if round_:
        m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
        im.putalpha(m)
    return im
res = 'android/app/src/main/res'
for d, sz in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    icon(sz, sz // 10).save(f'{res}/mipmap-{d}/ic_launcher.png')
    icon(sz, sz // 8, round_=True).save(f'{res}/mipmap-{d}/ic_launcher_round.png')
    fg = int(sz * 2.25)
    icon(fg, int(fg * 0.28), bg=False).save(f'{res}/mipmap-{d}/ic_launcher_foreground.png')
# color de fondo del icono adaptativo
vals = f'{res}/values/ic_launcher_background.xml'
if os.path.exists(vals):
    open(vals, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1B1426</color>\n</resources>\n')
# splash
for root, _, files in os.walk(res):
    for f in files:
        if f == 'splash.png':
            p = os.path.join(root, f)
            w, h = Image.open(p).size
            im = Image.new('RGBA', (w, h), BG)
            s = max(2, min(w, h) // 80)
            big = spr.resize((24 * s, 20 * s), Image.NEAREST)
            im.alpha_composite(big, ((w - 24 * s) // 2, (h - 20 * s) // 2))
            im.convert('RGB').save(p)
print('iconos y splash generados')
