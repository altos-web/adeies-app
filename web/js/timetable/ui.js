// ui.js — Κεντρική Διεπαφή & Διαχείριση Ωρολογίου Προγράμματος (aSc Timetables Workflow)
// Συντονίζει τα βήματα καταχώρισης (Σχολείο, Τμήματα, Εκπαιδευτικοί Time-off, Αναθέσεις, Solver & Matrix).

import { store } from '../store.js';
import { DAYS_OF_WEEK, SCHOOL_TYPES } from './curricula.js';
import { TimetableMatrix } from './matrix.js';
import { createInitialTimetable, normalizeTimetable, populateCurriculumForClasses } from './model.js';
import { TimetableSolver } from './solver.js';

export class TimetableUI {
  constructor(container) {
    this.container = container;
    this.activeStep = 1; // 1: Σχολείο/Τμήματα, 2: Εκπαιδευτικοί/Time-off, 3: Αναθέσεις, 4: Πρόγραμμα (Solver & Matrix)
    this.timetable = normalizeTimetable(store.getTimetable() || createInitialTimetable('gymnasio'));
    this.matrix = null;
  }

  render() {
    this.timetable = normalizeTimetable(this.timetable);
    this.container.innerHTML = '';

    try {
      const wrap = document.createElement('div');
      wrap.className = 'timetable-app';

      // 1. Wizard Steps Bar
      const stepsNav = this.createStepsNav();
      wrap.append(stepsNav);

      // 2. Active Step Content
      const stepContent = document.createElement('div');
      stepContent.className = 'timetable-step-content';

      switch (this.activeStep) {
        case 1:
          stepContent.append(this.renderStep1School());
          break;
        case 2:
          stepContent.append(this.renderStep2Teachers());
          break;
        case 3:
          stepContent.append(this.renderStep3Lessons());
          break;
        case 4:
          stepContent.append(this.renderStep4Schedule());
          break;
        default:
          break;
      }
      wrap.append(stepContent);

      this.container.append(wrap);
    } catch (err) {
      console.error('Error rendering timetable UI:', err);
      this.container.innerHTML = `
        <div class="panel" style="padding: 2rem; border-left: 4px solid var(--danger, #ef4444); background: #fff; margin: 1rem;">
          <h3 style="color: #b91c1c; margin-top: 0;">Σφάλμα εμφάνισης ωρολογίου προγράμματος</h3>
          <p>${err.message || 'Παρουσιάστηκε μη αναμενόμενο σφάλμα κατά τη φόρτωση των δεδομένων.'}</p>
          <div class="toolbar" style="margin-top: 1rem;">
            <button class="primary" id="btn-recover-tt">Επαναφορά Αρχικών Δεδομένων Ωρολογίου</button>
          </div>
        </div>
      `;
      const btn = this.container.querySelector('#btn-recover-tt');
      if (btn) {
        btn.onclick = () => {
          this.timetable = createInitialTimetable('gymnasio');
          this.save();
          this.render();
        };
      }
    }
  }

  save() {
    this.timetable = normalizeTimetable(this.timetable);
    store.setTimetable(this.timetable);
  }

  createStepsNav() {
    const nav = document.createElement('div');
    nav.className = 'timetable-wizard-nav';

    const steps = [
      { num: 1, title: 'Σχολείο & Τμήματα' },
      { num: 2, title: 'Εκπαιδευτικοί & Διαθεσιμότητα (Time-off)' },
      { num: 3, title: 'Μαθήματα & Αναθέσεις' },
      { num: 4, title: 'Πρόγραμμα & Επίλυση (aSc Matrix)' },
    ];

    steps.forEach(({ num, title }) => {
      const btn = document.createElement('button');
      btn.className = `wizard-step-btn${this.activeStep === num ? ' active' : ''}`;
      btn.innerHTML = `<span class="step-num">0${num}</span> <span class="step-title">${title}</span>`;
      btn.onclick = () => {
        this.activeStep = num;
        this.render();
      };
      nav.append(btn);
    });

    return nav;
  }

