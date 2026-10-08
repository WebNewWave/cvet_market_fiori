# Временный скрипт: генерирует брендовую OG-картинку для превью в ВК (1200x630, JPEG)
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = r"C:\Projects\Work\cvet_market"
W, H = 1200, 630

# Фон — реальное фото букета заказчика (розы), cover-crop
hero = Image.open(os.path.join(ROOT, "assets/photos/rozy/p01.webp")).convert("RGB")
hw, hh = hero.size
scale = max(W / hw, H / hh)
hero = hero.resize((int(hw * scale), int(hh * scale)))
left = (hero.width - W) // 2
top = (hero.height - H) // 2
hero = hero.crop((left, top, left + W, top + H)).convert("RGBA")

# Тёмный градиент слева для читаемости текста
grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grad)
for x in range(W):
    a = min(195, int(225 * (1 - x / (W * 0.7))))
    if a > 0:
        gd.line([(x, 0), (x, H)], fill=(18, 14, 11, a))
hero = Image.alpha_composite(hero, grad)

d = ImageDraw.Draw(hero)
fp = "C:/Windows/Fonts/arial.ttf"
try:
    fb = ImageFont.truetype(fp, 72)
    fm = ImageFont.truetype(fp, 34)
    fs = ImageFont.truetype(fp, 30)
except Exception:
    fb = fm = fs = ImageFont.load_default()

d.text((64, 150), "Фиори", font=fb, fill=(255, 255, 255))
d.text((66, 244), "Цветы, которыми хочется делиться теплом", font=fm, fill=(240, 230, 220))
d.text((66, 520), "Заказ в ВК   vk.ru/fiori.kirishi", font=fs, fill=(255, 255, 255))

out = hero.convert("RGB")
out.save(os.path.join(ROOT, "assets/og-image.jpg"), "JPEG", quality=88)
print("saved", os.path.join(ROOT, "assets/og-image.jpg"), out.size)
