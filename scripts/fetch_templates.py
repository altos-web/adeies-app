#!/usr/bin/env python3
"""Κατεβάζει τα έντυπα από τη ΔΙΠΕ Δράμας. Πηγές και σκεπτικό: docs/sources.md

  python3 scripts/fetch_templates.py            # ό,τι λείπει + ανανεώσεις
  python3 scripts/fetch_templates.py --missing  # μόνο όσα λείπουν
  python3 scripts/fetch_templates.py --refresh  # μόνο οι εκδόσεις 05/2026

Τα νέα πάνε κατευθείαν στο templates_src/. Οι ανανεώσεις πάνε στο
templates_src/2026/ και τυπώνεται σύγκριση — η αντικατάσταση γίνεται με --apply,
αφού δεις τι αλλάζει.
"""

import argparse
import os
import shutil
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "templates_src")
NEW2026 = os.path.join(SRC, "2026")
BASE = "https://dipe.dra.sch.gr/wordpress/wp-content/uploads/"

# ── έντυπα που λείπουν εντελώς ───────────────────────────────────────────────
MISSING = [
    # μόνιμοι — αιτήσεις
    "2022/09/Αίτηση-Κανονικής-Άδειας-Μόνιμου-Εκπαιδευτικού.doc",
    "2022/10/Αίτηση-Αναρρωτικής-Άδειας-Μόνιμου-Εκπαιδευτικού.doc",
    "2022/10/Αίτηση-Αναρρωτικής-Άδειας-ΥΔ-Μονίμου.doc",
    "2022/09/Αίτηση-Άδειας-Ανατροφής-Μόνιμου-Εκπαιδευτικού.doc",
    "2022/09/Αίτηση-Άδειας-Εξετάσεων-Μόνιμου-Εκπαιδευτικού.doc",
    "2022/09/Αίτηση-Άδειας-Κύησης-Μόνιμου-Εκπαιδευτικού.doc",
    "2022/09/Αίτηση-Άδειας-Λοχείας-Μόνιμου-Εκπαιδευτικού.doc",
    "2022/10/Αίτηση-Ειδικής-Άδειας-Μόνιμου-Εκπαιδευτικού-Γάμος.doc",
    "2022/09/Αίτηση-Ειδικής-Άδειας-Μόνιμου-Εκπαιδευτικού-Θάνατος.doc",
    "2022/10/Αίτηση-Αιμοδοτικής-Άδειας-Μονίμου.doc",
    "2022/09/Αίτηση-Ειδικής-Άδειας-Εκπαιδευτικού-Συμμετοχή-σε-δίκη.doc",
    "2022/09/Αίτηση-Άδειας-Διευκόλυνσης-για-Σχολική-Επίδοση-Παιδιού.doc",
    "2022/10/Αίτηση-Άδειας-Ασθένειας-Τέκνου-Μονίμων.doc",
    # μόνιμοι — απόφαση
    "2023/09/Απόφαση-Άδειας-Πατρότητας.doc",
    # αναπληρωτές — αποφάσεις
    "2026/05/Απόφαση-Άδειας-Αιμοδοσίας-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδειας-Αναπηρίας-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδειας-Γάμου-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδειας-Θανάτου-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδειας-Κανονικής-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδειας-Σχολικής-Επίδοσης-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδειας-Συμμετοχής-σε-Δίκη-Αναπληρωτών.doc",
    "2026/05/Απόφαση-Άδεια-Προγεννητικο-Αναπληρωτής.doc",
]

