# Genera iconos (a partir de assets/icon-source.jpg) y splash (retrato pixel art de Pipi)
import re, os
from PIL import Image, ImageDraw, ImageColor
rgba = lambda c: ImageColor.getrgb(c) + (255,)

src = open('src/assets/sprites.js').read()
blk = src[src.index('export const PORTRAIT'):]
portrait = re.findall(r"'([^']{18})'", blk[:blk.index('];')])
pal = {'o': '#2a1a16', 'h': '#6a4226', 'd': '#3c2416', 's': '#f6c8a2', 'l': '#fadcc8', 't': '#f0f0f4', 'e': '#140c10', 'm': '#4a2c1c'}
spr = Image.new('RGBA', (18, 18), (0, 0, 0, 0))
for y, r in enumerate(portrait):
    for x, c in enumerate(r):
        if c in pal: spr.putpixel((x, y), rgba(pal[c]))

BG = '#141828'
res = 'android/app/src/main/res'
icon = Image.open('assets/icon-source.jpg').convert('RGBA')
w, h = icon.size
side = min(w, h)
icon = icon.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))

def rounded(im, size):
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = im.copy(); out.putalpha(m); return out

for d, sz in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    im = icon.resize((sz, sz), Image.LANCZOS)
    im.save(f'{res}/mipmap-{d}/ic_launcher.png')
    rounded(im, sz).save(f'{res}/mipmap-{d}/ic_launcher_round.png')
    # icono adaptativo: la imagen ocupa la zona segura (66 %) sobre fondo del mismo color
    fg = int(sz * 2.25)
    canvas = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
    inner = int(fg * 0.72)
    canvas.alpha_composite(icon.resize((inner, inner), Image.LANCZOS), ((fg - inner) // 2, (fg - inner) // 2))
    canvas.save(f'{res}/mipmap-{d}/ic_launcher_foreground.png')
vals = f'{res}/values/ic_launcher_background.xml'
open(vals, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#141828</color>\n</resources>\n')
for root, _, files in os.walk(res):
    for f in files:
        if f == 'splash.png':
            p = os.path.join(root, f)
            w, h = Image.open(p).size
            im = Image.new('RGBA', (w, h), BG)
            s = max(2, min(w, h) // 40)
            big = spr.resize((18 * s, 18 * s), Image.NEAREST)
            im.alpha_composite(big, ((w - 18 * s) // 2, (h - 18 * s) // 2))
            im.convert('RGB').save(p)
print('iconos y splash generados')
