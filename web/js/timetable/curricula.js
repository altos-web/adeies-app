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
  primary_oligothesia: [
    { period: 1, start: '08:15', end: '09:00', label: '1η ώρα' },
    { period: 2, start: '09:05', end: '09:45', label: '2η ώρα' },
    { period: 3, start: '10:00', end: '10:45', label: '3η ώρα' },
    { period: 4, start: '11:00', end: '11:45', label: '4η ώρα' },
    { period: 5, start: '11:55', end: '12:35', label: '5η ώρα' },
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

// Λειτουργικότητα Δημοτικών Σχολείων βάσει νομοθεσίας (ΥΑ 83939/Δ1/19-5-2017 & Π.Δ. 79/2017)
export const DIMOTIKO_ORGANICITIES = {
  '6th_plus': {
    id: '6th_plus',
    name: '6/θέσιο & άνω (Ενιαίου Τύπου — 30 ώρ./εβδ., 6 αυτόνομα τμήματα Α-ΣΤ)',
    shortName: '6/θέσιο & άνω',
    periodsPerDay: 6,
    grades: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'],
    defaultClasses: [
      { id: 'c_a1', name: 'Α1', grade: 'Α', grades: ['Α'] },
      { id: 'c_b1', name: 'Β1', grade: 'Β', grades: ['Β'] },
      { id: 'c_g1', name: 'Γ1', grade: 'Γ', grades: ['Γ'] },
      { id: 'c_d1', name: 'Δ1', grade: 'Δ', grades: ['Δ'] },
      { id: 'c_e1', name: 'Ε1', grade: 'Ε', grades: ['Ε'] },
      { id: 'c_st1', name: 'ΣΤ1', grade: 'ΣΤ', grades: ['ΣΤ'] },
    ],
    bell: 'primary',
  },
  '1th': {
    id: '1th',
    name: '1/θέσιο (Μονοθέσιο — 25 ώρ./εβδ., 1 τμήμα συνδιδασκαλίας Α-ΣΤ)',
    shortName: '1/θέσιο (Μονοθέσιο)',
    periodsPerDay: 5,
    grades: ['Α_ΣΤ'],
    defaultClasses: [
      { id: 'c_all', name: 'Α-ΣΤ', grade: 'Α_ΣΤ', grades: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'] },
    ],
    bell: 'primary_oligothesia',
  },
  '2th': {
    id: '2th',
    name: '2/θέσιο (Διθέσιο — 25 ώρ./εβδ., 2 τμήματα: Α-Β-Γ & Δ-Ε-ΣΤ)',
    shortName: '2/θέσιο (Διθέσιο)',
    periodsPerDay: 5,
    grades: ['Α_Γ', 'Δ_ΣΤ'],
    defaultClasses: [
      { id: 'c_t1', name: 'Α-Β-Γ', grade: 'Α_Γ', grades: ['Α', 'Β', 'Γ'] },
      { id: 'c_t2', name: 'Δ-Ε-ΣΤ', grade: 'Δ_ΣΤ', grades: ['Δ', 'Ε', 'ΣΤ'] },
    ],
    bell: 'primary_oligothesia',
  },
  '3th': {
    id: '3th',
    name: '3/θέσιο (Τριθέσιο — 25 ώρ./εβδ., 3 τμήματα: Α-Β, Γ-Δ, Ε-ΣΤ)',
    shortName: '3/θέσιο (Τριθέσιο)',
    periodsPerDay: 5,
    grades: ['Α_Β', 'Γ_Δ', 'Ε_ΣΤ'],
    defaultClasses: [
      { id: 'c_t1', name: 'Α-Β', grade: 'Α_Β', grades: ['Α', 'Β'] },
      { id: 'c_t2', name: 'Γ-Δ', grade: 'Γ_Δ', grades: ['Γ', 'Δ'] },
      { id: 'c_t3', name: 'Ε-ΣΤ', grade: 'Ε_ΣΤ', grades: ['Ε', 'ΣΤ'] },
    ],
    bell: 'primary_oligothesia',
  },
  '4th': {
    id: '4th',
    name: '4/θέσιο (30 ώρ./εβδ., 4 τμήματα: Α, Β, Γ-Δ, Ε-ΣΤ)',
    shortName: '4/θέσιο',
    periodsPerDay: 6,
    grades: ['Α', 'Β', 'Γ_Δ', 'Ε_ΣΤ'],
    defaultClasses: [
      { id: 'c_a', name: 'Α1', grade: 'Α', grades: ['Α'] },
      { id: 'c_b', name: 'Β1', grade: 'Β', grades: ['Β'] },
      { id: 'c_gd', name: 'Γ-Δ', grade: 'Γ_Δ', grades: ['Γ', 'Δ'] },
      { id: 'c_est', name: 'Ε-ΣΤ', grade: 'Ε_ΣΤ', grades: ['Ε', 'ΣΤ'] },
    ],
    bell: 'primary',
  },
  '5th': {
    id: '5th',
    name: '5/θέσιο (30 ώρ./εβδ., 5 τμήματα: Α, Β, Γ, Δ, Ε-ΣΤ)',
    shortName: '5/θέσιο',
    periodsPerDay: 6,
    grades: ['Α', 'Β', 'Γ', 'Δ', 'Ε_ΣΤ'],
    defaultClasses: [
      { id: 'c_a', name: 'Α1', grade: 'Α', grades: ['Α'] },
      { id: 'c_b', name: 'Β1', grade: 'Β', grades: ['Β'] },
      { id: 'c_g', name: 'Γ1', grade: 'Γ', grades: ['Γ'] },
      { id: 'c_d', name: 'Δ1', grade: 'Δ', grades: ['Δ'] },
      { id: 'c_est', name: 'Ε-ΣΤ', grade: 'Ε_ΣΤ', grades: ['Ε', 'ΣΤ'] },
    ],
    bell: 'primary',
  },
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
    // ── Ολιγοθέσια Τμήματα Συνδιδασκαλίας (ΥΑ 83939/Δ1/19-5-2017) ─────────
    'Α_ΣΤ': [ // 1/θέσιο: Όλες οι τάξεις σε ενιαίο τμήμα (25 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα (Συνδιδασκαλία)', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά (Συνδιδασκαλία)', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'meleti_fysika', name: 'Μελέτη Περιβάλλοντος / Φυσικά', short: 'ΜΕΛ.ΦΥΣ', hours: 3, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Α_Γ': [ // 2/θέσιο - Τμήμα 1: Α-Β-Γ (25 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 8, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 3, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 1, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Δ_ΣΤ': [ // 2/θέσιο - Τμήμα 2: Δ-Ε-ΣΤ (25 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'fysika', name: 'Φυσικά / Μελέτη Περιβάλλοντος', short: 'ΦΥΣ', hours: 3, branch: 'ΠΕ70', color: '#0284c7', difficulty: 3 },
      { id: 'geografia_kpa', name: 'Γεωγραφία / ΚΠΑ', short: 'ΓΕΩ.ΚΠΑ', hours: 1, branch: 'ΠΕ70', color: '#14b8a6', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα', short: '2ηΞΓ', hours: 1, branch: 'ΠΕ05/ΠΕ07', color: '#d946ef', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'texnes', name: 'Μουσική / Εικαστικά', short: 'ΤΕΧΝ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
    ],
    'Α_Β': [ // 3/θέσιο - Τμήμα 1: Α-Β (25 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 8, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 3, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 2, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Γ_Δ': [ // 3/θέσιο / 4/θέσιο - Τμήμα Γ-Δ (25-26 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 2, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Ε_ΣΤ': [ // 3/θέσιο / 4/θέσιο - Τμήμα Ε-ΣΤ (25-26 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'fysika', name: 'Φυσικά', short: 'ΦΥΣ', hours: 2, branch: 'ΠΕ70', color: '#0284c7', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2 },
      { id: 'geografia_kpa', name: 'Γεωγραφία / ΚΠΑ', short: 'ΓΕΩ.ΚΠΑ', hours: 1, branch: 'ΠΕ70', color: '#14b8a6', difficulty: 2 },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1 },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 2, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'xeni_glossa_2', name: '2η Ξένη Γλώσσα', short: '2ηΞΓ', hours: 2, branch: 'ΠΕ05/ΠΕ07', color: '#d946ef', difficulty: 2 },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 2, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'texnes', name: 'Μουσική / Εικαστικά', short: 'ΤΕΧΝ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
    ],
    // ── 4/θέσιο & 5/θέσιο (Ενιαίου Τύπου — 30 ώρες/εβδ, 6ωρο καθημερινά) ────
    'Γ_Δ_30h': [ // 4/θέσιο - Τμήμα Γ-Δ (30 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 8, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά (Άμεση Διδασκαλία & Αυτενέργεια)', short: 'ΜΑΘ', hours: 5, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2, isCycleSubject: true, cycleA: 'Μυθολογία & Προϊστορία (Γ΄)', cycleB: 'Αρχαία Ελλάδα (Δ΄)' },
      { id: 'meleti', name: 'Μελέτη Περιβάλλοντος', short: 'ΜΕΛ', hours: 2, branch: 'ΠΕ70', color: '#f59e0b', difficulty: 2, isCycleSubject: true, cycleA: 'Μελέτη Περιβάλλοντος Γ΄', cycleB: 'Μελέτη Περιβάλλοντος Δ΄' },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 2, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1, isCycleSubject: true, cycleA: 'Θρησκευτικά Γ΄', cycleB: 'Θρησκευτικά Δ΄' },
      { id: 'gymnastiki', name: 'Φυσική Αγωγή', short: 'ΦΥΣ.ΑΓ', hours: 3, branch: 'ΠΕ11', color: '#ec4899', difficulty: 1, room: 'room_gym' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
      { id: 'mousiki', name: 'Μουσική', short: 'ΜΟΥ', hours: 1, branch: 'ΠΕ79.01', color: '#6366f1', difficulty: 1, room: 'room_art' },
      { id: 'eikastika', name: 'Εικαστικά', short: 'ΕΙΚ', hours: 1, branch: 'ΠΕ08', color: '#14b8a6', difficulty: 1 },
      { id: 'theatriki', name: 'Θεατρική Αγωγή', short: 'ΘΕΑ', hours: 1, branch: 'ΠΕ91', color: '#f97316', difficulty: 1 },
      { id: 'tpe', name: 'Τ.Π.Ε. (Πληροφορική)', short: 'ΤΠΕ', hours: 1, branch: 'ΠΕ86', color: '#64748b', difficulty: 1, room: 'room_cs' },
      { id: 'ergastiria_dex', name: 'Εργαστήρια Δεξιοτήτων', short: 'ΕΡΓ.ΔΕΞ', hours: 1, branch: 'ΠΕ70', color: '#84cc16', difficulty: 1 },
    ],
    'Ε_ΣΤ_30h': [ // 4/θέσιο & 5/θέσιο - Τμήμα Ε-ΣΤ (30 ώρες/εβδ)
      { id: 'glossa', name: 'Γλώσσα', short: 'ΓΛΩ', hours: 7, branch: 'ΠΕ70', color: '#3b82f6', difficulty: 3 },
      { id: 'math', name: 'Μαθηματικά (Άμεση Διδασκαλία & Αυτενέργεια)', short: 'ΜΑΘ', hours: 4, branch: 'ΠΕ70', color: '#10b981', difficulty: 3 },
      { id: 'istoria', name: 'Ιστορία', short: 'ΙΣΤ', hours: 2, branch: 'ΠΕ70', color: '#eab308', difficulty: 2, isCycleSubject: true, cycleA: 'Βυζαντινή Ιστορία (Ε΄)', cycleB: 'Νεότερη & Σύγχρονη Ιστορία (ΣΤ΄)' },
      { id: 'fysika', name: 'Φυσικά', short: 'ΦΥΣ', hours: 3, branch: 'ΠΕ70', color: '#0284c7', difficulty: 3, isCycleSubject: true, cycleA: 'Φυσικά Ε΄', cycleB: 'Φυσικά ΣΤ΄' },
      { id: 'geografia', name: 'Γεωγραφία', short: 'ΓΕΩ', hours: 1, branch: 'ΠΕ70', color: '#14b8a6', difficulty: 2, isCycleSubject: true, cycleA: 'Γεωγραφία Ελλάδας (Ε΄)', cycleB: 'Ήπειροι & Παγκόσμια Γεωγραφία (ΣΤ΄)' },
      { id: 'kpa', name: 'Κοινωνική & Πολιτική Αγωγή', short: 'ΚΠΑ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1, isCycleSubject: true, cycleA: 'Κοινωνική & Πολιτική Αγωγή Ε΄', cycleB: 'Κοινωνική & Πολιτική Αγωγή ΣΤ΄' },
      { id: 'thriskeutika', name: 'Θρησκευτικά', short: 'ΘΡΗ', hours: 1, branch: 'ΠΕ70', color: '#8b5cf6', difficulty: 1, isCycleSubject: true, cycleA: 'Θρησκευτικά Ε΄', cycleB: 'Θρησκευτικά ΣΤ΄' },
      { id: 'agglika', name: 'Αγγλικά', short: 'ΑΓΓ', hours: 3, branch: 'ΠΕ06', color: '#06b6d4', difficulty: 2 },
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

// Aliases για ολιγοθέσια τμήματα συνδιδασκαλίας Δημοτικού
CURRICULA.dimotiko['Α_Β_Γ'] = CURRICULA.dimotiko['Α_Γ'];
CURRICULA.dimotiko['Δ_Ε_ΣΤ'] = CURRICULA.dimotiko['Δ_ΣΤ'];
CURRICULA.dimotiko['Α_Β_Γ_Δ_Ε_ΣΤ'] = CURRICULA.dimotiko['Α_ΣΤ'];

// ── Επίσημη Κατηγοριοποίηση Κλάδων Εκπαιδευτικών ανά Βαθμίδα Σχολείου ──────
// Βάσει του ελληνικού νομοθετικού πλαισίου:
// 1. Πρωτοβάθμια (Δημοτικό): Αποκλειστικά ΠΕ70/ΠΕ71 και οι κοινές ειδικότητες.
// 2. Δευτεροβάθμια (Γυμνάσιο/ΓΕΛ/ΕΠΑΛ): Ποτέ ΠΕ70/ΠΕ60. Περιλαμβάνει καθηγητές ειδικοτήτων και τεχνικούς κλάδους.
// 3. Κοινές Ειδικότητες: Διδάσκουν τόσο στην Πρωτοβάθμια όσο και στη Δευτεροβάθμια Εκπαίδευση.
export const TEACHER_BRANCHES = {
  // Αποκλειστικοί κλάδοι Δημοτικού Σχολείου (Πρωτοβάθμια)
  dimotiko_only: [
    { code: 'ΠΕ70', label: 'ΠΕ70 - Δάσκαλοι' },
    { code: 'ΠΕ71', label: 'ΠΕ71 - Δάσκαλοι Ειδικής Αγωγής (ΕΑΕ)' },
  ],

  // Κοινές Ειδικότητες (διδάσκουν και στο Δημοτικό και στη Δευτεροβάθμια)
  common: [
    { code: 'ΠΕ06', label: 'ΠΕ06 - Αγγλικής Φιλολογίας' },
    { code: 'ΠΕ11', label: 'ΠΕ11 - Φυσικής Αγωγής (Γυμναστές)' },
    { code: 'ΠΕ86', label: 'ΠΕ86 - Πληροφορικής' },
    { code: 'ΠΕ79.01', label: 'ΠΕ79.01 - Μουσικής' },
    { code: 'ΠΕ08', label: 'ΠΕ08 - Εικαστικών / Καλών Τεχνών' },
    { code: 'ΠΕ05', label: 'ΠΕ05 - Γαλλικής Φιλολογίας' },
    { code: 'ΠΕ07', label: 'ΠΕ07 - Γερμανικής Φιλολογίας' },
    { code: 'ΠΕ91.01', label: 'ΠΕ91.01 - Θεατρικής Αγωγής' },
    { code: 'ΠΕ91.02', label: 'ΠΕ91.02 - Δραματικής Τέχνης' },
  ],

  // Δευτεροβάθμια: Γενικής Παιδείας & Θετικών/Θεωρητικών Επιστημών (Γυμνάσιο, ΓΕΛ, ΕΠΑΛ)
  secondary_general: [
    { code: 'ΠΕ01', label: 'ΠΕ01 - Θεολόγοι' },
    { code: 'ΠΕ02', label: 'ΠΕ02 - Φιλόλογοι' },
    { code: 'ΠΕ03', label: 'ΠΕ03 - Μαθηματικοί' },
    { code: 'ΠΕ04.01', label: 'ΠΕ04.01 - Φυσικοί' },
    { code: 'ΠΕ04.02', label: 'ΠΕ04.02 - Χημικοί' },
    { code: 'ΠΕ04.04', label: 'ΠΕ04.04 - Βιολόγοι' },
    { code: 'ΠΕ04.05', label: 'ΠΕ04.05 - Γεωλόγοι' },
    { code: 'ΠΕ78', label: 'ΠΕ78 - Κοινωνικών Επιστημών' },
    { code: 'ΠΕ80', label: 'ΠΕ80 - Οικονομίας' },
    { code: 'ΠΕ34', label: 'ΠΕ34 - Ιταλικής Φιλολογίας' },
  ],

  // ΕΠΑΛ / Τεχνολογικοί και Εργαστηριακοί Κλάδοι
  epal_vocational: [
    { code: 'ΠΕ81', label: 'ΠΕ81 - Πολιτικών Μηχανικών / Αρχιτεκτόνων' },
    { code: 'ΠΕ82', label: 'ΠΕ82 - Μηχανολόγων' },
    { code: 'ΠΕ83', label: 'ΠΕ83 - Ηλεκτρολόγων' },
    { code: 'ΠΕ84', label: 'ΠΕ84 - Ηλεκτρονικών' },
    { code: 'ΠΕ85', label: 'ΠΕ85 - Χημικών Μηχανικών' },
    { code: 'ΠΕ87.01', label: 'ΠΕ87.01 - Ιατρικής' },
    { code: 'ΠΕ87.02', label: 'ΠΕ87.02 - Νοσηλευτικής' },
    { code: 'ΠΕ88.01', label: 'ΠΕ88.01 - Γεωπόνοι' },
    { code: 'ΠΕ89.01', label: 'ΠΕ89.01 - Εφαρμοσμένων Τεχνών' },
    { code: 'ΤΕ01', label: 'ΤΕ01 - Τεχνολόγοι Εργαστηρίων' },
    { code: 'ΔΕ01', label: 'ΔΕ01 - Εκπαιδευτικοί Εργαστηρίων' },
  ],
};

// Επιστρέφει τις έγκυρες ειδικότητες για συγκεκριμένο τύπο σχολείου
export function getBranchesForSchoolType(schoolType) {
  if (schoolType === 'dimotiko') {
    return [
      ...TEACHER_BRANCHES.dimotiko_only,
      ...TEACHER_BRANCHES.common,
    ];
  }
  if (schoolType === 'gymnasio') {
    return [
      ...TEACHER_BRANCHES.secondary_general,
      ...TEACHER_BRANCHES.common,
      { code: 'ΠΕ82', label: 'ΠΕ82 - Μηχανολόγων (Τεχνολογία)' },
      { code: 'ΠΕ83', label: 'ΠΕ83 - Ηλεκτρολόγων (Τεχνολογία)' },
      { code: 'ΠΕ88.01', label: 'ΠΕ88.01 - Γεωπονίας (Τεχνολογία)' },
    ];
  }
  if (schoolType === 'gel') {
    return [
      ...TEACHER_BRANCHES.secondary_general,
      ...TEACHER_BRANCHES.common.filter((b) => !b.code.startsWith('ΠΕ91')),
    ];
  }
  if (schoolType === 'epal') {
    return [
      ...TEACHER_BRANCHES.secondary_general,
      ...TEACHER_BRANCHES.common.filter((b) => !b.code.startsWith('ΠΕ91')),
      ...TEACHER_BRANCHES.epal_vocational,
    ];
  }
  return [
    ...TEACHER_BRANCHES.secondary_general,
    ...TEACHER_BRANCHES.common,
  ];
}

// Ελέγχει αν ένας κλάδος είναι συμβατός με τον τύπο σχολείου
export function isBranchValidForSchoolType(branchCode, schoolType) {
  if (!branchCode) return true;
  const b = String(branchCode).trim().toUpperCase();

  if (schoolType === 'dimotiko') {
    // Στο Δημοτικό επιτρέπονται ΜΟΝΟ ΠΕ70/ΠΕ71 και οι κοινές ειδικότητες
    // ΠΟΤΕ ΠΕ01, ΠΕ02, ΠΕ03, ΠΕ04, ΠΕ78, ΠΕ80, ΠΕ81-89
    const allowedPrefixes = ['ΠΕ70', 'ΠΕ71', 'ΠΕ06', 'ΠΕ11', 'ΠΕ86', 'ΠΕ79', 'ΠΕ08', 'ΠΕ05', 'ΠΕ07', 'ΠΕ91'];
    return allowedPrefixes.some((p) => b.startsWith(p));
  }

  // Στη Δευτεροβάθμια (Γυμνάσιο, ΓΕΛ, ΕΠΑΛ) ΠΟΤΕ ΠΕ70 (δάσκαλοι) ή ΠΕ60 (νηπιαγωγοί)
  if (b.startsWith('ΠΕ70') || b.startsWith('ΠΕ71') || b.startsWith('ΠΕ60')) {
    return false;
  }

  return true;
}

