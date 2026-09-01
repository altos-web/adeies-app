"""Το λεξιλόγιο ετικετών: ομάδα, ελληνική ετικέτα, τύπος πεδίου.

Μία πηγή αλήθειας. Το scan_tags.py το χρησιμοποιεί για να απορρίπτει άγνωστες
ετικέτες, και το build_web.py το εξάγει σε JSON ώστε η εφαρμογή να χτίζει τις
φόρμες της χωρίς να ξέρει τίποτα για τα έγγραφα.

Ομάδες:
  ypiresia      σταθερά ανά διεύθυνση εκπαίδευσης — καρτέλα διευθυντή
  sxoleio       σταθερά ανά σχολική μονάδα        — καρτέλα διευθυντή
  ekpaideutikos η καρτέλα του εργαζομένου
  fylo          παράγονται από το φύλο            — δεν εμφανίζονται σε φόρμα
  arithmos      παράγονται από το πλήθος ημερών   — δεν εμφανίζονται σε φόρμα
  adeia         η συγκεκριμένη άδεια              — φόρμα έκδοσης
  eidika        δικαιολογητικά και τρίτα πρόσωπα  — φόρμα έκδοσης
  loipes        πεδία μόνο των λοιπών αδειών      — φόρμα έκδοσης

Τύποι: text (προεπιλογή), date, number, textarea, check.

Τέταρτο στοιχείο, προαιρετικό: **derived** — από πού υπολογίζεται το πεδίο. Τα
παράγωγα δεν ζητούνται στην κύρια φόρμα· η υπολογισμένη τιμή δείχνει ως placeholder
και το πεδίο μένει επεξεργάσιμο, γιατί η αυτόματη τιμή είναι πρόταση όχι κλείδωμα.
Η ίδια η λογική υπολογισμού ζει στο web/js/derive.js και στο scripts/render.py.
"""

