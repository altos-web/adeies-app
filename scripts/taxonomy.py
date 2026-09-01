"""Ταυτότητα εντύπου: κατηγορία, πρόγραμμα, είδος, τύπος άδειας.

**Η ταυτότητα βγαίνει από τη διαδρομή του φακέλου, όχι από το όνομα αρχείου.** Τα
ονόματα είναι αναξιόπιστα: η ίδια απλή αίτηση λέγεται «…-Αναπληρωτή-2.docx» στο ΕΠΑ,
«…-Αναπληρωτή.docx» στην Παράλληλη Στήριξη και «…-Αναπληρωτή-1.docx» στην
Παράλληλη-Τομεακό· μια απόφαση φτάνει και σε «…-Αναπληρωτών-1-1.doc».

Οι αναπληρωτές χωρίζονται σε **τρία προγράμματα χρηματοδότησης**. Το κείμενο των
εντύπων τους είναι πανομοιότυπο· αλλάζει μόνο το λογότυπο ΕΣΠΑ, που δηλώνει το
πρόγραμμα. Γι' αυτό δεν είναι διπλότυπα και δεν επιτρέπεται να συγχωνευθούν.
"""

import os
import re

CATEGORIES = {
    "monimoi": "Μόνιμοι",
    "anaplirotes": "Αναπληρωτές",
    "loipes": "Λοιπές άδειες",
}

PROGRAMMES = {
    "epa": "ΕΠΑ",
    "parallili_stirixi": "Παράλληλη Στήριξη – ΕΒΠ – ΠΕ25",
    "parallili_tomeako": "Παράλληλη – Τομεακό, ΣΜΕΑΕ, Αγγλικά στο Νηπιαγωγείο, "
                         "Ολοήμερο Δημοτικό, Ολοήμερο Νηπιαγωγείο, "
                         "Ψυχολόγοι – Κοινωνικοί Λειτουργοί",
}

# Αναγνώριση φακέλου προγράμματος από το πρόθεμά του, ώστε να μην εξαρτόμαστε από
# την ακριβή στίξη του μεγάλου ονόματος.
PROGRAMME_PREFIXES = [
    ("ΕΠΑ", "epa"),
    ("Παράλληλη Στήριξη", "parallili_stirixi"),
    ("Παράλληλη – Τομεακό", "parallili_tomeako"),
    ("Παράλληλη - Τομεακό", "parallili_tomeako"),
]

KINDS = {"Αιτήσεις": "aitisi", "Αποφάσεις": "apofasi"}

LEAVE_TYPES = {
    "kanoniki": "Κανονική άδεια",
    "anarrotiki": "Αναρρωτική άδεια",
    "anarrotiki_yd": "Αναρρωτική άδεια με υπεύθυνη δήλωση",
    "anatrofis": "Άδεια ανατροφής τέκνου",
    "asthenia_teknou": "Άδεια ασθένειας τέκνου",
    "sxoliki_epidosi": "Άδεια σχολικής επίδοσης τέκνου",
    "exetaseon": "Άδεια εξετάσεων",
    "kyisis": "Άδεια κύησης",
    "loxeias": "Άδεια λοχείας",
    "gamou": "Ειδική άδεια γάμου",
    "thanatou": "Ειδική άδεια θανάτου συγγενούς",
    "aimodosias": "Αιμοδοτική άδεια",
    "diki": "Ειδική άδεια συμμετοχής σε δίκη",
    "anapirias": "Ειδική άδεια αναπηρίας",
    "gynaikologikos": "Άδεια γυναικολογικού ελέγχου",
    "eklogiki": "Εκλογική άδεια",
    "patrotitas": "Άδεια πατρότητας",
    "progennitikon": "Άδεια προγεννητικών εξετάσεων",
    "meiomeno_orario": "Μειωμένο ωράριο λόγω μητρότητας",
    "apli": "Απλή αίτηση (ελεύθερο θέμα)",
    # λοιπές άδειες — μόνο αιτήσεις, τις εγκρίνει η Διεύθυνση
    "ekpaideftiki": "Εκπαιδευτική άδεια με αποδοχές",
    "ekpaideftiki_ananeosi": "Ανανέωση εκπαιδευτικής άδειας",
    "aneu_apodoxon": "Άδεια χωρίς αποδοχές για ολοκλήρωση σπουδών",
    "syndikalistiki": "Συνδικαλιστική άδεια",
    "epimorfotiki": "Άδεια για επιμορφωτικούς λόγους",
    "epimorfotiki_exoteriko": "Άδεια για επιμορφωτικούς λόγους στο εξωτερικό",
    "idiotiko_ergo": "Άδεια άσκησης ιδιωτικού έργου με αμοιβή",
    "yd_anarrotikis": "Υπεύθυνη δήλωση για αναρρωτική άδεια",
}

