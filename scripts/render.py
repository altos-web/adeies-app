#!/usr/bin/env python3
"""Συμπλήρωση ενός template και μετατροπή σε PDF — η λογική που θα χρησιμοποιήσει
η εφαρμογή. Τίποτα δεν γράφεται σε δίσκο εκτός από το τελικό αρχείο που ζητάς.

  python3 scripts/render.py Απόφαση-Κανονικής-Άδειας --data data/sample.json --pdf /tmp/a.pdf
"""

import argparse
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fields import IMERES_OLOGRAFOS
from rules import COUNT_TAGS, GENDER_TAGS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.join(ROOT, "templates")

# Σημάδι επιλογής. Όχι «✔»: οι γραμματοσειρές των εντύπων (Verdana) δεν έχουν το
# glyph και το LibreOffice το ρίχνει σιωπηλά κατά την εξαγωγή σε PDF.
CHECK = "Χ"

# Τα έντυπα κρατούν όλες τις σχέσεις εργασίας ορατές και σημειώνεται η μία που
# ισχύει. Το πεδίο «sxesi_ergasias» της καρτέλας δίνει το επίθεμα.
SXESI_ERGASIAS = (
    "check_plirous", "check_espa_plirous", "check_espa_amo", "check_oromisthios",
    "check_monimos_apospasmenos", "check_monimos_diathesi", "check_monimos_organiki",
    "check_diathesi_plires", "check_diathesi_meriki", "check_idax",
)


def _blank(value):
    return value is None or str(value).strip() == ""


def _parse_date(value):
    """Δέχεται «2026-04-15» ή «15/04/2026». Επιστρέφει date ή None."""
    text = str(value or "").strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _count(value):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def end_date(start, days, working_only):
    """Λήξη με περιληπτική μέτρηση: η πρώτη ημέρα μετράει.

    15/04 για 2 ημέρες → 16/04. Με working_only αγνοούνται Σάββατο και Κυριακή, όπως
    ορίζουν τα έντυπα που λένε «εργάσιμων ημερών». Οι αργίες δεν καλύπτονται — γι'
    αυτό η λήξη παραμένει επεξεργάσιμη.
    """
    if start is None or not days or days < 1:
        return None
    if not working_only:
        return start + timedelta(days=days - 1)
    current, remaining = start, days
    while current.weekday() >= 5:            # ξεκινά Σαββατοκύριακο
        current += timedelta(days=1)
    while remaining > 1:
        current += timedelta(days=1)
        if current.weekday() < 5:
            remaining -= 1
    return current


def derive(data):
    """Συμπληρώνει ό,τι υπολογίζεται: φύλο, πλήθος ημερών, ονόματα, ημερομηνίες.

    Κάθε παράγωγο μπαίνει μόνο αν το πεδίο είναι κενό — ό,τι έγραψε ο χρήστης
    υπερισχύει πάντα.
    """
    out = dict(data)

    female = str(data.get("fylo", "")).strip().upper() in {"Γ", "ΘΗΛΥ", "F"}
    for tag, (male_form, female_form) in GENDER_TAGS.items():
        if _blank(out.get(tag)):
            out[tag] = female_form if female else male_form

    days = _count(data.get("imeres_arithmitika"))
    for tag, (singular, plural) in COUNT_TAGS.items():
        if _blank(out.get(tag)):
            out[tag] = singular if days == 1 else plural

    # ονοματεπώνυμο και διεύθυνση από τα επιμέρους
    if _blank(out.get("onomateponymo")):
        out["onomateponymo"] = " ".join(
            p for p in (data.get("eponymo"), data.get("onoma")) if not _blank(p))
    if _blank(out.get("dieuthinsi_katoikias")):
        out["dieuthinsi_katoikias"] = " ".join(
            p for p in (data.get("odos"), data.get("arithmos_katoikias")) if not _blank(p))

    # ημέρες: ολογράφως και με μηδέν μπροστά
    if _blank(out.get("imeres_olografos")) and days in IMERES_OLOGRAFOS:
        out["imeres_olografos"] = IMERES_OLOGRAFOS[days]
    if days is not None:
        out["imeres_arithmitika"] = f"{days:02d}"
        if _blank(out.get("imeres_plithos")):
            out["imeres_plithos"] = str(days)   # «3/ήμερης», όχι «03/ήμερης»

    # λήξη και «στις» από την έναρξη
    start = _parse_date(data.get("imerominia_apo"))
    if _blank(out.get("imerominia_eos")):
        finish = end_date(start, days, bool(data.get("ergasimes")))
        if finish:
            out["imerominia_eos"] = finish.isoformat()
    if _blank(out.get("imerominia_stis")) and start:
        out["imerominia_stis"] = start.isoformat()

    if _blank(out.get("topos")):
        out["topos"] = data.get("nomos_on", "")

    # «2026-2027» → «2026»: η προϋπηρεσία μετριέται μέχρι την 31η Αυγούστου που
    # άνοιξε το τρέχον σχολικό έτος.
    if _blank(out.get("etos_anaforas")):
        out["etos_anaforas"] = re.split(r"[-–/]", data.get("sxoliko_etos", ""))[0].strip()

    for tag in SXESI_ERGASIAS:
        out.setdefault(tag, "")
    sxesi = data.get("sxesi_ergasias")
    if "check_" + str(sxesi) in SXESI_ERGASIAS:
        out["check_" + sxesi] = CHECK
    return out


def format_dates(data):
    """Οι ημερομηνίες στα έντυπα γράφονται 15/04/2026, όχι 2026-04-15."""
    out = dict(data)
    for key, value in out.items():
        parsed = _parse_date(value) if isinstance(value, str) and "-" in value else None
        if parsed and len(str(value).strip()) == 10:
            out[key] = parsed.strftime("%d/%m/%Y")
    return out


def render(template, data):
    """Επιστρέφει το συμπληρωμένο .docx ως bytes, στη μνήμη."""
    from docxtpl import DocxTemplate

    doc = DocxTemplate(os.path.join(TEMPLATES, template + ".docx"))
    doc.render(format_dates(derive(data)))
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def to_pdf(docx_bytes):
    """Μετατροπή σε PDF με headless LibreOffice, σε προσωρινό φάκελο που σβήνεται."""
    tmp = tempfile.mkdtemp(prefix="adeies-")
    try:
        src = os.path.join(tmp, "doc.docx")
        with open(src, "wb") as fh:
            fh.write(docx_bytes)
        subprocess.run(
            ["soffice", "--headless", f"-env:UserInstallation=file://{tmp}/profile",
             "--convert-to", "pdf", "--outdir", tmp, src],
            check=True, capture_output=True, timeout=180,
        )
        with open(os.path.join(tmp, "doc.pdf"), "rb") as fh:
            return fh.read()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("--data", required=True)
    ap.add_argument("--docx")
    ap.add_argument("--pdf")
    args = ap.parse_args()

    with open(args.data, encoding="utf-8") as fh:
        data = json.load(fh)

    docx_bytes = render(args.template, data)
    if args.docx:
        with open(args.docx, "wb") as fh:
            fh.write(docx_bytes)
        print("docx →", args.docx)
    if args.pdf:
        with open(args.pdf, "wb") as fh:
            fh.write(to_pdf(docx_bytes))
        print("pdf  →", args.pdf)
    if not args.docx and not args.pdf:
        print(f"{len(docx_bytes)} bytes (δεν ζητήθηκε αρχείο εξόδου)")


if __name__ == "__main__":
    main()
