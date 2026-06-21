from pathlib import Path

from PIL import Image

from remove_horse_bg import flood_transparent, trim

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
SHEET = ASSETS / "race-horse-sheet.png"


def largest_component(img: Image.Image, min_pixels: int = 200) -> Image.Image:
    """셀 안에 말 포즈가 2개 들어간 경우 가장 큰 덩어리만 사용."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    best_bbox = None
    best_count = 0

    for sy in range(h):
        for sx in range(w):
            if visited[sy][sx] or px[sx, sy][3] < 20:
                continue
            stack = [(sx, sy)]
            visited[sy][sx] = True
            minx = maxx = sx
            miny = maxy = sy
            count = 0
            while stack:
                x, y = stack.pop()
                count += 1
                minx = min(minx, x)
                maxx = max(maxx, x)
                miny = min(miny, y)
                maxy = max(maxy, y)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if (
                        0 <= nx < w
                        and 0 <= ny < h
                        and not visited[ny][nx]
                        and px[nx, ny][3] >= 20
                    ):
                        visited[ny][nx] = True
                        stack.append((nx, ny))
            if count >= min_pixels and count > best_count:
                best_count = count
                best_bbox = (minx, miny, maxx + 1, maxy + 1)

    if best_bbox:
        return img.crop(best_bbox)
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def is_red_cloth(r: int, g: int, b: int) -> bool:
    return r > 120 and g < 100 and b < 100 and r > g + 40


def is_white_num(r: int, g: int, b: int) -> bool:
    return r > 200 and g > 200 and b > 200


def remove_saddle_number(img: Image.Image) -> Image.Image:
    """스프라이트 안장 번호(흰색·밝은색·윤곽)를 주변 빨간 천 색으로 덮음."""
    out = img.copy().convert("RGBA")
    w, h = out.size
    px = out.load()

    def red_sample(x: int, y: int) -> tuple[int, int, int] | None:
        rs = gs = bs = n = 0
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h):
                    continue
                nr, ng, nb, na = px[nx, ny]
                if na > 40 and is_red_cloth(nr, ng, nb):
                    rs += nr
                    gs += ng
                    bs += nb
                    n += 1
        if n < 4:
            return None
        return (rs // n, gs // n, bs // n)

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            lum = r + g + b
            # 안장 천 위 밝은 숫자·하이라이트·검은 윤곽
            is_numberish = (
                is_white_num(r, g, b)
                or (lum > 420 and g > 100)
                or (lum < 90 and red_sample(x, y) is not None)
            )
            if not is_numberish:
                continue
            sample = red_sample(x, y)
            if sample is None:
                continue
            px[x, y] = (*sample, a)

    return out


def process_sprite(img: Image.Image) -> Image.Image:
    return remove_saddle_number(trim(img))


def main() -> None:
    im = Image.open(SHEET)
    print("sheet", im.size)

    base_raw = im.crop((0, 0, 420, 300))
    base = process_sprite(flood_transparent(base_raw))
    base.save(ASSETS / "race-horse-base.png")
    print("race-horse-base.png", base.size)

    for row in range(2):
        for col in range(3):
            idx = row * 3 + col
            x0 = 418 + col * 154
            y0 = row * 148
            fr = im.crop((x0, y0, x0 + 154, y0 + 148))
            cell = flood_transparent(fr)
            out = process_sprite(largest_component(cell))
            out.save(ASSETS / f"race-horse-frame-{idx}.png")
            print(f"race-horse-frame-{idx}.png", out.size)


if __name__ == "__main__":
    main()