# όνομα αρχείου (χωρίς τα -1/-2 και την κατάληξη) → τύπος άδειας, ανά κατηγορία/είδος
FILE_TO_LEAVE = {
    ("monimoi", "aitisi"): {
        "Αίτηση-Κανονικής-Άδειας-Μόνιμου-Εκπαιδευτικού": "kanoniki",
        "Αίτηση-Αναρρωτικής-Άδειας-Μόνιμου-Εκπαιδευτικού": "anarrotiki",
        "Αίτηση-Αναρρωτικής-Άδειας-ΥΔ-Μονίμου": "anarrotiki_yd",
        "Αίτηση-Άδειας-Ανατροφής-Μόνιμου-Εκπαιδευτικού": "anatrofis",
        "Αίτηση-Άδειας-Ασθένειας-Τέκνου-Μονίμων": "asthenia_teknou",
        "Αίτηση-Άδειας-Διευκόλυνσης-για-Σχολική-Επίδοση-Παιδιού": "sxoliki_epidosi",
        "Αίτηση-Άδειας-Εξετάσεων-Μόνιμου-Εκπαιδευτικού": "exetaseon",
        "Αίτηση-Άδειας-Κύησης-Μόνιμου-Εκπαιδευτικού": "kyisis",
        "Αίτηση-Άδειας-Λοχείας-Μόνιμου-Εκπαιδευτικού": "loxeias",
        "Αίτηση-Αιμοδοτικής-Άδειας-Μονίμου": "aimodosias",
        "Αίτηση-Ειδικής-Άδειας-Εκπαιδευτικού-Συμμετοχή-σε-δίκη": "diki",
        "Αίτηση-Ειδικής-Άδειας-Μόνιμου-Εκπαιδευτικού-Γάμος": "gamou",
        "Αίτηση-Ειδικής-Άδειας-Μόνιμου-Εκπαιδευτικού-Θάνατος": "thanatou",
    },
    ("monimoi", "apofasi"): {
        "Απόφαση-Κανονικής-Άδειας": "kanoniki",
        "Απόφαση-Άδειας-Αναρρωτικής-Γνωμάτευση": "anarrotiki",
        "Απόφαση-Άδειας-Αναρρωτικής-ΥΔ": "anarrotiki_yd",
        "Απόφαση-Ασθένειας-Τέκνου-Μονίμων": "asthenia_teknou",
        "Απόφαση-Χορήγησης-Άδειας-Τέκνου-Μονίμων": "asthenia_teknou",
        "Απόφαση-Άδειας-Σχολικής-Επίδοσης-Τέκνου": "sxoliki_epidosi",
        "Απόφαση-Άδειας-Εξετάσεων": "exetaseon",
        "Απόφαση-Άδεια-Γάμου-Μονίμων": "gamou",
        "Απόφαση-Άδειας-Θανάτου-Συγγενούς": "thanatou",
        "Απόφαση-Άδειας-Αιμοδοσίας": "aimodosias",
        "Απόφαση-Άδειας-Συμμετοχή-σε-Δίκη": "diki",
        "Απόφαση-Άδειας-Αναπηρίας": "anapirias",
        "Απόφαση-Άδειας-Γυναικολογικού-Ελέγχου": "gynaikologikos",
        "Απόφαση-Εκλογικής-Άδειας-Μονίμου": "eklogiki",
        "Απόφαση-Άδειας-Πατρότητας": "patrotitas",
    },
    # κοινός πίνακας και για τα τρία προγράμματα: ίδιοι τύποι, ίδια ονόματα
    ("anaplirotes", "aitisi"): {
        "Αίτηση-Άδειας-Κανονική-Αναπληρωτή": "kanoniki",
        "Αίτηση-Άδειας-Αναρρωτική-Αναπληρωτή": "anarrotiki",
        "Αίτηση-Άδειας-Ανατροφής-Αναπληρωτή": "anatrofis",
        "Αίτηση-Άδειας-Ασθένειας-Τέκνου-ΕΣΠΑ": "asthenia_teknou",
        "Αίτηση-Άδειας-Εξετάσεων-Αναπληρωτή": "exetaseon",
        "Αίτηση-Άδειας-Κύησης-Αναπληρωτή": "kyisis",
        "Αίτηση-Άδειας-Λοχείας-Αναπληρωτή-ΕΣΠΑ": "loxeias",
        "Αίτηση-Άδειας-Θανάτου-Αναπληρωτή": "thanatou",
        "Αίτηση-Άδειας-Αιμοδοτική-Αναπληρωτή": "aimodosias",
        "Αίτηση-Άδειας-Αναπηρίας-Αναπληρωτή": "anapirias",
        "Αίτηση-Άδειας-Προγεννητικών-Εξετάσεων": "progennitikon",
        "Αίτηση-Άδειας-Μειωμένου-Ωραρίου-Αναπληρωτή": "meiomeno_orario",
        "Αίτηση-Άδειας-Απλή-Αναπληρωτή": "apli",
    },
    ("anaplirotes", "apofasi"): {
        "Απόφαση-Άδειας-Κανονικής-Αναπληρωτών": "kanoniki",
        "Απόφαση-Άδειας-Αναρρωτικής-Αναπληρωτών": "anarrotiki",
        "Απόφαση-Άδειας-Ασθένειας-Τέκνου-Αναπληρωτών": "asthenia_teknou",
        "Απόφαση-Χορήγησης-Άδειας-Τέκνου-ΕΣΠΑ": "asthenia_teknou",
        "Απόφαση-Άδειας-Σχολικής-Επίδοσης-Αναπληρωτών": "sxoliki_epidosi",
        "Απόφαση-Άδειας-Εξετάσεων-ΕΣΠΑ": "exetaseon",
        "Απόφαση-Άδειας-Γάμου-Αναπληρωτών": "gamou",
        "Απόφαση-Άδειας-Θανάτου-Αναπληρωτών": "thanatou",
        "Απόφαση-Άδειας-Αιμοδοσίας-Αναπληρωτών": "aimodosias",
        "Απόφαση-Άδειας-Συμμετοχής-σε-Δίκη-Αναπληρωτών": "diki",
        "Απόφαση-Άδειας-Αναπηρίας-Αναπληρωτών": "anapirias",
        "Απόφαση-Άδεια-Προγεννητικο-Αναπληρωτής": "progennitikon",
        # δύο ονόματα για την ίδια απόφαση, ανάλογα με το πρόγραμμα
        "Απόφαση-Εκλογικής-Άδειας-ΕΣΠΑ-ΠΕΠ-ΠΑΡΑΛΛΗΛΗ": "eklogiki",
        "Απόφαση-Εκλογική-Άδεια-ΕΣΠΑ": "eklogiki",
    },
    ("loipes", "aitisi"): {
        "Αίτηση-Εκπαιδευτικής-Άδειας-με-Αποδοχές": "ekpaideftiki",
        "Αίτηση-Ανανέωσης-Εκπαιδευτικής-Άδειας": "ekpaideftiki_ananeosi",
        "Αίτηση-για-Άδεια-Χωρίς-Αποδοχές-για-Ολοκλήρωση-Σπουδών": "aneu_apodoxon",
        "Αίτηση-Συνδικαλιστικής-Άδειας": "syndikalistiki",
        "Αίτηση-άδειας-για-επιμορφωτικούς-λόγους": "epimorfotiki",
        "Αίτηση-άδειας-για-επιμορφωτικούς-λόγους-στο-εξωτερικό": "epimorfotiki_exoteriko",
        "Αίτηση-άδειας-άσκησης-ιδιωτικού-έργου-με-αμοιβή": "idiotiko_ergo",
        "Αίτηση-Υπεύθυνη-Δήλωση-για-Αναρρωτική-Άδεια": "yd_anarrotikis",
    },
}

