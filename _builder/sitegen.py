"""
Builds the website files from the product list.

website/
  index.html            home + shop (all products baked in)
  parts/<slug>.html     one Google-friendly page per product
  images/<slug>/N.jpg   product photos
  assets/               style, script, logo
  products.json         the product list (the app's data)
  sitemap.xml, robots.txt, CNAME (if you use your own domain)
"""

import datetime as dt
import hashlib
from urllib.parse import quote
import html
import json
import re
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE / "site_template"


FIX_ICONS = {'gear': '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/>', 'spring': '<path d="M8 3h8M8 21h8M12 3v2M12 19v2M7 7l10 2-10 2 10 2-10 2 10 2"/>', 'steer': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 14.2v6.3M9.9 11.3 4 9.5M14.1 11.3 20 9.5"/>', 'battery': '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3M7 12h4M9 10v4"/>', 'tyre': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>', 'bolt': '<path d="M13 2 5 13.5h6L10 22l8-11.5h-6z"/>', 'hook': '<path d="M12 3v9a4 4 0 1 1-4-4"/><path d="M9 3h6"/>', 'signal': '<path d="M4.9 9a10 10 0 0 1 14.2 0M7.8 12a6 6 0 0 1 8.4 0M10.6 15a2 2 0 0 1 2.8 0"/><circle cx="12" cy="18.5" r="1"/>', 'light': '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'}
FIXES = [  # (problem, usual cause, icon, topic on the Fix & upgrade page, area, first thing to check)
    ("Stripped or grinding gears", "Usually incorrect gear mesh or a fully locked slipper clutch.", "gear", "stripped-gears", "Drivetrain", "Gear mesh, using the paper-strip test."),
    ("Bottoming out on jumps", "Shock oil too thin for the heat, or springs too soft for the weight.", "spring", "bottoming-out", "Suspension", "Oil level and thickness (cSt) in each shock."),
    ("Weak or slow steering", "Dual rate turned down, binding in the linkage, or a servo short on torque.", "steer", "weak-steering", "Steering", "The D/R knob on your transmitter, then binding."),
    ("Short run time", "Ageing LiPo cells, voltage sag tripping the cutoff, or drivetrain drag.", "battery", "short-run-time", "Battery", "Each cell's voltage after a full charge."),
    ("Sliding, no grip", "Tread or compound wrong for the surface, or tired foam inserts.", "tyre", "no-grip", "Tyres", "Tread and compound for your surface; clean rubber."),
    ("Not fast enough", "A throttle limit left on, an uncalibrated ESC, or conservative gearing.", "bolt", "not-fast", "Power", "Throttle limit switch and ESC calibration."),
    ("Stuck on the trail", "Weight sitting too high or too far back, or tyres too hard for rock.", "hook", "stuck-on-trail", "Crawling", "Weight placement: low and towards the front."),
    ("Signal dropouts", "Antenna placement, interference from power wiring, or a servo brownout.", "signal", "signal-dropouts", "Radio", "Transmitter batteries and antenna routing."),
    ("Lights dim or flickering", "12V lights running off a 5–6V receiver port, or loose pins.", "light", "lights", "Lighting", "The light's voltage against the port powering it."),
    ("Motor or ESC overheating", "Pinion too large, drag in the drivetrain, or summer heat.", "bolt", "overheating", "Thermal", "Pinion size: drop one or two teeth."),
    ("ESC blinking, no drive", "Usually a protection mode: low voltage, heat or calibration.", "bolt", "esc-blinking", "Electronics", "Battery charge and the cutoff setting for its type."),
    ("Wheel wobble", "A loose nut, a rounded wheel hex or a bent axle.", "tyre", "wheel-wobble", "Wheels", "The wheel nut, then the hex for rounded corners."),
]


def _ic(k):
    return f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{FIX_ICONS[k]}</svg>'


def asset_v(name):
    """Short fingerprint of an asset file, added to its link so browsers fetch the new version after an update."""
    try:
        return hashlib.md5((TEMPLATE / "assets" / name).read_bytes()).hexdigest()[:8]
    except OSError:
        return "1"

CATEGORIES = ["Motors & ESCs", "Tyres & Wheels", "Shocks", "Batteries & Chargers",
              "Gears & Drivetrain", "Servos", "Lights", "Winch",
              "Radios & Receivers", "Tools & Accessories"]
SCALES = ["1:30", "1:24", "1:18", "1:12", "1:10", "1:8", "1:7", "1:5"]


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def clean_variants(v, n_images=99):
    """Tidy a part's variations: {"label": "Colour", "options": [{"name", "price" (int or None), "img" (photo number or None)}]}.
    Returns None unless there is a label and at least 2 named options."""
    if not isinstance(v, dict):
        return None
    label = re.sub(r"\s+", " ", str(v.get("label") or "")).strip()[:30]
    opts, seen = [], set()
    for o in (v.get("options") or [])[:24]:
        if not isinstance(o, dict):
            continue
        name = re.sub(r"\s+", " ", str(o.get("name") or "")).strip()[:40]
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        price = o.get("price")
        try:
            price = int(float(str(price).replace(",", "").replace("₹", ""))) if price not in (None, "") else None
        except ValueError:
            price = None
        if price is not None and price <= 0:
            price = None
        img = o.get("img")
        img = img if isinstance(img, int) and not isinstance(img, bool) and 0 <= img < n_images else None
        opts.append({"name": name, "price": price, "img": img})
    if not label or len(opts) < 2:
        return None
    return {"label": label, "options": opts}


def option_price(p, o):
    return o["price"] if o and o.get("price") else int(p.get("price") or 0)


def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")
    return s[:70].strip("-") or "part"


def site_url(settings):
    u = (settings.get("site_url") or "").strip()
    return (u.rstrip("/") + "/") if u else ""


def store_html(name):
    """'RC Spares' -> 'RC <em>Spares</em>' (last word in the accent colour)."""
    words = esc(name).split()
    if len(words) < 2:
        return esc(name)
    return " ".join(words[:-1]) + " <em>" + words[-1] + "</em>"


def json_block(data):
    # Safe to place inside <script type="application/json">
    return json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")


DEFAULT_BULK_NOTE = "Discount available on higher quantities."
THEMES = ("garage", "midnight", "trackday")


def delivery_text(settings):
    t = str(settings.get("delivery") or "").strip()
    if not t:
        old = settings.get("delivery_days")
        t = "15–21" if not old or str(old) == "15" else str(old)
    return t.replace("-", "–").replace(" ", "")


def public_settings(settings):
    return {
        "name": settings.get("store_name") or "RC Spares",
        "whatsapp": re.sub(r"\D", "", settings.get("whatsapp") or ""),
        "currency": "₹",
        "delivery": delivery_text(settings),
        "categoryImages": {k: v for k, v in (settings.get("category_images") or {}).items() if v},
        "bulkNote": (settings.get("bulk_note") or DEFAULT_BULK_NOTE).strip(),
    }


def fill(text, settings, root):
    mark = (TEMPLATE / "assets" / "logo-mark.inline.svg").read_text(encoding="utf-8")
    pub = public_settings(settings)
    rep = {
        "{{ROOT}}": root,
        "{{STORE}}": esc(pub["name"]),
        "{{STORE_HTML}}": store_html(pub["name"]),
        "{{DAYS}}": esc(pub["delivery"]),
        "{{MARK}}": mark,
        "{{MARK48}}": mark.replace("<svg ", '<svg width="48" height="48" ', 1),
        "{{FIX_GRID}}": "".join(f'<a class="fixc" href="{root}guides.html#g-{g}"><span class="fxcode">{i:02d} · {esc(ar)}</span><b>{esc(t)}</b><small>{esc(c)}</small><span class="fxfirst"><em>First check</em>{esc(fc)}</span><span class="fa" aria-hidden="true">→</span></a>' for i, (t, c, k, g, ar, fc) in enumerate(FIXES, 1)),
        "{{MENU_FIX}}": "".join(f'<a href="{root}guides.html#g-{g}">{esc(t)}</a>' for t, c, k, g, ar, fc in FIXES),
        "{{MENU_CATS}}": "".join(f'<a href="{root}index.html?cat={quote(c)}#shop" data-mcat="{esc(c)}">{esc(c)}</a>' for c in CATEGORIES),
    }
    for k, v in rep.items():
        text = text.replace(k, v)
    return text


