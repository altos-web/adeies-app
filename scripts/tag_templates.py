#!/usr/bin/env python3
"""Σαρώνει τα .docx του templates_src/ και γράφει ταγκαρισμένα αντίγραφα στο templates/.

  python3 scripts/tag_templates.py           # κανονική εκτέλεση
  python3 scripts/tag_templates.py --dry-run # μόνο αναφορά, χωρίς εγγραφή

Τα πρωτότυπα δεν αγγίζονται ποτέ.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from docx_text import Document
from normalize_docx import converted_from_doc, normalize_xml
from rules import RULES
from taxonomy import build_index

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "templates_src")
OUT = os.path.join(ROOT, "templates")

DOTS_ONLY = re.compile(r"^[…\.\s]+$")
TAG = re.compile(r"\{\{\s*[a-z_0-9]+\s*\}\}")

# Το μπλοκ επικοινωνίας των αποφάσεων είναι πίνακας δύο στηλών: στενό κελί με την
# ετικέτα, πλατύ κενό κελί για την τιμή. Αν η τιμή έμπαινε δίπλα στην ετικέτα, θα
# στρίμωχνε στο στενό κελί και θα έσπαγε σε συλλαβές.
NEXT_CELL = [
    (re.compile(r"^\s*Ταχ\.\s*Δ/νση\s*:?\s*$"), "{{ sxoleio_tax_dieuthinsi }}"),
    (re.compile(r"^\s*Διεύθυνση\s*:?\s*$"), "{{ sxoleio_tax_dieuthinsi }}"),
    (re.compile(r"^\s*Τ\.Κ\.\s*-\s*Πόλη\s*:?\s*$"), "{{ sxoleio_tk_poli }}"),
    (re.compile(r"^\s*Πληροφορίες\s*:?\s*$"), "{{ sxoleio_plirofories }}"),
    (re.compile(r"^\s*Τηλέφωνο\s*:?\s*$"), "{{ sxoleio_tilefono }}"),
    (re.compile(r"^\s*[EΕe]\s*-?\s*mail\s*:?\s*$"), "{{ sxoleio_email }}"),
    (re.compile(r"^\s*Ιστοσελίδα\s*:?\s*$"), "{{ sxoleio_istoselida }}"),
]
EMPTY_CELL = re.compile(r"^[\s:]*$")

# ── ΣΤΟΙΧΕΙΑ ΑΙΤΟΥΝΤΟΣ των υπεύθυνων δηλώσεων ────────────────────────────────
# Ίδιος πίνακας ετικέτα|κενό κελί με το μπλοκ επικοινωνίας, αλλά σε αιτήσεις και
# με δικό του λεξιλόγιο. Δύο παραλλαγές: άλλες ζητούν χωριστά όνομα και επώνυμο
# γονέα, η ΚΟΙΝΗ ΥΔ της ανατροφής τα ζητά ενωμένα.
YD_FILES = re.compile(r"Υπεύθυνη-Δήλωση|ΥΔ-Μονίμου|Ανατροφής")

# Τα έντυπα που ήρθαν από .doc γράφουν «µ» (U+00B5, σύμβολο micro) αντί για «μ».
# Το εξομαλύνουμε πριν το ταίριασμα αντί να διπλασιάσουμε κάθε regex· το «0» αντί
# για «Ο» της ίδιας μετατροπής το δέχεται απευθείας το regex του πρώτου κανόνα.
def yd_norm(text):
    return text.replace("µ", "μ").strip()


# (ετικέτα εντύπου, τι μπαίνει για τον εκπαιδευτικό, τι για τον σύζυγο)
YD_CELL = [
    (r"[0ΟO]\s*[-–]\s*Η\s+Όνομα\s*:?", "onoma", "syzygos_onoma"),
    (r"Επώνυμο\s*:?", "eponymo", "syzygos_eponymo"),
    (r"Όνομα\s+και\s+Επώνυμο\s+Πατέρα\s*:?",
     "patera_onomateponymo", "syzygos_patera_onomateponymo"),
    (r"Όνομα\s+και\s+Επώνυμο\s+Μητέρας\s*:?",
     "mitera_onomateponymo", "syzygos_mitera_onomateponymo"),
    (r"Όνομα\s+Πατέρα\s*:?", "patronymo", "syzygos_patronymo"),
    (r"Επώνυμο\s+Πατέρα\s*:?", "patera_eponymo", None),
    (r"Όνομα\s+Μητέρας\s*:?", "mitronymo", "syzygos_mitronymo"),
    (r"Επώνυμο\s+Μητέρας\s*:?", "mitera_eponymo", None),
    (r"Αριθ(?:μός|\.)?\s*Δελτ(?:ίου|\.)?\s*Ταυτότητας\s*:?", "adt", "syzygos_adt"),
    (r"Α\.?Φ\.?Μ\.?\s*:?", "afm", None),
    (r"Ημερομηνία\s+γέννησης\s*(?:\(\d\))?\s*:?",
     "imerominia_gennisis", "syzygos_imerominia_gennisis"),
    (r"Τόπος\s+Γέννησης\s*:?", "topos_gennisis", "syzygos_topos_gennisis"),
    (r"Τόπος\s+Κατοικίας\s*:?", "poli", "syzygos_poli"),
    (r"Οδός\s*:?", "odos", "syzygos_odos"),
    (r"Αριθ\s*:?", "arithmos_katoikias", "syzygos_arithmos"),
    (r"Τ\.?Κ\.?\s*:?", "tk", "syzygos_tk"),
    (r"Τηλ\.?\s*:?", "tilefono_katoikias", "syzygos_tilefono"),
    (r"Δ/νση\s+Ηλεκτρ\.\s*Ταχυδρομείου\s*(?:\(Εmail\)\s*)?:?", "email", "syzygos_email"),
]
YD_COMPILED = [(re.compile(r"^\s*" + pat + r"\s*$"), own, spouse)
               for pat, own, spouse in YD_CELL]

# Δείκτες που αλλάζουν το ποιος δηλώνει. Η επικεφαλίδα κάθε δήλωσης επαναφέρει
# στον εκπαιδευτικό — χρειάζεται, γιατί το «Α. Β.» της υπογραφής στο τέλος της
# ΚΟΙΝΗΣ ΥΔ προηγείται της τρίτης, ατομικής δήλωσης του ίδιου εντύπου.
YD_RESET = re.compile(r"ΥΠΕΥΘΥΝΗ\s+ΔΗΛΩΣΗ")
YD_DECLARANT_A = re.compile(r"^\s*[AΑ]\.\s*$")
YD_DECLARANT_B = re.compile(r"^\s*[BΒ]\.\s*$")
# Τα στοιχεία εκπροσώπου είναι άλλου προσώπου και μένουν πάντα κενά.
YD_STOP = re.compile(r"ΣΤΟΙΧΕΙΑ\s+ΕΚΠΡΟΣΩΠΟΥ")

# Στον πίνακα του αιτούντος τα κελιά «Αριθ:» και «ΤΚ:» είναι στενά από σχεδιασμό
# (510–768 twips) — μόνο οι αποστάτες των 31 twips πρέπει να απορρίπτονται.
YD_MIN_VALUE_CELL = 300

# Ελάχιστο πλάτος κελιού τιμής, σε twips (~2 εκατοστά). Κάτω από αυτό πρόκειται για
# αποστάτη και όχι για κελί περιεχομένου: τα έντυπα που ήρθαν από .doc έχουν στήλη
# 284 twips δίπλα στην ετικέτα, όπου η τιμή θα κοβόταν στον πρώτο χαρακτήρα.
MIN_VALUE_CELL = 1200

# Ετικέτες που η τιμή τους ζει στην *επόμενη* παράγραφο: το πρωτότυπο γράφει τον
# τίτλο σε μια γραμμή και αφήνει από κάτω μια γραμμή με τελείες.
NEXT_LINE = [
    (re.compile(r"^\s*Συνοδευτικά\s+υποβάλλ?ω\s*$"), "{{ synodeutika }}"),
    (re.compile(r"^\s*ΣΧΟΛΕΙΟ ΟΡΓΑΝΙΚΗΣ ΘΕΣΗΣ\s*:\s*$"), "{{ sxoleio_organikis }}"),
    (re.compile(r"^\s*ΣΧΟΛΕΙΟ ΠΟΥ ΥΠΗΡΕΤΩ\s*:\s*$"), "{{ sxoleia_ypiresias }}"),
    (re.compile(r"^\s*Ημερομηνία τέλεσης γάμου\s*:\s*$"), "{{ imerominia_gamou }}"),
]

COMPILED = [(scope, re.compile(files) if files else None, re.compile(pat), rep)
            for scope, files, pat, rep in RULES]

# Τα έγγραφα που ήρθαν από .doc θέλουν καθάρισμα μετά το ταγκάρισμα — βλ.
# normalize_docx.py για το τι ακριβώς έσπασε η μετατροπή του LibreOffice.
def collect():
    """Όλα τα πηγαία .docx με την ταυτότητά τους, από τη δομή φακέλων."""
    paths = []
    for root, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d != "doc"]
        paths += [os.path.relpath(os.path.join(root, f), SRC)
                  for f in files if f.endswith(".docx")]
    index, unknown = build_index(paths)
    from_doc = converted_from_doc(SRC)
    for entry in index.values():
        entry["fromDoc"] = entry["source"] in from_doc
    return index, unknown


def doc_scope(entry):
    """Το είδος έρχεται από τη διαδρομή, όχι από το όνομα αρχείου."""
    return entry["kind"]


def writeback(par, new_text):
    """Γράφει το new_text πίσω στην παράγραφο αλλάζοντας μόνο το τμήμα που διαφέρει."""
    old = par.text
    if old == new_text:
        return False
    i = 0
    while i < len(old) and i < len(new_text) and old[i] == new_text[i]:
        i += 1
    j = 0
    while (j < len(old) - i and j < len(new_text) - i
           and old[len(old) - 1 - j] == new_text[len(new_text) - 1 - j]):
        j += 1
    par.apply([(i, len(old) - j, new_text[i:len(new_text) - j])])
    return True


def process(path, entry, dry_run=False):
    name = os.path.basename(entry["source"])
    doc = Document(path)
    scope = doc_scope(entry)
    changes = []
    handled = set()

    # πρώτα ο πίνακας επικοινωνίας, ώστε να μην τον πιάσουν οι εν σειρά κανόνες
    if scope == "apofasi":
        for i, par in enumerate(doc.paragraphs[:-1]):
            nxt = doc.paragraphs[i + 1]
            if not EMPTY_CELL.match(nxt.text):
                continue
            tag = next((t for pat, t in NEXT_CELL if pat.match(par.text)), None)
            if not tag:
                continue
            width = doc.cell_width(i + 1)
            if width is not None and width < MIN_VALUE_CELL:
                continue  # αποστάτης· η τιμή μπαίνει δίπλα στην ετικέτα
            nxt.inject(tag)
            changes.append((f"{par.text.strip()} → [κενό κελί]", tag))
            handled.update((i, i + 1))

    # ο πίνακας «ΣΤΟΙΧΕΙΑ ΑΙΤΟΥΝΤΟΣ» των υπεύθυνων δηλώσεων, με τον ίδιο λόγο
    if YD_FILES.search(entry["source"]):
        who = "own"
        for i, par in enumerate(doc.paragraphs):
            text = yd_norm(par.text)
            if YD_RESET.search(text):
                who = "own"
                continue
            if YD_STOP.search(text):
                who = None
                continue
            if YD_DECLARANT_A.match(text):
                who = "own"
                continue
            if YD_DECLARANT_B.match(text):
                who = "spouse"
                continue
            if who is None or i in handled:
                continue
            match = next((m for m in YD_COMPILED if m[0].match(text)), None)
            if not match:
                continue
            tag = match[1] if who == "own" else match[2]
            if not tag:
                continue
            # η ετικέτα μπορεί να σπάει σε δύο παραγράφους («Δ/νση Ηλεκτρ.
            # Ταχυδρομείου» / «(Εmail):») — το κελί τιμής είναι το πρώτο κενό
            # κελί που ακολουθεί, όχι υποχρεωτικά η αμέσως επόμενη παράγραφος
            for j in range(i + 1, min(i + 3, len(doc.paragraphs))):
                width = doc.cell_width(j)
                if width is None or width < YD_MIN_VALUE_CELL:
                    continue
                if not EMPTY_CELL.match(doc.paragraphs[j].text):
                    break
                doc.paragraphs[j].inject("{{ %s }}" % tag)
                changes.append((f"{text} → [κενό κελί]", "{{ %s }}" % tag))
                handled.update((i, j))
                break

    for index, par in enumerate(doc.paragraphs):
        if index in handled:
            continue
        text = par.text
        if not text.strip():
            continue
        new = text
        for rscope, rfiles, pat, rep in COMPILED:
            if rscope != "all" and rscope != scope:
                continue
            if rfiles and not rfiles.search(entry["source"]):
                continue
            new = pat.sub(rep, new)
        if new != text:
            writeback(par, new)
            changes.append((text, new))

    # Ετικέτες γραμμένες με το χέρι στο Word: το Word τις σπάει σε πολλά runs και
    # παύουν να αναγνωρίζονται. Τις ξαναενώνουμε σε ένα run — ό,τι κάνει ο tagger
    # για τις δικές του, ώστε να ισχύει το ίδιο και για τις χειροκίνητες.
    for par in doc.paragraphs:
        spans = [(m.start(), m.end(), m.group(0)) for m in TAG.finditer(par.text)]
        broken = [s for s in spans if not any(s[2] in run for run in par.texts)]
        if broken:
            par.apply(broken)
            changes.append((f"[ένωση {len(broken)} χειροκίνητων ετικετών]", par.text[:80]))

    # τίτλος σε μια γραμμή, κενό με τελείες στην επόμενη
    pending = None
    for par in doc.paragraphs:
        text = par.text
        if not text.strip():
            continue
        if pending and DOTS_ONLY.match(text):
            writeback(par, pending)
            changes.append((text, pending))
            pending = None
        else:
            pending = next((tag for pat, tag in NEXT_LINE if pat.match(text)), None)

    if not dry_run:
        xml, stats = normalize_xml(doc.render(), from_doc=entry["fromDoc"])
        doc.parts["word/document.xml"] = xml.encode("utf-8")
        if any(stats.values()):
            changes.append((f"[κανονικοποίηση] {stats}", ""))
        target = os.path.join(OUT, entry["id"] + ".docx")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        doc.save_parts(target)
    return changes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--show", help="όνομα αρχείου για αναλυτική εμφάνιση αλλαγών")
    args = ap.parse_args()

    index, unknown = collect()
    for path in unknown:
        print(f"  ΑΤΑΞΙΝΟΜΗΤΟ  {path}")

    # καθάρισμα παλιών εξόδων που δεν αντιστοιχούν πια σε πηγαίο
    wanted = {e["id"] + ".docx" for e in index.values()}
    for root, _, files in os.walk(OUT):
        for stale in files:
            if not stale.endswith(".docx"):
                continue
            rel = os.path.relpath(os.path.join(root, stale), OUT)
            if rel not in wanted:
                os.remove(os.path.join(root, stale))
    total = 0
    for entry in sorted(index.values(), key=lambda e: e["id"]):
        changes = process(os.path.join(SRC, entry["source"]), entry, args.dry_run)
        total += len(changes)
        print(f"{len(changes):3d}  {entry['id']}")
        if args.show and args.show in entry["id"]:
            for old, new in changes:
                print(f"     - {old[:160]}")
                print(f"     + {new[:160]}")
    if not args.dry_run:
        # καταγραφή προέλευσης: ποιο πηγαίο έδωσε ποιο έντυπο
        manifest = {e["id"]: {"source": e["source"], "stem": e["stem"],
                              "fromDoc": e["fromDoc"]}
                    for e in index.values()}
        with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=1, sort_keys=True)

    print(f"\nΣύνολο: {len(index)} έντυπα, {total} παράγραφοι άλλαξαν"
          + (f", {len(unknown)} αταξινόμητα" if unknown else "")
          + ("  (dry-run)" if args.dry_run else f"  → {OUT}"))


if __name__ == "__main__":
    main()
