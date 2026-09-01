// Ό,τι υπολογίζεται αντί να ζητηθεί: φύλο, πλήθος ημερών, ονοματεπώνυμο, λήξη.
//
// Ακριβές αντίστοιχο της derive() στο scripts/render.py — οι πίνακες (φύλο, ενικός/
// πληθυντικός, ολογράφως) έρχονται από τα ίδια αρχεία Python μέσω config.json.
//
// Κανόνας παντού: το παράγωγο μπαίνει **μόνο αν το πεδίο είναι κενό**. Ό,τι έγραψε ο
// διευθυντής υπερισχύει, γιατί η αυτόματη τιμή είναι πρόταση και όχι κλείδωμα.

import { config } from './catalog.js';

// Σημάδι επιλογής. Όχι «✔»: η Verdana των εντύπων δεν έχει το glyph.
const CHECK = 'Χ';

const SXESI_ERGASIAS = [
  'check_plirous', 'check_espa_plirous', 'check_espa_amo', 'check_oromisthios',
  'check_monimos_apospasmenos', 'check_monimos_diathesi', 'check_monimos_organiki',
  'check_diathesi_plires', 'check_diathesi_meriki', 'check_idax',
];

const FEMALE = new Set(['Γ', 'ΘΗΛΥ', 'F']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const blank = (v) => v === undefined || v === null || String(v).trim() === '';

function count(value) {
  const n = parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function parseDate(value) {
  const text = String(value ?? '').trim();
  if (ISO_DATE.test(text)) return new Date(`${text}T00:00:00`);
  const greek = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (greek) return new Date(`${greek[3]}-${greek[2]}-${greek[1]}T00:00:00`);
  return null;
}

const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Λήξη με περιληπτική μέτρηση: η πρώτη ημέρα μετράει. 15/04 για 2 ημέρες → 16/04.
// Με workingOnly αγνοούνται Σάββατο και Κυριακή, όπως ορίζουν τα έντυπα που λένε
// «εργάσιμων ημερών». Οι αργίες δεν καλύπτονται — γι' αυτό η λήξη μένει επεξεργάσιμη.
export function endDate(start, days, workingOnly) {
  if (!start || !days || days < 1) return null;
  const current = new Date(start);
  if (!workingOnly) {
    current.setDate(current.getDate() + days - 1);
    return current;
  }
  while (current.getDay() === 0 || current.getDay() === 6) {
    current.setDate(current.getDate() + 1);
  }
  let remaining = days;
  while (remaining > 1) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() !== 0 && current.getDay() !== 6) remaining -= 1;
  }
  return current;
}

export function derive(data) {
  const { gender, count: countTags, olografos } = config();
  const out = { ...data };

  const female = FEMALE.has(String(data.fylo ?? '').trim().toUpperCase());
  for (const [tag, [male, fem]] of Object.entries(gender)) {
    if (blank(out[tag])) out[tag] = female ? fem : male;
  }

  const days = count(data.imeres_arithmitika);
  for (const [tag, [singular, plural]] of Object.entries(countTags)) {
    if (blank(out[tag])) out[tag] = days === 1 ? singular : plural;
  }

  if (blank(out.onomateponymo)) {
    out.onomateponymo = [data.eponymo, data.onoma].filter((p) => !blank(p)).join(' ');
  }
  if (blank(out.dieuthinsi_katoikias)) {
    out.dieuthinsi_katoikias = [data.odos, data.arithmos_katoikias]
      .filter((p) => !blank(p)).join(' ');
  }

  if (blank(out.imeres_olografos) && olografos[days]) out.imeres_olografos = olografos[days];
  if (days !== null) {
    out.imeres_arithmitika = String(days).padStart(2, '0');
    if (blank(out.imeres_plithos)) out.imeres_plithos = String(days); // «3/ήμερης»
  }

  const start = parseDate(data.imerominia_apo);
  if (blank(out.imerominia_eos)) {
    const finish = endDate(start, days, Boolean(data.ergasimes));
    if (finish) out.imerominia_eos = toIso(finish);
  }
  if (blank(out.imerominia_stis) && start) out.imerominia_stis = toIso(start);

  if (blank(out.topos)) out.topos = data.nomos_on ?? '';

  // «2026-2027» → «2026»: τα έντυπα υπηρεσιακής εκπαίδευσης μετρούν προϋπηρεσία
  // μέχρι την 31η Αυγούστου που άνοιξε το τρέχον σχολικό έτος.
  if (blank(out.etos_anaforas)) {
    out.etos_anaforas = (data.sxoliko_etos ?? '').split(/[-–\/]/)[0].trim();
  }

  for (const tag of SXESI_ERGASIAS) out[tag] = '';
  const key = `check_${data.sxesi_ergasias}`;
  if (SXESI_ERGASIAS.includes(key)) out[key] = CHECK;

  return out;
}

// Οι ημερομηνίες στα έντυπα γράφονται 15/04/2026, όχι 2026-04-15.
export function formatDates(data) {
  const out = { ...data };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === 'string' && ISO_DATE.test(value)) {
      const [y, m, d] = value.split('-');
      out[key] = `${d}/${m}/${y}`;
    }
  }
  return out;
}

// Οι υπολογισμένες τιμές που δείχνει η φόρμα ως υπόδειξη, χωρίς να τις γράφει.
// Με ελληνική μορφή ημερομηνίας, όπως θα τυπωθούν.
export function suggestions(data) {
  const full = formatDates(derive(data));
  const out = {};
  for (const tag of ['onomateponymo', 'dieuthinsi_katoikias', 'imeres_olografos',
                     'imeres_plithos', 'imerominia_eos', 'imerominia_stis', 'topos',
                     'etos_anaforas']) {
    if (blank(data[tag]) && !blank(full[tag])) out[tag] = full[tag];
  }
  return out;
}
