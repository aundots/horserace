from pathlib import Path

from PIL import Image

from remove_horse_bg import flood_transparent, trim

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
SHEET = ASSETS / "race-horse-sheet.png"


def main() -> None:
    im = Image.open(SHEET)
    w, h = im.size
    print("sheet", w, h)

    base_raw = im.crop((0, 0, 420, 300))
    trim(flood_transparent(base_raw)).save(ASSETS / "race-horse-base.png")
    print("race-horse-base.png")

    for row in range(2):
        for col in range(3):
            idx = row * 3 + col
            x0 = 418 + col * 154
            y0 = row * 148
            fr = im.crop((x0, y0, x0 + 154, y0 + 148))
            out = trim(flood_transparent(fr))
            out.save(ASSETS / f"race-horse-frame-{idx}.png")
            print(f"race-horse-frame-{idx}.png", out.size)


if __name__ == "__main__":
    main()