FIELDS = {
    # ── υπηρεσία ────────────────────────────────────────────────────────────
    "perifereia": ("ypiresia", "Περιφερειακή διεύθυνση", "text"),
    "nomos_gen": ("ypiresia", "Νομός (γενική) — «ΔΡΑΜΑΣ»", "text"),
    "nomos_on": ("ypiresia", "Νομός (ονομαστική) — «ΔΡΑΜΑ»", "text"),
    "vathmida": ("ypiresia", "Βαθμίδα — «Α/ΘΜΙΑΣ»", "text"),
    "vathmida_syntomo": ("ypiresia", "Βαθμίδα σύντομα — «Π.Ε.»", "text"),
    "sxoliko_etos": ("ypiresia", "Σχολικό έτος — «2026-2027»", "text"),
    "etos_anaforas": ("ypiresia", "Έτος αναφοράς προϋπηρεσίας", "text", "sxoliko_etos"),

    # ── σχολική μονάδα ──────────────────────────────────────────────────────
    "sxoleio": ("sxoleio", "Σχολείο (ονομαστική)", "text"),
    "sxoleio_gen": ("sxoleio", "Σχολείο (γενική) — «του …»", "text"),
    "sxoleio_tax_dieuthinsi": ("sxoleio", "Ταχυδρομική διεύθυνση", "text"),
    "sxoleio_tk_poli": ("sxoleio", "Τ.Κ. και πόλη", "text"),
    "sxoleio_plirofories": ("sxoleio", "Πληροφορίες (αρμόδιος)", "text"),
    "sxoleio_tilefono": ("sxoleio", "Τηλέφωνο", "text"),
    "sxoleio_email": ("sxoleio", "E-mail", "text"),
    "sxoleio_istoselida": ("sxoleio", "Ιστοσελίδα", "text"),
    "dieuthintis_titlos": ("sxoleio", "Τίτλος υπογράφοντος", "text"),
    "dieuthintis_onomateponymo": ("sxoleio", "Ονοματεπώνυμο διευθυντή", "text"),

    # ── εκπαιδευτικός ───────────────────────────────────────────────────────
    "eponymo": ("ekpaideutikos", "Επώνυμο", "text"),
    "onoma": ("ekpaideutikos", "Όνομα", "text"),
    "onomateponymo": ("ekpaideutikos", "Ονοματεπώνυμο", "text", "eponymo+onoma"),
    "patronymo": ("ekpaideutikos", "Πατρώνυμο", "text"),
    "mitronymo": ("ekpaideutikos", "Μητρώνυμο", "text"),
    # Οι υπεύθυνες δηλώσεις ζητούν και τα επώνυμα των γονέων, άλλοτε σε χωριστά
    # κελιά («Όνομα Πατέρα» / «Επώνυμο Πατέρα») και άλλοτε ενωμένα σε ένα.
    "patera_eponymo": ("ekpaideutikos", "Επώνυμο πατέρα", "text"),
    "mitera_eponymo": ("ekpaideutikos", "Επώνυμο μητέρας", "text"),
    "patera_onomateponymo": ("ekpaideutikos", "Ονοματεπώνυμο πατέρα", "text",
                             "patronymo+patera_eponymo"),
    "mitera_onomateponymo": ("ekpaideutikos", "Ονοματεπώνυμο μητέρας", "text",
                             "mitronymo+mitera_eponymo"),
    "imerominia_gennisis": ("ekpaideutikos", "Ημερομηνία γέννησης", "date"),
    "topos_gennisis": ("ekpaideutikos", "Τόπος γέννησης", "text"),
    "email": ("ekpaideutikos", "E-mail", "text"),
    "klados": ("ekpaideutikos", "Κλάδος — «ΠΕ70»", "text"),
    "klados_perigrafi": ("ekpaideutikos", "Περιγραφή κλάδου — «ΔΑΣΚΑΛΩΝ»", "text"),
    "eidikotita": ("ekpaideutikos", "Ειδικότητα", "text"),
    "am": ("ekpaideutikos", "Αριθμός μητρώου", "text"),
    "afm": ("ekpaideutikos", "ΑΦΜ", "text"),
    "adt": ("ekpaideutikos", "Αριθμός δελτίου ταυτότητας", "text"),
    "vathmos": ("ekpaideutikos", "Βαθμός", "text"),
    "mk": ("ekpaideutikos", "Μισθολογικό κλιμάκιο", "text"),
    "dieuthinsi_katoikias": ("ekpaideutikos", "Διεύθυνση κατοικίας", "text", "odos+arithmos_katoikias"),
    "odos": ("ekpaideutikos", "Οδός", "text"),
    "arithmos_katoikias": ("ekpaideutikos", "Αριθμός", "text"),
    "tk": ("ekpaideutikos", "Ταχυδρομικός κώδικας", "text"),
    "perioxi": ("ekpaideutikos", "Περιοχή", "text"),
    "poli": ("ekpaideutikos", "Πόλη", "text"),
    "dimos_katoikias": ("ekpaideutikos", "Δήμος κατοικίας", "text"),
    "tilefono_katoikias": ("ekpaideutikos", "Τηλέφωνο οικίας", "text"),
    "kinito": ("ekpaideutikos", "Κινητό τηλέφωνο", "text"),
    "sxoleio_organikis": ("ekpaideutikos", "Σχολείο οργανικής θέσης", "text"),
    "sxoleia_ypiresias": ("ekpaideutikos", "Σχολείο/α που υπηρετεί", "text"),
    "ypiresia_eti": ("ekpaideutikos", "Χρόνος υπηρεσίας: έτη", "number"),
    "ypiresia_mines": ("ekpaideutikos", "Χρόνος υπηρεσίας: μήνες", "number"),
    "ypiresia_imeres": ("ekpaideutikos", "Χρόνος υπηρεσίας: ημέρες", "number"),

    # σημειώνονται αυτόματα από τη σχέση εργασίας της καρτέλας
    "check_plirous": ("ekpaideutikos", "Αναπληρωτής πλήρους", "check"),
    "check_espa_plirous": ("ekpaideutikos", "Αναπληρωτής ΕΣΠΑ πλήρους", "check"),
    "check_espa_amo": ("ekpaideutikos", "Αναπληρωτής ΕΣΠΑ ΑΜΩ", "check"),
    "check_oromisthios": ("ekpaideutikos", "Ωρομίσθιος", "check"),
    "check_monimos_apospasmenos": ("ekpaideutikos", "Μόνιμος αποσπασμένος", "check"),
    "check_monimos_diathesi": ("ekpaideutikos", "Μόνιμος στη διάθεση", "check"),
    "check_monimos_organiki": ("ekpaideutikos", "Μόνιμος σε οργανική", "check"),
    "check_diathesi_plires": ("ekpaideutikos", "Διάθεση από Β/θμια, πλήρης", "check"),
    "check_diathesi_meriki": ("ekpaideutikos", "Διάθεση από Β/θμια, μερική", "check"),
    "check_idax": ("ekpaideutikos", "ΙΔΑΧ", "check"),

    # ── η συγκεκριμένη άδεια ────────────────────────────────────────────────
    "topos": ("adeia", "Τόπος σύνταξης", "text", "nomos_on"),
    "imerominia_egrafou": ("adeia", "Ημερομηνία εγγράφου", "date"),
    "arithmos_protokollou": ("adeia", "Αριθμός πρωτοκόλλου", "text"),
    "protokollo_aitisis": ("adeia", "Αριθμός πρωτοκόλλου της αίτησης", "text"),
    "imerominia_aitisis": ("adeia", "Ημερομηνία αίτησης", "date"),
    "imerominia_veveosis": ("adeia", "Ημερομηνία βεβαίωσης", "date"),
    # η έναρξη και το πλήθος γράφονται· λήξη, «στις» και ολογράφως υπολογίζονται
    "imerominia_apo": ("adeia", "Ημερομηνία έναρξης", "date"),
    "imeres_arithmitika": ("adeia", "Πλήθος ημερών", "number"),
    "imeres_etous": ("adeia", "Ημέρες που έχει ήδη λάβει φέτος", "number"),
    "imeres_plithos": ("adeia", "Ημέρες χωρίς μηδέν — «3/ήμερης»", "text", "imeres_arithmitika"),
    "imeres_olografos": ("adeia", "Ημέρες ολογράφως", "text", "imeres_arithmitika"),
    "imerominia_eos": ("adeia", "Ημερομηνία λήξης", "date", "imerominia_apo+imeres_arithmitika"),
    "imerominia_stis": ("adeia", "Στις", "date", "imerominia_apo"),
    "imera_evdomadas": ("adeia", "Ημέρα εβδομάδας", "text"),
    "thema": ("adeia", "Θέμα", "text"),
    "keimeno_aitimatos": ("adeia", "Κείμενο αιτήματος", "textarea"),
    "logoi_adeias": ("adeia", "Λόγοι χορήγησης", "textarea"),
    "synodeutika": ("adeia", "Συνοδευτικά δικαιολογητικά", "textarea"),

    # ── δικαιολογητικά και τρίτα πρόσωπα ────────────────────────────────────
    "onoma_iatrou": ("eidika", "Ονοματεπώνυμο ιατρού", "text"),
    "foreas_aimodosias": ("eidika", "Φορέας αιμοληψίας", "text"),
    "nosokomeio": ("eidika", "Νοσοκομείο", "text"),
    "panepistimio": ("eidika", "Εκπαιδευτικό ίδρυμα", "text"),
    "dikastirio": ("eidika", "Δικαστήριο", "text"),
    "idiotita_dikis": ("eidika", "Ιδιότητα στη δίκη", "text"),
    "apofasi_efka": ("eidika", "Απόφαση ΕΦΚΑ", "text"),
    "imeres_kepa": ("eidika", "Ημέρες κατά το πιστοποιητικό ΚΕΠΑ", "number"),
    "pistopoiitiko_kepa": ("eidika", "Πιστοποιητικό ΚΕΠΑ", "text"),
    "lixiarxeio": ("eidika", "Ληξιαρχείο", "text"),

    "syzygos_eponymo": ("eidika", "Συζύγου: επώνυμο", "text"),
    "syzygos_onoma": ("eidika", "Συζύγου: όνομα", "text"),
    "syzygos_patronymo": ("eidika", "Συζύγου: πατρώνυμο", "text"),
    "syzygos_mitronymo": ("eidika", "Συζύγου: μητρώνυμο", "text"),
    "imerominia_gamou": ("eidika", "Ημερομηνία τέλεσης γάμου", "date"),
    "topos_gamou": ("eidika", "Τόπος τέλεσης γάμου", "text"),

    # Η ΚΟΙΝΗ υπεύθυνη δήλωση της άδειας ανατροφής υπογράφεται από δύο πρόσωπα: ο
    # δηλών Α είναι ο εκπαιδευτικός, ο Β ο/η σύζυγος. Το μπλοκ Β ζητά για τον
    # σύζυγο ό,τι και το Α για τον εκπαιδευτικό.
    "syzygos_patera_onomateponymo": ("eidika", "Συζύγου: ονοματεπώνυμο πατέρα", "text"),
    "syzygos_mitera_onomateponymo": ("eidika", "Συζύγου: ονοματεπώνυμο μητέρας", "text"),
    "syzygos_imerominia_gennisis": ("eidika", "Συζύγου: ημερομηνία γέννησης", "date"),
    "syzygos_topos_gennisis": ("eidika", "Συζύγου: τόπος γέννησης", "text"),
    "syzygos_adt": ("eidika", "Συζύγου: ΑΔΤ", "text"),
    "syzygos_poli": ("eidika", "Συζύγου: τόπος κατοικίας", "text"),
    "syzygos_odos": ("eidika", "Συζύγου: οδός", "text"),
    "syzygos_arithmos": ("eidika", "Συζύγου: αριθμός", "text"),
    "syzygos_tk": ("eidika", "Συζύγου: Τ.Κ.", "text"),
    "syzygos_tilefono": ("eidika", "Συζύγου: τηλέφωνο", "text"),
    "syzygos_email": ("eidika", "Συζύγου: e-mail", "text"),

    "thanon_onomateponymo": ("eidika", "Θανόντος: ονοματεπώνυμο", "text"),
    "thanon_patronymo": ("eidika", "Θανόντος: πατρώνυμο", "text"),
    "thanon_mitronymo": ("eidika", "Θανόντος: μητρώνυμο", "text"),
    "thanon_adt": ("eidika", "Θανόντος: ΑΔΤ", "text"),
    "imerominia_thanatou": ("eidika", "Ημερομηνία θανάτου", "date"),
    "topos_thanatou": ("eidika", "Τόπος θανάτου", "text"),
    "topos_tafis": ("eidika", "Τόπος ταφής", "text"),

    "tekno_eponymo": ("eidika", "Τέκνου: επώνυμο", "text"),
    "tekno_onoma": ("eidika", "Τέκνου: όνομα", "text"),
    "tekno_patronymo": ("eidika", "Τέκνου: πατρώνυμο", "text"),
    "tekno_mitronymo": ("eidika", "Τέκνου: μητρώνυμο", "text"),
    "tekno_imera": ("eidika", "Τέκνου: ημέρα γέννησης", "text"),
    "tekno_minas": ("eidika", "Τέκνου: μήνας γέννησης", "text"),
    "tekno_etos": ("eidika", "Τέκνου: έτος γέννησης", "text"),
    "tekno_dimos": ("eidika", "Τέκνου: δήμος γέννησης", "text"),

    # ── λοιπές άδειες: μόνο ό,τι συμπληρώνει ο εκπαιδευτικός ────────────────
    # Η ενότητα «ΣΤΟΙΧΕΙΑ ΑΙΤΟΥΝΤΟΣ» των εντύπων υπηρεσιακής εκπαίδευσης
    # (ΦΕΚ διορισμού, χρόνος αδειών, εισήγηση) συμπληρώνεται από τη Διεύθυνση και
    # μένει σκόπιμα κενή.
    "perioxi_metathesis": ("loipes", "Περιοχή μετάθεσης του σχολείου", "text"),
    "dimosio_tameio": ("loipes", "Δημόσιο ταμείο πληρωμών", "text"),
    "etos_adeias": ("loipes", "Έτος αιτούμενης άδειας", "text"),
    "eidos_spoudon": ("loipes", "Θέμα διατριβής ή τίτλος μεταπτυχιακού", "text"),
    "aei": ("loipes", "Α.Ε.Ι.", "text"),
    "tmima": ("loipes", "Τμήμα", "text"),
    "syllogos": ("loipes", "Σύλλογος εκπαιδευτικών", "text"),
    "idiotita_syllogou": ("loipes", "Ιδιότητα στον σύλλογο", "text"),
    "idiotita_apascholisis": ("loipes", "Ιδιότητα απασχόλησης", "text"),
    "ergodotis": ("loipes", "Εργοδότης ή φορέας", "text"),
    "ores_evdomadiaios": ("loipes", "Ώρες απασχόλησης την εβδομάδα", "text"),
    "katanomi_oron": ("loipes", "Αναλυτική κατανομή ωρών", "textarea"),
    "programma_epimorfosis": ("loipes", "Πρόγραμμα επιμόρφωσης", "text"),
    "kodikos_programmatos": ("loipes", "Κωδικός σεμιναρίου/προγράμματος", "text"),
    "arithmos_egkrisis_iky": ("loipes", "Αριθμός έγκρισης Ι.Κ.Υ.", "text"),
    "perifereiaki_tax_dieuthinsi": ("loipes", "Ταχ. διεύθυνση Περιφερειακής Δ/νσης", "textarea"),
    "sxoleio_teknou": ("eidika", "Σχολείο του τέκνου", "text"),
}