# Όπου ένας τύπος άδειας έχει δύο αποφάσεις, ποια προτείνεται.
DEFAULT_APOFASI = {
    ("monimoi", "asthenia_teknou"): "Απόφαση-Ασθένειας-Τέκνου-Μονίμων",
    ("anaplirotes", "asthenia_teknou"): "Απόφαση-Άδειας-Ασθένειας-Τέκνου-Αναπληρωτών",
}

# Τύποι που δεν εγκρίνει η σχολική μονάδα: η αίτηση πάει στη Διεύθυνση.
NO_APOFASI = {"anatrofis", "kyisis", "loxeias", "meiomeno_orario", "apli",
              "ekpaideftiki", "ekpaideftiki_ananeosi", "aneu_apodoxon",
              "syndikalistiki", "epimorfotiki", "epimorfotiki_exoteriko",
              "idiotiko_ergo", "yd_anarrotikis"}

SUFFIX = re.compile(r"(?:-\d+)+$")


def file_stem(name):
    """«Αίτηση-…-Αναπληρωτή-1-1.docx» → «Αίτηση-…-Αναπληρωτή»."""
    return SUFFIX.sub("", os.path.splitext(name)[0])


def programme_of(folder):
    for prefix, key in PROGRAMME_PREFIXES:
        if folder.startswith(prefix):
            return key
    return None


