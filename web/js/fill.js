// Συμπλήρωση ενός .docx στη μνήμη του περιηγητή.
//
// Δεν χρειάζεται βιβλιοθήκη templating. Το scripts/tag_templates.py εγγυάται ότι
// κάθε ετικέτα κάθεται ολόκληρη μέσα σε ένα <w:t>, οπότε η συμπλήρωση είναι σκέτη
// αντικατάσταση κειμένου πάνω στο word/document.xml.

const TAG = /\{\{\s*([a-z_0-9]+)\s*\}\}/g;
const cache = new Map();

async function templateBytes(file) {
  if (!cache.has(file)) {
    const response = await fetch(`templates/${encodeURIComponent(file)}`);
    if (!response.ok) throw new Error(`Δεν βρέθηκε το έντυπο: ${file}`);
    cache.set(file, await response.arrayBuffer());
  }
  return cache.get(file);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Οι αλλαγές γραμμής των πεδίων πολλαπλών γραμμών γίνονται <w:br/>. Το <w:t> δεν
// δέχεται στοιχεία μέσα του, οπότε κλείνει και ξανανοίγει γύρω από το break.
function toRunXml(value) {
  return escapeXml(value)
    .split(/\r?\n/)
    .join('</w:t><w:br/><w:t xml:space="preserve">');
}

export async function fillDocx(file, data) {
  const zip = await JSZip.loadAsync(await templateBytes(file));
  const xml = await zip.file('word/document.xml').async('string');
  const filled = xml.replace(TAG, (_, tag) => toRunXml(data[tag] ?? ''));
  zip.file('word/document.xml', filled);
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

// Ποιες ετικέτες περιέχει πραγματικά ένα έντυπο — ο κατάλογος το ξέρει ήδη, αλλά
// αυτό επιτρέπει έλεγχο ότι το αρχείο και ο κατάλογος δεν έχουν ξεσυγχρονιστεί.
export async function tagsIn(file) {
  const zip = await JSZip.loadAsync(await templateBytes(file));
  const xml = await zip.file('word/document.xml').async('string');
  return [...new Set([...xml.matchAll(TAG)].map((m) => m[1]))];
}
