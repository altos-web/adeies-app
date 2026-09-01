// Φόρτωση του καταλόγου, των αντιστοιχίσεων και του λεξιλογίου πεδίων.
// Παράγονται όλα από τα scripts της Python — εδώ μόνο διαβάζονται.

let data = null;

export async function load() {
  if (data) return data;
  const [catalog, pairings, config] = await Promise.all([
    fetch('templates/catalog.json').then((r) => r.json()),
    fetch('templates/pairings.json').then((r) => r.json()),
    fetch('templates/config.json').then((r) => r.json()),
  ]);
  data = { catalog, pairings, config };
  return data;
}

export const catalog = () => data.catalog;
export const pairings = () => data.pairings;
export const config = () => data.config;

export function fieldsOf(group) {
  return data.config.fields[group] || [];
}

// Τα πεδία που πρέπει να συμπληρωθούν για ένα συγκεκριμένο έντυπο: όσα υπάρχουν
// μέσα του, μείον όσα έρχονται ήδη από τον διευθυντή ή την καρτέλα, μείον όσα
// παράγονται από το φύλο και το πλήθος ημερών.
export function formFieldsFor(templateKeys) {
  const derived = new Set([
    ...Object.keys(data.config.gender),
    ...Object.keys(data.config.count),
  ]);
  const fromElsewhere = new Set(
    ['ypiresia', 'sxoleio', 'ekpaideutikos'].flatMap((g) =>
      fieldsOf(g).map((f) => f.tag)),
  );
  const lookup = new Map(
    Object.values(data.config.fields).flat().map((f) => [f.tag, f]),
  );

  const needed = new Set();
  for (const key of templateKeys) {
    for (const tag of data.catalog[key]?.fields || []) {
      if (!derived.has(tag) && !fromElsewhere.has(tag)) needed.add(tag);
    }
  }
  // η σειρά του λεξιλογίου, όχι η σειρά εμφάνισης στο έγγραφο
  return [...lookup.values()].filter((f) => needed.has(f.tag));
}

// Οι αντιστοιχίσεις των αναπληρωτών φωλιάζουν ένα επίπεδο βαθύτερα, ανά πρόγραμμα
// χρηματοδότησης. Χωρίς πρόγραμμα δεν υπάρχει σωστή απάντηση, οπότε δεν μαντεύουμε.
export function slotsOf(category, programme) {
  const branch = data.pairings[category] || {};
  if (category !== 'anaplirotes') return branch;
  return branch[programme] || {};
}

export const programmes = () => data.config.programmes || {};
export const categories = () => data.config.categories || {};

// Οι τύποι άδειας μιας κατηγορίας, με σειρά αλφαβητική κατά τίτλο. Και τα τρία
// προγράμματα έχουν τους ίδιους τύπους, οπότε για τη λίστα αρκεί το πρώτο.
export function leaveTypesOf(category, programme) {
  const key = category === 'anaplirotes'
    ? (programme || Object.keys(data.pairings.anaplirotes)[0]) : null;
  return Object.entries(slotsOf(category, key))
    .map(([k, slot]) => ({ key: k, ...slot }))
    .sort((a, b) => a.title.localeCompare(b.title, 'el'));
}
