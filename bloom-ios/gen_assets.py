"""Generate the Bloom app icon + splash screens (no design tools needed)."""
import math
from PIL import Image, ImageDraw, ImageFilter

BG = (10, 10, 18)  # #0a0a12
PETALS = [
    (34, 211, 238),   # cyan
    (56, 189, 248),   # sky
    (129, 140, 248),  # indigo
    (168, 85, 247),   # violet
    (52, 211, 153),   # emerald
    (45, 212, 191),   # teal
]


def radial(size, color, alpha, cx, cy, r):
    """A soft radial glow blob."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(r * 0.5))


def petal(size, color, angle, cx, cy, length, width):
    """One blurred, translucent flower petal (rotated ellipse)."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    # ellipse pointing up from center, then rotate the whole layer
    d.ellipse(
        [cx - width // 2, cy - length, cx + width // 2, cy + int(length * 0.15)],
        fill=color + (170,),
    )
    layer = layer.rotate(angle, center=(cx, cy), resample=Image.BICUBIC)
    return layer.filter(ImageFilter.GaussianBlur(size * 0.012))


def bloom(size, scale=1.0):
    img = Image.new("RGBA", (size, size), BG + (255,))
    cx = cy = size // 2
    # ambient glows
    img.alpha_composite(radial(size, (88, 28, 135), 120, size * 0.2, size * 0.15, size * 0.5))
    img.alpha_composite(radial(size, (14, 78, 99), 120, size * 0.85, size * 0.85, size * 0.5))
    # petals
    n = len(PETALS)
    length = int(size * 0.30 * scale)
    width = int(size * 0.22 * scale)
    flower = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for i, color in enumerate(PETALS):
        angle = i * (360 / n)
        flower.alpha_composite(petal(size, color, angle, cx, cy, length, width))
    img.alpha_composite(flower)
    # bright center
    img.alpha_composite(radial(size, (255, 255, 255), 220, cx, cy, int(size * 0.06 * scale)))
    return img.convert("RGB")


def rounded_icon(size):
    """iOS masks the icon itself, so a full-bleed square is correct."""
    return bloom(size, scale=1.0)


# App icon (1024) — full-bleed, iOS applies the rounded mask
rounded_icon(1024).save("assets/icon-only.png")
# Android adaptive foreground/background (harmless extras)
bloom(1024, scale=0.7).save("assets/icon-foreground.png")
Image.new("RGB", (1024, 1024), BG).save("assets/icon-background.png")
# Splash — flower centered small on the dark field
sp = bloom(2732, scale=0.42)
sp.save("assets/splash.png")
sp.save("assets/splash-dark.png")
print("generated: icon-only, icon-foreground, icon-background, splash, splash-dark")
