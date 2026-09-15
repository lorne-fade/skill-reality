#!/usr/bin/env python3
"""Regenerate og-card.png and deck-cover.jpg.

    python scripts/social-cards/make-cards.py           # write the cards
    python scripts/social-cards/make-cards.py --check    # verify, write nothing

Why this exists
---------------
Both cards had two claims baked into their pixels — an "A VR VISION COMPANY"
badge and "A 10-year company on a brand-new platform." — that stayed live long
after the same claims were removed from the page, because no text search can
see them. og-card.png renders on every link unfurl and deck-cover.jpg sits at
the top of every investor deck email, so they are the two places a stale claim
is most likely to actually be read.

There is no design source in this repo, so rather than rebuild the artwork and
risk drift, this erases ONLY the two text regions and re-renders just those.
Photo panel, HUD overlay, wordmark, headline, body copy, gradients and glow all
stay identical at the pixel level.

To change the copy: edit BOLD / BADGE below and re-run. If a new string is much
longer, check it still clears the photo panel (it starts at x~763).

How it works
------------
1. PRISTINE_REV holds the artwork as it was before the first correction. Working
   from it every time means corrections never stack on corrections.
2. Each stale text band is erased by interpolating the background per column
   between a clean reference row above and below, so the panel's gradient is
   preserved instead of being flat-filled.
3. The replacement text is rendered by headless Chrome in the real site fonts,
   AT 2x, then downsampled and composited.

That 2x step is not cosmetic. The original cards were produced that way — their
glyph peaks reach ~215 while most pixels stay dim, which is the signature of a
downsampled raster. Rendering at 1x produces crisper, flatter text that reads
noticeably brighter side by side even at identical colour values.

Sizes and colours below were fitted to the originals by measurement, not by eye:
16.5px bold and 9.5px/2px-tracking mono reproduce the original ink widths, and
the result matches the originals' mean-of-lit brightness within ~5 levels.

Requires: Pillow, Google Chrome, and network access for the webfonts.
Set CHROME=/path/to/chrome to override browser discovery.
"""
import io, os, shutil, subprocess, sys, tempfile
from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

# Artwork as it was before any correction. Never regenerate from the live files:
# they already contain rendered text, and erasing it twice would degrade them.
PRISTINE_REV = "46201d1"

SCALE = 2

BOLD  = "A founder with 10 years in enterprise XR, on a brand-new platform."
BADGE = "BUILT BY A VR VISION CO-FOUNDER \u00b7 10 YEARS \u00b7 100+ DEPLOYMENTS"

# bands: (x0, x1, y0, y1, clean_row_above, clean_row_below) — the regions to erase
CARDS = {
    "og-card.png": dict(
        w=1200, h=630, fmt="PNG",
        bands=[(30, 470, 466, 491, 462, 495),     # the bold line
               (30, 620, 504, 556, 500, 561)],    # the pill, including its glow
        bold_left=48, bold_top=469, pill_left=40, pill_top=512,
    ),
    "deck-cover.jpg": dict(
        w=1200, h=600, fmt="JPEG",                # must stay JPEG: the deck email links this path
        bands=[(60, 480, 444, 468, 440, 472),
               (60, 620, 481, 528, 477, 533)],
        bold_left=74, bold_top=447, pill_left=72, pill_top=488,
    ),
}

