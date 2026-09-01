#!/usr/bin/env python3
"""Σαρώνει τα ταγκαρισμένα .docx, παράγει τον κατάλογο και ελέγχει για σφάλματα.

  python3 scripts/scan_tags.py                 # κατάλογος + έλεγχοι
  python3 scripts/scan_tags.py --leftovers     # και τα κενά που έμειναν χωρίς ετικέτα

Έλεγχοι:
  * σπασμένη ετικέτα — «{{» χωρίς «}}» μέσα στο ίδιο run (το Word έκοψε το tag)
  * άγνωστη ετικέτα  — όνομα εκτός λεξιλογίου
  * υπόλοιπα κενά    — σειρές τελειών που δεν έγιναν ετικέτα
"""

import argparse
import hashlib
import html
import json
import os
import re
import sys
import zipfile
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from docx_text import Document, T_INNER_RE
from fields import by_group
from rules import COUNT_TAGS, GENDER_TAGS
from taxonomy import (CATEGORIES, DEFAULT_APOFASI, LEAVE_TYPES, NO_APOFASI,
                      PROGRAMMES, parse_id)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "templates")
TODAY = date.today().isoformat()

TAG_RE = re.compile(r"\{\{\s*([a-z_0-9]+)\s*\}\}")
# Ετικέτα με φίλτρο («{{ x|kef }}»). Καταργήθηκε: η συμπλήρωση στον περιηγητή
# είναι σκέτη αντικατάσταση κειμένου και δεν ξέρει να εκτελεί φίλτρα.
FILTER_RE = re.compile(r"\{\{[^}]*\|[^}]*\}\}")
LEFTOVER_RE = re.compile(r"[…]{2,}|\.{4,}")

# Κενά που **μένουν σκόπιμα** κενά. Δεν είναι παραλείψεις: τα γράφει κάποιος άλλος
# ή γράφονται στο χέρι πάνω στο τυπωμένο χαρτί. Χωρίς τη λίστα, ο έλεγχος «μηδέν
# κενά χωρίς ετικέτα» θα ήταν μονίμως κόκκινος και θα έπαυε να λέει κάτι.
EXPECTED_BLANKS = [
    # Η ενότητα «ΣΤΟΙΧΕΙΑ ΑΙΤΟΥΝΤΟΣ» των εντύπων υπηρεσιακής εκπαίδευσης τη
    # συμπληρώνει η Διεύθυνση Εκπαίδευσης όταν παραλάβει την αίτηση, όχι ο
    # διευθυντής του σχολείου.
    (r"loipes/aitisi/(ekpaideftiki|ekpaideftiki_ananeosi|aneu_apodoxon)",
     r"^(α|β|γ|δ|ε|στ|ζ|η)\.\s|^Εισήγηση του"),
    # Εφεδρικές γραμμές της λίστας δικαιολογητικών: το «α)» πήρε την ετικέτα,
    # τα «β) γ) δ)» μένουν για συμπλήρωση με το χέρι.
    (r"loipes/aitisi/", r"^[βγδ]\)"),
]


def expected_blank(name, text):
    return any(re.search(f, name) and re.search(t, text.strip())
               for f, t in EXPECTED_BLANKS)

# Λεξιλόγιο: μία πηγή αλήθειας στο fields.py, συν όσα παράγονται από φύλο/πλήθος.
VOCAB = {group: [f["tag"] for f in items] for group, items in by_group().items()}
VOCAB["fylo"] = list(GENDER_TAGS)
VOCAB["arithmos"] = list(COUNT_TAGS)
KNOWN = {t: g for g, tags in VOCAB.items() for t in tags}


def espa(path):
    """Το λογότυπο ΕΣΠΑ είναι ~49KB, το εθνόσημο ~1KB — χωρίζει καθαρά τις κατηγορίες."""
    with zipfile.ZipFile(path) as z:
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        return sum(z.getinfo(n).file_size for n in media) > 40 * 1024