def partial(name):
    return (TEMPLATE / "partials" / f"{name}.html").read_text(encoding="utf-8")


def head(title, description, root, canonical="", image="", extra=""):
    parts = [
        '<!DOCTYPE html>',
        '<html lang="en-IN">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{esc(title)}</title>',
        f'<meta name="description" content="{esc(description)}">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(description)}">',
        '<meta property="og:type" content="website">',
    ]
    if canonical:
        parts.append(f'<link rel="canonical" href="{esc(canonical)}">')
        parts.append(f'<meta property="og:url" content="{esc(canonical)}">')
    if image:
        parts.append(f'<meta property="og:image" content="{esc(image)}">')
    parts += [
        f'<link rel="icon" type="image/png" href="{root}assets/favicon.png">',
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">',
        f'<link rel="stylesheet" href="{root}assets/style.css?v={asset_v("style.css")}">',
        extra,
        '</head>',
    ]
    return "\n".join(p for p in parts if p)


def themed(html_text, settings):
    t = settings.get("theme") if settings.get("theme") in THEMES else "garage"
    return html_text.replace('<html lang="en-IN">', f'<html lang="en-IN" data-theme="{t}">', 1)


# Car models customers can pick. (shown name, scale, pattern found in a part's name / "Fits" line / description)
CAR_MODELS = [  # (shown name, scale, pattern, parent model for body versions)
    ("Axial SCX24 (all versions)", "1:24", r"scx ?24", None),
    ("Axial SCX24 – C10 / JLU / Bronco / Deadbolt / Base Camp / 4Runner", "1:24", r"c10|jlu|wrangler|bronco|deadbolt|base ?camp|4runner|betty", "Axial SCX24 (all versions)"),
    ("Axial SCX24 – Gladiator / Power Wagon / JT", "1:24", r"gladiator|power ?wagon|\bjt\b", "Axial SCX24 (all versions)"),
    ("Axial AX24", "1:24", r"\bax ?24\b", None),
    ("FMS FCX24 / FCX24M (Power Wagon, Smasher, K5, Lemur, Unimog)", "1:24", r"fcx ?24|smasher|lemur|unimog ?421", None),
    ("Redcat Ascent-32", "1:32", r"ascent[- ]?32", None),
    ("Axial SCX30", "1:30", r"scx ?30", None),
    ("Traxxas TRX-4M", "1:18", r"trx[- ]?4[- ]?m\b", None),
    ("FMS FCX18 / FCX18 II (LC80, Bronco, F-100, K10)", "1:18", r"fcx ?18", None),
    ("MJX H18P", "1:18", r"h18p", None),
    ("Redcat Ascent-18 / APEX", "1:18", r"ascent[- ]?18", None),
    ("Axial UTB18 Capra", "1:18", r"utb ?18|capra", None),
    ("JJRC C8801 / C8809 / C8823", "1:18", r"\bc88(01|09|23)\b", None),
    ("MJX Hyper Go 1/16 & 1/14", "1:16", r"hyper ?go|\b1620[0-9]\b|\b142[01][0-9]\b|\b1430[0-9]\b|\b18208\b|\b20208\b", None),
    ("WPL C24 / C54", "1:16", r"wpl ?c\d+|\bc24\b|\bc54\b", None),
    ("HB Toys R1601–R1612", "1:16", r"hb ?toys|\br16(0[1-9]|1[0-2])\b", None),
    ("MN 1/12 series (MN82, MN99S, MN168…)", "1:12", r"\bmn ?(78|82|86|98|99|128|168)", None),
    ("MJX H12P / H12Y", "1:12", r"\bh12[py]\b", None),
    ("Axial SCX10", "1:10", r"scx ?10", None),
    ("Traxxas TRX-4", "1:10", r"trx[- ]?4(?![- ]?m\b)", None),
    ("FMS FCX10", "1:10", r"fcx ?10", None),
    ("Redcat Vertex-10", "1:10", r"vertex[- ]?10", None),
    ("RGT EX86100 series", "1:10", r"\bex86\d{3}\b|\bex136100\b|\brgt\b", None),
    ("JJRC C8815", "1:10", r"\bc8815\b", None),
    ("WPL D12", "1:10", r"wpl ?d12|\bd12\b", None),
    ("Yikong YK4107", "1:10", r"yikong|\byk ?41\d\d\b", None),
    ("MJX H8H / H8E", "1:8", r"\bh8[he]\b", None),
    ("Rlaarlo 1/7", "1:7", r"rlaarlo|mk07", None),
]


PART_KINDS = ("Replacement", "Upgrade", "Accessory")
_UPGRADE = r"\b(metal|brass|alumin(i)?um|alloy|steel|stainless|cnc|carbon|titanium|hardened|upgrade[ds]?|brushless|coreless|high torque|beadlock|silicone|weight(s|ed)?|heavy[- ]duty|portal)\b"
_ACCESSORY = r"\b(lights?|led|spotlights?|searchlight|headlights?|lamp|stand|jack|bag|luggage|net|sticker|decal|tools?|screwdriver|wrench|hex key|allen|sound|speaker|tire mount|spare tire|roof rack|winch|charger|power supply|bracket)\b"


def part_kind(p):
    """Replacement / Upgrade / Accessory: the owner's choice if set, otherwise a guess from the name."""
    if p.get("kind") in PART_KINDS:
        return p["kind"]
    name = (p.get("name") or "").lower()
    if p.get("category") in ("Lights", "Winch", "Tools & Accessories") or re.search(_ACCESSORY, name):
        return "Accessory"
    if re.search(_UPGRADE, name):
        return "Upgrade"
    return "Replacement"


# ---- cars: the list comes from Settings (so new cars can be added in the app), else the defaults above
ACTIVE_CARS = []          # set by build_site
CAR_LINKS = {}            # checked links for the catalogue (site_template/car_links.json)


def default_cars():
    return [{"name": m, "scale": sc, "pattern": pat, **({"parent": pa} if pa else {})} for m, sc, pat, pa in CAR_MODELS]


def cars_list(settings):
    cars = (settings or {}).get("cars")
    return [c for c in cars if c.get("name") and c.get("scale")] if cars else default_cars()


def _car_pattern(c):
    if c.get("pattern"):
        return c["pattern"]
    words = [w.strip().lower() for w in re.split(r"[,\n]", c.get("words") or "") if w.strip()] + [c["name"].lower()]
    return "|".join(re.escape(w).replace(r"\ ", r"[\s-]?").replace(r"\-", r"[\s-]?") for w in words)


def load_car_links():
    f = TEMPLATE / "car_links.json"
    try:
        return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    except ValueError:
        return {}


def models_for(p, cars=None):
    """Guess the cars a part is made for from its name, "Fits" line and description.
    Body versions (e.g. SCX24 Gladiator) count only when the parent model is named too."""
    cars = cars or ACTIVE_CARS or default_cars()
    text = " ".join([p.get("name") or "", p.get("fits") or "", (p.get("desc") or "")[:400]]).lower()
    found = []
    for c in cars:
        try:
            if re.search(_car_pattern(c), text):
                found.append((c["name"], c.get("parent")))
        except re.error:
            continue
    names = {m for m, pa in found}
    out = [m for m, pa in found if not pa or pa in names]
    kids = {pa for m, pa in found if pa and pa in names}
    return [m for m in out if m not in kids]