# Πλήθος ημερών ολογράφως, σε γενική και κεφαλαία, όπως το θέλουν τα έντυπα
# («κανονική άδεια ΤΡΙΩΝ (03) ημερών», «άδεια ΜΙΑΣ (01) ημέρας»). Στα ελληνικά
# κλίνονται μόνο τα 1, 3, 4 και οι σύνθετοί τους.
_ONES = ["", "ΜΙΑΣ", "ΔΥΟ", "ΤΡΙΩΝ", "ΤΕΣΣΑΡΩΝ", "ΠΕΝΤΕ", "ΕΞΙ", "ΕΠΤΑ", "ΟΚΤΩ", "ΕΝΝΕΑ"]
_TEENS = ["ΔΕΚΑ", "ΕΝΤΕΚΑ", "ΔΩΔΕΚΑ", "ΔΕΚΑΤΡΙΩΝ", "ΔΕΚΑΤΕΣΣΑΡΩΝ", "ΔΕΚΑΠΕΝΤΕ",
          "ΔΕΚΑΕΞΙ", "ΔΕΚΑΕΠΤΑ", "ΔΕΚΑΟΚΤΩ", "ΔΕΚΑΕΝΝΕΑ"]

IMERES_OLOGRAFOS = (
    {n: _ONES[n] for n in range(1, 10)}
    | {10 + n: _TEENS[n] for n in range(10)}
    | {20: "ΕΙΚΟΣΙ"}
    | {20 + n: f"ΕΙΚΟΣΙ {_ONES[n]}" for n in range(1, 10)}
    | {30: "ΤΡΙΑΝΤΑ"}
)


def by_group():
    groups = {}
    for tag, spec in FIELDS.items():
        group, label, kind = spec[:3]
        field = {"tag": tag, "label": label, "type": kind}
        if len(spec) > 3:
            field["derived"] = spec[3]
        groups.setdefault(group, []).append(field)
    return groups
