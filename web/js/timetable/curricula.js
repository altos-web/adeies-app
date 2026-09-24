// curricula.js — Επίσημα Αναλυτικά Προγράμματα Σπουδών & Προδιαγραφές Μαθημάτων
// Περιλαμβάνει τη νομοθετημένη κατανομή ωρών ανά τάξη για Δημοτικό, Γυμνάσιο, ΓΕΛ και ΕΠΑΛ.

export const SCHOOL_TYPES = {
  dimotiko: {
    id: 'dimotiko',
    name: 'Δημοτικό Σχολείο',
    periodsPerDay: 6,
    totalWeeklyPeriods: 30,
    grades: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'],
  },
  gymnasio: {
    id: 'gymnasio',
    name: 'Γυμνάσιο',
    periodsPerDay: 7,
    totalWeeklyPeriods: 35,
    grades: ['Α', 'Β', 'Γ'],
  },
  gel: {
    id: 'gel',
    name: 'Γενικό Λύκειο (ΓΕΛ)',
    periodsPerDay: 7,
    totalWeeklyPeriods: 35,
    grades: ['Α', 'Β', 'Γ'],
  },
  epal: {
    id: 'epal',
    name: 'Επαγγελματικό Λύκειο (ΕΠΑΛ)',
    periodsPerDay: 7,
    totalWeeklyPeriods: 35,
    grades: ['Α', 'Β', 'Γ'],
  },
};

export const DEFAULT_BELL_TIMES = {
  primary: [
    { period: 1, start: '08:15', end: '09:00', label: '1η ώρα' },
    { period: 2, start: '09:05', end: '09:40', label: '2η ώρα' },
    { period: 3, start: '10:00', end: '10:45', label: '3η ώρα' },
    { period: 4, start: '10:55', end: '11:40', label: '4η ώρα' },
    { period: 5, start: '11:55', end: '12:35', label: '5η ώρα' },
    { period: 6, start: '12:40', end: '13:15', label: '6η ώρα' },
  ],
  secondary: [
    { period: 1, start: '08:15', end: '09:00', label: '1η ώρα' },
    { period: 2, start: '09:05', end: '09:50', label: '2η ώρα' },
    { period: 3, start: '10:00', end: '10:45', label: '3η ώρα' },
    { period: 4, start: '10:55', end: '11:40', label: '4η ώρα' },
    { period: 5, start: '11:50', end: '12:35', label: '5η ώρα' },
    { period: 6, start: '12:40', end: '13:25', label: '6η ώρα' },
    { period: 7, start: '13:30', end: '14:10', label: '7η ώρα' },
  ],
};

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Δευτέρα', short: 'ΔΕΥ' },
  { id: 2, name: 'Τρίτη', short: 'ΤΡΙ' },
  { id: 3, name: 'Τετάρτη', short: 'ΤΕΤ' },
  { id: 4, name: 'Πέμπτη', short: 'ΠΕΜ' },
  { id: 5, name: 'Παρασκευή', short: 'ΠΑΡ' },
];

export const SPECIAL_ROOMS = [
  { id: 'room_gen', name: 'Κανονική Αίθουσα', short: 'ΑΙΘ' },
  { id: 'room_cs', name: 'Εργαστήριο Πληροφορικής', short: 'ΕΡΓ.ΠΛΗΡ' },
  { id: 'room_sci', name: 'Εργαστήριο Φυσικών Επιστημών', short: 'ΕΡΓ.ΦΥΣ' },
  { id: 'room_tech', name: 'Εργαστήριο Τεχνολογίας / Μηχανολογίας', short: 'ΕΡΓ.ΤΕΧ' },
  { id: 'room_gym', name: 'Γυμναστήριο / Προαύλιο', short: 'ΓΥΜΝ' },
  { id: 'room_art', name: 'Αίθουσα Μουσικής / Εικαστικών', short: 'ΑΙΘ.ΤΕΧΝ' },
];

