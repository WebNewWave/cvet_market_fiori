# -*- coding: utf-8 -*-
"""Генерирует OG-картинку (1200x630) для FlowerPower из фото букета."""
from PIL import Image, ImageDraw, ImageFont
import os

BASE = r"C:\Projects\Work\cvet_market_fiori"
SRC = os.path.join(BASE, "assets", "photos", "flowerpower", "og-base.jpg")
OUT = os.path.join(BASE, "assets", "og-image.jpg")
W, H = 1200, 630

img = Image.open(SRC).convert("RGB")
sw, sh = img.size
scale = max(W / sw, H / sh)
nw, nh = int(sw * scale), int(sh * scale)
img = img.resize((nw, nh), Image.LANCZOS)
left, top = (nw - W) // 2, (nh - H) // 2
img = img.crop((left, top, left + W, top + H))

# Пытаемся найти шрифт для подписи
title_font = None
sub_font = None
for fp in [
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]:
    if os.path.exists(fp):
        try:
            title_font = ImageFont.truetype(fp, 72)
            sub_font = ImageFont.truetype(fp, 30)
            break
        except Exception:
            pass

img = img.convert("RGBA")
# Нижний скрим-градиент для читаемости подписи
scrim = Image.new("RGBA", (W, 240), (42, 32, 36, 0))
pix = scrim.load()
for y in range(240):
    a = int(165 * (y / 240))
    for x in range(W):
        pix[x, y] = (42, 32, 36, a)
img.paste(scrim, (0, H - 240), scrim)
img = img.convert("RGB")

draw = ImageDraw.Draw(img)
if title_font:
    draw.text((60, H - 170), "FlowerPower", font=title_font, fill=(255, 255, 255))
    draw.text((62, H - 86), "Букеты с доставкой по Казани", font=sub_font, fill=(245, 231, 234))
else:
    draw.text((60, H - 120), "FlowerPower — Казань", font=ImageFont.load_default(), fill=(255, 255, 255))

img.save(OUT, "JPEG", quality=90)
print("OK OG image:", OUT, img.size)
