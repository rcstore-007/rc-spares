"""Runs on GitHub (see .github/workflows/build.yml): rebuilds the website from products.json.
This is how parts added from the phone page appear on the website."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import sitegen  # noqa: E402

settings = json.loads((HERE / "settings.json").read_text(encoding="utf-8"))
pf = ROOT / "products.json"
products = json.loads(pf.read_text(encoding="utf-8")) if pf.exists() else []
sitegen.build_site(ROOT, settings, products, tools=False)
print(f"Built {len(products)} part page(s).")