# ── ανανεώσεις: (διαδρομή 05/2026, όνομα που αντικαθιστά στο templates_src) ──
REFRESH = [(f"2026/05/{n}", n) for n in [
    "Αίτηση-Άδειας-Αιμοδοτική-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Αναπηρίας-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Αναρρωτική-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Ανατροφής-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Ασθένειας-Τέκνου-ΕΣΠΑ.docx",
    "Αίτηση-Άδειας-Εξετάσεων-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Θανάτου-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Κανονική-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Κύησης-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Λοχείας-Αναπληρωτή-ΕΣΠΑ.docx",
    "Αίτηση-Άδειας-Μειωμένου-Ωραρίου-Αναπληρωτή.docx",
    "Αίτηση-Άδειας-Προγεννητικών-Εξετάσεων.docx",
    "Απόφαση-Άδειας-Αναρρωτικής-Αναπληρωτών.docx",
    "Απόφαση-Άδειας-Ασθένειας-Τέκνου-Αναπληρωτών.docx",
    "Απόφαση-Άδειας-Εξετάσεων-ΕΣΠΑ.docx",
    "Απόφαση-Χορήγησης-Άδειας-Τέκνου-ΕΣΠΑ.docx",
    "Απόφαση-Εκλογικής-Άδειας-ΕΣΠΑ-ΠΕΠ-ΠΑΡΑΛΛΗΛΗ.docx",
]] + [("2026/05/Αίτηση-Άδειας-Απλή-Αναπληρωτή-2.docx", "Αίτηση-Άδειας-Απλή-Αναπληρωτή.docx")]


def download(path, dest):
    url = BASE + urllib.parse.quote(path)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    if len(data) < 2000:
        raise ValueError(f"ύποπτα μικρό αρχείο ({len(data)} bytes)")
    with open(dest, "wb") as fh:
        fh.write(data)
    return len(data)


def fetch_missing():
    got = skipped = failed = 0
    for path in MISSING:
        name = os.path.basename(path)
        dest = os.path.join(SRC, name)
        if os.path.exists(dest):
            print(f"  υπάρχει  {name}")
            skipped += 1
            continue
        try:
            size = download(path, dest)
            print(f"  {size//1024:5d}KB  {name}")
            got += 1
        except Exception as exc:
            print(f"  ΣΦΑΛΜΑ   {name}: {exc}")
            failed += 1
    print(f"\nΛείποντα: {got} νέα, {skipped} υπήρχαν ήδη, {failed} απέτυχαν")
    return failed


def fetch_refresh(apply_new):
    os.makedirs(NEW2026, exist_ok=True)
    same = diff = failed = 0
    changed = []
    for path, target in REFRESH:
        dest = os.path.join(NEW2026, target)
        try:
            download(path, dest)
        except Exception as exc:
            print(f"  ΣΦΑΛΜΑ   {target}: {exc}")
            failed += 1
            continue
        current = os.path.join(SRC, target)
        if not os.path.exists(current):
            print(f"  ΝΕΟ      {target}")
            changed.append(target)
            diff += 1
        elif text_of(dest) == text_of(current):
            print(f"  ίδιο     {target}")
            same += 1
        else:
            print(f"  ΑΛΛΑΞΕ   {target}")
            changed.append(target)
            diff += 1

    print(f"\nΑνανεώσεις: {same} αμετάβλητα, {diff} με διαφορές, {failed} απέτυχαν")
    if changed and apply_new:
        for target in changed:
            shutil.copy2(os.path.join(NEW2026, target), os.path.join(SRC, target))
        print(f"Αντικαταστάθηκαν {len(changed)} αρχεία στο templates_src/")
    elif changed:
        print("Τρέξε ξανά με --apply για να αντικατασταθούν.")
    return failed


def text_of(path):
    """Κείμενο του εγγράφου, για σύγκριση εκδόσεων χωρίς τον θόρυβο του zip."""
    from docx_text import Document
    try:
        return "\n".join(p.text for p in Document(path).paragraphs)
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--missing", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    ap.add_argument("--apply", action="store_true", help="εφαρμογή των ανανεώσεων")
    args = ap.parse_args()
    both = not args.missing and not args.refresh

    failed = 0
    if args.missing or both:
        print("── Έντυπα που λείπουν ──")
        failed += fetch_missing()
    if args.refresh or both:
        print("\n── Εκδόσεις 05/2026 ──")
        failed += fetch_refresh(args.apply)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