def scan(path):
    doc = Document(path)
    tags, broken, leftovers, filtered = [], [], [], []
    for par in doc.paragraphs:
        for chunk in T_INNER_RE.finditer(par.xml):
            run = html.unescape(chunk.group(1))
            if run.count("{{") != run.count("}}"):
                broken.append((par.text.strip()[:120], run[:60]))
        text = par.text
        for m in TAG_RE.finditer(text):
            if m.group(1) not in tags:
                tags.append(m.group(1))
        filtered.extend(m.group(0) for m in FILTER_RE.finditer(text))
        stripped = TAG_RE.sub("", text)
        if LEFTOVER_RE.search(stripped) and stripped.strip(" …._\t"):
            leftovers.append(text.strip()[:160])
    return tags, broken, leftovers, filtered


def check_programmes():
    """Το σφάλμα που κρύφτηκε μια φορά: ίδιο κείμενο, ίδιο λογότυπο.

    Τα τρία προγράμματα των αναπληρωτών έχουν κατά λέξη το ίδιο κείμενο — γι' αυτό
    πέρασαν κάποτε για διπλότυπα. Τα ξεχωρίζει μόνο το λογότυπο ΕΣΠΑ. Αν δύο
    προγράμματα βγάλουν το ίδιο, κάποιο έντυπο αντιγράφηκε σε λάθος διαδρομή.
    """
    notes = []
    for kind in ("aitisi", "apofasi"):
        folder = os.path.join(OUT, "anaplirotes", list(PROGRAMMES)[0], kind)
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            paths = {p: os.path.join(OUT, "anaplirotes", p, kind, name)
                     for p in PROGRAMMES}
            elsewhere = [p for p, x in paths.items() if not os.path.exists(x)]
            if elsewhere:
                notes.append(f"ΛΕΙΠΕΙ ΑΠΟ ΠΡΟΓΡΑΜΜΑ {kind}/{name} → {elsewhere}")
                continue
            logos = {p: _media_hash(x) for p, x in paths.items()}
            if len(set(logos.values())) != len(PROGRAMMES):
                notes.append(f"ΙΔΙΟ ΛΟΓΟΤΥΠΟ ΣΕ ΔΥΟ ΠΡΟΓΡΑΜΜΑΤΑ {kind}/{name}")
    return notes


def _media_hash(path):
    with zipfile.ZipFile(path) as z:
        names = sorted(n for n in z.namelist() if n.startswith("word/media/"))
        return hashlib.md5(b"".join(z.read(n) for n in names)).hexdigest()


