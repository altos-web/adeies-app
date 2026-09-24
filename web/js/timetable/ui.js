// ui.js — Κεντρική Διεπαφή & Διαχείριση Ωρολογίου Προγράμματος (aSc Timetables Workflow)
// Συντονίζει τα βήματα καταχώρισης (Σχολείο, Τμήματα, Εκπαιδευτικοί Time-off, Αναθέσεις, Solver & Matrix).

import { store } from '../store.js';
import { DAYS_OF_WEEK, SCHOOL_TYPES } from './curricula.js';
import { TimetableMatrix } from './matrix.js';
import { createInitialTimetable, populateCurriculumForClasses } from './model.js';
import { TimetableSolver } from './solver.js';

export class TimetableUI {
  constructor(container) {
    this.container = container;
    this.activeStep = 1; // 1: Σχολείο/Τμήματα, 2: Εκπαιδευτικοί/Time-off, 3: Αναθέσεις, 4: Πρόγραμμα (Solver & Matrix)
    this.timetable = store.getTimetable() || createInitialTimetable('gymnasio');
    this.matrix = null;
  }

  render() {
    this.container.innerHTML = '';

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
  }

  save() {
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
    const typeConfig = SCHOOL_TYPES[this.timetable.schoolType] || SCHOOL_TYPES.gymnasio;

    const renderClassesList = () => {
      classesList.innerHTML = '';
      this.timetable.classes.forEach((cls, idx) => {
        const item = document.createElement('div');
        item.className = 'class-chip';
        item.innerHTML = `
          <div class="class-chip-info">
            <strong>${cls.name}</strong>
            <span class="class-grade">Τάξη ${cls.grade}</span>
          </div>
          <button class="chip-delete danger" title="Διαγραφή">✕</button>
        `;
        item.querySelector('.chip-delete').onclick = () => {
          this.timetable.classes.splice(idx, 1);
          this.save();
          renderClassesList();
        };
        classesList.append(item);
      });
    };
    renderClassesList();

    // Add class button
    div.querySelector('#btn-add-class').onclick = () => {
      const grade = prompt(`Επιλέξτε Τάξη (${typeConfig.grades.join(', ')}):`, typeConfig.grades[0]);
      if (!grade) return;
      const name = prompt(`Όνομα τμήματος (π.χ. ${grade}1, ${grade}2):`, `${grade}${this.timetable.classes.filter((c) => c.grade === grade).length + 1}`);
      if (!name) return;

      this.timetable.classes.push({
        id: `c_${Date.now()}`,
        name: name.trim().toUpperCase(),
        grade: grade.trim().toUpperCase(),
      });
      this.save();
      renderClassesList();
    };

    div.querySelector('#btn-to-step-2').onclick = () => {
      this.activeStep = 2;
      this.render();
    };

    return div;
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

    // Sync from employees tab
    div.querySelector('#btn-sync-employees').onclick = () => {
      const employees = store.getEmployees();
      if (!employees.length) {
        alert('Δεν έχουν καταχωριστεί εργαζόμενοι στην καρτέλα 02 («Εργαζόμενοι»).');
        return;
      }
      let added = 0;
      employees.forEach((emp) => {
        if (!this.timetable.teachers.some((t) => t.id === emp.id)) {
          this.timetable.teachers.push({
            id: emp.id,
            name: emp.onomateponymo || `${emp.eponymo || ''} ${emp.onoma || ''}`.trim() || 'Εκπαιδευτικός',
            branch: emp.klados || 'ΠΕ02',
            requiredHours: 21, // Προεπιλογή
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
      const hours = Number(prompt('Υποχρεωτικό εβδομαδιαίο διδακτικό ωράριο (ώρες):', '21')) || 21;

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
    if (!this.timetable.teachers.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="hint text-center">Δεν έχει καταχωριστεί κανένας εκπαιδευτικός. Πατήστε «Συγχρονισμός» ή «Προσθήκη».</td></tr>`;
      return;
    }

    this.timetable.teachers.forEach((t) => {
      // Υπολογισμός ανατεθειμένων ωρών από τα μαθήματα
      const assigned = this.timetable.lessons
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
        <p class="hint">Φορτώστε το επίσημο αναλυτικό πρόγραμμα και αναθέστε τους καθηγητές στα μαθήματα κάθε τμήματος.</p>
      </div>

      <div class="toolbar">
        <button class="primary" id="btn-load-curriculum">📋 Αυτόματη Φόρτωση Επίσημου Ωρολογίου Προγράμματος</button>
        <span class="badge info">${this.timetable.lessons.length} ενεργά μαθήματα</span>
      </div>

      <div class="lessons-table-wrap">
        <table class="list lessons-table">
          <thead>
            <tr>
              <th>Τμήμα</th>
              <th>Μάθημα</th>
              <th>Ώρες / Εβδ.</th>
              <th>Ειδικότητα</th>
              <th>Ανάθεση Εκπαιδευτικού</th>
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

    div.querySelector('#btn-load-curriculum').onclick = () => {
      if (confirm('Θέλετε να φορτώσετε το επίσημο ωρολόγιο πρόγραμμα για όλα τα τμήματα; Αυτό θα αντικαταστήσει τα υπάρχοντα μαθήματα.')) {
        populateCurriculumForClasses(this.timetable);
        this.save();
        this.render();
      }
    };

    const tbody = div.querySelector('#lessons-tbody');
    this.renderLessonsList(tbody);

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

  renderLessonsList(tbody) {
    tbody.innerHTML = '';
    if (!this.timetable.lessons.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="hint text-center">Δεν υπάρχουν μαθήματα. Πατήστε «Αυτόματη Φόρτωση Επίσημου Ωρολογίου Προγράμματος».</td></tr>`;
      return;
    }

    this.timetable.lessons.forEach((les) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${les.className || les.classId}</strong></td>
        <td>
          <span class="badge" style="border-left: 3px solid ${les.subjectColor || '#3b82f6'};">
            ${les.subjectName}
          </span>
        </td>
        <td><strong>${les.hours}</strong> ώρες</td>
        <td><small>${les.branch || '—'}</small></td>
        <td>
          <select class="sel-teacher">
            <option value="">— Χωρίς ανάθεση —</option>
            ${this.timetable.teachers.map(
              (t) => `<option value="${t.id}" ${t.id === les.teacherId ? 'selected' : ''}>${t.name} (${t.branch})</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <select class="sel-room">
            ${this.timetable.rooms.map(
              (r) => `<option value="${r.id}" ${r.id === les.roomId ? 'selected' : ''}>${r.name}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          ${les.isSplit ? `<span class="badge danger">Παράλληλο (${les.splitType || 'Split'})</span>` : '<span class="badge muted">Ολόκληρο</span>'}
        </td>
      `;

      row.querySelector('.sel-teacher').onchange = (e) => {
        const tId = e.target.value;
        const teacher = this.timetable.teachers.find((t) => t.id === tId);
        les.teacherId = tId;
        les.teacherName = teacher ? teacher.name : '';
        this.save();
      };

      row.querySelector('.sel-room').onchange = (e) => {
        les.roomId = e.target.value;
        this.save();
      };

      tbody.append(row);
    });
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
      const unassignedCount = this.timetable.lessons.filter((l) => !l.teacherId).length;
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
