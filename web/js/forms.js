// Δυναμική φόρμα από λίστα πεδίων. Καμία φόρμα δεν είναι γραμμένη στο χέρι — όλες
// χτίζονται από το λεξιλόγιο, ώστε νέο έντυπο να μη χρειάζεται αλλαγή κώδικα.
//
// Δύο έννοιες που επαναλαμβάνονται παντού:
//   placeholders — η υπολογισμένη τιμή δείχνει γκρίζα μέσα στο άδειο πεδίο. Το πεδίο
//                  μένει κενό, οπότε στο έντυπο μπαίνει το υπολογισμένο· μόλις
//                  γραφτεί κάτι, υπερισχύει.
// Η ομαδοποίηση σε ενότητες (κύρια / υπολογίζονται / σπάνια) γίνεται από τον καλούντα
// με πολλαπλές κλήσεις — βλ. sectionedForm στο main.js.

function makeField(field, values, onChange, placeholder) {
  const label = document.createElement('label');
  label.className = 'field';
  label.append(Object.assign(document.createElement('span'), {
    className: 'field-label',
    textContent: field.label,
  }));

  const input = field.type === 'textarea'
    ? document.createElement('textarea')
    : document.createElement('input');
  if (field.type === 'textarea') {
    input.rows = 2;
    label.classList.add('wide');
  } else {
    input.type = field.type === 'number' ? 'number'
      : field.type === 'date' ? 'date' : 'text';
  }
  input.value = values[field.tag] ?? '';
  input.dataset.tag = field.tag;

  input.addEventListener('input', () => {
    values[field.tag] = input.value;
    onChange(field.tag, input.value);
  });

  label.append(input);

  // Τα πεδία ημερομηνίας και αριθμού αγνοούν το placeholder, οπότε η πρόταση
  // γράφεται ως ξεχωριστή υπόδειξη κάτω από το πεδίο. Ίδια μεταχείριση παντού,
  // ώστε να διαβάζεται το ίδιο σε όλη τη φόρμα.
  if (field.derived) {
    label.classList.add('has-suggestion');
    const hint = document.createElement('small');
    hint.className = 'suggested';
    hint.dataset.suggestionFor = field.tag;
    label.append(hint);
    setSuggestion(hint, placeholder);
  }
  return label;
}

function setSuggestion(node, value) {
  node.textContent = value ? `προτείνεται: ${value}` : '';
  node.hidden = !value;
}

export function buildForm(container, fields, values, onChange, placeholders = {}) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'form-grid';
  for (const field of fields) {
    if (field.type === 'check') continue; // σημειώνονται από τη σχέση εργασίας
    grid.append(makeField(field, values, onChange, placeholders[field.tag]));
  }
  container.append(grid);
  return container;
}

// Ανανεώνει μόνο τα placeholders — η φόρμα δεν ξαναχτίζεται, ώστε να μη χαθεί ο
// δρομέας ενώ ο χρήστης πληκτρολογεί.
export function refreshPlaceholders(container, placeholders) {
  for (const node of container.querySelectorAll('[data-suggestion-for]')) {
    setSuggestion(node, placeholders[node.dataset.suggestionFor]);
  }
}

export function selectField(labelText, options, value, onChange) {
  const label = document.createElement('label');
  label.className = 'field';
  label.append(Object.assign(document.createElement('span'), {
    className: 'field-label', textContent: labelText,
  }));
  const select = document.createElement('select');
  for (const [optValue, optLabel] of options) {
    const option = document.createElement('option');
    option.value = optValue;
    option.textContent = optLabel;
    if (optValue === value) option.selected = true;
    select.append(option);
  }
  select.addEventListener('change', () => onChange(select.value));
  label.append(select);
  return label;
}

export function toggleField(labelText, checked, onChange, hint) {
  const label = document.createElement('label');
  label.className = 'field';
  label.append(Object.assign(document.createElement('span'), {
    className: 'field-label', textContent: labelText,
  }));
  const box = document.createElement('span');
  box.className = 'toggle';
  const input = Object.assign(document.createElement('input'), { type: 'checkbox', checked });
  input.addEventListener('change', () => onChange(input.checked));
  box.append(input);
  if (hint) box.append(Object.assign(document.createElement('small'), { textContent: hint }));
  label.append(box);
  return label;
}
