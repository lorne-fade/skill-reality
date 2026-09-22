#!/usr/bin/env python3
"""Regenerate every logo/icon asset from the vector mark.

    python scripts/make-icons.py           # write the icons + favicon/skill-reality-mark.svg
    python scripts/make-icons.py --check   # verify the committed icons still match, write nothing

The mark
--------
A "C" and a "j": a rounded-square bracket open at the top right, a one-stroke-
width gap in its bottom edge, a stub rising from the bottom-right corner, and a
dot in the open corner. Square caps, three rounded corners. Geometry below was
measured off the brand board (stroke 26, outer corner radius 37, gap x=48..69,
dot r=27) and verified against it at IoU 0.955 for both mark and dot; the
remainder is 1px anti-aliasing on a compressed source.

Three families, each rendered from the same path at 2048px and downsampled:

  glyph   transparent, white mark, brand-blue dot   -> nav/footer on the dark site
  dark    #0A0E14 tile, white mark, blue dot         -> favicons, PWA, apple-touch
  bright  brand-blue tile, white mark, white dot     -> the "-bright" set the Meta
                                                        glasses menu scrapes (their
                                                        additive display drops dark
                                                        pixels), and the sub-app icons

The dot uses the site accent (#1B74BC) so the logo matches everything around
it. The brand board's palette swatch reads #1B74FC; if the accent is changing,
that's a site-wide change, not an icon change.

Requires Pillow and Chrome. Set CHROME=/path/to/chrome to override discovery.
"""
import io, os, shutil, subprocess, sys, tempfile
from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
ACCENT = "#1B74BC"
INK = "#0A0E14"

# Mark geometry, 1 unit = 1px on the brand board. viewBox is 0 -11 194 185: the
# dot rises 11 units above the bracket's top edge and 9 past its right edge.
C_PATH = "M98 13 H37 A24 24 0 0 0 13 37 V137 A24 24 0 0 0 37 161 H48"
J_PATH = "M70 161 H148 A24 24 0 0 0 172 137 V76"
MW, MH = 194, 185
MASTER = 2048
TILE_RADIUS = 0.16   # of side, measured off the board's own tiles
MARK_IN_TILE = 0.58  # mark width as a fraction of tile side

def mark_group(mark, dot, x, y, s):
    return (f'<g transform="translate({x},{y}) scale({s}) translate(0,11)">'
            f'<path d="{C_PATH} {J_PATH}" fill="none" stroke="{mark}" stroke-width="26" stroke-linecap="butt"/>'
            f'<circle cx="166.5" cy="16" r="27" fill="{dot}"/></g>')

def standalone_svg(mark, dot):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -11 {MW} {MH}">'
            f'<path d="{C_PATH} {J_PATH}" fill="none" stroke="{mark}" stroke-width="26" stroke-linecap="butt"/>'
            f'<circle cx="166.5" cy="16" r="27" fill="{dot}"/></svg>\n')

CHROME_CANDIDATES = [
    os.environ.get("CHROME"),
    r"C:/Program Files/Google/Chrome/Application/chrome.exe",
    r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome", "chromium", "chromium-browser",
]

def find_chrome():
    for c in CHROME_CANDIDATES:
        if not c:
            continue
        if os.path.isfile(c):
            return c
        w = shutil.which(c)
        if w:
            return w
    sys.exit("make-icons: Chrome not found. Set CHROME=/path/to/chrome and re-run.")

def render(chrome, tmp, inner, w, h):
    html = (f'<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{inner}</svg></body></html>')
    hp = os.path.join(tmp, "r.html"); io.open(hp, "w", encoding="utf-8").write(html)
    out = os.path.join(tmp, "r.png")
    if os.path.exists(out): os.remove(out)
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", "--default-background-color=00000000",
                    "--virtual-time-budget=3000", "--window-size=%d,%d" % (w, h),
                    "--screenshot=%s" % out, "file:///" + hp.replace("\\", "/")],
                   capture_output=True, timeout=180)
    if not os.path.exists(out):
        sys.exit("make-icons: Chrome produced no screenshot")
    return Image.open(out).convert("RGBA")