CAR_SPECIFIC_CATS = ("Gears & Drivetrain", "Shocks", "Tyres & Wheels", "Axles & Chassis")


def car_link(p):
    """(cars, status) for a part. status: ok = checked, check = waiting for the owner, auto = guessed for a new part.
    The owner's own choice (saved on the part) wins, then the checked catalogue links, then a guess."""
    known = {c["name"] for c in ACTIVE_CARS or default_cars()}
    if p.get("fit") in ("ok", "check"):
        return ([c for c in p.get("cars") or [] if c in known] if p["fit"] == "ok" else []), p["fit"]
    l = CAR_LINKS.get(p.get("id"))
    if l:
        return ([c for c in l.get("cars") or [] if c in known] if l.get("fit") == "ok" else []), l.get("fit", "ok")
    guess = models_for(p)
    if guess:
        return guess, "auto"
    return [], ("check" if p.get("category") in CAR_SPECIFIC_CATS else "auto")


def car_picker_models(products):
    """Cars that have at least one part, with scale, photo and parent (for body versions)."""
    cars = ACTIVE_CARS or default_cars()
    have = {m for p in products for m in car_link(p)[0]}
    out = []
    for c in cars:
        m, pa = c["name"], c.get("parent")
        if m in have or (pa and pa in have) or any(k.get("parent") == m and k["name"] in have for k in cars):
            d = {"name": m, "scale": c["scale"]}
            if pa:
                d["parent"] = pa
            if c.get("photo"):
                d["photo"] = c["photo"]
            out.append(d)
    return out


def admin_car_data(products):
    """For the PC and phone admin: the car list and each part's links and status."""
    links = {}
    for p in products:
        cars, st = car_link(p)
        l = CAR_LINKS.get(p.get("id")) or {}
        links[p["id"]] = {"cars": cars, "fit": st, "suggest": l.get("suggest") or models_for(p), "why": l.get("why", "")}
    return {"cars": ACTIVE_CARS or default_cars(), "links": links}


SIZE_KEYS = ("Wheel size", "Shock length", "Wheel hex")


def sizes_for(p):
    """Wheel size / shock length / hex size, from the specs if given, else from the name and options."""
    specs = {k.lower(): str(v) for k, v in (p.get("specs") or {}).items()}
    opts = " ".join(o.get("name", "") for o in ((p.get("variants") or {}).get("options") or []))
    name = (p.get("name") or "").lower()
    text = (name + " " + opts.lower())
    cat = p.get("category")
    out = {}
    given = specs.get("wheel size") or specs.get("rim size")
    if given:
        out["Wheel size"] = [x + " inch" for x in re.findall(r"[12]\.\d{1,2}", given)]
    elif cat == "Tyres & Wheels" or re.search(r"wheel|tyre|tire|rim|beadlock|insert", name):
        vals = re.findall(r"(?<![\d.])([12]\.\d{1,2})\s*(?:-|\s)?(?:inch|in\b|\"|”)", text) or \
            re.findall(r"(?<![\d.])([12]\.\d{1,2})(?=\s*(?:beadlock|wheel|tyre|tire|crawler|rim))", text)
        if vals:
            out["Wheel size"] = [v + " inch" for v in vals]
    given = specs.get("shock length") or specs.get("length")
    if given and (cat == "Shocks" or "shock" in name):
        out["Shock length"] = [x + " mm" for x in re.findall(r"\d{2,3}", given)]
    elif cat == "Shocks" or "shock" in name:
        vals = re.findall(r"(\d{2,3})\s*mm", text)
        if vals:
            out["Shock length"] = [v + " mm" for v in vals]
    given = specs.get("wheel hex") or specs.get("hex size") or specs.get("hex")
    if given:
        out["Wheel hex"] = [x + " mm" for x in re.findall(r"\d{1,2}", given)]
    elif "hex" in name:
        vals = re.findall(r"(\d{1,2})\s*mm", name)
        if vals:
            out["Wheel hex"] = [v + " mm" for v in vals]
    # batteries and leads: cell count and plug type
    alltext = " ".join([name, opts.lower(), " ".join(f"{k} {v}" for k, v in specs.items())])
    if cat == "Batteries & Chargers" or re.search(r"\b(battery|lipo|li-?ion|nimh|lead|connector|adapter|plug)\b", name):
        is_batt = re.search(r"\b(battery|lipo|li-?ion|nimh|pack)\b", name) or "battery" in str(specs.get("part type", "")).lower()
        if is_batt:
            cells = [c.upper() + "S" for c in re.findall(r"\b([1-8])\s*s\b", alltext)]
            volt = {"7.4": "2S", "7.6": "2S", "11.1": "3S", "11.4": "3S", "14.8": "4S", "22.2": "6S"}
            cells += [volt[v] for v in re.findall(r"(7\.4|7\.6|11\.1|11\.4|14\.8|22\.2)\s*v", alltext)]
            given = specs.get("cells")
            if given:
                cells = [c.upper() + "S" for c in re.findall(r"([1-8])", given)]
            if cells:
                out["Battery cells"] = cells
        plugs = {"xt30": "XT30", "xt60": "XT60", "xt90": "XT90", "deans": "Deans / T-plug", "t-plug": "Deans / T-plug", "t plug": "Deans / T-plug",
                 "ec3": "EC3", "ec5": "EC5", "tamiya": "Tamiya", "trx": "Traxxas", "sm-2p": "SM", "jst": "JST", "ph2.0": "PH2.0"}
        given = specs.get("plug") or specs.get("connector")
        src = given.lower() if given else alltext
        found = [v for k, v in plugs.items() if k in src]
        if found:
            out["Plug"] = found
    clean = {}
    for k, v in out.items():
        seen = []
        for x in v:
            if x not in seen:
                seen.append(x)
        if seen:
            clean[k] = seen
    return clean



def build_index(settings, products):
    pub = public_settings(settings)
    base = site_url(settings)
    title = f"{pub['name']} – RC Car Parts & Upgrades in India"
    desc = (f"RC car parts and upgrades in India: motors, ESCs, tyres, shocks, batteries, servos, lights "
            f"and winches for 1:30 to 1:5 scale. Order on WhatsApp, usually ships within {pub['delivery']} days.")
    ld = {"@context": "https://schema.org", "@type": "Store", "name": pub["name"],
          "description": desc, "currenciesAccepted": "INR", "areaServed": "IN"}
    if base:
        ld["url"] = base
        ld["logo"] = base + "assets/logo.png"
    extra = f'<script type="application/ld+json">{json_block(ld)}</script>'
    links = "\n".join(f'    <li><a href="parts/{esc(p["slug"])}.html">{esc(p["name"])}</a></li>' for p in products)
    body = "\n".join([
        '<body data-page="home" data-root="">',
        fill(partial("nav"), settings, ""),
        fill(partial("home"), settings, ""),
        f'<nav class="seo-list" aria-label="All parts"><ul>\n{links}\n</ul></nav>',
        fill(partial("footer"), settings, ""),
        fill(partial("cart"), settings, ""),
        f'<script id="store-settings" type="application/json">{json_block(pub)}</script>',
        f'<script id="products" type="application/json">{json_block([dict(p, variants=clean_variants(p.get("variants"), len(p.get("images") or [])), models=car_link(p)[0], kind=part_kind(p), sizes=sizes_for(p)) for p in products])}</script>',
        f'<script id="car-models" type="application/json">{json_block(car_picker_models(products))}</script>',
        f'<script src="assets/store.js?v={asset_v("store.js")}"></script>',
        '</body>',
        '</html>',
    ])
    return head(title, desc, "", base, (base + "assets/logo.png") if base else "", extra) + "\n" + body