HTML = """<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=block" rel="stylesheet">
<style>
 html,body{{margin:0;padding:0;width:{w}px;height:{h}px;overflow:hidden;background:transparent}}
 .bold{{position:absolute;left:{bold_left}px;top:{bold_top}px;font-family:'Hanken Grotesk',sans-serif;
        font-weight:700;font-size:16.5px;line-height:1;color:rgba(240,244,248,0.84);
        white-space:nowrap;letter-spacing:-0.1px}}
 .pill{{position:absolute;left:{pill_left}px;top:{pill_top}px;height:32px;box-sizing:border-box;
        display:inline-flex;align-items:center;gap:9px;padding:0 15px;
        border:1px solid rgba(240,244,248,0.10);border-radius:100px;background:rgba(27,116,188,0.06)}}
 .dot{{width:6px;height:6px;border-radius:50%;background:#1B74BC;flex:none}}
 .btxt{{font-family:'IBM Plex Mono',monospace;font-weight:400;font-size:9.5px;letter-spacing:2px;
        color:rgba(240,244,248,0.72);white-space:nowrap}}
</style></head><body>
<div class="bold">{bold}</div>
<div class="pill"><span class="dot"></span><span class="btxt">{badge}</span></div>
</body></html>"""

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
        which = shutil.which(c)
        if which:
            return which
    sys.exit("make-cards: Chrome not found. Set CHROME=/path/to/chrome and re-run.")

def pristine(name):
    """The card as it was before any correction, read straight out of git."""
    raw = subprocess.run(["git", "show", "%s:%s" % (PRISTINE_REV, name)],
                         cwd=REPO, capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(raw)).convert("RGB")

def erase(im, x0, x1, y0, y1, ref_above, ref_below):
    px = im.load()
    span = (y1 - y0) + 2.0
    for x in range(x0, x1 + 1):
        top, bot = px[x, ref_above], px[x, ref_below]
        for y in range(y0, y1 + 1):
            t = (y - y0 + 1) / span
            px[x, y] = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))

def build(name, cfg, chrome, tmp):
    plate = pristine(name)
    if plate.size != (cfg["w"], cfg["h"]):
        sys.exit("make-cards: %s at %s is %s, expected %s"
                 % (name, PRISTINE_REV, plate.size, (cfg["w"], cfg["h"])))
    for band in cfg["bands"]:
        erase(plate, *band)

    hp = os.path.join(tmp, "card.html")
    io.open(hp, "w", encoding="utf-8").write(HTML.format(bold=BOLD, badge=BADGE, **cfg))
    ov = os.path.join(tmp, "overlay.png")
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=%d" % SCALE,
                    "--default-background-color=00000000",
                    "--virtual-time-budget=8000",
                    "--window-size=%d,%d" % (cfg["w"], cfg["h"]),
                    "--screenshot=%s" % ov,
                    "file:///" + hp.replace("\\", "/")], capture_output=True, timeout=180)
    if not os.path.exists(ov):
        sys.exit("make-cards: Chrome produced no screenshot for %s" % name)

    overlay = Image.open(ov).convert("RGBA")
    if overlay.size != (cfg["w"], cfg["h"]):
        overlay = overlay.resize((cfg["w"], cfg["h"]), Image.LANCZOS)

    out = plate.convert("RGBA")
    out.alpha_composite(overlay)
    return out.convert("RGB")

def main():
    check = "--check" in sys.argv
    chrome = find_chrome()
    tmp = tempfile.mkdtemp(prefix="social-cards-")
    failures = 0
    try:
        for name, cfg in CARDS.items():
            img = build(name, cfg, chrome, tmp)
            dest = os.path.join(REPO, name)
            if cfg["fmt"] == "JPEG":
                img.save(dest + ".new", "JPEG", quality=90, optimize=True, progressive=True)
            else:
                img.save(dest + ".new", "PNG", optimize=True)
            if check:
                same = (os.path.exists(dest)
                        and Image.open(dest).convert("RGB").tobytes()
                            == Image.open(dest + ".new").convert("RGB").tobytes())
                print("  %-16s %s" % (name, "matches committed file" if same else "DIFFERS"))
                failures += 0 if same else 1
                os.remove(dest + ".new")
            else:
                os.replace(dest + ".new", dest)
                print("  wrote %-16s %s %s" % (name, img.size, cfg["fmt"]))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if check and failures:
        sys.exit("make-cards: %d card(s) differ from the committed files" % failures)

if __name__ == "__main__":
    main()
