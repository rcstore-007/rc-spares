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
import html
import json
import re
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE / "site_template"

CATEGORIES = ["Motors & ESCs", "Tyres & Wheels", "Shocks", "Batteries & Chargers",
              "Gears & Drivetrain", "Servos", "Lights", "Winch",
              "Radios & Receivers", "Tools & Accessories"]
SCALES = ["1:5", "1:7", "1:8", "1:10", "1:12", "1:18", "1:24", "1:30"]


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


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


DEFAULT_BULK_NOTE = "Extra discount when you buy more than one unit."
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
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">',
        f'<link rel="stylesheet" href="{root}assets/style.css">',
        extra,
        '</head>',
    ]
    return "\n".join(p for p in parts if p)


def themed(html_text, settings):
    t = settings.get("theme") if settings.get("theme") in THEMES else "garage"
    return html_text.replace('<html lang="en-IN">', f'<html lang="en-IN" data-theme="{t}">', 1)


def build_index(settings, products):
    pub = public_settings(settings)
    base = site_url(settings)
    title = f"{pub['name']} – RC Car Spare Parts in India"
    desc = (f"RC car spare parts in India: motors, ESCs, tyres, shocks, batteries, servos, lights "
            f"and winches for 1:5 to 1:30 scale. Order on WhatsApp, delivery in {pub['delivery']} days.")
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
        f'<script id="products" type="application/json">{json_block(products)}</script>',
        '<script src="assets/store.js"></script>',
        '</body>',
        '</html>',
    ])
    return head(title, desc, "", base, (base + "assets/logo.png") if base else "", extra) + "\n" + body


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
        main = f'<div class="gmain"><img id="gMain" src="{root}{esc(imgs[0])}" alt="{esc(p["name"])}"></div>'
        thumbs = ""
        if len(imgs) > 1:
            thumbs = '<div class="thumbs">' + "".join(
                f'<button data-thumb="{root}{esc(i)}" aria-pressed="{"true" if n == 0 else "false"}" aria-label="Photo {n + 1}"><img src="{root}{esc(i)}" alt=""></button>'
                for n, i in enumerate(imgs)) + "</div>"
        gallery = main + thumbs
    else:
        gallery = f'<div class="gmain art" style="{category_vars(p.get("category"))}">{category_art(p.get("category"))}</div>'

    scales = "".join(f'<span class="sc">{esc(s)} scale</span>' for s in p.get("scale") or [])
    rows = ""
    if p.get("fits"):
        rows += f'<tr><td>Fits</td><td>{esc(p["fits"])}</td></tr>'
    rows += f'<tr><td>Scale</td><td>{esc(", ".join(p.get("scale") or []))}</td></tr>'
    for k, v in (p.get("specs") or {}).items():
        rows += f"<tr><td>{esc(k)}</td><td>{esc(v)}</td></tr>"
    rows += f'<tr><td>Part code</td><td>{esc(p["id"])}</td></tr>'
    rows += f'<tr><td>Delivery</td><td>{esc(pub["delivery"])} days across India</td></tr>'

    wa_icon = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>')
    main_html = f'''<main class="wrap">
  <div class="crumbs"><a href="../index.html#home">Home</a> › <a href="../index.html#shop">Shop</a> › {esc(p.get("category", ""))}</div>
  <div class="part">
    <div class="gallery">{gallery}</div>
    <div class="pinfo">
      <div class="cbrand">{esc(p.get("brand", ""))}</div>
      <h1>{esc(p["name"])}</h1>
      <div class="pp"><span class="price">{price}</span></div>
      <div class="meta">{scales}<span>{esc(p.get("category", ""))}</span></div>
      <p class="desc">{esc(short)}</p>
      <div class="pbtns">
        <button class="add" id="pAdd">Add to cart</button>
        <div class="incart" id="pInCart" hidden></div>
        <a class="wa" id="pNow" href="#" aria-disabled="true">{wa_icon} Order this on WhatsApp</a>
        <p class="bulk">{esc(pub["bulkNote"])}</p>
        <p class="note" id="pHint"></p>
      </div>
      <div class="deliv">Delivery in <b>{esc(pub["delivery"])} days</b> across India. Shipping cost is confirmed on WhatsApp.</div>
      <h2>Details</h2>
      <table class="specs">{rows}</table>
      <div class="strip"><span><b>Need a different part?</b> We source parts on request for any brand and scale.</span><a href="../index.html#request">Request a part →</a></div>
    </div>
  </div>
</main>'''
    product_for_js = {k: p.get(k) for k in ("id", "slug", "name", "price", "category", "images", "brand", "scale")}
    body = "\n".join([
        '<body data-page="part" data-root="../">',
        fill(partial("nav"), settings, root),
        main_html,
        fill(partial("footer"), settings, root),
        fill(partial("cart"), settings, root),
        f'<script id="store-settings" type="application/json">{json_block(pub)}</script>',
        f'<script id="products" type="application/json">{json_block([product_for_js])}</script>',
        '<script src="../assets/store.js"></script>',
        '</body>',
        '</html>',
    ])
    return head(title, desc, root, url, abs_imgs[0] if abs_imgs else "", extra) + "\n" + body


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
    urls = [f"  <url><loc>{esc(base)}</loc><lastmod>{today}</lastmod></url>"]
    for p in products:
        lm = (p.get("updated") or p.get("added") or today)[:10]
        urls.append(f"  <url><loc>{esc(base)}parts/{esc(p['slug'])}.html</loc><lastmod>{lm}</lastmod></url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")


PUBLIC_KEYS = ("store_name", "whatsapp", "delivery", "delivery_days", "custom_domain", "site_url", "category_images", "bulk_note", "theme")
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
    live = {p["slug"] for p in products} | {CATEGORY_DIR}
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