HOLO_SVG = '''<svg class="holo-car" viewBox="0 0 600 300" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <g class="h-body">
    <path d="M70 196 L88 150 L190 140 L232 92 L372 90 L404 136 L520 146 L548 168 L552 196"/>
    <path d="M244 100 L238 138 M300 96 L300 138 M362 98 L388 138"/>
    <path d="M70 196 L96 196 M204 196 L396 196 M504 196 L552 196"/>
    <path d="M110 212 L490 212" class="h-faint"/>
  </g>
  <g class="h-part p-light"><path d="M252 82 L360 82"/><path d="M262 82 L262 76 M282 82 L282 76 M302 82 L302 76 M322 82 L322 76 M342 82 L342 76"/><path d="M530 156 l14 4 l0 10 l-14 -2 z"/></g>
  <g class="h-part p-radio"><rect x="338" y="150" width="34" height="22" rx="3"/><path d="M366 150 L380 112"/><path d="M470 40 h52 v34 h-52 z M484 40 v-14 M508 40 v-10 M482 58 h28" class="h-tx"/></g>
  <g class="h-part p-battery"><rect x="214" y="158" width="96" height="26" rx="4"/><path d="M228 158 v-6 M244 158 v-6"/></g>
  <g class="h-part p-motor"><rect x="320" y="178" width="46" height="26" rx="8"/><circle cx="314" cy="191" r="13"/></g>
  <g class="h-part p-drive"><path d="M152 232 L300 204 L448 232"/><circle cx="300" cy="204" r="9"/><path d="M128 232 h48 M424 232 h48"/></g>
  <g class="h-part p-servo"><rect x="424" y="176" width="34" height="20" rx="3"/><path d="M441 196 L452 228"/></g>
  <g class="h-part p-shock"><path d="M118 152 L140 222 M478 152 L458 222"/><path d="M121 166 l10 -3 M124 176 l10 -3 M127 186 l10 -3 M130 196 l10 -3 M475 166 l-10 -3 M472 176 l-10 -3 M469 186 l-10 -3 M466 196 l-10 -3"/></g>
  <g class="h-part p-winch"><rect x="548" y="186" width="24" height="18" rx="3"/><path d="M572 195 h12 v18 a6 6 0 0 1 -12 0"/></g>
  <g class="h-part p-wheels"><circle cx="150" cy="232" r="48"/><circle cx="150" cy="232" r="22"/><circle cx="450" cy="232" r="48"/><circle cx="450" cy="232" r="22"/>
    <path d="M150 184 v10 M150 270 v10 M102 232 h10 M188 232 h10 M450 184 v10 M450 270 v10 M402 232 h10 M488 232 h10"/></g>
  <line class="h-scan" x1="0" x2="600" y1="0" y2="0"/>
</svg>'''

HOLO_MAP = {"Tyres & Wheels": ("wheels", "Wheels and tyres"), "Shocks": ("shock", "Suspension, front and rear"),
            "Motors & ESCs": ("motor", "Motor and speed controller"), "Batteries & Chargers": ("battery", "Battery tray"),
            "Gears & Drivetrain": ("drive", "Gearbox, driveshafts and axles"), "Servos": ("servo", "Steering servo"),
            "Lights": ("light", "Light bar and headlights"), "Winch": ("winch", "Front bumper winch"),
            "Radios & Receivers": ("radio", "Receiver and transmitter"), "Tools & Accessories": ("all", "Works on your whole rig")}


FIT_RULES = [  # (words in the product name, zone, label) — first match wins
    (("beadlock", "rim", "rims"), "rims", "Rims"),
    (("tyre", "tire"), "tyres", "Tyres"),
    (("wheel hub", "hex", "counterweight", "wheel weight", "brass weight", "hub"), "hubs", "Wheel hubs"),
    (("wheel",), "wheels", "Wheels and tyres"),
    (("diff", "locker", "differential", "spool"), "diff", "Differential"),
    (("knuckle", "c-hub", "c hub", "steering cup", "portal", "caster block"), "knuckles", "Steering knuckles"),
    (("axle", "pumpkin", "axle housing"), "axles", "Axles"),
    (("link", "rod end", "trailing arm"), "links", "Suspension links"),
    (("shock", "damper", "spring"), "shocks", "Shocks"),
    (("driveshaft", "drive shaft", "cvd", "dogbone", "dog bone", "universal joint", "propshaft", "prop shaft"), "driveshafts", "Driveshafts"),
    (("transmission", "gearbox", "gear box", "transfer case"), "transmission", "Gearbox"),
    (("pinion", "spur", "gear"), "gears", "Gears"),
    (("servo horn", "servo saver", "steering link", "tie rod", "drag link", "steering"), "steering", "Steering"),
    (("servo",), "servo", "Steering servo"),
    (("esc", "speed controller") , "esc", "Speed controller"),
    (("motor", "fan", "heatsink", "heat sink", "cooling"), "motor", "Motor"),
    (("battery", "lipo", "li-po", "charger", "balance lead"), "battery", "Battery"),
    (("transmitter", "radio", "remote"), "radio", "Transmitter and receiver"),
    (("receiver", "antenna"), "receiver", "Receiver"),
    (("sound", "speaker", "gyro"), "electronics", "Electronics bay"),
    (("chassis", "frame", "ladder", "rail"), "chassis", "Chassis"),
    (("skid",), "skid", "Skid plate"),
    (("winch",), "winch", "Winch"),
    (("light", "led", "lamp", "spotlight", "searchlight"), "lights", "Lights"),
    (("bumper",), "bumper", "Bumpers"),
    (("body", "shell", "interior", "roof", "luggage", "window"), "body", "Body"),
]
CAT_FIT = {"Tyres & Wheels": ("wheels", "Wheels and tyres"), "Shocks": ("shocks", "Shocks"), "Motors & ESCs": ("motoresc", "Motor and speed controller"),
           "Batteries & Chargers": ("battery", "Battery"), "Gears & Drivetrain": ("drivetrain", "Drivetrain"), "Servos": ("servo", "Steering servo"),
           "Lights": ("lights", "Lights"), "Winch": ("winch", "Winch"), "Radios & Receivers": ("radio", "Transmitter and receiver"),
           "Tools & Accessories": ("all", "Works on your whole rig")}


def fit_for(p):
    """Which part of the rig this product belongs to, from its name (falls back to its category)."""
    if p.get("fit"):
        return p["fit"], p.get("fit_label") or p["fit"].title()
    name = " " + re.sub(r"[^a-z0-9]+", " ", (p.get("name") or "").lower()) + " "
    cat = p.get("category")
    has = lambda w: (" " + w + " ") in name or (" " + w + "s ") in name or (len(w) > 4 and w in name)
    if has("motor") and (has("esc") or has("combo")):
        return "motoresc", "Motor and speed controller"
    allowed = {"Servos": ("servo", "steering"), "Batteries & Chargers": ("battery",), "Lights": ("lights",), "Winch": ("winch",),
               "Radios & Receivers": ("radio", "receiver"), "Motors & ESCs": ("motor", "esc", "motoresc", "electronics"),
               "Tools & Accessories": ("lights", "body", "winch", "bumper", "electronics", "chassis", "receiver")}.get(cat)
    for words, zone, label in FIT_RULES:
        if any(has(w) for w in words):
            if allowed and zone not in allowed:
                break
            return zone, label
    return CAT_FIT.get(cat, ("all", "Works on your whole rig"))


