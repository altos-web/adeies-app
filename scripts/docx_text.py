"""Ανάγνωση και ασφαλής επεξεργασία κειμένου μέσα σε .docx.

Ένα .docx είναι zip με XML. Το κείμενο ζει σε <w:t> στοιχεία, τα οποία το Word
σπάει αυθαίρετα σε πολλά "runs". Το module δουλεύει σε επίπεδο παραγράφου: ενώνει
τα <w:t> μιας παραγράφου, εφαρμόζει αντικαταστάσεις στο ενιαίο κείμενο και γράφει
πίσω μόνο μέσα στα <w:t>. Τίποτα άλλο στο XML δεν αγγίζεται, οπότε το αρχείο
παραμένει έγκυρο και κρατά μορφοποίηση, πίνακες, εικόνες και στυλ.
"""

import html
import re
import zipfile

P_OPEN_RE = re.compile(r"<w:p(?:\s[^>]*)?>|<w:p(?:\s[^>]*)?/>")
P_CLOSE_RE = re.compile(r"</w:p>")


def paragraph_spans(xml):
    """Θέσεις των παραγράφων, χωρίς επικαλύψεις.

    Οι παράγραφοι **φωλιάζουν**: ένα πλαίσιο κειμένου (<w:txbxContent>) κρατά δικές
    του παραγράφους μέσα σε μια εξωτερική. Ένα απλό μη-άπληστο regex τις μπερδεύει
    και κολλά κείμενο από δύο παραγράφους σε μία. Εδώ κρατάμε τις **εσωτερικές**,
    που είναι αυτές που περιέχουν πραγματικά τα <w:t>.
    """
    tokens = sorted(
        [(m.start(), m.end(), "self" if m.group(0).endswith("/>") else "open")
         for m in P_OPEN_RE.finditer(xml)]
        + [(m.start(), m.end(), "close") for m in P_CLOSE_RE.finditer(xml)]
    )
    spans, stack = [], []
    for start, end, kind in tokens:
        if kind == "self":
            spans.append((start, end))
        elif kind == "open":
            stack.append(start)
        elif stack:
            spans.append((stack.pop(), end))

    # Κόβουμε στα όρια όλων των παραγράφων: η εξωτερική δίνει δύο κομμάτια, πριν και
    # μετά το πλαίσιο, και η εσωτερική το δικό της. Έτσι κανένα <w:t> δεν μένει έξω
    # και τα κομμάτια δεν επικαλύπτονται.
    edges = sorted({b for span in spans for b in span})
    return [(a, b) for a, b in zip(edges, edges[1:])
            if any(s <= a and b <= e for s, e in spans)]
T_RE = re.compile(r"<w:t(?:\s[^>]*)?>.*?</w:t>|<w:t(?:\s[^>]*)?/>", re.S)
T_INNER_RE = re.compile(r"<w:t(?:\s[^>]*)?>(.*?)</w:t>", re.S)
PPR_RE = re.compile(r"<w:pPr>.*?</w:pPr>|<w:pPr/>", re.S)


def _t_text(chunk):
    m = T_INNER_RE.fullmatch(chunk)
    return html.unescape(m.group(1)) if m else ""


def _t_write(text):
    return '<w:t xml:space="preserve">' + html.escape(text, quote=False) + "</w:t>"


