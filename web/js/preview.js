// Προεπισκόπηση του συμπληρωμένου εντύπου και έκδοση PDF.
//
// Το docx-preview μετατρέπει το .docx σε HTML μέσα στη σελίδα. Το ίδιο ακριβώς
// HTML τυπώνεται, οπότε ό,τι βλέπει ο διευθυντής είναι ό,τι θα πάρει σε PDF.

let renderToken = 0;

export async function renderInto(container, blob) {
  const token = ++renderToken;
  const buffer = await blob.arrayBuffer();
  if (token !== renderToken) return; // πρόλαβε νεότερη αλλαγή
  container.innerHTML = '';
  await docx.renderAsync(buffer, container, null, {
    className: 'docx',
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    breakPages: true,
    experimental: true,
  });
}

export function printPreview() {
  window.print();
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Καθυστέρηση ώστε το preview να μην ξαναχτίζεται σε κάθε πλήκτρο.
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