def holo_panel(p):
    zone, label = fit_for(p)
    scales = ", ".join(p.get("scale") or [])
    key, _ = HOLO_MAP.get(p.get("category"), ("all", ""))
    return (f'<div class="holo" data-hl="{key}" data-fit="{zone}"><div class="holo-head"><span>Where it fits</span><b>{esc(label)}</b></div>'
            f'<div class="holo-stage"><div class="holo-tag">{esc(label)}</div>{HOLO_SVG}</div>'
            f'<div class="holo-foot">{esc(scales + " scale") if scales else ""}</div></div>')


def build_part(settings, p):
    pub = public_settings(settings)
    base = site_url(settings)
    root = "../"
    url = f"{base}parts/{p['slug']}.html" if base else ""
    price = f"₹{int(p.get('price') or 0):,}"
    title = f"{p['name']} – Price in India | {pub['name']}"
    short = re.sub(r"\s+", " ", p.get("desc") or "").strip()
    desc = f"{p['name']} at {price}. {short}"
    if len(desc) > 155:
        desc = desc[:152].rsplit(" ", 1)[0] + "..."
    imgs = p.get("images") or []
    abs_imgs = [base + i for i in imgs] if base else []
    var = clean_variants(p.get("variants"), len(imgs))
    first = var["options"][0] if var else None
    if first:
        price = f"₹{option_price(p, first):,}"
    start_img = imgs[first["img"]] if first and first.get("img") is not None else (imgs[0] if imgs else None)

    ld = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": p["name"],
        "sku": p["id"],
        "category": p.get("category", ""),
        "description": short or p["name"],
        "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": str(int(p.get("price") or 0)),
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
        },
    }
    if var:
        prices = [option_price(p, o) for o in var["options"]]
        if min(prices) != max(prices):
            ld["offers"] = {"@type": "AggregateOffer", "priceCurrency": "INR", "lowPrice": str(min(prices)),
                            "highPrice": str(max(prices)), "offerCount": str(len(prices)),
                            "availability": "https://schema.org/InStock"}
    if p.get("brand"):
        ld["brand"] = {"@type": "Brand", "name": p["brand"]}
    if abs_imgs:
        ld["image"] = abs_imgs
    if url:
        ld["offers"]["url"] = url
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", **({"item": base} if base else {})},
        {"@type": "ListItem", "position": 2, "name": p.get("category", ""), **({"item": base + "index.html#shop"} if base else {})},
        {"@type": "ListItem", "position": 3, "name": p["name"]},
    ]}
    extra = (f'<script type="application/ld+json">{json_block(ld)}</script>\n'
             f'<script type="application/ld+json">{json_block(crumbs)}</script>')

    # Gallery
    if imgs:
        main = f'<div class="gmain"><img id="gMain" src="{root}{esc(start_img)}" alt="{esc(p["name"])}"></div>'
        thumbs = ""
        if len(imgs) > 1:
            thumbs = '<div class="thumbs">' + "".join(
                f'<button data-thumb="{root}{esc(i)}" aria-pressed="{"true" if i == start_img else "false"}" aria-label="Photo {n + 1}"><img src="{root}{esc(i)}" alt=""></button>'
                for n, i in enumerate(imgs)) + "</div>"
        gallery = main + thumbs
    else:
        gallery = f'<div class="gmain art" style="{category_vars(p.get("category"))}">{category_art(p.get("category"))}</div>'

    scales = "".join(f'<span class="sc">{esc(s)} scale</span>' for s in p.get("scale") or [])
    var_html = ""
    if var:
        tiles = ""
        for n, o in enumerate(var["options"]):
            pic = f'<img src="{root}{esc(imgs[o["img"]])}" alt="">' if o.get("img") is not None else ""
            tiles += (f'<button type="button" class="vo{" has-img" if pic else ""}" data-vi="{n}" aria-pressed="{"true" if n == 0 else "false"}">'
                      f'{pic}<span class="vn">{esc(o["name"])}</span><span class="vp">₹{option_price(p, o):,}</span></button>')
        var_html = (f'<div class="vars"><div class="vl">{esc(var["label"])}: <b id="pVarName">{esc(first["name"])}</b></div>'
                    f'<div class="vopts" role="group" aria-label="{esc(var["label"])}">{tiles}</div></div>')
        rows = f'<tr><td>{esc(var["label"])}</td><td>{esc(", ".join(o["name"] for o in var["options"]))}</td></tr>'
    else:
        rows = ""
    if p.get("fits"):
        rows += f'<tr><td>Fits</td><td>{esc(p["fits"])}</td></tr>'
    rows += f'<tr><td>Scale</td><td>{esc(", ".join(p.get("scale") or []))}</td></tr>'
    for k, v in (p.get("specs") or {}).items():
        rows += f"<tr><td>{esc(k)}</td><td>{esc(v)}</td></tr>"
    have_keys = {k.lower() for k in (p.get("specs") or {})}
    for k, v in sizes_for(p).items():
        if k.lower() not in have_keys:
            rows += f"<tr><td>{esc(k)}</td><td>{esc(', '.join(v))}</td></tr>"
    rows += f'<tr><td>Part code</td><td>{esc(p["id"])}</td></tr>'
    rows += f'<tr><td>Shipping</td><td>Usually ships within {esc(pub["delivery"])} days</td></tr>'

    mods = car_link(p)[0]
    wa_num = re.sub(r"\D", "", settings.get("whatsapp") or "")
    ask = ""
    if wa_num:
        msg = f"Hi, will this part fit my car? {p['name']} ({p['id']}). My car is: "
        ask = f'<a class="pask" href="https://wa.me/{wa_num}?text={quote(msg)}" target="_blank" rel="noopener">Not sure it fits? Send us a photo of your car on WhatsApp →</a>'
    if mods:
        chips = "".join(f'<a class="fchip" href="{root}index.html?car={quote(m)}#shop">{esc(m)}</a>' for m in mods)
        fit_html = f'<div class="pfit"><div class="pfl">Made for</div><div class="fchips">{chips}</div>{ask}</div>'
    else:
        sc = " / ".join(p.get("scale") or [])
        what = esc(p["fits"]) if p.get("fits") else (f"Universal part for {esc(sc)} scale models. Check the size and mounting before ordering." if sc else "Universal part. Check the size and mounting before ordering.")
        fit_html = f'<div class="pfit"><div class="pfl">Fits</div><p class="fwhat">{what}</p>{ask}</div>'
    wa_icon = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>')
    main_html = f'''<main class="wrap">
  <div class="crumbs"><a href="../index.html#home">Home</a> › <a href="../index.html#shop">Shop</a> › {esc(p.get("category", ""))}</div>
  <div class="part">
    <div class="gallery">{gallery}</div>
    <div class="pinfo">
      <div class="cbrand">{esc(p.get("brand", ""))}</div>
      <h1>{esc(p["name"])}</h1>
      <div class="pp"><span class="price" id="pPrice">{price}</span></div>
      <div class="meta">{scales}<span>{esc(p.get("category", ""))}</span><span class="kind k-{part_kind(p).lower()}">{part_kind(p)}</span></div>
      {fit_html}
      {var_html}
      <p class="desc">{esc(short)}</p>
      <div class="pbtns">
        <button class="add" id="pAdd">Add to cart</button>
        <div class="incart" id="pInCart" hidden></div>
        <a class="wa" id="pNow" href="#" aria-disabled="true">{wa_icon} Order this on WhatsApp</a>
        <p class="bulk">{esc(pub["bulkNote"])}</p>
        <p class="note" id="pHint"></p>
      </div>
      <div class="deliv">Usually ships within <b>{esc(pub["delivery"])} days</b>. Shipping cost is confirmed on WhatsApp.</div>
      <h2>Details</h2>
      <table class="specs">{rows}</table>
      {holo_panel(p)}
      <div class="strip"><span><b>Need a different part?</b> We source parts on request for any brand and scale.</span><a href="../index.html#request">Request a part →</a></div>
    </div>
  </div>
</main>'''
    product_for_js = {k: p.get(k) for k in ("id", "slug", "name", "price", "category", "images", "brand", "scale")}
    product_for_js["variants"] = var
    body = "\n".join([
        '<body data-page="part" data-root="../">',
        fill(partial("nav"), settings, root),
        main_html,
        fill(partial("footer"), settings, root),
        fill(partial("cart"), settings, root),
        f'<script id="store-settings" type="application/json">{json_block(pub)}</script>',
        f'<script id="products" type="application/json">{json_block([product_for_js])}</script>',
        f'<script src="../assets/store.js?v={asset_v("store.js")}"></script>',
        f'<script src="../assets/holo3d.js?v={asset_v("holo3d.js")}" defer></script>',
        '</body>',
        '</html>',
    ])
    return head(title, desc, root, url, abs_imgs[0] if abs_imgs else "", extra) + "\n" + body


