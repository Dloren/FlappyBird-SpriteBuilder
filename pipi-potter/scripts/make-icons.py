# Genera iconos y splash de Android a partir de las plantillas del sprite de Pipi
import re, os
from PIL import Image, ImageDraw, ImageColor
rgba = lambda c: ImageColor.getrgb(c) + (255,)
src = open('src/assets/sprites.js').read()
def block(name, start_pat):
    i = src.index(start_pat)
    j = src.index(']', src.index(name + ':', i))
    return re.findall(r"'([^']{16})'", src[src.index(name + ':', i):j])
head = block('down', 'short: {')[:9]
body = block('down', 'belly: {')[:6]
feet = '...okko..okko...'
rows = head + body + [feet]
pal = {'o': '#1e1428', 'e': '#1e1428', 'k': '#1e1428', 'h': '#4a2c1c', 'b': '#4a2c1c', 'm': '#4a2c1c',
       's': '#b8d890', 't': '#eeeef2', 'p': '#2c3450'}
spr = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
for y, r in enumerate(rows):
    for x, c in enumerate(r):
        if c in pal: spr.putpixel((x, y), rgba(pal[c]))
# gotita de pota
for (x, y) in [(13, 9), (13, 10), (14, 11), (13, 11)]: spr.putpixel((x, y), rgba('#8cb030'))
BG = '#1b1426'
def icon(size, pad, round_=False, bg=True):
    im = Image.new('RGBA', (size, size), BG if bg else (0, 0, 0, 0))
    s = (size - 2 * pad) // 16
    big = spr.resize((16 * s, 16 * s), Image.NEAREST)
    off = (size - 16 * s) // 2
    im.alpha_composite(big, (off, off))
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
            s = max(2, min(w, h) // 64)
            big = spr.resize((16 * s, 16 * s), Image.NEAREST)
            im.alpha_composite(big, ((w - 16 * s) // 2, (h - 16 * s) // 2))
            im.convert('RGB').save(p)
print('iconos y splash generados')
