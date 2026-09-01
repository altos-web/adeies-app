#!/usr/bin/env python3
"""Ετοιμάζει τον φάκελο web/ για δημοσίευση.

Αντιγράφει τα ταγκαρισμένα έντυπα (χωρίς τα διπλότυπα -1/-2) και εξάγει σε JSON
όσα ξέρει μόνο η Python: το λεξιλόγιο πεδίων και τους πίνακες που παράγουν τις
ετικέτες φύλου και πλήθους. Έτσι η εφαρμογή δεν διπλογράφει τίποτα.

  python3 scripts/build_web.py
"""

import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fields import IMERES_OLOGRAFOS, by_group
from rules import COUNT_TAGS, GENDER_TAGS
from taxonomy import CATEGORIES, LEAVE_TYPES, PROGRAMMES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.join(ROOT, "templates")
WEB = os.path.join(ROOT, "web")
WEB_TEMPLATES = os.path.join(WEB, "templates")


def main():
    with open(os.path.join(TEMPLATES, "catalog.json"), encoding="utf-8") as fh:
        catalog = json.load(fh)

    # Το δέντρο ξαναχτίζεται από την αρχή: αν μετακινηθεί ένα έντυπο, δεν θέλουμε
    # να μείνει και στην παλιά του θέση.
    shutil.rmtree(WEB_TEMPLATES, ignore_errors=True)
    os.makedirs(WEB_TEMPLATES, exist_ok=True)

    copied = 0
    published = {}
    for key, entry in catalog.items():
        target = os.path.join(WEB_TEMPLATES, entry["file"])
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy2(os.path.join(TEMPLATES, entry["file"]), target)
        entry["ergasimes"] = "ergasimon" in entry["fields"]
        published[key] = entry
        copied += 1

    write(os.path.join(WEB_TEMPLATES, "catalog.json"), published)
    shutil.copy2(os.path.join(TEMPLATES, "pairings.json"),
                 os.path.join(WEB_TEMPLATES, "pairings.json"))
    write(os.path.join(WEB_TEMPLATES, "config.json"), {
        "fields": by_group(),
        "gender": GENDER_TAGS,
        "count": COUNT_TAGS,
        "olografos": IMERES_OLOGRAFOS,
        "leaveTypes": LEAVE_TYPES,
        "categories": CATEGORIES,
        "programmes": PROGRAMMES,
        # πόσα έντυπα χρησιμοποιούν κάθε ετικέτα — όσες βρίσκονται σε ένα μόνο
        # έντυπο κρύβονται πίσω από αναδιπλούμενο στην καρτέλα εργαζομένου
        "usedBy": used_by(published),
    })

    banners = write_banners()

    size = sum(os.path.getsize(os.path.join(root, n))
               for root, _, names in os.walk(WEB_TEMPLATES) for n in names)
    print(f"{copied} έντυπα + 3 αρχεία ρυθμίσεων → web/templates/  ({size // 1024} KB)")
    print(f"{banners} banner στο web/banners/"
          + ("" if banners else " — η κεφαλίδα θα δείχνει μόνο τον τίτλο"))


def write_banners():
    """Καταγράφει ό,τι εικόνα βρει στο web/banners/. Η σελίδα διαλέγει μία τυχαία."""
    folder = os.path.join(WEB, "banners")
    os.makedirs(folder, exist_ok=True)
    names = sorted(
        n for n in os.listdir(folder)
        if n.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"))
    )
    write(os.path.join(folder, "banners.json"), names)
    return len(names)


def used_by(catalog):
    counts = {}
    for entry in catalog.values():
        for tag in entry["fields"]:
            counts[tag] = counts.get(tag, 0) + 1
    return counts


def write(path, data):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
