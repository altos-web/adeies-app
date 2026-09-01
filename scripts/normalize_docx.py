#!/usr/bin/env python3
"""Διορθώνει ζημιές που άφησε η μετατροπή .doc → .docx του LibreOffice.

Καλείται από το tag_templates.py **αφού** μπουν οι ετικέτες, γιατί η μία διόρθωση
χρειάζεται να ξέρει ποιες γραμμές πινάκων κρατούν πλέον τιμή. Πειράζει μόνο τα
έγγραφα που ήρθαν από .doc — τα γνήσια .docx έχουν σωστή μορφοποίηση.

  1. trHeight hRule="exact" → "atLeast", **μόνο σε γραμμές που περιέχουν ετικέτα**
     Το σταθερό ύψος 255 twips έκοβε ό,τι τυλιγόταν σε δεύτερη σειρά: το
     «3ο ΔΗΜΟΤΙΚΟ ΣΧΟΛΕΙΟ ΔΡΑΜΑΣ» τυπωνόταν «3ο». Χαλαρώνουμε μόνο εκεί που θα μπει
     κείμενο άγνωστου μήκους· οι υπόλοιπες γραμμές κρατούν το σταθερό τους ύψος,
     αλλιώς το επιστολόχαρτο φουσκώνει και το έγγραφο πάει σε δεύτερη σελίδα.

  2. Κενά <w:tcBorders></w:tcBorders> → αφαίρεση
     Το Word τα διαβάζει ως «κληρονόμησε από το στυλ πίνακα» και δεν σχεδιάζει
     τίποτα. Τα έγγραφα όμως δεν έχουν στυλ πίνακα, οπότε το docx-preview πέφτει
     στο δικό του προεπιλεγμένο περίγραμμα και γεμίζει τη σελίδα γραμμές.

  3. Γραμμές πινάκων χωρίς καθόλου περιεχόμενο → αφαίρεση
     Το επιστολόχαρτο έχει ~10 τέτοιες. Με σταθερό ύψος ήταν αόρατες· μόλις
     χαλαρώσει το ύψος φουσκώνουν και σπρώχνουν το έγγραφο σε δεύτερη σελίδα.

  4. Κενές παράγραφοι στο τέλος του εγγράφου → αφαίρεση
     Τρεις αρκούν για να προστεθεί ολόκληρη κενή σελίδα στο τυπωμένο έγγραφο.

  5. Σειρές τεσσάρων ή περισσότερων διαδοχικών κενών παραγράφων → δύο
     Σειρές μέχρι τρεις μένουν: είναι σκόπιμο κενό της σελιδοποίησης. Ποτέ μέσα σε
     πίνακα: ένα κελί χωρίς παράγραφο είναι άκυρο και καταρρέει η διάταξη.

Ως εργαλείο γραμμής εντολών δείχνει τι θα άλλαζε στα ήδη ταγκαρισμένα:

  python3 scripts/normalize_docx.py
"""

import glob
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "templates_src")

ROW = re.compile(r"<w:tr\b.*?</w:tr>", re.S)
TABLE = re.compile(r"<w:tbl>.*?</w:tbl>", re.S)
EXACT_HEIGHT = re.compile(r'(<w:trHeight[^>]*w:hRule=")exact(")')
EMPTY_BORDERS = re.compile(r"<w:tcBorders\s*></w:tcBorders>|<w:tcBorders\s*/>")
PARAGRAPH = re.compile(r"<w:p(?:\s[^>]*)?>.*?</w:p>|<w:p(?:\s[^>]*)?/>", re.S)
HAS_CONTENT = re.compile(r"<w:t[\s>]|<w:drawing[\s>]|<w:pict[\s>]")
HAS_OBJECT = re.compile(r"<w:drawing[\s>]|<w:pict[\s>]")
T_TEXT = re.compile(r"<w:t(?:\s[^>]*)?>(.*?)</w:t>", re.S)


def _is_blank(paragraph_xml):
    """Κενή θεωρείται και η παράγραφος που κρατά μόνο κενά — η τελευταία παράγραφος
    πολλών εντύπων είναι ακριβώς αυτό, και αρκεί για μια λευκή σελίδα παραπάνω."""
    if HAS_OBJECT.search(paragraph_xml):
        return False
    return not any(t.strip() for t in T_TEXT.findall(paragraph_xml))

MAX_BLANK_RUN = 3
KEEP_BLANKS = 2


def converted_from_doc(src=SRC):
    """Σχετικές διαδρομές των .docx που προήλθαν από .doc.

    Το convert_doc.py αφήνει το πρωτότυπο σε υποφάκελο «doc/» δίπλα στο αρχείο, οπότε
    η αντιστοιχία είναι «…/doc/X.doc» → «…/X.docx».
    """
    out = set()
    for root, _, files in os.walk(src):
        if os.path.basename(root) != "doc":
            continue
        parent = os.path.dirname(root)
        for f in files:
            if f.endswith(".doc"):
                out.add(os.path.relpath(os.path.join(parent, f[:-4] + ".docx"), src))
    return out