def build_pairings(catalog):
    """Ανά κατηγορία → πρόγραμμα → τύπο άδειας: ποια αίτηση, ποια απόφαση.

    Δεν είναι ένα προς ένα. Ανατροφής, κύησης, λοχείας, μειωμένου ωραρίου, απλή και
    όλες οι λοιπές τις εγκρίνει η Διεύθυνση, οπότε δεν υπάρχει απόφαση διευθυντή.
    Αντίστροφα, γάμου, δίκης, σχολικής επίδοσης, εκλογική, αναπηρίας, γυναικολογικού
    και πατρότητας έχουν απόφαση χωρίς τυποποιημένη αίτηση.
    """
    out = {}
    for key, entry in catalog.items():
        branch = out.setdefault(entry["category"], {})
        if entry["programme"]:
            branch = branch.setdefault(entry["programme"], {})
        slot = branch.setdefault(entry["leaveType"], {
            "title": LEAVE_TYPES[entry["leaveType"]],
            "aitisi": None, "apofasi": None, "apofaseis": [],
        })
        if entry["kind"] == "aitisi":
            slot["aitisi"] = key
        else:
            slot["apofaseis"].append(key)

    def finish(category, types):
        for leave, slot in types.items():
            slot["apofaseis"].sort()
            default = DEFAULT_APOFASI.get((category, leave))
            chosen = next((k for k in slot["apofaseis"]
                           if default and catalog[k]["stem"] == default), None)
            slot["apofasi"] = chosen or (slot["apofaseis"][0]
                                         if len(slot["apofaseis"]) == 1 else
                                         slot["apofaseis"][0] if slot["apofaseis"] else None)
            slot["ektos_sxolikis_monadas"] = leave in NO_APOFASI

    for category, branch in out.items():
        if category == "anaplirotes":
            for types in branch.values():
                finish(category, types)
        else:
            finish(category, branch)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--leftovers", action="store_true")
    args = ap.parse_args()

    names = sorted(
        os.path.relpath(os.path.join(root, f), OUT)
        for root, _, files in os.walk(OUT) for f in files if f.endswith(".docx"))
    catalog_path = os.path.join(OUT, "catalog.json")
    try:
        with open(catalog_path, encoding="utf-8") as fh:
            old_catalog = json.load(fh)
    except (OSError, ValueError):
        old_catalog = {}
    try:
        with open(os.path.join(OUT, "index.json"), encoding="utf-8") as fh:
            manifest = json.load(fh)
    except (OSError, ValueError):
        manifest = {}
    catalog, seen_hash, problems = {}, {}, []

    for name in names:
        path = os.path.join(OUT, name)
        tags, broken, leftovers, filtered = scan(path)
        key = os.path.splitext(name)[0].replace(os.sep, "/")
        digest = hashlib.md5(" ".join(sorted(tags)).encode()).hexdigest()[:8]

        ident = parse_id(key)
        previous = old_catalog.get(key, {})
        catalog[key] = {
            "title": ident["title"],
            "file": name.replace(os.sep, "/"),
            "category": ident["category"],
            "programme": ident["programme"],
            "kind": ident["kind"],
            "leaveType": ident["leaveType"],
            "espa": espa(path),
            "stem": manifest.get(key, {}).get("stem", ""),
            "source": manifest.get(key, {}).get("source", ""),
            "version": previous.get("version", 1),
            "updated": previous.get("updated", TODAY),
            "fields": sorted(tags),
            "groups": sorted({KNOWN.get(t, "ΑΓΝΩΣΤΟ") for t in tags}),
        }
        if previous.get("fields") and previous["fields"] != catalog[key]["fields"]:
            catalog[key]["version"] = previous.get("version", 1) + 1
            catalog[key]["updated"] = TODAY
        seen_hash.setdefault(digest, []).append(name)

        for tag in filtered:
            problems.append(f"ΕΤΙΚΕΤΑ ΜΕ ΦΙΛΤΡΟ {name}  →  {tag}")
        for par, run in broken:
            problems.append(f"ΣΠΑΣΜΕΝΗ ΕΤΙΚΕΤΑ  {name}\n    {par}\n    run: {run}")
        for t in tags:
            if t not in KNOWN:
                problems.append(f"ΑΓΝΩΣΤΗ ΕΤΙΚΕΤΑ   {name}  →  {{{{ {t} }}}}")
        if args.leftovers:
            for lo in leftovers:
                if expected_blank(name, lo):
                    continue
                problems.append(f"ΚΕΝΟ ΧΩΡΙΣ ΕΤΙΚΕΤΑ {name}\n    {lo}")

    with open(catalog_path, "w", encoding="utf-8") as fh:
        json.dump(catalog, fh, ensure_ascii=False, indent=2)

    pairings = build_pairings(catalog)
    with open(os.path.join(OUT, "pairings.json"), "w", encoding="utf-8") as fh:
        json.dump(pairings, fh, ensure_ascii=False, indent=2)

    all_tags = sorted({t for e in catalog.values() for t in e["fields"]})
    print(f"{len(names)} templates, {len(all_tags)} διακριτές ετικέτες")
    print(f"κατάλογος → {catalog_path}\n")

    for group, tags in VOCAB.items():
        used = [t for t in tags if t in all_tags]
        if used:
            print(f"  {group:15s} {', '.join(used)}")

    for note in check_programmes():
        problems.append(note)

    dupes = {d: f for d, f in seen_hash.items() if len(f) > 1}
    if dupes:
        print(f"\nΊδιο σύνολο πεδίων ({len(dupes)} ομάδες):")
        for files in dupes.values():
            print("  " + " ≡ ".join(files))

    if problems:
        print(f"\n{'-'*60}\nΠΡΟΣ ΕΛΕΓΧΟ ({len(problems)}):")
        for p in problems:
            print("  " + p)
    else:
        print("\nΚαμία σπασμένη ή άγνωστη ετικέτα.")


if __name__ == "__main__":
    main()
