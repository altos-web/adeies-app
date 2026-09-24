// Αποθήκευση στον περιηγητή. Τίποτα δεν φεύγει από το μηχάνημα, οπότε ο
// διαχωρισμός ανά διευθυντή προκύπτει από μόνος του και δεν χρειάζεται σύνδεση.
//
// Όλη η πρόσβαση περνά από εδώ: αν κάποτε χρειαστεί Firestore, αλλάζει μόνο αυτό
// το αρχείο.

const KEYS = {
  director: 'adeies.director',
  employees: 'adeies.employees',
  pairings: 'adeies.pairings',
  timetable: 'adeies.timetable',
  meta: 'adeies.meta',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getDirector: () => read(KEYS.director, {}),
  setDirector: (data) => write(KEYS.director, data),

  getEmployees: () => read(KEYS.employees, []),

  saveEmployee(employee) {
    const all = store.getEmployees();
    const index = all.findIndex((e) => e.id === employee.id);
    if (index >= 0) all[index] = employee;
    else all.push({ ...employee, id: employee.id || crypto.randomUUID() });
    write(KEYS.employees, all);
    return all;
  },

  deleteEmployee(id) {
    write(KEYS.employees, store.getEmployees().filter((e) => e.id !== id));
  },

  // Ποια απόφαση συνοδεύει ποια άδεια, όταν ο διευθυντής αλλάζει την προεπιλογή.
  getPairings: () => read(KEYS.pairings, {}),
  // Το κλειδί το φτιάχνει ο καλών: στους αναπληρωτές περιλαμβάνει και το
  // πρόγραμμα, γιατί η ίδια άδεια έχει άλλο έντυπο σε καθένα από τα τρία.
  setPairing(key, apofasi) {
    write(KEYS.pairings, { ...store.getPairings(), [key]: apofasi });
  },

  getTimetable: () => read(KEYS.timetable, null),
  setTimetable: (data) => write(KEYS.timetable, data),

  getMeta: () => read(KEYS.meta, {}),
  markExported() {
    write(KEYS.meta, { ...store.getMeta(), lastExport: new Date().toISOString() });
  },

  // Ένα καθάρισμα ιστορικού σβήνει τα πάντα, οπότε η εξαγωγή δεν είναι
  // προαιρετική. Ο έλεγχος παλαιότητας τροφοδοτεί την υπενθύμιση στην οθόνη.
  daysSinceExport() {
    const last = store.getMeta().lastExport;
    if (!last) return Infinity;
    return (Date.now() - new Date(last).getTime()) / 86400000;
  },

  exportAll() {
    return {
      version: 2,
      exported: new Date().toISOString(),
      director: store.getDirector(),
      employees: store.getEmployees(),
      pairings: store.getPairings(),
      timetable: store.getTimetable(),
    };
  },

  importAll(data) {
    if (!data || typeof data !== 'object') throw new Error('Μη αναγνωρίσιμο αρχείο.');
    if (!Array.isArray(data.employees)) throw new Error('Λείπει η λίστα εργαζομένων.');
    write(KEYS.director, data.director || {});
    write(KEYS.employees, data.employees);
    write(KEYS.pairings, data.pairings || {});
    if (data.timetable) write(KEYS.timetable, data.timetable);
  },
};