def masters(chrome, tmp):
    s = MASTER / MW
    glyph = render(chrome, tmp, mark_group("#FFFFFF", ACCENT, 0, 0, s), MASTER, round(MH * s))
    def tile(bg, mark, dot):
        r = round(MASTER * TILE_RADIUS); ts = (MASTER * MARK_IN_TILE) / MW
        w, h = MW * ts, MH * ts
        inner = f'<rect width="{MASTER}" height="{MASTER}" rx="{r}" fill="{bg}"/>' + \
                mark_group(mark, dot, (MASTER - w) / 2, (MASTER - h) / 2, ts)
        return render(chrome, tmp, inner, MASTER, MASTER)
    return glyph, tile(INK, "#FFFFFF", ACCENT), tile(ACCENT, "#FFFFFF", "#FFFFFF")

def fit(src, w, h):
    return src.resize((w, h), Image.LANCZOS)

def outputs(glyph, dark, bright):
    """Yield (repo path, PIL image or ('ico', [images]))."""
    yield "favicon/glyph-bright.png", fit(glyph, 256, round(256 * MH / MW))
    for name, size in [("favicon/icon-512.png", 512), ("favicon/icon-192.png", 192),
                       ("favicon/apple-touch-icon.png", 180), ("favicon/favicon-48x48.png", 48),
                       ("favicon/favicon-32x32.png", 32), ("favicon/favicon-16x16.png", 16)]:
        yield name, fit(dark, size, size)
    ico = [fit(dark, s, s) for s in (48, 32, 16)]
    yield "favicon.ico", ("ico", ico)
    yield "favicon/favicon.ico", ("ico", ico)
    for name, size in [("favicon/icon-192-bright.png", 192), ("favicon/icon-96-bright.png", 96),
                       ("favicon/icon-52-bright.png", 52)]:
        yield name, fit(bright, size, size)
    for app in ("coach", "hazard", "hud"):
        for fn, size in [("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-96.png", 96), ("icon-52.png", 52)]:
            if os.path.exists(os.path.join(REPO, app, fn)):
                yield f"{app}/{fn}", fit(bright, size, size)

def main():
    check = "--check" in sys.argv
    chrome = find_chrome()
    tmp = tempfile.mkdtemp(prefix="make-icons-")
    failures = 0
    try:
        glyph, dark, bright = masters(chrome, tmp)
        svg_path = os.path.join(REPO, "favicon", "skill-reality-mark.svg")
        svg_text = standalone_svg(INK, ACCENT)
        if check:
            cur = io.open(svg_path, encoding="utf-8").read() if os.path.exists(svg_path) else None
            print("  %-34s %s" % ("favicon/skill-reality-mark.svg", "matches" if cur == svg_text else "DIFFERS"))
            failures += 0 if cur == svg_text else 1
        else:
            io.open(svg_path, "w", encoding="utf-8", newline="\n").write(svg_text)
            print("  wrote %-34s (vector master)" % "favicon/skill-reality-mark.svg")
        for rel, img in outputs(glyph, dark, bright):
            dest = os.path.join(REPO, rel)
            tmpout = dest + ".new"
            if isinstance(img, tuple):
                ico = img[1]
                ico[0].save(tmpout, format="ICO", sizes=[(48, 48), (32, 32), (16, 16)], append_images=ico[1:])
            else:
                img.save(tmpout, format="PNG", optimize=True)
            if check:
                a = Image.open(dest).convert("RGBA").tobytes() if os.path.exists(dest) else None
                b = Image.open(tmpout).convert("RGBA").tobytes()
                same = a == b
                print("  %-34s %s" % (rel, "matches" if same else "DIFFERS"))
                failures += 0 if same else 1
                os.remove(tmpout)
            else:
                os.replace(tmpout, dest)
                print("  wrote %-34s" % rel)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if check and failures:
        sys.exit("make-icons: %d asset(s) differ from the committed files" % failures)

if __name__ == "__main__":
    main()