def _relax_tagged_rows(xml):
    """Χαλαρώνει το σταθερό ύψος μόνο στις γραμμές που περιέχουν «{{»."""
    count = 0

    def fix_row(match):
        nonlocal count
        row = match.group(0)
        if "{{" not in row:
            return row
        row, n = EXACT_HEIGHT.subn(r"\1atLeast\2", row)
        count += n
        return row

    return ROW.sub(fix_row, xml), count


def _drop_empty_rows(xml):
    """Πετά γραμμές πινάκων χωρίς καθόλου περιεχόμενο.

    Το επιστολόχαρτο των μετατρεμμένων εντύπων έχει ~10 τέτοιες γραμμές, που στο
    πρωτότυπο ήταν αόρατες επειδή το σταθερό ύψος τις συνέθλιβε. Μόλις χαλαρώσει το
    ύψος, φουσκώνουν και σπρώχνουν το έγγραφο σε δεύτερη σελίδα. Δεν κουβαλούν
    πληροφορία, οπότε φεύγουν.
    """
    count = 0

    def drop(match):
        nonlocal count
        row = match.group(0)
        if HAS_CONTENT.search(row):
            return row
        count += 1
        return ""

    out = ROW.sub(drop, xml)
    # ένας πίνακας χωρίς γραμμές είναι άκυρος· αν συνέβη, γυρνάμε πίσω
    if "<w:tbl>" in out and re.search(r"<w:tbl>(?:(?!<w:tr).)*?</w:tbl>", out, re.S):
        return xml, 0
    return out, count


def _collapse_blank_runs(xml):
    """Μαζεύει τα μεγάλα κενά, αλλά **ποτέ μέσα σε πίνακα**.

    Ένα <w:tc> πρέπει να περιέχει τουλάχιστον μία παράγραφο. Αν αδειάσει, ο πίνακας
    χαλάει και η διάταξη του επιστολόχαρτου καταρρέει — οι δύο στήλες γίνονται μία.
    """
    tables = [(m.start(), m.end()) for m in TABLE.finditer(xml)]

    def in_table(pos):
        return any(start <= pos < end for start, end in tables)

    spans = [(m.start(), m.end(), bool(HAS_CONTENT.search(m.group(0))) or in_table(m.start()))
             for m in PARAGRAPH.finditer(xml)]
    drop, run = [], []
    for start, end, has_content in spans + [(None, None, True)]:
        if not has_content:
            run.append((start, end))
            continue
        if len(run) > MAX_BLANK_RUN:
            drop.extend(run[KEEP_BLANKS:])
        run = []
    if not drop:
        return xml, 0
    out, prev = [], 0
    for start, end in sorted(drop):
        out.append(xml[prev:start])
        prev = end
    out.append(xml[prev:])
    return "".join(out), len(drop)


def _trim_trailing_blanks(xml):
    """Πετά τις κενές παραγράφους μετά την τελευταία με περιεχόμενο.

    Τρεις τέτοιες αρκούν για να σπρώξουν μια ολόκληρη κενή σελίδα στο τέλος του
    εγγράφου. Δεν αγγίζονται όσες βρίσκονται μέσα σε πίνακα.
    """
    tables = [(m.start(), m.end()) for m in TABLE.finditer(xml)]
    spans = [(m.start(), m.end(), not _is_blank(m.group(0))
              or any(a <= m.start() < b for a, b in tables))
             for m in PARAGRAPH.finditer(xml)]
    drop = []
    for start, end, keep in reversed(spans):
        if keep:
            break
        drop.append((start, end))
    if not drop:
        return xml, 0
    out, prev = [], 0
    for start, end in sorted(drop):
        out.append(xml[prev:start])
        prev = end
    out.append(xml[prev:])
    return "".join(out), len(drop)


def normalize_xml(xml, from_doc=True):
    """Επιστρέφει (xml, {διόρθωση: πλήθος}). Ασφαλές να ξανατρέξει.

    Με from_doc=False εφαρμόζεται μόνο το κόψιμο της ουράς, που δεν αφορά τη
    μετατροπή: και γνήσια .docx κουβαλούν κενές παραγράφους στο τέλος και τυπώνουν
    μια λευκή σελίδα παραπάνω.
    """
    stats = {}
    if from_doc:
        xml, stats["ύψη"] = _relax_tagged_rows(xml)
        xml, stats["γραμμές"] = _drop_empty_rows(xml)
        xml, stats["περιγράμματα"] = EMPTY_BORDERS.subn("", xml)
        xml, stats["κενές"] = _collapse_blank_runs(xml)
    xml, stats["ουρά"] = _trim_trailing_blanks(xml)
    return xml, stats


def main():
    converted = converted_from_doc()
    print(f"{len(converted)} έντυπα προέρχονται από .doc και περνούν κανονικοποίηση:")
    for name in sorted(converted)[:6]:
        print("   ", name[:74])
    if len(converted) > 6:
        print(f"    … και άλλα {len(converted) - 6}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