DEFAULT_RETURNS = ("If a part arrives damaged, faulty or different from what you ordered, message us on WhatsApp within 48 hours "
                   "of delivery with photos or an unboxing video. After checking, we will replace the part or refund you. "
                   "Parts that have been installed, used, modified or damaged by wrong use cannot be returned.")
DEFAULT_PAYMENT = "UPI or bank transfer"


def build_policies(settings):
    """One page with shipping, returns, payment, privacy and contact details (required for online sellers in India)."""
    pub = public_settings(settings)
    base = site_url(settings)
    g = lambda k: (settings.get(k) or "").strip()
    name, days = pub["name"], pub["delivery"]
    wa = re.sub(r"\D", "", settings.get("whatsapp") or "")
    wa_txt = f'+{wa[:2]} {wa[2:]}' if len(wa) > 10 else wa
    wa_link = f'<a href="https://wa.me/{wa}">{esc(wa_txt)}</a>' if wa else "our WhatsApp number"
    legal = g("legal_name") or name
    paras = lambda t: "".join(f"<p>{esc(x.strip())}</p>" for x in re.split(r"\n\s*\n|\n", t) if x.strip())
    contact_rows = [("Business name", esc(legal))]
    if g("address"):
        contact_rows.append(("Address", esc(g("address")).replace("\n", "<br>")))
    if wa:
        contact_rows.append(("WhatsApp / phone", wa_link))
    if g("email"):
        contact_rows.append(("Email", f'<a href="mailto:{esc(g("email"))}">{esc(g("email"))}</a>'))
    if g("gstin"):
        contact_rows.append(("GSTIN", esc(g("gstin"))))
    contact = "".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in contact_rows)
    griev = esc(g("grievance_name") or legal)
    griev_contact = wa_link + (f' or <a href="mailto:{esc(g("email"))}">{esc(g("email"))}</a>' if g("email") else "")
    updated = dt.date.today().strftime("%d %B %Y").lstrip("0")
    sections = [
        ("ordering", "Ordering and payment", f"""<p>Add parts to your cart and send the order to us on WhatsApp. We reply to confirm availability, the final price and the shipping cost before you pay. Nothing is charged on this website.</p>
<p>Payment methods: {esc(g("payment_modes") or DEFAULT_PAYMENT)}. Prices are in Indian rupees (₹).</p>"""),
        ("shipping", "Shipping and delivery", f"""<p>We deliver across India. Orders usually ship within <b>{esc(days)} days</b> after payment is confirmed. The shipping cost is confirmed on WhatsApp before you pay, and we share tracking details once your order is sent.</p>"""),
        ("returns", "Returns, refunds and cancellations", paras(g("returns_policy") or DEFAULT_RETURNS) + """<p>You can cancel an order for a full refund any time before it is shipped. Approved refunds are paid back to the way you paid.</p>"""),
        ("warranty", "Warranty", "<p>Parts are sold without any warranty. If a part arrives damaged, faulty or different from what you ordered, the returns policy above applies.</p>"),
        ("privacy", "Privacy", f"""<p>We only collect what we need to deliver your order: your name, phone number and delivery address, which you share with us on WhatsApp. We use them to confirm, ship and support your order, and share them only with the courier delivering it. We do not sell your details.</p>
<p>This website does not use tracking cookies, analytics or ads. Your cart is saved only in your own browser so it is still there when you come back; you can clear it at any time.</p>
<p>You can ask us to show, correct or delete the details we hold about you by messaging {wa_link}.</p>"""),
        ("contact", "Contact and complaints", f"""<table class="specs">{contact}</table>
<p><b>Grievance officer:</b> {griev}, reachable on {griev_contact}. We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>"""),
    ]
    toc = "".join(f'<a href="#{i}">{esc(t)}</a>' for i, t, _ in sections)
    body_html = "".join(f'<section class="pol" id="{i}"><h2>{esc(t)}</h2>{c}</section>' for i, t, c in sections)
    main_html = f'''<main class="wrap polwrap">
  <div class="crumbs"><a href="index.html#home">Home</a> › Policies</div>
  <h1>Store policies</h1>
  <p class="polsub">How ordering, delivery, returns and privacy work at {esc(name)}. Last updated {updated}.</p>
  <nav class="poltoc" aria-label="On this page">{toc}</nav>
  {body_html}
</main>'''
    body = "\n".join([
        '<body data-page="policies" data-root="">',
        fill(partial("nav"), settings, ""),
        main_html,
        fill(partial("footer"), settings, ""),
        fill(partial("cart"), settings, ""),
        f'<script id="store-settings" type="application/json">{json_block(pub)}</script>',
        '<script id="products" type="application/json">[]</script>',
        f'<script src="assets/store.js?v={asset_v("store.js")}"></script>',
        '</body>',
        '</html>',
    ])
    title = f"Store policies – shipping, returns and privacy | {name}"
    return themed(head(title, f"Shipping, returns, refunds, payment and privacy at {name}.", "", (base + "policies.html") if base else "") + "\n" + body, settings)


GUIDE_KINDS = [("problem", "Problems"), ("upgrade", "Upgrades"), ("care", "Care")]
GUIDE_CHIPS = ["Steering weak", "Battery dies fast", "Gears grinding", "Car too slow", "No grip", "Motor too hot"]


def load_guides():
    f = TEMPLATE / "guides.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else []


def _from_price(p):
    opts = (p.get("variants") or {}).get("options") or []
    prices = [o["price"] for o in opts if o.get("price")] or [int(p.get("price") or 0)]
    lo = min(prices)
    return ("from " if len(set(prices)) > 1 else "") + "₹" + f"{lo:,}"


def guide_parts(g, products, limit=6):
    """Parts from the shop for a guide. Takes turns over the guide's part words (most important first),
    so each kind of part gets a place; tops up from its categories only when few names match."""
    cats, words = g.get("cats") or [], [w.lower() for w in g.get("pwords") or []]
    pool = [p for p in products if not cats or p.get("category") in cats]
    picked, seen = [], set()
    has = lambda w, p: re.search(r"(?<![a-z])" + re.escape(w), (p.get("name") or "").lower())
    buckets = [[p for p in pool if has(w, p)] for w in words]
    while len(picked) < limit and any(buckets):
        for bk in buckets:
            while bk and bk[0]["slug"] in seen:
                bk.pop(0)
            if bk and len(picked) < limit:
                p = bk.pop(0)
                picked.append(p)
                seen.add(p["slug"])
    if len(picked) < 3:
        for p in pool:
            if len(picked) >= 3:
                break
            if p["slug"] not in seen and p.get("category") == (cats[0] if cats else None):
                picked.append(p)
                seen.add(p["slug"])
    return picked


