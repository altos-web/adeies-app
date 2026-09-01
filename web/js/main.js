import * as cat from './catalog.js';
import { derive, formatDates, suggestions } from './derive.js';
import { fillDocx } from './fill.js';
import { buildForm, refreshPlaceholders, selectField, toggleField } from './forms.js';
import { debounce, documentFilename, download } from './output.js';
import { store } from './store.js';

const $ = (selector) => document.querySelector(selector);

const SXESI = {
  monimos: [
    ['monimos_organiki', 'Μόνιμος σε οργανική'],
    ['monimos_apospasmenos', 'Μόνιμος αποσπασμένος'],
    ['monimos_diathesi', 'Μόνιμος στη διάθεση'],
    ['diathesi_plires', 'Διάθεση από Β/θμια, πλήρης'],
    ['diathesi_meriki', 'Διάθεση από Β/θμια, μερική'],
    ['idax', 'ΙΔΑΧ'],
  ],
  anapliromatis: [
    ['plirous', 'Αναπληρωτής πλήρους ωραρίου'],
    ['espa_plirous', 'Αναπληρωτής ΕΣΠΑ πλήρους'],
    ['espa_amo', 'Αναπληρωτής ΕΣΠΑ ΑΜΩ'],
    ['oromisthios', 'Ωρομίσθιος'],
  ],
};

// Πεδία που τροφοδοτούν παράγωγα: μένουν πάντα ορατά, ακόμη κι αν κανένα έντυπο
// δεν τα ζητά απευθείας.
const DERIVED_SOURCES = new Set([
  'eponymo', 'onoma', 'odos', 'arithmos_katoikias',
  'imeres_arithmitika', 'imerominia_apo', 'nomos_on',
]);

const state = {
  category: 'monimoi',
  leaveType: null,
  employeeId: null,
  docKind: 'aitisi',
  leaveData: {},
};


// Χωρίζει τα πεδία σε τρεις ενότητες: όσα γράφονται, όσα υπολογίζονται, και όσα
// ζητά ένα μόνο έντυπο. Ο κανόνας βγαίνει από τον κατάλογο, δεν είναι γραμμένος.
function splitFields(fields) {
  const usedBy = cat.config().usedBy || {};
  const derived = fields.filter((f) => f.derived);
  const rare = fields.filter((f) => !f.derived && usedBy[f.tag] === 1
    && !DERIVED_SOURCES.has(f.tag));
  const rareTags = new Set(rare.map((f) => f.tag));
  const main = fields.filter((f) => !f.derived && !rareTags.has(f.tag));
  return { main, derived, rare };
}

// Χτίζει φόρμα σε ενότητες· όσες έχουν τίτλο μπαίνουν σε αναδιπλούμενο.
function sectionedForm(container, sections, values, onChange, hints) {
  container.innerHTML = '';
  for (const { fields, label, hint } of sections) {
    if (!fields.length) continue;
    const holder = document.createElement('div');
    buildForm(holder, fields, values, onChange, hints);
    if (!label) {
      container.append(holder);
      continue;
    }
    const details = document.createElement('details');
    details.className = 'more';
    details.append(Object.assign(document.createElement('summary'), {
      textContent: `${label} (${fields.length})`,
    }));
    if (hint) {
      details.append(Object.assign(document.createElement('p'), {
        className: 'hint', textContent: hint,
      }));
    }
    details.append(holder);
    container.append(details);
  }
}

// ── καρτέλα 1: διευθυντής και σχολείο ──────────────────────────────────────
function renderDirector() {
  const panel = $('#tab-director');
  panel.innerHTML = `
    <p class="hint">Συμπληρώνονται μία φορά και μπαίνουν αυτούσια σε κάθε έντυπο.
       Γράψτε τα <strong>με κεφαλαία</strong>.</p>`;
  const values = store.getDirector();
  const fields = [...cat.fieldsOf('ypiresia'), ...cat.fieldsOf('sxoleio')];
  buildForm(panel.appendChild(document.createElement('div')), fields, values, () => {
    store.setDirector(values);
    renderIssuer();
  });
  renderIssuer();
}