// Πρότυπα Ωρολογίων Προγραμμάτων ανά Σχολείο και Τάξη
export const CURRICULA = {
  // ── ΔΗΜΟΤΙΚΟ (Ενιαίου Τύπου - Π.Δ. 79/2017 & ΦΕΚ Β΄ 3990/2026) ─────────────
  dimotiko: {
    'Α': [
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 9, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 5, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 3, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 3, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'theatriki', name: 'Θεατρική Αγωγή', short: 'ΘΕΑ', hours: 1, branch: 'ΠΕ91', color: '#f97316', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 2, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Β': [
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 9, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 5, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 3, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 3, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'theatriki', name: 'Θεατρική Αγωγή', short: 'ΘΕΑ', hours: 1, branch: 'ΠΕ91', color: '#f97316', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 2, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Γ': [
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 8, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 2, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 3, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'theatriki', name: 'Θεατρική Αγωγή', short: 'ΘΕΑ', hours: 1, branch: 'ΠΕ91', color: '#f97316', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 2, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Δ': [
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 8, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 2, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 3, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'theatriki', name: 'Θεατρική Αγωγή', short: 'ΘΕΑ', hours: 1, branch: 'ΠΕ91', color: '#f97316', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 2, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Ε': [
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'fysika', name: 'Φυσικά', short: 'ΦΥΣ', hours: 3, branch: 'ΠΕ70', color: '#0284c7', difficulty: 3 },
      { id: 'geografia', name: 'Γεωγραφία', short: 'ΓΕΩ', hours: 1, branch: 'ΠΕ70', color: '#14b8a6', difficulty: 2 },
      { id: 'kpa', name: 'Κοινωνική & Πολιτική Αγωγή', short: 'ΚΠΑ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      // 2η Ξένη Γλώσσα: Σπάει σε 2 υποτμήματα (Γαλλικά / Γερμανικά)
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα (Γαλλικά/Γερμανικά)', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#d946ef', difficulty: 2, isSplit: true, splitType: 'foreign_lang_2' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'ΣΤ': [
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'fysika', name: 'Φυσικά', short: 'ΦΥΣ', hours: 3, branch: 'ΠΕ70', color: '#0284c7', difficulty: 3 },
      { id: 'geografia', name: 'Γεωγραφία', short: 'ΓΕΩ', hours: 1, branch: 'ΠΕ70', color: '#14b8a6', difficulty: 2 },
      { id: 'kpa', name: 'Κοινωνική & Πολιτική Αγωγή', short: 'ΚΠΑ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      // 2η Ξένη Γλώσσα: Σπάει σε 2 υποτμήματα
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα (Γαλλικά/Γερμανικά)', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#d946ef', difficulty: 2, isSplit: true, splitType: 'foreign_lang_2' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
  },

  // ── ΓΥΜΝΑΣΙΟ (Υ.Α. 44257/Δ2/2026 - ΦΕΚ 2132/Β/2026) ──────────────────────
  gymnasio: {
    'Α': [
      { id: 'ne_glossa', name: 'Νεοελληνική Γλώσσα & Γραμματεία', short: 'ΝΕ.ΓΛ', hours: 5, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'arxaia', name: 'Αρχαία Ελληνική Γλώσσα & Γραμματεία', short: 'ΑΡΧ', hours: 3, branch: 'ΠΕ02', color: '#4f46e5', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 1, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 2, room: 'room_sci' },
      { id: 'viologia', name: 'Βιολογία', short: 'ΒΙΟ', hours: 1, branch: 'ΠΕ04.04', color: '#16a34a', difficulty: 2, room: 'room_sci' },
      { id: 'geografia', name: 'Γεωλογία - Γεωγραφία', short: 'ΓΕΩ', hours: 1, branch: 'ΠΕ04.05', color: '#0d9488', difficulty: 2 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ02', color: '#d97706', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      // 2η Ξένη Γλώσσα (Γαλλικά / Γερμανικά / Ιταλικά)
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα (Γαλλικά/Γερμανικά)', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#c026d3', difficulty: 2, isSplit: true, splitType: 'foreign_lang_2' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#4338ca', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#0f766e', difficulty: 1 },
      { id: 'pliroforiki', name: 'Πληροφορική', short: 'ΠΛΗΡ', hours: 2, branch: 'ΠΕ86', color: '#475569', difficulty: 2, room: 'room_cs' },
      { id: 'texnologia', name: 'Τεχνολογία', short: 'ΤΕΧ', hours: 1, branch: 'ΠΕ81-84', color: '#b45309', difficulty: 1, room: 'room_tech' },
      { id: 'oikiaki', name: 'Οικιακή Οικονομία', short: 'ΟΙΚ.ΟΙΚ', hours: 1, branch: 'ΠΕ80', color: '#ea580c', difficulty: 1 },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'Όλοι', color: '#65a30d', difficulty: 1 },
    ],
    'Β': [
      { id: 'ne_glossa', name: 'Νεοελληνική Γλώσσα & Γραμματεία', short: 'ΝΕ.ΓΛ', hours: 4, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'arxaia', name: 'Αρχαία Ελληνική Γλώσσα & Γραμματεία', short: 'ΑΡΧ', hours: 3, branch: 'ΠΕ02', color: '#4f46e5', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 3, room: 'room_sci' },
      { id: 'ximeia', name: 'Χημεία', short: 'ΧΗΜ', hours: 1, branch: 'ΠΕ04.02', color: '#0ea5e9', difficulty: 2, room: 'room_sci' },
      { id: 'viologia', name: 'Βιολογία', short: 'ΒΙΟ', hours: 1, branch: 'ΠΕ04.04', color: '#16a34a', difficulty: 2, room: 'room_sci' },
      { id: 'geografia', name: 'Γεωλογία - Γεωγραφία', short: 'ΓΕΩ', hours: 2, branch: 'ΠΕ04.05', color: '#0d9488', difficulty: 2 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ02', color: '#d97706', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα (Γαλλικά/Γερμανικά)', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#c026d3', difficulty: 2, isSplit: true, splitType: 'foreign_lang_2' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#4338ca', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#0f766e', difficulty: 1 },
      { id: 'pliroforiki', name: 'Πληροφορική', short: 'ΠΛΗΡ', hours: 2, branch: 'ΠΕ86', color: '#475569', difficulty: 2, room: 'room_cs' },
      { id: 'texnologia', name: 'Τεχνολογία', short: 'ΤΕΧ', hours: 1, branch: 'ΠΕ81-84', color: '#b45309', difficulty: 1, room: 'room_tech' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'Όλοι', color: '#65a30d', difficulty: 1 },
    ],
    'Γ': [
      { id: 'ne_glossa', name: 'Νεοελληνική Γλώσσα & Γραμματεία', short: 'ΝΕ.ΓΛ', hours: 4, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'arxaia', name: 'Αρχαία Ελληνική Γλώσσα & Γραμματεία', short: 'ΑΡΧ', hours: 3, branch: 'ΠΕ02', color: '#4f46e5', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 3, room: 'room_sci' },
      { id: 'ximeia', name: 'Χημεία', short: 'ΧΗΜ', hours: 1, branch: 'ΠΕ04.02', color: '#0ea5e9', difficulty: 2, room: 'room_sci' },
      { id: 'viologia', name: 'Βιολογία', short: 'ΒΙΟ', hours: 1, branch: 'ΠΕ04.04', color: '#16a34a', difficulty: 2, room: 'room_sci' },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ02', color: '#d97706', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα (Γαλλικά/Γερμανικά)', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#c026d3', difficulty: 2, isSplit: true, splitType: 'foreign_lang_2' },
      { id: 'kpa', name: 'Κοινωνική & Πολιτική Αγωγή', short: 'ΚΠΑ', hours: 2, branch: 'ΠΕ78', color: '#7c3aed', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#4338ca', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#0f766e', difficulty: 1 },
      { id: 'pliroforiki', name: 'Πληροφορική', short: 'ΠΛΗΡ', hours: 2, branch: 'ΠΕ86', color: '#475569', difficulty: 2, room: 'room_cs' },
      { id: 'texnologia', name: 'Τεχνολογία', short: 'ΤΕΧ', hours: 1, branch: 'ΠΕ81-84', color: '#b45309', difficulty: 1, room: 'room_tech' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'Όλοι', color: '#65a30d', difficulty: 1 },
    ],
  },

  // ── ΓΕΝΙΚΟ ΛΥΚΕΙΟ (ΓΕΛ) (Υ.Α. 43684/Δ2/2026 - ΦΕΚ 2106/Β/2026) ───────────
  gel: {
    'Α': [
      { id: 'ne_glossa', name: 'Νεοελληνική Γλώσσα & Λογοτεχνία', short: 'ΝΕ.ΓΛ', hours: 4, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'arxaia', name: 'Αρχαία Ελληνική Γλώσσα & Γραμματεία', short: 'ΑΡΧ', hours: 5, branch: 'ΠΕ02', color: '#4f46e5', difficulty: 3 },
      { id: 'algebra', name: 'Άλγεβρα', short: 'ΑΛΓ', hours: 3, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'geometria', name: 'Γεωμετρία', short: 'ΓΕΩΜ', hours: 2, branch: 'ΠΕ03', color: '#10b981', difficulty: 3 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 3, room: 'room_sci' },
      { id: 'ximeia', name: 'Χημεία', short: 'ΧΗΜ', hours: 2, branch: 'ΠΕ04.02', color: '#0ea5e9', difficulty: 2, room: 'room_sci' },
      { id: 'viologia', name: 'Βιολογία', short: 'ΒΙΟ', hours: 2, branch: 'ΠΕ04.04', color: '#16a34a', difficulty: 2, room: 'room_sci' },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ02', color: '#d97706', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα (Γαλλικά/Γερμανικά)', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#c026d3', difficulty: 2, isSplit: true, splitType: 'foreign_lang_2' },
      { id: 'politiki_paideia', name: 'Πολιτική Παιδεία', short: 'ΠΟΛ.ΠΑΙΔ', hours: 2, branch: 'ΠΕ78/ΠΕ80', color: '#6366f1', difficulty: 2 },
      { id: 'pliroforiki', name: 'Εφαρμογές Πληροφορικής', short: 'ΕΦ.ΠΛΗΡ', hours: 2, branch: 'ΠΕ86', color: '#475569', difficulty: 2, room: 'room_cs' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
    ],
    'Β': [
      // Κοινά Γενικής Παιδείας (30 ώρες)
      { id: 'ne_glossa', name: 'Νεοελληνική Γλώσσα & Λογοτεχνία', short: 'ΝΕ.ΓΛ', hours: 4, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'arxaia', name: 'Αρχαία Ελληνικά Γενικής', short: 'ΑΡΧ.ΓΕΝ', hours: 2, branch: 'ΠΕ02', color: '#4f46e5', difficulty: 2 },
      { id: 'algebra', name: 'Άλγεβρα', short: 'ΑΛΓ', hours: 3, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'geometria', name: 'Γεωμετρία', short: 'ΓΕΩΜ', hours: 2, branch: 'ΠΕ03', color: '#10b981', difficulty: 3 },
      { id: 'viologia', name: 'Βιολογία', short: 'ΒΙΟ', hours: 2, branch: 'ΠΕ04.04', color: '#16a34a', difficulty: 2, room: 'room_sci' },
      { id: 'fysiki', name: 'Φυσική Γενικής', short: 'ΦΥΣ.ΓΕΝ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 2, room: 'room_sci' },
      { id: 'ximeia', name: 'Χημεία Γενικής', short: 'ΧΗΜ.ΓΕΝ', hours: 2, branch: 'ΠΕ04.02', color: '#0ea5e9', difficulty: 2, room: 'room_sci' },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ02', color: '#d97706', difficulty: 2 },
      { id: 'filosofia', name: 'Φιλοσοφία', short: 'ΦΙΛ', hours: 2, branch: 'ΠΕ02', color: '#9333ea', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα', short: '2ηΞΓ', hours: 1, branch: 'ΠΕ05/ΠΕ07', color: '#c026d3', difficulty: 2 },
      { id: 'eisagogi_hy', name: 'Εισαγωγή στις Αρχές της Επ. Η/Υ', short: 'ΕΙΣ.ΗΥ', hours: 2, branch: 'ΠΕ86', color: '#475569', difficulty: 2, room: 'room_cs' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      // Ομάδες Προσανατολισμού (5 ώρες): Ανθρωπιστικών vs Θετικών
      { id: 'omades_prosanatolismou_v', name: 'Ομάδες Προσανατολισμού (Ανθρωπιστικών / Θετικών)', short: 'ΟΜ.ΠΡΟΣ', hours: 5, branch: 'ΠΕ02/ΠΕ03', color: '#e11d48', difficulty: 3, isSplit: true, splitType: 'orientation_v' },
    ],
    'Γ': [
      // Κοινά Γενικής Παιδείας (14 ώρες)
      { id: 'ne_glossa', name: 'Νεοελληνική Γλώσσα & Λογοτεχνία', short: 'ΝΕ.ΓΛ', hours: 6, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'math_gen', name: 'Μαθηματικά Γενικής', short: 'ΜΑΘ.ΓΕΝ', hours: 2, branch: 'ΠΕ03', color: '#059669', difficulty: 2 },
      { id: 'istoria_gen', name: 'Ιστορία Γενικής', short: 'ΙΣΤ.ΓΕΝ', hours: 2, branch: 'ΠΕ02', color: '#d97706', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 1, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      // Ομάδες Προσανατολισμού Γ' Λυκείου (18 ώρες)
      // Ανθρωπιστικών / Θετικών-Υγείας / Οικονομίας-Πληροφορικής
      { id: 'omades_prosanatolismou_g', name: 'Ομάδες Προσανατολισμού Γ΄ Λυκείου (3x6 ώρες)', short: 'ΟΜ.ΠΡΟΣ.Γ', hours: 18, branch: 'ΠΕ02/ΠΕ03/ΠΕ04/ΠΕ86/ΠΕ80', color: '#e11d48', difficulty: 3, isSplit: true, splitType: 'orientation_g' },
      { id: 'epilogi', name: 'Μάθημα Επιλογής / Ενίσχυσης', short: 'ΕΠΙΛ', hours: 1, branch: 'Διάφοροι', color: '#64748b', difficulty: 1 },
    ],
  },

  // ── ΕΠΑΛ (Ν. 4386/2016 & Ν. 5128/2024) ────────────────────────────────────
  epal: {
    'Α': [
      // 22 ώρες Γενικής Παιδείας
      { id: 'ne_glossa', name: 'Νέα Ελληνικά', short: 'ΝΕ.ΕΛΛ', hours: 4, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'algebra', name: 'Άλγεβρα', short: 'ΑΛΓ', hours: 3, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'geometria', name: 'Γεωμετρία', short: 'ΓΕΩΜ', hours: 1, branch: 'ΠΕ03', color: '#10b981', difficulty: 2 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 2, room: 'room_sci' },
      { id: 'ximeia', name: 'Χημεία', short: 'ΧΗΜ', hours: 1, branch: 'ΠΕ04.02', color: '#0ea5e9', difficulty: 2, room: 'room_sci' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      { id: 'politiki_paideia', name: 'Πολιτική Παιδεία', short: 'ΠΟΛ.ΠΑΙΔ', hours: 2, branch: 'ΠΕ78', color: '#6366f1', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'pliroforiki', name: 'Πληροφορική', short: 'ΠΛΗΡ', hours: 2, branch: 'ΠΕ86', color: '#475569', difficulty: 2, room: 'room_cs' },
      // 6 ώρες Προσανατολισμού
      { id: 'ereunitiki_ergasia', name: 'Ερευνητική Εργασία στην Τεχνολογία', short: 'ΕΡΕΥΝ.ΤΕΧ', hours: 2, branch: 'ΠΕ81-89', color: '#b45309', difficulty: 1 },
      { id: 'zdd', name: 'Ζώνη Δημιουργικών Δραστηριοτήτων', short: 'ΖΔΔ', hours: 2, branch: 'Όλοι', color: '#65a30d', difficulty: 1 },
      { id: 'sep', name: 'Σ.Ε.Π. (Σχολικός Προσανατολισμός)', short: 'ΣΕΠ', hours: 2, branch: 'Όλοι', color: '#ea580c', difficulty: 1 },
      // 6 ώρες Μαθήματα Επιλογής Τομέων (3x2)
      { id: 'epilogi_tomeon', name: 'Μαθήματα Επιλογής Τομέων (3x2 ώρες)', short: 'ΕΠΙΛ.ΤΟΜ', hours: 6, branch: 'ΠΕ81-89', color: '#d97706', difficulty: 2, room: 'room_tech' },
    ],
    'Β': [
      // 12 ώρες Γενικής Παιδείας
      { id: 'ne_glossa', name: 'Νέα Ελληνικά', short: 'ΝΕ.ΕΛΛ', hours: 3, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'algebra', name: 'Άλγεβρα', short: 'ΑΛΓ', hours: 2, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'geometria', name: 'Γεωμετρία', short: 'ΓΕΩΜ', hours: 1, branch: 'ΠΕ03', color: '#10b981', difficulty: 2 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 2, room: 'room_sci' },
      { id: 'ximeia', name: 'Χημεία', short: 'ΧΗΜ', hours: 1, branch: 'ΠΕ04.02', color: '#0ea5e9', difficulty: 2, room: 'room_sci' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 1, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 1, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      // 23 ώρες Μαθήματα Τομέα (Θεωρία + Εργαστήρια Ε.Κ.)
      { id: 'mathimata_tomea', name: 'Μαθήματα Τομέα (Θεωρία + Εργαστήρια)', short: 'ΤΟΜΕΑΣ', hours: 23, branch: 'ΠΕ81-89/ΤΕ01/ΔΕ01', color: '#b45309', difficulty: 3, isSplit: true, splitType: 'epal_sector', room: 'room_tech' },
    ],
    'Γ': [
      // 12 ώρες Γενικής Παιδείας
      { id: 'ne_glossa', name: 'Νέα Ελληνικά', short: 'ΝΕ.ΕΛΛ', hours: 3, branch: 'ΠΕ02', color: '#2563eb', difficulty: 3 },
      { id: 'algebra', name: 'Άλγεβρα', short: 'ΑΛΓ', hours: 3, branch: 'ΠΕ03', color: '#059669', difficulty: 3 },
      { id: 'fysiki', name: 'Φυσική', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ04.01', color: '#0284c7', difficulty: 2, room: 'room_sci' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 1, branch: 'ΠΕ06', color: '#0891b2', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 1, branch: 'ΠΕ11', color: '#db2777', difficulty: 1, room: 'room_gym' },
      { id: 'thriskeutika', name: 'Θρησκευτικά / Ηθική', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ01', color: '#7c3aed', difficulty: 1 },
      { id: 'eidiko_mathima', name: 'Ειδικό Μάθημα / Επιλογής', short: 'ΕΙΔΙΚΟ', hours: 1, branch: 'Όλοι', color: '#64748b', difficulty: 1 },
      // 23 ώρες Μαθήματα Ειδικότητας (Θεωρία + Εργαστήρια Ε.Κ.)
      { id: 'mathimata_eidikotitas', name: 'Μαθήματα Ειδικότητας (Θεωρία + Εργαστήρια)', short: 'ΕΙΔΙΚΟΤ', hours: 23, branch: 'ΠΕ81-89/ΤΕ01/ΔΕ01', color: '#c2410c', difficulty: 3, isSplit: true, splitType: 'epal_specialty', room: 'room_tech' },
    ],
  },
};