class Paragraph:
    """Μία <w:p> με τα <w:t> της, ως ενιαίο κείμενο."""

    def __init__(self, xml):
        self.xml = xml
        self.spans = [(m.start(), m.end()) for m in T_RE.finditer(xml)]
        self.texts = [_t_text(xml[s:e]) for s, e in self.spans]

    @property
    def text(self):
        return "".join(self.texts)

    def apply(self, spans):
        """spans: λίστα (start, end, replacement) πάνω στο ενιαίο κείμενο."""
        if not spans:
            return False
        bounds, pos = [], 0
        for t in self.texts:
            bounds.append((pos, pos + len(t)))
            pos += len(t)
        out = list(self.texts)
        for s, e, rep in sorted(spans, key=lambda x: x[0], reverse=True):
            # το run που φιλοξενεί την αρχή της αλλαγής· για καθαρή εισαγωγή στο
            # τέλος της παραγράφου, το τελευταίο run με περιεχόμενο.
            host = next((i for i, (a, b) in enumerate(bounds) if a <= s < b), None)
            if host is None:
                host = max((i for i, (a, b) in enumerate(bounds) if a <= s <= b),
                           default=len(out) - 1)
            for i, (a, b) in enumerate(bounds):
                if b < s or a > e or (i != host and (b <= s or a >= e)):
                    continue
                ls, le = max(a, s) - a, min(b, e) - a
                if i == host:
                    out[i] = out[i][:ls] + rep + out[i][le:]
                else:
                    out[i] = out[i][:ls] + out[i][le:]
        self.texts = out
        return True

    def set_text(self, text):
        """Αντικαθιστά ολόκληρο το κείμενο της παραγράφου (πρώτο run κρατά τα πάντα)."""
        if not self.spans:
            return False
        self.texts = [text] + [""] * (len(self.texts) - 1)
        return True

    def inject(self, text):
        """Γράφει κείμενο σε παράγραφο χωρίς κανένα run (π.χ. κενό κελί πίνακα)."""
        if self.spans:
            return self.set_text(text)
        run = "<w:r>" + _t_write(text) + "</w:r>"
        if self.xml.endswith("/>"):
            self.xml = self.xml[:-2] + ">" + run + "</w:p>"
        else:
            m = PPR_RE.search(self.xml)
            at = m.end() if m else self.xml.index(">") + 1
            self.xml = self.xml[:at] + run + self.xml[at:]
        self.spans = [(m.start(), m.end()) for m in T_RE.finditer(self.xml)]
        self.texts = [_t_text(self.xml[s:e]) for s, e in self.spans]
        return True

    def render(self):
        out, prev = [], 0
        for (s, e), txt in zip(self.spans, self.texts):
            out.append(self.xml[prev:s])
            out.append(_t_write(txt))
            prev = e
        out.append(self.xml[prev:])
        return "".join(out)


TCW_RE = re.compile(r"<w:tc>.*?<w:tcW w:w=\"(\d+)\"", re.S)


class Document:
    def __init__(self, path):
        self.path = path
        with zipfile.ZipFile(path) as z:
            self.parts = {n: z.read(n) for n in z.namelist()}
            self.order = list(z.namelist())
        xml = self.parts["word/document.xml"].decode("utf-8")
        self.pieces, self.paragraphs = [], []
        prev = 0
        for start, end in paragraph_spans(xml):
            self.pieces.append(xml[prev:start])
            self.paragraphs.append(Paragraph(xml[start:end]))
            prev = end
        self.tail = xml[prev:]

    def cell_width(self, index):
        """Πλάτος σε twips του κελιού που *ανοίγει* σε αυτή την παράγραφο, αλλιώς None.

        Χρειάζεται για να ξεχωρίσουμε το κελί τιμής από τον στενό αποστάτη: στα
        έντυπα που ήρθαν από .doc η επόμενη στήλη είναι συχνά 284 twips (μισό
        εκατοστό) και ό,τι μπει εκεί κόβεται.
        """
        if not 0 <= index < len(self.pieces):
            return None
        match = TCW_RE.search(self.pieces[index])
        return int(match.group(1)) if match else None

    def render(self):
        out = []
        for piece, p in zip(self.pieces, self.paragraphs):
            out.append(piece)
            out.append(p.render())
        out.append(self.tail)
        return "".join(out)

    def save(self, path):
        self.parts["word/document.xml"] = self.render().encode("utf-8")
        self.save_parts(path)

    def save_parts(self, path):
        """Γράφει τα parts ως έχουν — για όταν το XML έχει ήδη ετοιμαστεί αλλού."""
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            for name in self.order:
                z.writestr(name, self.parts[name])
