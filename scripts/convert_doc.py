#!/usr/bin/env python3
"""Μετατρέπει τα .doc του templates_src/ σε .docx, σε όλο το δέντρο.

Το .doc είναι δυαδικό Word 97, όχι zip — το docx_text.py δεν το διαβάζει. Η
μετατροπή γίνεται μία φορά· τα πρωτότυπα .doc μετακινούνται σε υποφάκελο «doc/»
δίπλα στο αρχείο τους, ώστε να μη χαθεί η θέση τους στο δέντρο.

  python3 scripts/convert_doc.py
"""

import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "templates_src")


def convert(path, outdir):
    """Ξεχωριστό προφίλ ανά κλήση, αλλιώς το LibreOffice κολλάει σε ταυτόχρονες."""
    tmp = tempfile.mkdtemp(prefix="adeies-conv-")
    try:
        subprocess.run(
            ["soffice", "--headless", f"-env:UserInstallation=file://{tmp}/profile",
             "--convert-to", "docx", "--outdir", outdir, path],
            check=True, capture_output=True, timeout=180,
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    docs = []
    for root, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d != "doc"]      # ό,τι έχει ήδη μετατραπεί
        docs += [os.path.join(root, f) for f in files if f.endswith(".doc")]
    docs.sort()
    if not docs:
        print("Κανένα .doc για μετατροπή.")
        return 0

    done = failed = 0
    for path in docs:
        folder = os.path.dirname(path)
        name = os.path.basename(path)
        target = os.path.join(folder, name[:-4] + ".docx")
        try:
            convert(path, folder)
        except subprocess.CalledProcessError as exc:
            print(f"  ΣΦΑΛΜΑ  {name}: {exc.stderr.decode()[:120]}")
            failed += 1
            continue
        if not os.path.exists(target):
            print(f"  ΣΦΑΛΜΑ  {name}: δεν παρήχθη .docx")
            failed += 1
            continue
        keep = os.path.join(folder, "doc")
        os.makedirs(keep, exist_ok=True)
        shutil.move(path, os.path.join(keep, name))
        done += 1
        print(f"  {os.path.getsize(target)//1024:5d}KB  {os.path.relpath(target, SRC)[:78]}")

    print(f"\n{done} μετατράπηκαν, {failed} απέτυχαν. "
          f"Τα πρωτότυπα .doc σε υποφακέλους doc/")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