  // ── ΒΗΜΑ 1: Σχολείο & Τμήματα ─────────────────────────────────────────────
  renderStep1School() {
    const div = document.createElement('div');
    div.className = 'panel-step';

    div.innerHTML = `
      <div class="step-intro">
        <h3>Βήμα 1: Τύπος Σχολείου & Τμήματα</h3>
        <p class="hint">Επιλέξτε τον τύπο της σχολικής μονάδας και ορίστε τα τμήματα (π.χ. Α1, Α2, Β1...).</p>
      </div>

      <div class="form-grid">
        <label class="field">
          <span class="label">Τύπος Σχολείου</span>
          <select id="tt-school-type">
            ${Object.values(SCHOOL_TYPES).map(
              (t) => `<option value="${t.id}" ${t.id === this.timetable.schoolType ? 'selected' : ''}>${t.name} (${t.periodsPerDay} ώρες/ημέρα)</option>`
            ).join('')}
          </select>
        </label>
      </div>

      <div class="classes-management-section">
        <div class="section-header">
          <h4>Τμήματα Σχολείου (${this.timetable.classes.length})</h4>
          <button class="primary" id="btn-add-class">+ Προσθήκη Τμήματος</button>
        </div>
        <div class="classes-grid" id="classes-list"></div>
      </div>

      <div class="step-actions">
        <button class="primary next-btn" id="btn-to-step-2">Επόμενο: Εκπαιδευτικοί &rarr;</button>
      </div>
    `;

    // Type change
    const typeSelect = div.querySelector('#tt-school-type');
    typeSelect.onchange = (e) => {
      const newType = e.target.value;
      if (confirm('Η αλλαγή τύπου σχολείου θα επαναφέρει το αναλυτικό ωρολόγιο πρόγραμμα. Συνέχεια;')) {
        this.timetable = createInitialTimetable(newType);
        this.save();
        this.render();
      } else {
        e.target.value = this.timetable.schoolType;
      }
    };

    // Render classes
    const classesList = div.querySelector('#classes-list');
    let draggedClassIndex = null;

    const renderClassesList = () => {
      classesList.innerHTML = '';
      this.timetable.classes.forEach((cls, idx) => {
        const item = document.createElement('div');
        item.className = 'class-chip';
        item.draggable = true;
        item.dataset.index = idx;
        item.innerHTML = `
          <div class="class-chip-content">
            <span class="drag-handle" title="Σύρετε για αναδιάταξη">⠿</span>
            <div class="class-chip-info" title="Κλικ για επεξεργασία">
              <strong>${cls.name}</strong>
              <span class="class-grade">Τάξη ${cls.grade}</span>
            </div>
          </div>
          <div class="chip-actions">
            <button class="chip-edit" title="Επεξεργασία">✎</button>
            <button class="chip-delete danger" title="Διαγραφή">✕</button>
          </div>
        `;

        // Click to edit
        const handleEdit = () => {
          this.openClassModal(cls, () => renderClassesList());
        };
        item.querySelector('.class-chip-content').onclick = handleEdit;
        item.querySelector('.chip-edit').onclick = handleEdit;

        // Delete
        item.querySelector('.chip-delete').onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Διαγραφή του τμήματος ${cls.name};`)) {
            this.timetable.classes.splice(idx, 1);
            this.save();
            renderClassesList();
          }
        };

        // Drag n drop reordering
        item.addEventListener('dragstart', (e) => {
          draggedClassIndex = idx;
          item.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(idx));
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          if (draggedClassIndex === null || draggedClassIndex === idx) return;

          const moved = this.timetable.classes.splice(draggedClassIndex, 1)[0];
          this.timetable.classes.splice(idx, 0, moved);
          this.save();
          renderClassesList();
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('is-dragging');
          draggedClassIndex = null;
        });

        classesList.append(item);
      });
    };
    renderClassesList();

    // Add class button opens modal
    div.querySelector('#btn-add-class').onclick = () => {
      this.openClassModal(null, () => renderClassesList());
    };

    div.querySelector('#btn-to-step-2').onclick = () => {
      this.activeStep = 2;
      this.render();
    };

    return div;
  }

  // Pop-up modal για επιλογή τάξης και ονόματος τμήματος
  openClassModal(clsToEdit = null, onSaved = null) {
    const typeConfig = SCHOOL_TYPES[this.timetable.schoolType] || SCHOOL_TYPES.gymnasio;
    const dialog = document.createElement('dialog');
    dialog.className = 'class-dialog';

    const defaultGrade = clsToEdit ? clsToEdit.grade : typeConfig.grades[0];
    const suggestName = (gr) => {
      const count = this.timetable.classes.filter((c) => c.grade === gr).length;
      return `${gr}${count + 1}`;
    };
    const defaultName = clsToEdit ? clsToEdit.name : suggestName(defaultGrade);

    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>${clsToEdit ? 'Επεξεργασία Τμήματος' : 'Προσθήκη Νέου Τμήματος'}</h3>
        <p class="hint">Επιλέξτε την τάξη ανάλογα με τη βαθμίδα και ορίστε το όνομα του τμήματος.</p>

        <div class="form-grid" style="margin-top: 1.25rem;">
          <label class="field">
            <span class="label">Τάξη</span>
            <select id="modal-class-grade">
              ${typeConfig.grades.map(
                (g) => `<option value="${g}" ${g === defaultGrade ? 'selected' : ''}>Τάξη ${g}</option>`
              ).join('')}
            </select>
          </label>

          <label class="field">
            <span class="label">Όνομα Τμήματος</span>
            <input type="text" id="modal-class-name" value="${defaultName}" placeholder="π.χ. Α1, Β2, Γ_ΘΕΤ" autofocus>
          </label>
        </div>

        <div class="toolbar" style="margin-top: 1.5rem; justify-content: flex-end;">
          <button type="button" class="btn-cancel">Άκυρο</button>
          <button type="button" class="primary btn-save">Αποθήκευση</button>
        </div>
      </div>
    `;

    const gradeSelect = dialog.querySelector('#modal-class-grade');
    const nameInput = dialog.querySelector('#modal-class-name');

    if (!clsToEdit) {
      gradeSelect.onchange = () => {
        nameInput.value = suggestName(gradeSelect.value);
      };
    }

    const close = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('.btn-cancel').onclick = close;

    const save = () => {
      const grade = gradeSelect.value.trim().toUpperCase();
      const name = nameInput.value.trim().toUpperCase();
      if (!name) {
        alert('Παρακαλώ εισαγάγετε όνομα τμήματος.');
        return;
      }

      if (clsToEdit) {
        clsToEdit.grade = grade;
        clsToEdit.name = name;
      } else {
        this.timetable.classes.push({
          id: `c_${Date.now()}`,
          name,
          grade,
        });
      }

      this.save();
      close();
      if (onSaved) onSaved();
    };

    dialog.querySelector('.btn-save').onclick = save;
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      }
    };

    document.body.append(dialog);
    dialog.showModal();
  }

  // ── ΒΗΜΑ 2: Εκπαιδευτικοί & Time-off ──────────────────────────────────────
  renderStep2Teachers() {
    const div = document.createElement('div');
    div.className = 'panel-step';

    div.innerHTML = `
      <div class="step-intro">
        <h3>Βήμα 2: Εκπαιδευτικοί & Διαθεσιμότητα (Time-off)</h3>
        <p class="hint">Εισαγάγετε το διδακτικό ωράριο κάθε καθηγητή και ορίστε τις ώρες διαθεσιμότητας (time-off matrix).</p>
      </div>

      <div class="toolbar">
        <button class="primary" id="btn-sync-employees">🔄 Συγχρονισμός από Καρτέλα Εργαζομένων</button>
        <button id="btn-add-teacher">+ Προσθήκη Εκπαιδευτικού</button>
      </div>

      <div class="teachers-table-wrap">
        <table class="list teachers-table">
          <thead>
            <tr>
              <th>Ονοματεπώνυμο</th>
              <th>Κλάδος</th>
              <th>Υποχρεωτικό Ωράριο</th>
              <th>Ανατεθειμένες Ώρες</th>
              <th>Διαθεσιμότητα (Time-off)</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="teachers-tbody"></tbody>
        </table>
      </div>

      <div class="step-actions">
        <button class="secondary" id="btn-back-step-1">&larr; Πίσω</button>
        <button class="primary next-btn" id="btn-to-step-3">Επόμενο: Μαθήματα & Αναθέσεις &rarr;</button>
      </div>
    `;

    // 1. Sync from employees tab
    div.querySelector('#btn-sync-employees').onclick = () => {
      const employees = store.getEmployees();
      if (!employees.length) {
        alert('Δεν έχουν καταχωριστεί εργαζόμενοι στην καρτέλα 02 («Εργαζόμενοι»). Μπορείτε να πατήσετε «Φόρτωση Εικονικών Εκπαιδευτικών» για έτοιμο δείγμα.');
        return;
      }
      let added = 0;
      employees.forEach((emp) => {
        if (!this.timetable.teachers.some((t) => t.id === emp.id)) {
          this.timetable.teachers.push({
            id: emp.id,
            name: emp.onomateponymo || `${emp.eponymo || ''} ${emp.onoma || ''}`.trim() || 'Εκπαιδευτικός',
            branch: emp.klados || 'ΠΕ02',
            requiredHours: 20,
            assignedHours: 0,
            timeOff: {},
          });
          added++;
        }
      });
      this.save();
      this.render();
      alert(`Συγχρονίστηκαν ${added} εκπαιδευτικοί!`);
    };

    // Add manual teacher
    div.querySelector('#btn-add-teacher').onclick = () => {
      const name = prompt('Ονοματεπώνυμο εκπαιδευτικού:');
      if (!name) return;
      const branch = prompt('Κλάδος (π.χ. ΠΕ02, ΠΕ03, ΠΕ04, ΠΕ86):', 'ΠΕ02') || 'ΠΕ';
      const hours = Number(prompt('Υποχρεωτικό εβδομαδιαίο διδακτικό ωράριο (ώρες):', '20')) || 20;

      this.timetable.teachers.push({
        id: `t_${Date.now()}`,
        name: name.trim().toUpperCase(),
        branch: branch.trim().toUpperCase(),
        requiredHours: hours,
        assignedHours: 0,
        timeOff: {},
      });
      this.save();
      this.render();
    };

    const tbody = div.querySelector('#teachers-tbody');
    this.renderTeachersList(tbody);

    div.querySelector('#btn-back-step-1').onclick = () => {
      this.activeStep = 1;
      this.render();
    };
    div.querySelector('#btn-to-step-3').onclick = () => {
      this.activeStep = 3;
      this.render();
    };

    return div;
  }

  renderTeachersList(tbody) {
    tbody.innerHTML = '';
    const teachers = this.timetable.teachers || [];
    if (!teachers.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="hint text-center">Δεν έχει καταχωριστεί κανένας εκπαιδευτικός. Πατήστε «Συγχρονισμός» ή «Προσθήκη».</td></tr>`;
      return;
    }

    const lessons = this.timetable.lessons || [];
    teachers.forEach((t) => {
      // Υπολογισμός ανατεθειμένων ωρών από τα μαθήματα
      const assigned = lessons
        .filter((les) => les.teacherId === t.id)
        .reduce((sum, les) => sum + (Number(les.hours) || 0), 0);
      t.assignedHours = assigned;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${t.name}</strong></td>
        <td><span class="badge">${t.branch || '—'}</span></td>
        <td>
          <input type="number" min="1" max="30" value="${t.requiredHours || 21}" class="input-hours" style="width: 4rem;"> ώρες
        </td>
        <td>
          <span class="badge ${assigned === t.requiredHours ? 'success' : assigned > t.requiredHours ? 'danger' : 'warn'}">
            ${assigned} / ${t.requiredHours} ώρες
          </span>
        </td>
        <td>
          <button class="btn-timeoff">📅 Πλέγμα Διαθεσιμότητας</button>
        </td>
        <td class="row-actions">
          <button class="danger btn-del-t">Διαγραφή</button>
        </td>
      `;

      // Change hours
      row.querySelector('.input-hours').onchange = (e) => {
        t.requiredHours = Number(e.target.value) || 21;
        this.save();
        this.render();
      };

      // Open Time-off modal
      row.querySelector('.btn-timeoff').onclick = () => {
        this.openTimeOffModal(t);
      };

      // Delete teacher
      row.querySelector('.btn-del-t').onclick = () => {
        if (confirm(`Διαγραφή του/της ${t.name};`)) {
          this.timetable.teachers = this.timetable.teachers.filter((item) => item.id !== t.id);
          this.save();
          this.render();
        }
      };

      tbody.append(row);
    });
  }

