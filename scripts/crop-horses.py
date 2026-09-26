from PIL import Image

im = Image.open("public/assets/race-horse-sheet.png")
w, h = im.size
print("sheet", w, h)

# large horse — left
base = im.crop((0, 0, 420, 300))
base.save("public/assets/race-horse-base-raw.png")

# gallop frames — top-right 2x3 grid (full cells, trim later)
for row in range(2):
    for col in range(3):
        idx = row * 3 + col
        x0 = 418 + col * 154
        y0 = row * 148
        fr = im.crop((x0, y0, x0 + 154, y0 + 148))
        fr.save(f"public/assets/race-horse-frame-raw-{idx}.png")

print("raw crops done")
