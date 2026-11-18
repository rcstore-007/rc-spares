"""Runs on GitHub (see .github/workflows/build.yml): rebuilds the website from products.json.
This is how parts added from the phone page appear on the website.
Parts added from the phone with a web photo carry "pending_images" (photo links); those photos are
downloaded here, because a phone browser isn't allowed to download photos from other websites."""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import sitegen  # noqa: E402

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
TYPES = {"image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
MAX_BYTES = 4 * 1024 * 1024


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=20) as r:
        ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        data = r.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES or len(data) < 1500:
        raise ValueError("size")
    ext = TYPES.get(ctype)
    if not ext:
        if data[:3] == b"\xff\xd8\xff":
            ext = "jpg"
        elif data[:8] == b"\x89PNG\r\n\x1a\n":
            ext = "png"
        elif data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            ext = "webp"
        else:
            raise ValueError("not a photo")
    return data, ext


def fetch_pending_photos(products):
    changed = False
    for p in products:
        chosen = p.pop("pending_images", None) or []
        backup = p.pop("pending_fallback", None) or []
        if not chosen and not backup:
            continue
        changed = True
        images = list(p.get("images") or [])
        got = 0
        for url in chosen:
            if len(images) >= 4:
                break
            try:
                data, ext = download(url)
            except Exception:
                continue
            got += 1
            images.append(save(p["slug"], len(images) + 1, data, ext))
        if not images:                       # none of the chosen photos worked: try a backup for the main photo
            for url in backup[:6]:
                try:
                    data, ext = download(url)
                except Exception:
                    continue
                images.append(save(p["slug"], 1, data, ext))
                break
        p["images"] = images
        print(f"{p['name']}: {len(images)} photo(s)")
    return changed


def save(slug, n, data, ext):
    d = ROOT / "images" / slug
    d.mkdir(parents=True, exist_ok=True)
    name = f"{n}-{hashlib.md5(data).hexdigest()[:6]}.{ext}"
    (d / name).write_bytes(data)
    return f"images/{slug}/{name}"


settings = json.loads((HERE / "settings.json").read_text(encoding="utf-8"))
pf = ROOT / "products.json"
products = json.loads(pf.read_text(encoding="utf-8")) if pf.exists() else []
fetch_pending_photos(products)
sitegen.build_site(ROOT, settings, products, tools=False)
print(f"Built {len(products)} part page(s).")