  // Μοντάλ Διαθεσιμότητας aSc Time-off Matrix
  openTimeOffModal(teacher) {
    const dialog = document.createElement('dialog');
    dialog.className = 'timeoff-dialog';

    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Διαθεσιμότητα (Time-off): ${teacher.name}</h3>
        <p class="hint">Κάντε κλικ στα κελιά για εναλλαγή κατάστασης:
          <span class="badge success">✓ Διαθέσιμος</span>
          <span class="badge danger">✕ Απαγορευτικό (άλλο σχολείο/ρεπό)</span>
          <span class="badge warn">? Ανεπιθύμητο</span>
        </p>

        <div class="timeoff-grid-wrap">
          <table class="timeoff-table">
            <thead>
              <tr>
                <th>Ώρα</th>
                ${DAYS_OF_WEEK.map((d) => `<th>${d.short}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: this.timetable.periodsPerDay }, (_, idx) => {
                const period = idx + 1;
                return `
                  <tr>
                    <td><strong>${period}η</strong></td>
                    ${DAYS_OF_WEEK.map((d) => {
                      const key = `${d.id}-${period}`;
                      const state = teacher.timeOff?.[key] || 'ok';
                      const symbol = state === 'no' ? '✕' : state === 'warn' ? '?' : '✓';
                      const cls = state === 'no' ? 'state-no' : state === 'warn' ? 'state-warn' : 'state-ok';
                      return `<td class="timeoff-cell ${cls}" data-key="${key}">${symbol}</td>`;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="toolbar" style="margin-top: 1.5rem; justify-content: flex-end;">
          <button class="primary btn-close-dialog">Κλείσιμο &amp; Αποθήκευση</button>
        </div>
      </div>
    `;

    // Cell click toggle
    dialog.querySelectorAll('.timeoff-cell').forEach((cell) => {
      cell.onclick = () => {
        const key = cell.dataset.key;
        if (!teacher.timeOff) teacher.timeOff = {};
        const current = teacher.timeOff[key] || 'ok';
        let next = 'no';
        if (current === 'no') next = 'warn';
        else if (current === 'warn') next = 'ok';

        teacher.timeOff[key] = next;
        cell.className = `timeoff-cell state-${next}`;
        cell.textContent = next === 'no' ? '✕' : next === 'warn' ? '?' : '✓';
      };
    });

    dialog.querySelector('.btn-close-dialog').onclick = () => {
      this.save();
      dialog.close();
      dialog.remove();
    };

    document.body.append(dialog);
    dialog.showModal();
  }

  // ── ΒΗΜΑ 3: Μαθήματα & Αναθέσεις ──────────────────────────────────────────
  renderStep3Lessons() {
    const div = document.createElement('div');
    div.className = 'panel-step';

    div.innerHTML = `
      <div class="step-intro">
        <h3>Βήμα 3: Μαθήματα & Αναθέσεις Διδασκαλίας</h3>
        <p class="hint">
          Ορίστε τις ώρες διδασκαλίας κάθε μαθήματος ανά τμήμα (προεπιλεγμένες βάσει νομοθεσίας) και αναθέστε τους κατάλληλους εκπαιδευτικούς μέσω του αναδυόμενου πίνακα διαθεσιμότητας.
        </p>
      </div>

      <div class="toolbar" style="flex-wrap: wrap; gap: 0.75rem;">
        <button class="primary" id="btn-load-curriculum">📋 Αυτόματη Φόρτωση Επίσημου Ωρολογίου Προγράμματος</button>
        <span class="badge info">${(this.timetable.lessons || []).length} ενεργά μαθήματα</span>

        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
          <label for="filter-class" class="hint" style="font-size: 0.8125rem;">Προβολή τμήματος:</label>
          <select id="filter-class" style="padding: 0.35rem 0.6rem; border-radius: 4px; border: 1px solid var(--rule); font-family: var(--sans); font-size: 0.8125rem;">
            <option value="all">Όλα τα τμήματα</option>
            ${(this.timetable.classes || []).map((c) => `<option value="${c.id}">${c.name} (${c.grade} Τάξη)</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="lessons-table-wrap">
        <table class="list lessons-table">
          <thead>
            <tr>
              <th>Τμήμα</th>
              <th>Μάθημα</th>
              <th style="min-width: 9rem;">Ώρες / Εβδ.</th>
              <th>Ειδικότητα</th>
              <th style="min-width: 17rem;">Ανάθεση Εκπαιδευτικού</th>
              <th>Ειδικός Χώρος</th>
              <th>Σπαστό / Παράλληλο</th>
            </tr>
          </thead>
          <tbody id="lessons-tbody"></tbody>
        </table>
      </div>

      <div class="step-actions">
        <button class="secondary" id="btn-back-step-2">&larr; Πίσω</button>
        <button class="primary next-btn" id="btn-to-step-4">Επόμενο: Αυτόματη Κατάρτιση &rarr;</button>
      </div>
    `;

    let activeFilterClass = 'all';

    div.querySelector('#btn-load-curriculum').onclick = () => {
      if (confirm('Θέλετε να φορτώσετε το επίσημο ωρολόγιο πρόγραμμα για όλα τα τμήματα; Αυτό θα αντικαταστήσει τα υπάρχοντα μαθήματα.')) {
        populateCurriculumForClasses(this.timetable);
        this.save();
        this.render();
      }
    };

    const tbody = div.querySelector('#lessons-tbody');
    const classFilter = div.querySelector('#filter-class');
    if (classFilter) {
      classFilter.onchange = (e) => {
        activeFilterClass = e.target.value;
        this.renderLessonsList(tbody, activeFilterClass);
      };
    }

    this.renderLessonsList(tbody, activeFilterClass);

    div.querySelector('#btn-back-step-2').onclick = () => {
      this.activeStep = 2;
      this.render();
    };
    div.querySelector('#btn-to-step-4').onclick = () => {
      this.activeStep = 4;
      this.render();
    };

    return div;
  }

  renderLessonsList(tbody, filterClass = 'all') {
    tbody.innerHTML = '';
    const allLessons = this.timetable.lessons || [];
    if (!allLessons.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="hint text-center">Δεν υπάρχουν μαθήματα. Πατήστε «Αυτόματη Φόρτωση Επίσημου Ωρολογίου Προγράμματος».</td></tr>`;
      return;
    }

    const lessons = filterClass === 'all'
      ? allLessons
      : allLessons.filter((l) => l.classId === filterClass);

    if (!lessons.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="hint text-center">Δεν υπάρχουν μαθήματα για το επιλεγμένο τμήμα.</td></tr>`;
      return;
    }

    // Helper: Υπολογισμός υπολειπόμενων ωρών εκπαιδευτικού
    const getTeacherStats = (t) => {
      const assigned = allLessons
        .filter((l) => l.teacherId === t.id)
        .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      const remaining = (t.requiredHours || 20) - assigned;
      return { assigned, remaining };
    };

    lessons.forEach((les) => {
      const teacher = (this.timetable.teachers || []).find((t) => t.id === les.teacherId);
      let teacherRemainingInfo = '';
      let remClass = '';

      if (teacher) {
        const { remaining } = getTeacherStats(teacher);
        if (remaining > 0) {
          remClass = 'rem-positive';
          teacherRemainingInfo = `(απομένουν ${remaining} ώρες)`;
        } else if (remaining === 0) {
          remClass = 'rem-zero';
          teacherRemainingInfo = '(απομένουν 0 ώρες)';
        } else {
          remClass = 'rem-negative';
          teacherRemainingInfo = `(0 ώρες / +${Math.abs(remaining)} υπερωρία)`;
        }
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${les.className || les.classId}</strong></td>
        <td>
          <span class="badge" style="border-left: 3px solid ${les.subjectColor || '#3b82f6'}; font-weight: 500;">
            ${les.subjectName}
          </span>
        </td>
        <td>
          <div class="lesson-hours-ctrl">
            <input type="number" min="1" max="15" value="${les.hours}" class="input-lesson-hours" title="Ώρες ανά εβδομάδα (κλικ για αλλαγή)">
            <span class="hours-unit">ώρ.</span>
            ${les.defaultHours && les.defaultHours !== les.hours ? `
              <button type="button" class="btn-reset-hours" title="Επαναφορά στην επίσημη προεπιλογή (${les.defaultHours} ώρες)">↺ ${les.defaultHours}</button>
            ` : `
              <span class="hours-preset-hint" title="Προεπιλογή βάσει νομοθεσίας">προεπ. ${les.defaultHours || les.hours}</span>
            `}
          </div>
        </td>
        <td><small>${les.branch || '—'}</small></td>
        <td>
          ${teacher ? `
            <button type="button" class="btn-teacher-select assigned" title="Κλικ για αλλαγή ανάθεσης εκπαιδευτικού">
              <div class="assigned-teacher-label">
                <strong>${teacher.name}</strong>
                <span class="badge muted" style="font-size: 0.6875rem;">${teacher.branch || '—'}</span>
              </div>
              <span class="rem-badge ${remClass}" style="font-size: 0.75rem;">
                ${teacherRemainingInfo}
              </span>
              <span class="edit-icon">✎</span>
            </button>
          ` : `
            <button type="button" class="btn-teacher-select unassigned" title="Κλικ για επιλογή εκπαιδευτικού από τη λίστα">
              <span style="font-size: 1rem; font-weight: bold; color: var(--stamp);">＋</span>
              <span>Επιλογή Εκπαιδευτικού</span>
              ${les.branch ? `<span class="badge highlight" style="font-size: 0.7rem; margin-left: auto;">${les.branch}</span>` : ''}
            </button>
          `}
        </td>
        <td>
          <select class="sel-room">
            ${(this.timetable.rooms || []).map(
              (r) => `<option value="${r.id}" ${r.id === les.roomId ? 'selected' : ''}>${r.name}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          ${les.isSplit ? `<span class="badge danger">Παράλληλο (${les.splitType || 'Split'})</span>` : '<span class="badge muted">Ολόκληρο</span>'}
        </td>
      `;

      // 1. Change hours input
      const hoursInput = row.querySelector('.input-lesson-hours');
      hoursInput.onchange = (e) => {
        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
        les.hours = val;
        hoursInput.value = val;
        this.save();
        this.renderLessonsList(tbody, filterClass);
      };

      // 2. Reset to default hours
      const resetBtn = row.querySelector('.btn-reset-hours');
      if (resetBtn) {
        resetBtn.onclick = () => {
          les.hours = les.defaultHours;
          this.save();
          this.renderLessonsList(tbody, filterClass);
        };
      }

      // 3. Open Teacher Assignment Pop-up Modal
      const teacherBtn = row.querySelector('.btn-teacher-select');
      teacherBtn.onclick = () => {
        this.openTeacherAssignModal(les, () => {
          this.renderLessonsList(tbody, filterClass);
        });
      };

      // 4. Change room
      row.querySelector('.sel-room').onchange = (e) => {
        les.roomId = e.target.value;
        this.save();
      };

      tbody.append(row);
    });
  }

  // Pop-up modal ανάθεσης εκπαιδευτικού με εμφάνιση όλων των εκπαιδευτικών
  // και των υπολειπόμενων ωρών τους σε παρένθεση βάσει υποχρεωτικού ωραρίου
  openTeacherAssignModal(lesson, onSaved = null) {
    const dialog = document.createElement('dialog');
    dialog.className = 'teacher-assign-dialog';

    const teachers = this.timetable.teachers || [];
    const allLessons = this.timetable.lessons || [];

    // Helper υπολογισμού υπολειπόμενων ωρών
    const getTeacherStats = (t) => {
      const assigned = allLessons
        .filter((l) => l.teacherId === t.id)
        .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      const remaining = (t.requiredHours || 20) - assigned;
      return { assigned, remaining };
    };

    const hasTeachers = teachers.length > 0;

    dialog.innerHTML = `
      <div class="dialog-content teacher-picker-content">
        <div class="teacher-picker-header">
          <div>
            <h3>Ανάθεση Εκπαιδευτικού</h3>
            <p class="hint" style="margin: 0.25rem 0 0;">
              <strong>${lesson.subjectName}</strong> &bull; Τμήμα <strong>${lesson.className}</strong>
              &bull; <strong>${lesson.hours} ώρες/εβδομάδα</strong>
              ${lesson.branch ? ` &bull; Ειδικότητα: <span class="badge info">${lesson.branch}</span>` : ''}
            </p>
          </div>
          <button type="button" class="btn-close-picker" aria-label="Κλείσιμο">&times;</button>
        </div>

        ${hasTeachers ? `
          <div class="picker-search-bar">
            <input type="text" class="picker-search-input" placeholder="🔍 Αναζήτηση εκπαιδευτικού με όνομα ή ειδικότητα (π.χ. ΠΕ02, Γεώργιος)..." autofocus>
            <div class="picker-filter-chips">
              <button type="button" class="filter-chip active" data-filter="all">Όλοι (${teachers.length})</button>
              ${lesson.branch ? `<button type="button" class="filter-chip" data-filter="branch">Ειδικότητας (${lesson.branch})</button>` : ''}
              <button type="button" class="filter-chip" data-filter="available">Με διαθέσιμες ώρες</button>
            </div>
          </div>

          <div class="teacher-pick-list">
            <!-- Επιλογή καθαρισμού / Χωρίς ανάθεση -->
            <div class="teacher-pick-item clear-assign${!lesson.teacherId ? ' selected' : ''}" data-id="">
              <div class="teacher-pick-info">
                <span class="teacher-pick-name" style="color: var(--ink-soft);">— Χωρίς ανάθεση (Κενό μάθημα) —</span>
                <span class="teacher-pick-sub">Αφαίρεση τρέχουσας ανάθεσης από το μάθημα</span>
              </div>
              <div class="teacher-pick-hours">
                <span class="badge muted">Καθαρισμός</span>
              </div>
            </div>

            <!-- Λίστα όλων των εκπαιδευτικών -->
            <div class="teachers-group-list" id="picker-teachers-container"></div>
          </div>
        ` : `
          <div style="padding: 2.5rem; text-align: center;">
            <p class="hint" style="font-size: 1rem;">Δεν έχουν καταχωριστεί εκπαιδευτικοί στο ωρολόγιο πρόγραμμα.</p>
            <button type="button" class="primary btn-goto-teachers" style="margin-top: 1rem;">
              Μετάβαση στο Βήμα 2 (Εκπαιδευτικοί)
            </button>
          </div>
        `}
      </div>
    `;

    const close = () => {
      dialog.close();
      dialog.remove();
    };

    const closeBtn = dialog.querySelector('.btn-close-picker');
    if (closeBtn) closeBtn.onclick = close;

    // Click outside to close (backdrop)
    dialog.onclick = (e) => {
      if (e.target === dialog) close();
    };

    const gotoBtn = dialog.querySelector('.btn-goto-teachers');
    if (gotoBtn) {
      gotoBtn.onclick = () => {
        close();
        this.activeStep = 2;
        this.render();
      };
      document.body.append(dialog);
      dialog.showModal();
      return;
    }

    const container = dialog.querySelector('#picker-teachers-container');
    const searchInput = dialog.querySelector('.picker-search-input');
    const filterChips = dialog.querySelectorAll('.filter-chip');

    let currentFilter = 'all';
    let searchQuery = '';

    const renderTeachersListInPicker = () => {
      container.innerHTML = '';

      // Ταξινόμηση:
      // 1. Τρέχουσα ανάθεση πρώτα
      // 2. Συμβατή ειδικότητα
      // 3. Με διαθέσιμες ώρες
      // 4. Αλφαβητικά
      const sortedTeachers = [...teachers].sort((a, b) => {
        const isCurA = lesson.teacherId === a.id;
        const isCurB = lesson.teacherId === b.id;
        if (isCurA && !isCurB) return -1;
        if (!isCurA && isCurB) return 1;

        const matchA = lesson.branch && (a.branch === lesson.branch || a.branch.startsWith(lesson.branch) || lesson.branch.startsWith(a.branch));
        const matchB = lesson.branch && (b.branch === lesson.branch || b.branch.startsWith(lesson.branch) || lesson.branch.startsWith(b.branch));
        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;

        return a.name.localeCompare(b.name, 'el');
      });

      let visibleCount = 0;

      sortedTeachers.forEach((t) => {
        const { assigned, remaining } = getTeacherStats(t);
        const isCurrent = lesson.teacherId === t.id;
        const isMatchingBranch = lesson.branch && (
          t.branch === lesson.branch ||
          t.branch.startsWith(lesson.branch) ||
          lesson.branch.startsWith(t.branch)
        );

        // Filters
        if (currentFilter === 'branch' && !isMatchingBranch) return;
        if (currentFilter === 'available' && remaining <= 0) return;

        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesName = t.name.toLowerCase().includes(q);
          const matchesBranch = (t.branch || '').toLowerCase().includes(q);
          if (!matchesName && !matchesBranch) return;
        }

        visibleCount++;

        let remClass = 'rem-positive';
        let remText = `(απομένουν ${remaining} ώρες)`;
        if (remaining === 0) {
          remClass = 'rem-zero';
          remText = '(απομένουν 0 ώρες)';
        } else if (remaining < 0) {
          remClass = 'rem-negative';
          remText = `(απομένουν 0 ώρες / υπερωρία +${Math.abs(remaining)})`;
        }

        const item = document.createElement('div');
        item.className = `teacher-pick-item${isCurrent ? ' selected' : ''}${isMatchingBranch ? ' branch-match' : ''}`;
        item.innerHTML = `
          <div class="teacher-pick-info">
            <div class="teacher-pick-title-row">
              <span class="teacher-pick-name">${t.name}</span>
              <span class="badge ${isMatchingBranch ? 'success' : 'muted'}">${t.branch || '—'}</span>
              ${isCurrent ? '<span class="badge" style="background: var(--stamp); color: white;">✓ Τρέχουσα Ανάθεση</span>' : ''}
              ${isMatchingBranch && !isCurrent ? '<span class="badge highlight">Συμβατός Κλάδος</span>' : ''}
            </div>
            <span class="teacher-pick-sub">
              Υποχρεωτικό ωράριο: <strong>${t.requiredHours || 20} ώρες</strong> &bull; Ήδη ανατεθειμένες: <strong>${assigned} ώρες</strong>
            </span>
          </div>

          <div class="teacher-pick-hours">
            <span class="rem-badge ${remClass}">${remText}</span>
          </div>
        `;

        item.onclick = () => {
          lesson.teacherId = t.id;
          lesson.teacherName = t.name;
          this.save();
          close();
          if (onSaved) onSaved();
        };

        container.append(item);
      });

      if (visibleCount === 0) {
        container.innerHTML = `<div class="hint text-center" style="padding: 1.5rem;">Δεν βρέθηκε εκπαιδευτικός με τα επιλεγμένα κριτήρια.</div>`;
      }
    };

    // Clear assignment item click
    const clearItem = dialog.querySelector('.teacher-pick-item.clear-assign');
    if (clearItem) {
      clearItem.onclick = () => {
        lesson.teacherId = '';
        lesson.teacherName = '— Χωρίς εκπαιδευτικό —';
        this.save();
        close();
        if (onSaved) onSaved();
      };
    }

    // Search input
    searchInput.oninput = (e) => {
      searchQuery = e.target.value.trim();
      renderTeachersListInPicker();
    };

    // Filter chips
    filterChips.forEach((chip) => {
      chip.onclick = () => {
        filterChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        renderTeachersListInPicker();
      };
    });

    renderTeachersListInPicker();

    document.body.append(dialog);
    dialog.showModal();
  }

  // ── ΒΗΜΑ 4: Πρόγραμμα & Επίλυση (Matrix & Solver) ─────────────────────────
  renderStep4Schedule() {
    const div = document.createElement('div');
    div.className = 'panel-step';

    div.innerHTML = `
      <div class="step-intro">
        <h3>Βήμα 4: Αυτόματη Κατάρτιση &amp; Διαδραστικός Πίνακας (aSc Matrix)</h3>
        <p class="hint">Εκτελέστε τον αλγόριθμο επίλυσης για αυτόματη τοποθέτηση όλων των καρτών χωρίς συγκρούσεις, ή διαχειριστείτε το πρόγραμμα διαδραστικά.</p>
      </div>

      <div class="toolbar solver-toolbar">
        <button class="primary" id="btn-run-solver">⚡ Αυτόματη Επίλυση (Solver)</button>
        <button id="btn-clear-schedule" class="danger">Καθαρισμός Προγράμματος</button>
        <button id="btn-print-school" class="secondary">🖨️ Εκτύπωση / PDF</button>
      </div>

      <div class="matrix-mount-point" id="matrix-mount"></div>
    `;

    // Run Solver
    div.querySelector('#btn-run-solver').onclick = () => {
      // Έλεγχος αν υπάρχουν ανατεθειμένοι καθηγητές
      const lessons = this.timetable.lessons || [];
      const unassignedCount = lessons.filter((l) => !l.teacherId).length;
      if (unassignedCount > 0) {
        if (!confirm(`Υπάρχουν ${unassignedCount} μαθήματα χωρίς ανάθεση εκπαιδευτικού. Θέλετε να συνεχίσετε;`)) {
          return;
        }
      }

      const solver = new TimetableSolver(this.timetable);
      const res = solver.solve();

      if (res.success) {
        this.timetable.schedule = res.schedule;
        this.timetable.unplacedCards = [];
        this.save();
        this.render();
        alert(`Επιτυχία! Τοποθετήθηκαν και οι ${res.stats.placedCount} κάρτες σε ${res.stats.durationMs}ms χωρίς καμία σύγκρουση!`);
      } else {
        this.timetable.schedule = res.schedule;
        this.timetable.unplacedCards = res.unplacedCards;
        this.save();
        this.render();
        alert(`Ολοκληρώθηκε με μερική επιτυχία: Τοποθετήθηκαν ${res.stats.placedCount} κάρτες, αλλά έμειναν ${res.unplacedCards.length} ατοποθέτητες στο καλάθι λόγω ασυμβατότητας διαθεσιμότητας ή αιθουσών.`);
      }
    };

    // Clear schedule
    div.querySelector('#btn-clear-schedule').onclick = () => {
      if (confirm('Καθαρισμός όλων των τοποθετημένων καρτών του προγράμματος;')) {
        this.timetable.schedule = [];
        this.timetable.unplacedCards = [];
        this.save();
        this.render();
      }
    };

    // Print
    div.querySelector('#btn-print-school').onclick = () => {
      window.print();
    };

    // Render Matrix
    const mount = div.querySelector('#matrix-mount');
    this.matrix = new TimetableMatrix(mount, this.timetable, () => {
      this.save();
    });
    this.matrix.render();

    return div;
  }
}
