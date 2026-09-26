"""말·기수 PNG — 배경 flood-fill 투명 + 트림"""
from collections import deque

from PIL import Image

TOLERANCE = 36


def is_background(r: int, g: int, b: int) -> bool:
    if r >= 255 - TOLERANCE and g >= 255 - TOLERANCE and b >= 255 - TOLERANCE:
        return True
    if r <= 18 and g <= 18 and b <= 18:
        return True
    return False


def flood_transparent(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    seen = set()
    while q:
        x, y = q.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if not is_background(r, g, b):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return img


def trim(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img