def build_guides(settings, products):
    pub = public_settings(settings)
    base = site_url(settings)
    name = pub["name"]
    guides = load_guides()
    icons = dict(FIX_ICONS)
    cards = []
    for g in guides:
        parts = guide_parts(g, products)
        pc = "".join(
            f'<a class="gpart" href="parts/{esc(p["slug"])}.html">'
            + (f'<img src="{esc(p["images"][0])}" alt="" loading="lazy">' if p.get("images") else '<span class="noimg"></span>')
            + f'<span class="gpn">{esc(p["name"])}</span><span class="gpp">{_from_price(p)}</span></a>' for p in parts)
        more = (f'<a class="gmore" href="index.html?cat={quote(g["more"])}#shop">See all {esc(g["more"])} →</a>' if g.get("more") else "")
        body = ""
        if g.get("causes"):
            body += '<h3>Why it happens</h3><ul>' + "".join(f"<li>{esc(c)}</li>" for c in g["causes"]) + "</ul>"
        body += f'<h3>{"Check these, in order" if g["kind"] == "problem" else "Step by step"}</h3><ol>' + "".join(f"<li>{esc(x)}</li>" for x in g["steps"]) + "</ol>"
        if g.get("warn"):
            body += f'<p class="gwarn"><b>Careful:</b> {esc(g["warn"])}</p>'
        if g.get("tip"):
            body += f'<p class="gtip"><b>Good to know:</b> {esc(g["tip"])}</p>'
        if g.get("faq"):
            body += '<h3>Common questions</h3><div class="gfaq">' + "".join(
                f'<div class="gfq"><h4>{esc(q)}</h4><p>{esc(a)}</p></div>' for q, a in g["faq"]) + '</div>'
        if pc:
            body += f'<h3>Parts that help</h3><div class="gparts">{pc}</div>{more}'
        body += '<p class="gask">Still stuck? <a href="index.html#request">Tell us the problem on WhatsApp →</a></p>'
        text = " ".join([g["title"], g["summary"], g.get("words", ""), " ".join(g.get("causes") or []), " ".join(g["steps"]),
                         " ".join(q for q, a in g.get("faq") or [])]).lower()
        cards.append(
            f'<article class="guide" id="g-{esc(g["id"])}" data-kind="{esc(g["kind"])}" data-key="{esc((g["title"] + " " + g.get("words", "")).lower())}" data-text="{esc(text)}">'
            f'<button type="button" class="gq" aria-expanded="false" aria-controls="gb-{esc(g["id"])}">'
            f'<span class="gi">{_ic(g.get("icon") or "gear")}</span><span class="gt"><b>{esc(g["title"])}</b><small>{esc(g["summary"])}</small></span>'
            f'<span class="gch" aria-hidden="true"></span></button>'
            f'<div class="gbody" id="gb-{esc(g["id"])}" hidden>{body}</div></article>')
    tabs = '<button type="button" class="gtab on" data-kind="all" aria-pressed="true">All</button>' + "".join(
        f'<button type="button" class="gtab" data-kind="{k}" aria-pressed="false">{t}</button>' for k, t in GUIDE_KINDS)
    chips = "".join(f'<button type="button" class="gchip">{esc(c)}</button>' for c in GUIDE_CHIPS)
    main_html = f'''<main class="wrap gwrap">
  <div class="crumbs"><a href="index.html#home">Home</a> › Fix &amp; upgrade</div>
  <h1>Fix &amp; upgrade</h1>
  <p class="gsub">Common problems and upgrades, explained for beginners: what usually causes each one, what to check first, and which parts fix it.</p>
  <div class="gsearch"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="gq" type="search" placeholder="What's wrong? e.g. steering weak, battery dies fast" autocomplete="off" aria-label="Describe the problem"><button type="button" id="gclear" aria-label="Clear search" hidden>✕</button></div>
  <div class="gchips" id="gchips"><span>Common:</span>{chips}</div>
  <div class="gtabs" role="group" aria-label="Show">{tabs}</div>
  <p class="gcount" id="gcount" aria-live="polite"></p>
  <div class="glist" id="glist">{"".join(cards)}</div>
  <div class="gnone" id="gnone" hidden><b>Nothing matches that yet.</b> Tell us what's happening and we'll help you find the fix and the part.<a class="btn primary" href="index.html#request">Tell us the problem</a></div>
</main>'''
    nav = fill(partial("nav"), settings, "").replace('class="guidelink"', 'class="guidelink on"', 1)
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
        for g in guides for q, a in g.get("faq") or []]}
    body = "\n".join([
        '<body data-page="guides" data-root="">',
        nav,
        main_html,
        fill(partial("footer"), settings, ""),
        fill(partial("cart"), settings, ""),
        f'<script id="store-settings" type="application/json">{json_block(pub)}</script>',
        '<script id="products" type="application/json">[]</script>',
        f'<script src="assets/store.js?v={asset_v("store.js")}"></script>',
        f'<script src="assets/guides.js?v={asset_v("guides.js")}"></script>',
        f'<script type="application/ld+json">{json_block(faq_ld)}</script>',
        '</body>',
        '</html>',
    ])
    title = f"Fix & upgrade your RC car – problems, upgrades and care | {name}"
    desc = "Beginner-friendly RC car fixes: stripped gears, weak steering, short battery life, no grip and more, with the parts that fix them."
    return themed(head(title, desc, "", (base + "guides.html") if base else "") + "\n" + body, settings)


CAT_COLORS = {"Motors & ESCs": ("#f2d8cf", "#b8442f"), "Tyres & Wheels": ("#d6e2ec", "#3d6a8c"),
              "Shocks": ("#d5e4da", "#2e5e4e"), "Batteries & Chargers": ("#f6e6bf", "#9a6a08"),
              "Gears & Drivetrain": ("#e6dbec", "#6b4a7a"), "Servos": ("#d2e8ea", "#1f6f78"),
              "Lights": ("#f8dcc8", "#c4561b"), "Winch": ("#e9e0c6", "#6b5a2e"),
              "Axles & Chassis": ("#dfe3e8", "#4a5563"), "Radios & Receivers": ("#f3dde6", "#a23b62"), "Tools & Accessories": ("#e4e8d5", "#55692c"), "RC Cars": ("#dce7ee", "#24485e")}


def category_vars(cat):
    bg, fg = CAT_COLORS.get(cat, ("#e7dcc5", "#2a2420"))
    return f"--tbg:{bg};--tfg:{fg}"


