// Παράδοση του συμπληρωμένου εντύπου.
//
// Το παραδοτέο είναι **το .docx**. Δεν υπάρχει προεπισκόπηση και δεν τυπώνεται
// τίποτα από τη σελίδα: ο διευθυντής κατεβάζει το αρχείο και το ανοίγει στο Word,
// που είναι και η μόνη αυθεντία για το πώς φαίνεται ένα .docx.
//
// Προηγουμένως το έντυπο αποδιδόταν με το docx-preview μέσα στη σελίδα και το PDF
// έβγαινε από την εκτύπωση του περιηγητή. Αυτό έδειχνε πράγματα που δεν υπάρχουν
// στο έγγραφο — συλλαβισμό «ΘΡΗΣΚΕΥΜΑ-/ΤΩΝ» — και έκρυβε πράγματα που υπάρχουν:
// σε 14 έντυπα ο renderer φούσκωνε τον εξωτερικό πίνακα (έχωνε στο colgroup του
// και τις στήλες ενός ένθετου) και το «Αριθμ. Πρωτ.» έβγαινε εκτός σελίδας, όπου
// το `overflow: hidden` το εξαφάνιζε αθόρυβα.

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Καθυστέρηση ώστε η σύνοψη να μην ξαναχτίζεται σε κάθε πλήκτρο.
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