def classify(rel_path):
    """Ταυτότητα από τη σχετική διαδρομή μέσα στο templates_src/.

    Επιστρέφει dict ή None αν η διαδρομή δεν αναγνωρίζεται.
    """
    parts = rel_path.replace("\\", "/").split("/")
    if len(parts) < 2:
        return None
    name = parts[-1]

    if parts[0] == "Μόνιμοι" and len(parts) == 3:
        category, programme, kind_folder = "monimoi", None, parts[1]
    elif parts[0] == "Λοιπές άδειες" and len(parts) == 2:
        category, programme, kind_folder = "loipes", None, "Αιτήσεις"
    elif parts[0] == "Αναπληρωτές" and len(parts) == 4:
        category, programme, kind_folder = "anaplirotes", programme_of(parts[1]), parts[2]
        if programme is None:
            return None
    else:
        return None

    kind = KINDS.get(kind_folder)
    if kind is None:
        return None
    stem = file_stem(name)
    leave = FILE_TO_LEAVE.get((category, kind), {}).get(stem)
    if leave is None:
        return None

    return {
        "slot": slot_id(category, programme, kind, leave),
        "category": category,
        "programme": programme,
        "kind": kind,
        "leaveType": leave,
        "title": LEAVE_TYPES[leave],
        "source": rel_path,
        "stem": stem,
    }


def slot_id(category, programme, kind, leave):
    """«anaplirotes/epa/apofasi/asthenia_teknou» — η θέση, χωρίς ελληνικά."""
    parts = [category] + ([programme] if programme else []) + [kind, leave]
    return "/".join(parts)


def parse_id(template_id):
    """Αντίστροφο του slot_id: από «anaplirotes/epa/apofasi/kanoniki» στα μέρη του."""
    parts = template_id.split("/")
    leave = parts[-1].split("__")[0]
    category = parts[0]
    programme = parts[1] if category == "anaplirotes" else None
    return {
        "category": category,
        "programme": programme,
        "kind": parts[-2],
        "leaveType": leave,
        "title": LEAVE_TYPES.get(leave, leave),
    }


def build_index(rel_paths):
    """Ταυτότητα για κάθε διαδρομή, με μοναδικά κλειδιά.

    Δύο αρχεία μπορεί να μοιράζονται θέση — π.χ. η ασθένεια τέκνου έχει δύο
    αποφάσεις. Τότε το πρώτο κατά αλφαβητική σειρά ονόματος κρατά τη σκέτη θέση και
    τα επόμενα παίρνουν «__2», «__3». Η σειρά είναι σταθερή μεταξύ εκτελέσεων.
    """
    entries, unknown = [], []
    for path in sorted(rel_paths):
        found = classify(path)
        (entries if found else unknown).append(found or path)

    by_slot = {}
    for entry in entries:
        by_slot.setdefault(entry["slot"], []).append(entry)

    index = {}
    for slot, group in by_slot.items():
        for position, entry in enumerate(sorted(group, key=lambda e: e["stem"])):
            entry["id"] = slot if position == 0 else f"{slot}__{position + 1}"
            index[entry["id"]] = entry
    return index, unknown