def category_art(cat):
    # Same simple drawings as the shop uses when a part has no photo
    g = {
        "Motors & ESCs": '<rect x="45" y="45" width="90" height="60" rx="12"/><line x1="135" y1="75" x2="165" y2="75"/><line x1="65" y1="45" x2="65" y2="105"/><line x1="85" y1="45" x2="85" y2="105"/>',
        "Tyres & Wheels": '<circle cx="100" cy="75" r="52"/><circle cx="100" cy="75" r="40" stroke-dasharray="5 7"/><circle cx="100" cy="75" r="20"/>',
        "Shocks": '<rect x="86" y="14" width="28" height="48" rx="6"/><path d="M100 62 l16 8 -32 9 32 9 -32 9 32 9 -16 8"/><line x1="100" y1="114" x2="100" y2="136"/>',
        "Batteries & Chargers": '<rect x="38" y="42" width="120" height="66" rx="10"/><path d="M106 54 l-16 22 h20 l-16 22"/>',
        "Gears & Drivetrain": '<circle cx="82" cy="80" r="40"/><circle cx="82" cy="80" r="46" stroke-dasharray="6 6" stroke-width="8"/><circle cx="146" cy="52" r="18"/>',
        "Servos": '<rect x="48" y="52" width="104" height="58" rx="8"/><circle cx="78" cy="52" r="12"/><line x1="78" y1="52" x2="128" y2="26"/>',
        "Lights": '<rect x="30" y="62" width="140" height="32" rx="10"/><circle cx="58" cy="78" r="8"/><circle cx="86" cy="78" r="8"/><circle cx="114" cy="78" r="8"/><circle cx="142" cy="78" r="8"/>',
        "Winch": '<rect x="40" y="50" width="80" height="50" rx="10"/><line x1="55" y1="50" x2="55" y2="100"/><line x1="105" y1="50" x2="105" y2="100"/><path d="M120 75 h30 a10 10 0 0 1 10 10 v12 a10 10 0 0 1 -20 0"/>',
        "Axles & Chassis": '<line x1="30" y1="75" x2="170" y2="75"/><circle cx="100" cy="75" r="20"/><rect x="16" y="45" width="16" height="60" rx="5"/><rect x="168" y="45" width="16" height="60" rx="5"/><line x1="100" y1="95" x2="100" y2="130"/>',
        "Radios & Receivers": '<path d="M72 125 L86 62 H128 L140 125 Z"/><circle cx="64" cy="72" r="22"/><line x1="124" y1="62" x2="150" y2="18"/><circle cx="108" cy="84" r="6"/>',
        "Tools & Accessories": '<rect x="28" y="60" width="72" height="30" rx="10"/><line x1="100" y1="75" x2="172" y2="75"/><path d="M42 60 v30 M57 60 v30 M72 60 v30"/>',
        "RC Cars": '<path d="M35 95 h130 l-8 -22 -30 -6 -12 -20 h-40 l-14 20 -20 6 z"/><circle cx="65" cy="102" r="15"/><circle cx="138" cy="102" r="15"/>',
    }
    inner = g.get(cat, g["Gears & Drivetrain"])
    return f'<svg viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{inner}</svg>'


def build_sitemap(settings, products):
    base = site_url(settings)
    if not base:
        return None
    today = dt.date.today().isoformat()
    urls = [f"  <url><loc>{esc(base)}</loc><lastmod>{today}</lastmod></url>",
            f"  <url><loc>{esc(base)}guides.html</loc><lastmod>{today}</lastmod></url>",
            f"  <url><loc>{esc(base)}policies.html</loc><lastmod>{today}</lastmod></url>"]
    for p in products:
        lm = (p.get("updated") or p.get("added") or today)[:10]
        urls.append(f"  <url><loc>{esc(base)}parts/{esc(p['slug'])}.html</loc><lastmod>{lm}</lastmod></url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")


PUBLIC_KEYS = ("cars", "store_name", "whatsapp", "delivery", "delivery_days", "custom_domain", "site_url", "category_images", "bulk_note", "theme",
               "legal_name", "address", "email", "grievance_name", "payment_modes", "returns_policy", "gstin")
CATEGORY_DIR = "_categories"   # images/_categories/<file>.jpg


def builder_settings(settings):
    """Settings that are safe to put on GitHub (no keys or tokens)."""
    return {k: settings.get(k) for k in PUBLIC_KEYS if settings.get(k) not in (None, "")}


WORKFLOW = """name: Build website
on:
  push:
    branches: [{branch}]
  workflow_dispatch:
permissions:
  contents: write
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{{{ steps.deployment.outputs.page_url }}}}
    steps:
      - uses: actions/checkout@v5
      - name: Build pages from products.json
        run: python3 _builder/build.py
      - name: Save photos downloaded for parts added from the phone
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A
          git diff --cached --quiet || (git commit -m "Website build: save photos and pages" && git push) || echo "Not saved this time; the next build tries again."
      - uses: actions/upload-pages-artifact@v4
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
"""


def build_site(site_dir, settings, products, tools=True, branch="main"):
    """Write every generated file into site_dir.
    tools=True also writes the builder, the GitHub workflow and the phone page (used by the PC app)."""
    global ACTIVE_CARS, CAR_LINKS
    ACTIVE_CARS = cars_list(settings)
    CAR_LINKS = load_car_links()
    site = Path(site_dir)
    (site / "parts").mkdir(parents=True, exist_ok=True)
    (site / "images").mkdir(parents=True, exist_ok=True)

    # Assets
    dst = site / "assets"
    dst.mkdir(exist_ok=True)
    for f in (TEMPLATE / "assets").iterdir():
        if f.name.endswith(".inline.svg"):
            continue
        shutil.copy2(f, dst / f.name)

    (site / "index.html").write_text(themed(build_index(settings, products), settings), encoding="utf-8")
    (site / "policies.html").write_text(build_policies(settings), encoding="utf-8")
    (site / "guides.html").write_text(build_guides(settings, products), encoding="utf-8")
    (site / "admin").mkdir(exist_ok=True)
    (site / "admin" / "cars.json").write_text(json.dumps(admin_car_data(products), ensure_ascii=False), encoding="utf-8")

    keep = set()
    for p in products:
        name = f"{p['slug']}.html"
        keep.add(name)
        (site / "parts" / name).write_text(themed(build_part(settings, p), settings), encoding="utf-8")
    for f in (site / "parts").glob("*.html"):
        if f.name not in keep:
            f.unlink()

    # Remove photos no part (or category) uses any more
    used = {i for p in products for i in (p.get("images") or [])}
    used |= {v for v in (settings.get("category_images") or {}).values() if v}
    used |= {c["photo"] for c in ACTIVE_CARS if c.get("photo")}
    live = {p["slug"] for p in products} | {CATEGORY_DIR, "cars"}
    for d in (site / "images").iterdir():
        if d.is_dir() and d.name not in live:
            shutil.rmtree(d)
        elif d.is_dir():
            for f in d.iterdir():
                if f.is_file() and f"images/{d.name}/{f.name}" not in used:
                    f.unlink()

    (site / "products.json").write_text(json.dumps(products, ensure_ascii=False, indent=1), encoding="utf-8")

    sm = build_sitemap(settings, products)
    base = site_url(settings)
    if sm:
        (site / "sitemap.xml").write_text(sm, encoding="utf-8")
    robots = "User-agent: *\nAllow: /\nDisallow: /admin/\n" + (f"Sitemap: {base}sitemap.xml\n" if base else "")
    (site / "robots.txt").write_text(robots, encoding="utf-8")

    domain = (settings.get("custom_domain") or "").strip().lower()
    domain = re.sub(r"^https?://", "", domain).strip("/")
    cname = site / "CNAME"
    if domain:
        cname.write_text(domain + "\n", encoding="utf-8")
    elif cname.exists():
        cname.unlink()
    # Tell GitHub Pages to serve files as they are
    (site / ".nojekyll").write_text("", encoding="utf-8")

    if tools:
        write_tools(site, settings, branch)


def write_tools(site, settings, branch):
    """Builder + workflow (so GitHub rebuilds the site when the phone adds a part) and the phone page."""
    b = site / "_builder"
    # Overwrite in place (no delete first): OneDrive sometimes locks files for a moment
    shutil.copytree(TEMPLATE, b / "site_template", ignore=shutil.ignore_patterns("admin"), dirs_exist_ok=True)
    shutil.copy2(HERE / "sitegen.py", b / "sitegen.py")
    shutil.copy2(HERE / "build.py", b / "build.py")
    (b / "settings.json").write_text(json.dumps(builder_settings(settings), ensure_ascii=False, indent=1), encoding="utf-8")
    wf = site / ".github" / "workflows"
    wf.mkdir(parents=True, exist_ok=True)
    (wf / "build.yml").write_text(WORKFLOW.format(branch=branch), encoding="utf-8")
    adm = site / "admin"
    adm.mkdir(exist_ok=True)
    shutil.copy2(TEMPLATE / "admin" / "index.html", adm / "index.html")