// Η κεφαλίδα δείχνει για ποια μονάδα εκδίδονται τα έντυπα — όπως το επιστολόχαρτο
// δείχνει την υπηρεσία που υπογράφει.
function renderIssuer() {
  const d = store.getDirector();
  const parts = [d.sxoleio, [d.vathmida_syntomo, d.nomos_gen].filter(Boolean).join(' ')];
  $('#issuer').textContent = parts.filter(Boolean).join(' · ')
    || 'Δεν έχουν οριστεί στοιχεία σχολείου';
}

// ── καρτέλα 2: εργαζόμενοι ─────────────────────────────────────────────────
function renderEmployees() {
  const panel = $('#tab-employees');
  panel.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'toolbar';
  bar.append(
    button('Νέος εργαζόμενος', 'primary', () => editEmployee({})),
    button('Εξαγωγή σε JSON', '', exportData),
    button('Επαναφορά από JSON', '', importData),
  );
  panel.append(bar);

  const days = store.daysSinceExport();
  if (days > 14) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.textContent = days === Infinity
      ? 'Δεν έχετε κάνει ποτέ εξαγωγή. Ένα καθάρισμα ιστορικού θα έσβηνε τα πάντα.'
      : `Έχουν περάσει ${Math.floor(days)} μέρες από την τελευταία εξαγωγή.`;
    panel.append(warn);
  }

  const employees = store.getEmployees();
  if (!employees.length) {
    panel.append(Object.assign(document.createElement('p'), {
      className: 'hint', textContent: 'Δεν έχει καταχωριστεί κανένας εργαζόμενος.',
    }));
    return;
  }

  const table = document.createElement('table');
  table.className = 'list';
  table.innerHTML = `<thead><tr>
      <th>Ονοματεπώνυμο</th><th>Κλάδος</th><th>Κατηγορία</th><th>Πρόγραμμα</th><th></th>
    </tr></thead>`;
  const body = document.createElement('tbody');
  for (const employee of employees) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(employee.onomateponymo || `${employee.eponymo || ''} ${employee.onoma || ''}`)}</td>
      <td>${escapeHtml(employee.klados || '')}</td>
      <td>${employee.katigoria === 'monimos' ? 'Μόνιμος' : 'Αναπληρωτής'}</td>
      <td>${escapeHtml(cat.programmes()[employee.programma] || '')}</td>`;
    const actions = document.createElement('td');
    actions.className = 'row-actions';
    actions.append(
      button('Επεξεργασία', '', () => editEmployee(employee)),
      button('Διαγραφή', 'danger', () => {
        if (confirm(`Διαγραφή του/της ${employee.onomateponymo || employee.eponymo};`)) {
          store.deleteEmployee(employee.id);
          renderEmployees();
        }
      }),
    );
    row.append(actions);
    body.append(row);
  }
  table.append(body);
  panel.append(table);
}

function editEmployee(employee) {
  const values = { ...employee };
  const dialog = $('#employee-dialog');
  const form = $('#employee-form');
  form.innerHTML = '';

  form.append(selectField('Φύλο', [['Α', 'Άνδρας'], ['Γ', 'Γυναίκα']],
    values.fylo || 'Α', (v) => { values.fylo = v; }));

  const sxesiHolder = document.createElement('div');
  const renderSxesi = () => {
    sxesiHolder.innerHTML = '';
    const options = SXESI[values.katigoria || 'monimos'];
    if (!options.some(([v]) => v === values.sxesi_ergasias)) {
      values.sxesi_ergasias = options[0][0];
    }
    sxesiHolder.append(selectField('Σχέση εργασίας', options, values.sxesi_ergasias,
      (v) => { values.sxesi_ergasias = v; }));

    // Δύο ανεξάρτητοι άξονες: η σχέση εργασίας βάζει το «Χ» μέσα στο έντυπο, το
    // πρόγραμμα διαλέγει ποιο αρχείο ανοίγει — άλλο λογότυπο ΕΣΠΑ σε καθένα.
    if (values.katigoria !== 'anapliromatis') return;
    const list = Object.entries(cat.programmes());
    if (!list.some(([v]) => v === values.programma)) values.programma = list[0][0];
    sxesiHolder.append(selectField('Πρόγραμμα', list, values.programma,
      (v) => { values.programma = v; }, 'ορίζει το λογότυπο ΕΣΠΑ των εντύπων'));
  };

  form.append(selectField('Κατηγορία', [['monimos', 'Μόνιμος'], ['anapliromatis', 'Αναπληρωτής']],
    values.katigoria || 'monimos', (v) => { values.katigoria = v; renderSxesi(); }));
  form.append(sxesiHolder);
  renderSxesi();

  const holder = document.createElement('div');
  form.append(holder);

  const { main, derived, rare } = splitFields(cat.fieldsOf('ekpaideutikos'));
  const draw = () => sectionedForm(holder, [
    { fields: main },
    { fields: derived, label: 'Υπολογίζονται αυτόματα',
      hint: 'Συμπληρώστε τα μόνο αν θέλετε άλλη διατύπωση από την προτεινόμενη.' },
    { fields: rare, label: 'Χρειάζονται σε ένα μόνο έντυπο' },
  ], values, () => refreshPlaceholders(holder, suggestions(values)), suggestions(values));
  draw();

  $('#employee-save').onclick = () => {
    values.katigoria = values.katigoria || 'monimos';
    store.saveEmployee(values);
    dialog.close();
    renderEmployees();
  };
  dialog.showModal();
}

function exportData() {
  const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)],
    { type: 'application/json' });
  download(blob, `adeies-${new Date().toISOString().slice(0, 10)}.json`);
  store.markExported();
  renderEmployees();
}

function importData() {
  const input = Object.assign(document.createElement('input'),
    { type: 'file', accept: 'application/json' });
  input.onchange = async () => {
    try {
      store.importAll(JSON.parse(await input.files[0].text()));
      renderEmployees();
      renderDirector();
      alert('Τα δεδομένα επαναφέρθηκαν.');
    } catch (error) {
      alert(`Η επαναφορά απέτυχε: ${error.message}`);
    }
  };
  input.click();
}

// ── καρτέλα 3: άδειες ──────────────────────────────────────────────────────
function renderLeaves() {
  const panel = $('#tab-leaves');
  panel.innerHTML = '';

  const tabs = document.createElement('div');
  tabs.className = 'segmented';
  for (const [key, label] of Object.entries(cat.categories())) {
    const b = button(label, state.category === key ? 'active' : '', () => {
      state.category = key;
      state.leaveType = null;
      renderLeaves();
    });
    tabs.append(b);
  }
  panel.append(tabs);

  const list = document.createElement('div');
  list.className = 'leave-list';
  for (const leave of cat.leaveTypesOf(state.category, currentProgramme())) {
    const item = document.createElement('button');
    item.className = `leave${state.leaveType === leave.key ? ' active' : ''}`;
    const badges = [
      leave.aitisi ? '<span class="badge">αίτηση</span>' : '',
      leave.apofasi ? '<span class="badge">απόφαση</span>' : '',
      leave.ektos_sxolikis_monadas
        ? '<span class="badge muted">εγκρίνει η Διεύθυνση</span>' : '',
    ].join('');
    item.innerHTML = `<span>${escapeHtml(leave.title)}</span><span>${badges}</span>`;
    item.onclick = () => {
      state.leaveType = leave.key;
      state.docKind = leave.aitisi ? 'aitisi' : 'apofasi';
      renderLeaves();
    };
    list.append(item);
  }
  panel.append(list);

  if (state.leaveType) {
    panel.append(renderEditor());
    const slot = currentSlot();
    if (slot) updateSummary(slot); // μετά την προσάρτηση: το #summary πρέπει να υπάρχει
  }
}

function currentEmployee() {
  return store.getEmployees().find((e) => e.id === state.employeeId) || null;
}

// Το πρόγραμμα έρχεται από την καρτέλα του εργαζομένου, όχι από επιλογή εδώ.
function currentProgramme() {
  return state.category === 'anaplirotes' ? currentEmployee()?.programma : null;
}

function pairingKey() {
  const programme = currentProgramme();
  return [state.category, programme, state.leaveType].filter(Boolean).join('/');
}

function currentSlot() {
  const slot = cat.slotsOf(state.category, currentProgramme())[state.leaveType];
  if (!slot) return null;
  return { ...slot, apofasi: store.getPairings()[pairingKey()] || slot.apofasi };
}

function renderEditor() {
  const wrap = document.createElement('div');
  wrap.className = 'split';

  const left = document.createElement('div');
  left.className = 'pane-form';
  const right = document.createElement('div');
  right.className = 'pane-summary';
  right.innerHTML = '<div id="summary" class="summary"></div>';
  wrap.append(left, right);

  // Οι λοιπές άδειες αφορούν και τους δύο· οι άλλες δύο κατηγορίες όχι.
  const wanted = { monimoi: 'monimos', anaplirotes: 'anapliromatis' }[state.category];
  const employees = store.getEmployees().filter(
    (e) => !wanted || e.katigoria === wanted);

  if (!employees.length) {
    left.innerHTML = `<p class="warn">Δεν υπάρχει καταχωρισμένος
      ${wanted === 'monimos' ? 'μόνιμος' : 'αναπληρωτής'} εργαζόμενος.</p>`;
    return wrap;
  }
  if (!employees.some((e) => e.id === state.employeeId)) {
    state.employeeId = employees[0].id;
  }

  left.append(selectField('Εργαζόμενος',
    employees.map((e) => [e.id, e.onomateponymo || `${e.eponymo} ${e.onoma}`]),
    state.employeeId, (v) => { state.employeeId = v; renderLeaves(); }));

  // Καρτέλα από παλιότερη έκδοση, χωρίς πρόγραμμα: το έντυπο του λάθους
  // προγράμματος στέλνει τον αναπληρωτή σε λάθος χρηματοδότηση, οπότε ρωτάμε
  // αντί να μαντέψουμε.
  const slot = currentSlot();
  if (!slot) {
    const who = currentEmployee();
    left.append(Object.assign(document.createElement('p'), {
      className: 'warn',
      textContent: `Η καρτέλα «${who?.onomateponymo || who?.eponymo || ''}» δεν έχει `
        + 'πρόγραμμα. Ανοίξτε την στην καρτέλα «Εργαζόμενοι» και επιλέξτε ένα.',
    }));
    return wrap;
  }

  // ποιο έντυπο: αίτηση ή απόφαση
  const kinds = [];
  if (slot.aitisi) kinds.push(['aitisi', 'Αίτηση']);
  if (slot.apofasi) kinds.push(['apofasi', 'Απόφαση']);
  if (kinds.length > 1) {
    left.append(selectField('Έντυπο', kinds, state.docKind,
      (v) => { state.docKind = v; renderLeaves(); }));
  }

  // εναλλακτικές αποφάσεις για τον ίδιο τύπο άδειας
  if (slot.apofaseis.length > 1) {
    left.append(selectField('Ποια απόφαση',
      slot.apofaseis.map((k) => [k, cat.catalog()[k].file.replace(/\.docx$/, '')]),
      slot.apofasi, (v) => {
        store.setPairing(pairingKey(), v);
        renderLeaves();
      }));
  }

  const keys = [slot.aitisi, slot.apofasi].filter(Boolean);
  const fields = cat.formFieldsFor(keys);
  const { main, derived, rare } = splitFields(fields);

  // Ο διακόπτης προεπιλέγεται από το ίδιο το έντυπο: όσα λένε «εργάσιμων ημερών»
  // φέρουν την ετικέτα ergasimon και ξεκινούν ανοιχτά.
  const worksDays = keys.some((k) => cat.catalog()[k]?.ergasimes);
  if (state.leaveData.ergasimes === undefined) state.leaveData.ergasimes = worksDays;

  const holder = document.createElement('div');
  left.append(holder);

  const refresh = debounce(() => updateSummary(slot), 300);
  const draw = () => {
    sectionedForm(holder, [
      { fields: main },
      { fields: derived, label: 'Υπολογίζονται αυτόματα',
        hint: 'Η λήξη δεν γνωρίζει αργίες. Διορθώστε τη αν πέφτει αργία στο διάστημα.' },
      { fields: rare, label: 'Χρειάζονται σε ένα μόνο έντυπο' },
    ], state.leaveData, () => {
      refreshPlaceholders(holder, suggestions(currentRaw()));
      refresh();
    }, suggestions(currentRaw()));

    const count = holder.querySelector('[data-tag="imeres_arithmitika"]');
    if (count) {
      count.closest('.field').after(toggleField('Μόνο εργάσιμες',
        Boolean(state.leaveData.ergasimes), (on) => {
          state.leaveData.ergasimes = on;
          refreshPlaceholders(holder, suggestions(currentRaw()));
          refresh();
        }, 'αγνοεί Σάββατο και Κυριακή'));
    }
  };
  draw();

  const actions = document.createElement('div');
  actions.className = 'toolbar';
  actions.append(
    button('Λήψη .docx', 'primary', async () => {
      const key = state.docKind === 'aitisi' ? slot.aitisi : slot.apofasi;
      const entry = cat.catalog()[key];
      const data = currentData();
      download(await fillDocx(entry.file, data), documentFilename({
        onoma: data.onoma,
        eponymo: data.eponymo,
        title: entry.title,
        kind: state.docKind,
        date: data.imerominia_egrafou,
      }));
    }),
  );
  left.append(actions);

  return wrap;
}

// Τα ακατέργαστα δεδομένα, με τις ημερομηνίες ακόμη σε μορφή ISO ώστε να μπορούν
// να υπολογιστούν διαφορές ημερών.
function currentRaw() {
  const employee = store.getEmployees().find((e) => e.id === state.employeeId) || {};
  return { ...store.getDirector(), ...employee, ...state.leaveData };
}

function currentData() {
  return formatDates(derive(currentRaw()));
}

// Ό,τι έλεγχο έκανε η προεπισκόπηση, χωρίς να αποδίδεται το έγγραφο: ποιες ετικέτες
// ζητά το επιλεγμένο έντυπο και ποιες από αυτές είναι ακόμη κενές. Το κενό πεδίο
// τυπώνεται ως κενό στο Word, οπότε είναι το μόνο που αξίζει προειδοποίηση.
function updateSummary(slot) {
  const key = state.docKind === 'aitisi' ? slot.aitisi : slot.apofasi;
  const container = $('#summary');
  if (!key || !container) return;

  const entry = cat.catalog()[key];
  const labels = new Map(
    Object.values(cat.config().fields).flat().map((f) => [f.tag, f.label]));
  const data = currentData();

  // Το φύλο και το πλήθος ημερών παράγουν μόνα τους τις μορφές τους («ούσα»,
  // «ημερών»). Δεν τα γράφει κανείς, οπότε δεν έχουν θέση σε σύνοψη ελέγχου.
  const automatic = new Set([
    ...Object.keys(cat.config().gender), ...Object.keys(cat.config().count)]);

  const tags = (entry.fields || []).filter((t) => !automatic.has(t));
  const rows = tags.filter((t) => !t.startsWith('check_')).map((tag) => ({
    tag, label: labels.get(tag) || tag, value: String(data[tag] ?? '').trim(),
  }));
  const empty = rows.filter((r) => !r.value);

  // Η σχέση εργασίας είναι δέκα ετικέτες αλλά **μία** επιλογή: το έντυπο κρατά όλες
  // τις γραμμές ορατές και σημειώνεται με «Χ» αυτή που ισχύει. Οι υπόλοιπες εννέα
  // πρέπει να μείνουν κενές, οπότε δεν είναι παραλείψεις — μία σειρά, όχι δέκα.
  const checks = tags.filter((t) => t.startsWith('check_'));
  const marked = checks.filter((t) => String(data[t] ?? '').trim());
  const sxesi = checks.length ? {
    label: 'Σχέση εργασίας',
    value: marked.map((t) => labels.get(t) || t).join(', '),
  } : null;

  container.innerHTML = `
    <h3>${escapeHtml(entry.title)}</h3>
    <p class="summary-count">${rows.length - empty.length} από ${rows.length}
       πεδία συμπληρωμένα</p>
    ${empty.length ? `<p class="warn">Θα τυπωθούν κενά: ${
      empty.slice(0, 6).map((r) => escapeHtml(r.label)).join(', ')}${
      empty.length > 6 ? ` και ${empty.length - 6} ακόμη — σημειωμένα πιο κάτω` : ''}</p>` : ''}
    <dl class="summary-list">${[...(sxesi ? [sxesi] : []), ...rows].map((r) => `
      <dt>${escapeHtml(r.label)}</dt>
      <dd class="${r.value ? '' : 'is-empty'}">${
        r.value ? escapeHtml(r.value) : '— κενό —'}</dd>`).join('')}
    </dl>`;
}

// ── βοηθητικά ──────────────────────────────────────────────────────────────
function button(text, className, onClick) {
  const b = document.createElement('button');
  b.textContent = text;
  if (className) b.className = className;
  b.onclick = onClick;
  return b;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function showTab(name) {
  for (const panel of document.querySelectorAll('.panel')) {
    panel.hidden = panel.id !== `tab-${name}`;
  }
  for (const tab of document.querySelectorAll('nav button')) {
    tab.classList.toggle('active', tab.dataset.tab === name);
  }
  if (name === 'employees') renderEmployees();
  if (name === 'leaves') renderLeaves();
}

// Τα banner τα δίνει ο χρήστης στο web/banners/· το build_web.py φτιάχνει τον
// κατάλογο. Διαλέγεται ένα στην τύχη σε κάθε φόρτωση — καμία περιστροφή με
// χρονομέτρη, η εναλλαγή γίνεται από επίσκεψη σε επίσκεψη.
async function showBanner() {
  const slot = $('#banner');
  try {
    const files = await fetch('banners/banners.json').then((r) => r.json());
    if (!Array.isArray(files) || !files.length) return;
    const pick = files[Math.floor(Math.random() * files.length)];
    const img = Object.assign(document.createElement('img'), {
      src: `banners/${encodeURIComponent(pick)}`,
      alt: '',
      loading: 'lazy',
    });
    img.addEventListener('error', () => { slot.hidden = true; });
    slot.append(img);
    slot.hidden = false;
  } catch {
    // κανένα banner — η κεφαλίδα μένει όπως είναι
  }
}

async function init() {
  await cat.load();
  showBanner();
  renderDirector();
  renderEmployees();
  renderLeaves();
  for (const tab of document.querySelectorAll('nav button')) {
    tab.onclick = () => showTab(tab.dataset.tab);
  }
  showTab('director');
}

init().catch((error) => {
  document.body.innerHTML = `<p class="warn">Η εφαρμογή δεν φόρτωσε: ${error.message}
    <br>Η σελίδα πρέπει να ανοίγει μέσω διακομιστή, όχι με διπλό κλικ στο αρχείο.</p>`;
});
