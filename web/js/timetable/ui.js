// ui.js — Κεντρική Διεπαφή & Διαχείριση Ωρολογίου Προγράμματος (aSc Timetables Workflow)
// Συντονίζει τα βήματα καταχώρισης (Σχολείο, Τμήματα, Εκπαιδευτικοί Time-off, Αναθέσεις, Solver & Matrix).

import { store } from '../store.js';
import { DAYS_OF_WEEK, DEFAULT_BELL_TIMES, DIMOTIKO_ORGANICITIES, getBranchesForSchoolType, isBranchValidForSchoolType, SCHOOL_TYPES } from './curricula.js';
import { TimetableMatrix } from './matrix.js';
import { autoAssignTeachers, buildBellTimes, createInitialTimetable, getAvailableDistributions, getDefaultLessonDistribution, normalizeTimetable, populateCurriculumForClasses, splitMultigradeLesson, syncSpecialClasses } from './model.js';
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

  reloadFromStore() {
    this.timetable = normalizeTimetable(store.getTimetable() || createInitialTimetable('gymnasio'));
  }

  createStepsNav() {
    const nav = document.createElement('div');
    nav.className = 'timetable-wizard-nav';

    const stepsWrap = document.createElement('div');
    stepsWrap.className = 'wizard-steps-list';

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
      stepsWrap.append(btn);
    });
    nav.append(stepsWrap);

    // Quick I/O buttons for Timetable
    const ioWrap = document.createElement('div');
    ioWrap.className = 'timetable-quick-io';
    ioWrap.style.cssText = 'display: flex; gap: 0.5rem; margin-left: auto; align-items: center;';
    ioWrap.innerHTML = `
      <button type="button" class="secondary" id="btn-tt-import" style="padding: 0.35rem 0.75rem; font-size: 0.8125rem; font-weight: 500;" title="Εισαγωγή ωρολογίου, εκπαιδευτικών & αναθέσεων από JSON">📥 Εισαγωγή JSON</button>
      <button type="button" class="secondary" id="btn-tt-export" style="padding: 0.35rem 0.75rem; font-size: 0.8125rem; font-weight: 500;" title="Εξαγωγή πλήρους αντιγράφου JSON">📤 Εξαγωγή JSON</button>
    `;

    ioWrap.querySelector('#btn-tt-import').onclick = () => {
      const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json' });
      input.onchange = async () => {
        try {
          const text = await input.files[0].text();
          const parsed = JSON.parse(text);
          store.importAll(parsed);
          this.reloadFromStore();
          this.render();
          const lesCount = (this.timetable.lessons || []).length;
          const assignedCount = (this.timetable.lessons || []).filter((l) => l.teacherId).length;
          alert(`Το αρχείο φορτώθηκε επιτυχώς! Περιλαμβάνει ${this.timetable.teachers.length} εκπαιδευτικούς και ${assignedCount}/${lesCount} ανατεθειμένα μαθήματα.`);
        } catch (err) {
          alert('Σφάλμα εισαγωγής JSON: ' + err.message);
        }
      };
      input.click();
    };

    ioWrap.querySelector('#btn-tt-export').onclick = () => {
      const data = store.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `orologio_programma_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    nav.append(ioWrap);

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

        ${this.timetable.schoolType === 'dimotiko' ? `
          <label class="field">
            <span class="label">Λειτουργικότητα / Οργανικότητα Δημοτικού</span>
            <select id="tt-dimotiko-organicity">
              ${Object.values(DIMOTIKO_ORGANICITIES).map(
                (org) => `<option value="${org.id}" ${org.id === (this.timetable.dimotikoOrganicity || '6th_plus') ? 'selected' : ''}>${org.name}</option>`
              ).join('')}
            </select>
          </label>

          <div class="programs-options-card" style="grid-column: 1 / -1; margin-top: 0.5rem; padding: 1rem 1.25rem; border: 1px solid var(--rule); border-radius: 6px; background: var(--card);">
            <div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>Πρόσθετα Προγράμματα Δημοτικού (Προαιρετικά — Π.Δ. 79/2017 &amp; Ν. 4957/2022)</span>
            </div>
            <p class="hint" style="font-size: 0.8125rem; margin-bottom: 0.85rem;">
              Ενεργοποιήστε την Πρωινή Ζώνη ή το Ολοήμερο Πρόγραμμα αν λειτουργούν στη σχολική μονάδα.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              <!-- 1. Πρωινή Ζώνη -->
              <label style="display: flex; align-items: flex-start; gap: 0.6rem; cursor: pointer;">
                <input type="checkbox" id="cb-has-proini-zoni" ${this.timetable.hasProiniZoni ? 'checked' : ''} style="margin-top: 0.2rem;">
                <div>
                  <strong style="font-size: 0.875rem;">🌅 Πρωινή Ζώνη (07:00 - 08:00)</strong>
                  <div class="hint" style="font-size: 0.8125rem;">5 ώρες/εβδομάδα (1 ώρα καθημερινά 07:00 - 08:00, πριν την έναρξη των πρωινών μαθημάτων).</div>
                </div>
              </label>

              <!-- 2. Ολοήμερο Πρόγραμμα -->
              <div style="border-top: 1px solid var(--rule); padding-top: 0.85rem;">
                <label style="display: flex; align-items: flex-start; gap: 0.6rem; cursor: pointer;">
                  <input type="checkbox" id="cb-has-oloimero" ${this.timetable.hasOloimero ? 'checked' : ''} style="margin-top: 0.2rem;">
                  <div>
                    <strong style="font-size: 0.875rem;">☀️ Ολοήμερο Πρόγραμμα</strong>
                    <div class="hint" style="font-size: 0.8125rem;">Πρόγραμμα μετά τη λήξη των πρωινών μαθημάτων (Διατροφική Αγωγή / Σίτιση, Μελέτη-Προετοιμασία, Δραστηριότητες).</div>
                  </div>
                </label>

                <div id="oloimero-details-panel" style="margin-top: 0.75rem; margin-left: 1.8rem; display: ${this.timetable.hasOloimero ? 'flex' : 'none'}; flex-direction: column; gap: 0.6rem; padding: 0.75rem 1rem; background: var(--wash); border-radius: 5px; border: 1px solid var(--rule);">
                  <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.875rem;">
                      <input type="radio" name="rb-oloimero-type" value="basic" ${(this.timetable.oloimeroType || 'basic') === 'basic' ? 'checked' : ''}>
                      <span><strong>Βασικό Ολοήμερο (έως 16:00)</strong> — 3 ώρες/ημέρα (15 ώρες/εβδ.)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.875rem;">
                      <input type="radio" name="rb-oloimero-type" value="expanded" ${this.timetable.oloimeroType === 'expanded' ? 'checked' : ''}>
                      <span><strong>Αναβαθμισμένο Ολοήμερο (έως 17:30)</strong> — 5 ώρες/ημέρα (25 ώρες/εβδ.)</span>
                    </label>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.875rem; margin-top: 0.25rem;">
                    <span>Αριθμός τμημάτων Ολοημέρου:</span>
                    <input type="number" id="input-oloimero-count" min="1" max="6" value="${this.timetable.oloimeroCount || 1}" style="width: 4rem; padding: 0.2rem 0.4rem; border: 1px solid var(--rule); border-radius: 4px; text-align: center; font-weight: 600;">
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="classes-management-section">
        <div class="section-header">
          <h4>Τμήματα Σχολείου (${this.timetable.classes.length})</h4>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${this.timetable.schoolType === 'dimotiko' ? `
              <button type="button" class="secondary" id="btn-reset-dimotiko-classes" title="Αυτόματος ορισμός των 6 αυτόνομων τάξεων (Α1 έως ΣΤ1)">⚡ Αυτόματα 6 Τμήματα (Α1-ΣΤ1)</button>
            ` : ''}
            <button class="primary" id="btn-add-class">+ Προσθήκη Τμήματος</button>
          </div>
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

    // Organicity change for Dimotiko
    const organicitySelect = div.querySelector('#tt-dimotiko-organicity');
    if (organicitySelect) {
      organicitySelect.onchange = (e) => {
        const orgId = e.target.value;
        const org = DIMOTIKO_ORGANICITIES[orgId];
        if (!org) return;
        if (confirm(`Προσαρμογή τμημάτων και ωρών στη λειτουργικότητα «${org.shortName}»; Αυτό θα ενημερώσει τα τμήματα και τις ώρες ανά ημέρα.`)) {
          this.timetable.dimotikoOrganicity = orgId;
          this.timetable.periodsPerDay = org.periodsPerDay;
          this.timetable.classes = JSON.parse(JSON.stringify(org.defaultClasses));
          this.timetable.bellTimes = buildBellTimes(this.timetable);
          populateCurriculumForClasses(this.timetable);
          if (this.timetable.teachers && this.timetable.teachers.length > 0) {
            autoAssignTeachers(this.timetable, { overwriteExisting: false });
          }
          this.timetable.schedule = [];
          this.timetable.unplacedCards = [];
          this.save();
          this.render();
        } else {
          e.target.value = this.timetable.dimotikoOrganicity || '6th_plus';
        }
      };
    }

    // Πρωινή Ζώνη Listener
    const cbProiniZoni = div.querySelector('#cb-has-proini-zoni');
    if (cbProiniZoni) {
      cbProiniZoni.onchange = (e) => {
        this.timetable.hasProiniZoni = e.target.checked;
        syncSpecialClasses(this.timetable);
        this.timetable.bellTimes = buildBellTimes(this.timetable);
        populateCurriculumForClasses(this.timetable);
        if (this.timetable.teachers && this.timetable.teachers.length > 0) {
          autoAssignTeachers(this.timetable, { overwriteExisting: false });
        }
        this.save();
        renderClassesList();
      };
    }

    // Ολοήμερο Listener
    const cbOloimero = div.querySelector('#cb-has-oloimero');
    const oloPanel = div.querySelector('#oloimero-details-panel');
    if (cbOloimero) {
      cbOloimero.onchange = (e) => {
        this.timetable.hasOloimero = e.target.checked;
        if (oloPanel) oloPanel.style.display = e.target.checked ? 'flex' : 'none';
        this.timetable.periodsPerDay = e.target.checked ? (this.timetable.oloimeroType === 'expanded' ? 11 : 9) : 6;
        syncSpecialClasses(this.timetable);
        this.timetable.bellTimes = buildBellTimes(this.timetable);
        populateCurriculumForClasses(this.timetable);
        if (this.timetable.teachers && this.timetable.teachers.length > 0) {
          autoAssignTeachers(this.timetable, { overwriteExisting: false });
        }
        this.save();
        renderClassesList();
      };
    }

    // Τύπος Ολοημέρου (Βασικό / Αναβαθμισμένο)
    div.querySelectorAll('input[name="rb-oloimero-type"]').forEach((rb) => {
      rb.onchange = (e) => {
        this.timetable.oloimeroType = e.target.value;
        this.timetable.periodsPerDay = this.timetable.oloimeroType === 'expanded' ? 11 : 9;
        this.timetable.bellTimes = buildBellTimes(this.timetable);
        populateCurriculumForClasses(this.timetable);
        if (this.timetable.teachers && this.timetable.teachers.length > 0) {
          autoAssignTeachers(this.timetable, { overwriteExisting: false });
        }
        this.save();
        renderClassesList();
      };
    });

    // Αριθμός Τμημάτων Ολοημέρου
    const inputOloCount = div.querySelector('#input-oloimero-count');
    if (inputOloCount) {
      inputOloCount.onchange = (e) => {
        const cnt = Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 1));
        this.timetable.oloimeroCount = cnt;
        inputOloCount.value = cnt;
        syncSpecialClasses(this.timetable);
        populateCurriculumForClasses(this.timetable);
        if (this.timetable.teachers && this.timetable.teachers.length > 0) {
          autoAssignTeachers(this.timetable, { overwriteExisting: false });
        }
        this.save();
        renderClassesList();
      };
    }

    // Reset 6 classes button for Dimotiko
    const resetDimotikoBtn = div.querySelector('#btn-reset-dimotiko-classes');
    if (resetDimotikoBtn) {
      resetDimotikoBtn.onclick = () => {
        if (confirm('Επαναφορά των 6 αυτόνομων τμημάτων (Α1, Β1, Γ1, Δ1, Ε1, ΣΤ1);')) {
          this.timetable.dimotikoOrganicity = '6th_plus';
          this.timetable.periodsPerDay = this.timetable.hasOloimero ? (this.timetable.oloimeroType === 'expanded' ? 11 : 9) : 6;
          this.timetable.classes = JSON.parse(JSON.stringify(DIMOTIKO_ORGANICITIES['6th_plus'].defaultClasses));
          this.timetable.bellTimes = buildBellTimes(this.timetable);
          populateCurriculumForClasses(this.timetable);
          if (this.timetable.teachers && this.timetable.teachers.length > 0) {
            autoAssignTeachers(this.timetable, { overwriteExisting: false });
          }
          this.timetable.schedule = [];
          this.timetable.unplacedCards = [];
          this.save();
          this.render();
        }
      };
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

        const isSpecialPZ = cls.isProiniZoni || cls.id === 'c_proini_zoni';
        const isSpecialOlo = cls.isOloimero || cls.id.startsWith('c_olo_');
        const isMulti = !isSpecialPZ && !isSpecialOlo && Array.isArray(cls.grades) && cls.grades.length > 1;

        const cycleBadge = isMulti
          ? `<span class="badge info" style="font-size: 0.75rem; margin-left: 0.4rem; padding: 0.15rem 0.45rem;" title="Εκπαιδευτικός Κύκλος Συνδιδασκαλίας (Π.Δ. 79/2017)">Κύκλος ${cls.cycle || 'Α'}΄</span>`
          : '';

        let gradeBadgesHtml = '';
        if (isSpecialPZ) {
          gradeBadgesHtml = `<div class="class-grade-tag single" style="background: #e0e7ff; color: #3730a3; border-color: #c7d2fe;">🌅 Πρωινή Ζώνη (07:00 - 08:00)</div>`;
        } else if (isSpecialOlo) {
          gradeBadgesHtml = `<div class="class-grade-tag single" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">☀️ Ολοήμερο Πρόγραμμα</div>`;
        } else if (isMulti) {
          gradeBadgesHtml = `<div class="class-grade-tag multi" title="Συνδιδασκόμενο τμήμα (${cls.grades.length} τάξεις: ${cls.grades.join(', ')})">
               <span class="multi-indicator">Συνδιδασκαλία</span>
               <span class="grades-pills">${cls.grades.map((g) => `<span class="pill">${g}</span>`).join('')}</span>
               ${cycleBadge}
             </div>`;
        } else {
          gradeBadgesHtml = `<div class="class-grade-tag single">Τάξη ${cls.grade || (cls.grades && cls.grades[0]) || ''}</div>`;
        }

        item.innerHTML = `
          <div class="class-chip-content">
            <span class="drag-handle" title="Σύρετε για αναδιάταξη">⠿</span>
            <div class="class-chip-info" title="${isSpecialPZ || isSpecialOlo ? '' : 'Κλικ για επεξεργασία'}">
              <strong class="class-title">${cls.name}</strong>
              ${gradeBadgesHtml}
            </div>
          </div>
          <div class="chip-actions">
            ${isSpecialPZ || isSpecialOlo ? '' : '<button class="chip-edit" title="Επεξεργασία">✎</button>'}
            <button class="chip-delete danger" title="Διαγραφή">✕</button>
          </div>
        `;

        // Click to edit
        if (!isSpecialPZ && !isSpecialOlo) {
          const handleEdit = () => {
            this.openClassModal(cls, () => renderClassesList());
          };
          item.querySelector('.class-chip-content').onclick = handleEdit;
          item.querySelector('.chip-edit').onclick = handleEdit;
        }

        // Delete
        item.querySelector('.chip-delete').onclick = (e) => {
          e.stopPropagation();
          if (isSpecialPZ) {
            if (confirm('Απενεργοποίηση της Πρωινής Ζώνης;')) {
              this.timetable.hasProiniZoni = false;
              syncSpecialClasses(this.timetable);
              this.timetable.bellTimes = buildBellTimes(this.timetable);
              this.save();
              this.render();
            }
            return;
          }
          if (isSpecialOlo) {
            if (confirm(`Διαγραφή του τμήματος ${cls.name};`)) {
              if ((this.timetable.oloimeroCount || 1) <= 1) {
                this.timetable.hasOloimero = false;
              } else {
                this.timetable.oloimeroCount = (this.timetable.oloimeroCount || 1) - 1;
              }
              syncSpecialClasses(this.timetable);
              this.timetable.bellTimes = buildBellTimes(this.timetable);
              this.save();
              this.render();
            }
            return;
          }
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

  // Pop-up modal για επιλογή τάξης/τάξεων (μονοθεματικών ή συνδιδασκόμενων) και ονόματος τμήματος
  openClassModal(clsToEdit = null, onSaved = null) {
    const typeConfig = SCHOOL_TYPES[this.timetable.schoolType] || SCHOOL_TYPES.gymnasio;
    const dialog = document.createElement('dialog');
    dialog.className = 'class-dialog';

    // Αρχικές επιλεγμένες τάξεις
    let initialGrades = [];
    if (clsToEdit) {
      if (Array.isArray(clsToEdit.grades) && clsToEdit.grades.length > 0) {
        initialGrades = [...clsToEdit.grades];
      } else if (clsToEdit.grade) {
        if (clsToEdit.grade === 'Α_ΣΤ' || clsToEdit.grade === 'Α_Β_Γ_Δ_Ε_ΣΤ') {
          initialGrades = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'];
        } else if (clsToEdit.grade === 'Α_Γ' || clsToEdit.grade === 'Α_Β_Γ') {
          initialGrades = ['Α', 'Β', 'Γ'];
        } else if (clsToEdit.grade === 'Δ_ΣΤ' || clsToEdit.grade === 'Δ_Ε_ΣΤ') {
          initialGrades = ['Δ', 'Ε', 'ΣΤ'];
        } else if (clsToEdit.grade === 'Α_Β') {
          initialGrades = ['Α', 'Β'];
        } else if (clsToEdit.grade === 'Γ_Δ') {
          initialGrades = ['Γ', 'Δ'];
        } else if (clsToEdit.grade === 'Ε_ΣΤ') {
          initialGrades = ['Ε', 'ΣΤ'];
        } else if (clsToEdit.grade.includes('_')) {
          initialGrades = clsToEdit.grade.split('_');
        } else {
          initialGrades = [clsToEdit.grade];
        }
      }
    }
    if (initialGrades.length === 0) {
      initialGrades = [typeConfig.grades[0]];
    }

    let isUserEditedName = Boolean(clsToEdit);

    const suggestName = (selectedGrades) => {
      if (!selectedGrades || selectedGrades.length === 0) return '';
      if (selectedGrades.length === 1) {
        const gr = selectedGrades[0];
        const count = this.timetable.classes.filter((c) => {
          if (clsToEdit && c.id === clsToEdit.id) return false;
          return c.grades && c.grades.length === 1 && c.grades[0] === gr;
        }).length;
        return `${gr}${count + 1}`;
      }
      if (this.timetable.schoolType === 'dimotiko' && selectedGrades.length === 6) {
        return 'Α-ΣΤ';
      }
      return selectedGrades.join('-');
    };

    const defaultName = clsToEdit ? clsToEdit.name : suggestName(initialGrades);

    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>${clsToEdit ? 'Επεξεργασία Τμήματος' : 'Προσθήκη Νέου Τμήματος'}</h3>
        <p class="hint">
          Επιλέξτε τις τάξεις που φοιτούν στο τμήμα. Στα ολιγοθέσια δημοτικά (1/θέσια έως 5/θέσια) μπορείτε να τσεκάρετε 2 ή περισσότερες τάξεις για <strong>συνδιδασκαλία</strong>.
        </p>

        <div style="margin-top: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
            <span class="label" style="font-weight: 600;">Τάξεις Τμήματος</span>
            <span class="sublabel hint" style="font-size: 0.8125rem;">(Τσεκάρετε μία ή περισσότερες)</span>
          </div>

          ${this.timetable.schoolType === 'dimotiko' ? `
            <div class="grade-presets-bar">
              <span class="presets-title">Συνήθεις συνδυασμοί:</span>
              <button type="button" class="btn-preset-grade" data-grades="Α,Β,Γ,Δ,Ε,ΣΤ" title="1 τμήμα με όλες τις τάξεις">1/θ (Α-ΣΤ)</button>
              <button type="button" class="btn-preset-grade" data-grades="Α,Β,Γ" title="Συνδιδασκαλία Α, Β, Γ">2/θ (Α-Β-Γ)</button>
              <button type="button" class="btn-preset-grade" data-grades="Δ,Ε,ΣΤ" title="Συνδιδασκαλία Δ, Ε, ΣΤ">2/θ (Δ-Ε-ΣΤ)</button>
              <button type="button" class="btn-preset-grade" data-grades="Α,Β" title="Συνδιδασκαλία Α, Β">3/θ (Α-Β)</button>
              <button type="button" class="btn-preset-grade" data-grades="Γ,Δ" title="Συνδιδασκαλία Γ, Δ">3/θ & 4/θ (Γ-Δ)</button>
              <button type="button" class="btn-preset-grade" data-grades="Ε,ΣΤ" title="Συνδιδασκαλία Ε, ΣΤ">Ε-ΣΤ</button>
            </div>
          ` : ''}

          <div class="grade-checkboxes-grid" id="modal-grade-checkboxes">
            ${typeConfig.grades.map((g) => {
              const isChecked = initialGrades.includes(g);
              return `
                <label class="grade-checkbox-label">
                  <input type="checkbox" name="modal-class-grade-cb" value="${g}" ${isChecked ? 'checked' : ''}>
                  <div class="grade-box">
                    <span class="grade-check-icon">✓</span>
                    <span class="grade-name">Τάξη ${g}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </div>

          <div id="modal-grade-status" class="grade-selection-status"></div>
        </div>

        <div id="modal-cycle-container" style="margin-top: 1rem; padding: 0.85rem; border: 1px solid var(--rule); border-radius: 6px; background: rgba(59, 130, 246, 0.04); display: ${initialGrades.length > 1 ? 'block' : 'none'};">
          <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;">Εκπαιδευτικός Κύκλος Συνδιδασκαλίας (Π.Δ. 79/2017 & Υ.Α. 83939/Δ1)</div>
          <p class="hint" style="font-size: 0.8125rem; margin-bottom: 0.6rem;">
            Στα συνδιδασκόμενα τμήματα, τα γνωστικά αντικείμενα (Ιστορία, Γεωγραφία, Φυσικά, ΚΠΑ, Θρησκευτικά) διδάσκονται σε 2 εναλλασσόμενους κύκλους ανά σχολικό έτος σε όλο το τμήμα, ενώ στη Γλώσσα και τα Μαθηματικά γίνεται άμεση διδασκαλία ανά τάξη με σιωπηρές εργασίες.
          </p>
          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.875rem;">
              <input type="radio" name="modal-class-cycle" value="A" ${(clsToEdit?.cycle || 'A') === 'A' ? 'checked' : ''}>
              <span><strong>Κύκλος Α΄</strong> (π.χ. Ύλη Γ΄ / Ε΄ Τάξης — Τρέχον Έτος)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.875rem;">
              <input type="radio" name="modal-class-cycle" value="B" ${(clsToEdit?.cycle || 'A') === 'B' ? 'checked' : ''}>
              <span><strong>Κύκλος Β΄</strong> (π.χ. Ύλη Δ΄ / ΣΤ΄ Τάξης — Επόμενο Έτος)</span>
            </label>
          </div>
        </div>

        <div class="form-grid" style="margin-top: 1rem;">
          <label class="field" style="width: 100%;">
            <span class="label" style="font-weight: 600;">Όνομα Τμήματος</span>
            <input type="text" id="modal-class-name" value="${defaultName}" placeholder="π.χ. Α1, Α-Β, Γ-Δ, Α-ΣΤ" autofocus>
            <span class="hint" style="font-size: 0.8125rem; margin-top: 0.25rem;">
              Προτείνεται αυτόματα βάσει των επιλεγμένων τάξεων ή πληκτρολογήστε τη δική σας ονομασία.
            </span>
          </label>
        </div>

        <div class="toolbar" style="margin-top: 1.5rem; justify-content: flex-end;">
          <button type="button" class="btn-cancel">Άκυρο</button>
          <button type="button" class="primary btn-save">Αποθήκευση</button>
        </div>
      </div>
    `;

    const checkboxes = Array.from(dialog.querySelectorAll('input[name="modal-class-grade-cb"]'));
    const statusEl = dialog.querySelector('#modal-grade-status');
    const nameInput = dialog.querySelector('#modal-class-name');

    const getSelectedGrades = () => {
      return typeConfig.grades.filter((g) => {
        const cb = checkboxes.find((c) => c.value === g);
        return cb && cb.checked;
      });
    };

    const updateStatusAndName = () => {
      const selected = getSelectedGrades();
      if (selected.length === 0) {
        statusEl.innerHTML = '<span class="status-warning">⚠️ Παρακαλώ επιλέξτε τουλάχιστον μία τάξη.</span>';
      } else if (selected.length === 1) {
        statusEl.innerHTML = `<span class="status-ok">✓ Αυτόνομο τμήμα: <strong>Τάξη ${selected[0]}</strong></span>`;
      } else if (this.timetable.schoolType === 'dimotiko' && selected.length === 6) {
        statusEl.innerHTML = `<span class="status-multi">⚡ <strong>Συνδιδασκόμενο τμήμα (Μονοθέσιο)</strong>: Όλες οι τάξεις (Α, Β, Γ, Δ, Ε, ΣΤ)</span>`;
      } else {
        statusEl.innerHTML = `<span class="status-multi">⚡ <strong>Συνδιδασκόμενο τμήμα</strong> (${selected.length} τάξεις: <strong>${selected.join(', ')}</strong>)</span>`;
      }

      const cycleContainer = dialog.querySelector('#modal-cycle-container');
      if (cycleContainer) {
        cycleContainer.style.display = selected.length > 1 ? 'block' : 'none';
      }

      if (!isUserEditedName) {
        nameInput.value = suggestName(selected);
      }
    };

    checkboxes.forEach((cb) => {
      cb.onchange = () => {
        updateStatusAndName();
      };
    });

    nameInput.oninput = () => {
      isUserEditedName = true;
    };

    // Quick presets handling
    dialog.querySelectorAll('.btn-preset-grade').forEach((btn) => {
      btn.onclick = () => {
        const targetGrades = btn.dataset.grades.split(',');
        checkboxes.forEach((cb) => {
          cb.checked = targetGrades.includes(cb.value);
        });
        isUserEditedName = false;
        updateStatusAndName();
      };
    });

    updateStatusAndName();

    const close = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('.btn-cancel').onclick = close;

    const save = () => {
      const selectedGrades = getSelectedGrades();
      if (selectedGrades.length === 0) {
        alert('Παρακαλώ επιλέξτε τουλάχιστον μία τάξη για το τμήμα.');
        return;
      }

      const name = nameInput.value.trim().toUpperCase();
      if (!name) {
        alert('Παρακαλώ εισαγάγετε όνομα τμήματος.');
        return;
      }

      // Κανονικοποίηση κωδικού τάξης (canonical grade identifier)
      let canonicalGrade = selectedGrades.join('_');
      if (selectedGrades.length === 1) {
        canonicalGrade = selectedGrades[0];
      } else if (this.timetable.schoolType === 'dimotiko') {
        const joined = selectedGrades.join('');
        if (selectedGrades.length === 6) canonicalGrade = 'Α_ΣΤ';
        else if (joined === 'ΑΒΓ') canonicalGrade = 'Α_Γ';
        else if (joined === 'ΔΕΣΤ') canonicalGrade = 'Δ_ΣΤ';
        else if (joined === 'ΑΒ') canonicalGrade = 'Α_Β';
        else if (joined === 'ΓΔ') canonicalGrade = 'Γ_Δ';
        else if (joined === 'ΕΣΤ') canonicalGrade = 'Ε_ΣΤ';
      }

      const cycleRadio = dialog.querySelector('input[name="modal-class-cycle"]:checked');
      const selectedCycle = selectedGrades.length > 1 ? (cycleRadio?.value || 'A') : null;

      if (clsToEdit) {
        clsToEdit.name = name;
        clsToEdit.grade = canonicalGrade;
        clsToEdit.grades = selectedGrades;
        clsToEdit.cycle = selectedCycle;
      } else {
        this.timetable.classes.push({
          id: `c_${Date.now()}`,
          name,
          grade: canonicalGrade,
          grades: selectedGrades,
          cycle: selectedCycle,
        });
      }

      // Αυτόματος επαναπροσδιορισμός των μαθημάτων για όλα τα τμήματα ώστε να ανανεωθούν
      populateCurriculumForClasses(this.timetable);
      if (this.timetable.teachers && this.timetable.teachers.length > 0) {
        autoAssignTeachers(this.timetable, { overwriteExisting: false });
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
      if (this.timetable.lessons && this.timetable.lessons.length > 0) {
        autoAssignTeachers(this.timetable, { overwriteExisting: false });
      }
      this.save();
      this.render();
      alert(`Συγχρονίστηκαν ${added} εκπαιδευτικοί!`);
    };

    // Add manual teacher with Pop-up Modal
    div.querySelector('#btn-add-teacher').onclick = () => {
      this.openTeacherFormModal(null, () => this.render());
    };

    const tbody = div.querySelector('#teachers-tbody');
    this.renderTeachersList(tbody);

    div.querySelector('#btn-back-step-1').onclick = () => {
      this.activeStep = 1;
      this.render();
    };
    div.querySelector('#btn-to-step-3').onclick = () => {
      if (this.timetable.lessons && this.timetable.lessons.length > 0 && this.timetable.teachers && this.timetable.teachers.length > 0) {
        autoAssignTeachers(this.timetable, { overwriteExisting: false });
        this.save();
      }
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
      const isValidBranch = isBranchValidForSchoolType(t.branch, this.timetable.schoolType);
      const branchBadgeHtml = isValidBranch
        ? `<span class="branch-badge">${t.branch || '—'}</span>`
        : `<span class="branch-badge" style="background: #fee2e2; color: #991b1b; border-color: #fca5a5;" title="Ο κλάδος ${t.branch} δεν ανήκει στη βαθμίδα αυτού του σχολείου">${t.branch || '—'} ⚠️</span>`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong style="font-size: 0.9375rem;">${t.name}</strong></td>
        <td>${branchBadgeHtml}</td>
        <td>
          <input type="number" min="1" max="30" value="${t.requiredHours || 24}" class="input-hours" style="width: 4.5rem; font-size: 0.9375rem; font-weight: bold; text-align: center;"> <span style="font-weight: 500;">ώρες</span>
        </td>
        <td>
          <span class="hours-status-badge ${assigned === t.requiredHours ? 'exact' : assigned > t.requiredHours ? 'over' : 'under'}">
            ${assigned} / ${t.requiredHours} ώρες
          </span>
        </td>
        <td>
          <button class="btn-timeoff">📅 Πλέγμα Διαθεσιμότητας</button>
        </td>
        <td class="row-actions" style="display: flex; gap: 0.35rem; align-items: center;">
          <button class="chip-edit btn-edit-t" title="Επεξεργασία">✎</button>
          <button class="danger btn-del-t" title="Διαγραφή">✕</button>
        </td>
      `;

      // Change hours
      row.querySelector('.input-hours').onchange = (e) => {
        t.requiredHours = Number(e.target.value) || 24;
        this.save();
        this.render();
      };

      // Edit teacher
      row.querySelector('.btn-edit-t').onclick = () => {
        this.openTeacherFormModal(t, () => this.render());
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

  // Pop-up modal για προσθήκη / επεξεργασία εκπαιδευτικού σε ενιαίο παράθυρο (Προεπιλογή: 24 ώρες)
  openTeacherFormModal(teacherToEdit = null, onSaved = null) {
    const dialog = document.createElement('dialog');
    dialog.className = 'teacher-form-dialog';

    const defaultHours = teacherToEdit ? teacherToEdit.requiredHours : 24; // Προεπιλογή 24 ώρες βάσει οδηγίας
    const defaultName = teacherToEdit ? teacherToEdit.name : '';
    const defaultBranch = teacherToEdit ? teacherToEdit.branch : (this.timetable.schoolType === 'dimotiko' ? 'ΠΕ70' : 'ΠΕ02');

    const schoolBranches = getBranchesForSchoolType(this.timetable.schoolType);
    const branchOptions = [
      ...schoolBranches,
      { code: 'other', label: '— Άλλος κλάδος (πληκτρολόγηση) —' },
    ];

    const isKnownBranch = branchOptions.some((b) => b.code === defaultBranch);

    dialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>${teacherToEdit ? 'Επεξεργασία Εκπαιδευτικού' : 'Προσθήκη Νέου Εκπαιδευτικού'}</h3>
          <p class="hint">Συμπληρώστε το ονοματεπώνυμο, τον κλάδο και το υποχρεωτικό διδακτικό ωράριο.</p>
        </div>

        <form id="form-teacher-modal" style="margin-top: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
          <label class="field">
            <span class="label">Ονοματεπώνυμο</span>
            <input type="text" id="tmodal-name" value="${defaultName}" placeholder="π.χ. ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ" required autofocus style="font-weight: 600;">
          </label>

          <label class="field">
            <span class="label">Κλάδος / Ειδικότητα (${this.timetable.schoolType === 'dimotiko' ? 'Πρωτοβάθμια' : 'Δευτεροβάθμια'})</span>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
              <select id="tmodal-branch-select">
                ${branchOptions.map(
                  (b) => `<option value="${b.code}" ${b.code === (isKnownBranch ? defaultBranch : 'other') ? 'selected' : ''}>${b.label}</option>`
                ).join('')}
              </select>
              <input type="text" id="tmodal-branch-custom" value="${defaultBranch}" placeholder="π.χ. ΠΕ02 ή ΠΕ88.01" style="${isKnownBranch ? 'display: none;' : ''}">
            </div>
          </label>

          <label class="field">
            <span class="label">Υποχρεωτικό Ωράριο (ώρες/εβδομάδα)</span>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <input type="number" id="tmodal-hours" min="1" max="30" value="${defaultHours}" style="width: 5.5rem; font-size: 1rem; font-weight: bold; text-align: center;">
              <span class="hint" style="font-weight: 500;">(Προεπιλογή: 24 ώρες)</span>
            </div>
          </label>

          <div class="toolbar" style="margin-top: 1.5rem; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-cancel">Άκυρο</button>
            <button type="submit" class="primary">Αποθήκευση</button>
          </div>
        </form>
      </div>
    `;

    const branchSelect = dialog.querySelector('#tmodal-branch-select');
    const branchCustom = dialog.querySelector('#tmodal-branch-custom');

    branchSelect.onchange = () => {
      if (branchSelect.value === 'other') {
        branchCustom.style.display = 'block';
        branchCustom.focus();
      } else {
        branchCustom.style.display = 'none';
        branchCustom.value = branchSelect.value;
      }
    };

    const close = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('.btn-cancel').onclick = close;

    dialog.querySelector('#form-teacher-modal').onsubmit = (e) => {
      e.preventDefault();
      const name = dialog.querySelector('#tmodal-name').value.trim().toUpperCase();
      let branch = (branchSelect.value === 'other' ? branchCustom.value : branchSelect.value).trim().toUpperCase();
      if (!branch) branch = this.timetable.schoolType === 'dimotiko' ? 'ΠΕ70' : 'ΠΕ02';
      const hours = parseInt(dialog.querySelector('#tmodal-hours').value, 10) || 24;

      if (!name) {
        alert('Παρακαλώ εισαγάγετε ονοματεπώνυμο.');
        return;
      }

      if (teacherToEdit) {
        teacherToEdit.name = name;
        teacherToEdit.branch = branch;
        teacherToEdit.requiredHours = hours;
      } else {
        this.timetable.teachers.push({
          id: `t_${Date.now()}`,
          name,
          branch,
          requiredHours: hours,
          assignedHours: 0,
          timeOff: {},
        });
      }

      this.save();
      close();
      if (onSaved) onSaved();
      else this.render();
    };

    document.body.append(dialog);
    dialog.showModal();
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
    // Αν δεν υπάρχουν μαθήματα ή αν κάποιο τμήμα δεν έχει μαθήματα, αυτόματη δημιουργία και ανάθεση
    const existingClassIds = new Set((this.timetable.lessons || []).map((l) => l.classId));
    const hasMissingClassLessons = (this.timetable.classes || []).some((c) => !existingClassIds.has(c.id));
    if (!this.timetable.lessons || this.timetable.lessons.length === 0 || hasMissingClassLessons) {
      populateCurriculumForClasses(this.timetable);
      if (this.timetable.teachers && this.timetable.teachers.length > 0) {
        autoAssignTeachers(this.timetable, { overwriteExisting: false });
      }
      this.save();
    }

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
        <button type="button" class="secondary" id="btn-auto-assign-teachers" title="Αυτόματη ανάθεση εκπαιδευτικών αντίστοιχης ειδικότητας βάσει διαθέσιμων ωρών">
          ⚡ Αυτόματη Συμπλήρωση Εκπαιδευτικών
        </button>
        <span class="badge info">${(this.timetable.lessons || []).length} ενεργά μαθήματα</span>

        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <div id="class-cycle-wrapper" style="display: none; align-items: center; gap: 0.35rem; background: rgba(59, 130, 246, 0.08); padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid var(--rule);">
            <span style="font-size: 0.8125rem; font-weight: 600;">Κύκλος Συνδιδασκαλίας:</span>
            <select id="sel-class-cycle-step3" style="padding: 0.25rem 0.45rem; border-radius: 4px; border: 1px solid var(--rule); font-family: var(--sans); font-size: 0.8125rem;">
              <option value="A">Κύκλος Α΄ (Ύλη Γ΄/Ε΄)</option>
              <option value="B">Κύκλος Β΄ (Ύλη Δ΄/ΣΤ΄)</option>
            </select>
          </div>
          <label for="filter-class" class="hint" style="font-size: 0.8125rem;">Προβολή τμήματος:</label>
          <select id="filter-class" style="padding: 0.35rem 0.6rem; border-radius: 4px; border: 1px solid var(--rule); font-family: var(--sans); font-size: 0.8125rem;">
            <option value="all">Όλα τα τμήματα</option>
            ${(this.timetable.classes || []).map((c) => {
              const grLabel = c.grades && c.grades.length > 1 ? `Συνδιδασκαλία: ${c.grades.join(', ')} · Κύκλος ${c.cycle || 'Α'}΄` : `Τάξη ${c.grade}`;
              return `<option value="${c.id}">${c.name} (${grLabel})</option>`;
            }).join('')}
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
              <th style="min-width: 14rem;">Κατανομή (Δίωρα / Μονόωρα)</th>
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

    const autoAssignBtn = div.querySelector('#btn-auto-assign-teachers');
    if (autoAssignBtn) {
      autoAssignBtn.onclick = () => {
        if (!this.timetable.teachers || this.timetable.teachers.length === 0) {
          alert('Δεν έχουν καταχωριστεί εκπαιδευτικοί. Παρακαλώ μεταβείτε στο Βήμα 2 («Εκπαιδευτικοί») για να προσθέσετε ή να συγχρονίσετε εκπαιδευτικούς.');
          return;
        }
        let overwrite = false;
        const hasUnassigned = (this.timetable.lessons || []).some((l) => !l.teacherId && Number(l.hours) > 0);
        if (!hasUnassigned) {
          if (confirm('Όλα τα μαθήματα έχουν ήδη ανατεθεί σε εκπαιδευτικό. Θέλετε να επανυπολογιστούν όλες οι αναθέσεις αυτόματα από την αρχή;')) {
            overwrite = true;
          } else {
            return;
          }
        }
        const count = autoAssignTeachers(this.timetable, { overwriteExisting: overwrite });
        this.save();
        this.renderLessonsList(tbody, activeFilterClass);
        alert(`Συμπληρώθηκαν επιτυχώς ${count} αναθέσεις μαθημάτων σε εκπαιδευτικούς αντίστοιχης ειδικότητας!`);
      };
    }

    const tbody = div.querySelector('#lessons-tbody');
    const cycleWrapper = div.querySelector('#class-cycle-wrapper');
    const cycleSelect = div.querySelector('#sel-class-cycle-step3');

    const updateCycleVisibility = () => {
      if (!cycleWrapper || !cycleSelect) return;
      if (activeFilterClass === 'all') {
        cycleWrapper.style.display = 'none';
        return;
      }
      const selCls = (this.timetable.classes || []).find((c) => c.id === activeFilterClass);
      if (selCls && selCls.grades && selCls.grades.length > 1) {
        cycleWrapper.style.display = 'inline-flex';
        cycleSelect.value = selCls.cycle || 'A';
      } else {
        cycleWrapper.style.display = 'none';
      }
    };

    if (cycleSelect) {
      cycleSelect.onchange = (e) => {
        const selCls = (this.timetable.classes || []).find((c) => c.id === activeFilterClass);
        if (selCls) {
          selCls.cycle = e.target.value;
          populateCurriculumForClasses(this.timetable);
          if (this.timetable.teachers && this.timetable.teachers.length > 0) {
            autoAssignTeachers(this.timetable, { overwriteExisting: false });
          }
          this.save();
          this.renderLessonsList(tbody, activeFilterClass);
        }
      };
    }

    const classFilter = div.querySelector('#filter-class');
    if (classFilter) {
      classFilter.onchange = (e) => {
        activeFilterClass = e.target.value;
        updateCycleVisibility();
        this.renderLessonsList(tbody, activeFilterClass);
      };
    }

    updateCycleVisibility();

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
      tbody.innerHTML = `<tr><td colspan="8" class="hint text-center">Δεν υπάρχουν μαθήματα. Πατήστε «Αυτόματη Φόρτωση Επίσημου Ωρολογίου Προγράμματος».</td></tr>`;
      return;
    }

    const lessons = filterClass === 'all'
      ? allLessons
      : allLessons.filter((l) => l.classId === filterClass);

    if (!lessons.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="hint text-center">Δεν υπάρχουν μαθήματα για το επιλεγμένο τμήμα.</td></tr>`;
      return;
    }

    // Helper: Υπολογισμός υπολειπόμενων ωρών εκπαιδευτικού
    const getTeacherStats = (t) => {
      const assigned = allLessons
        .filter((l) => l.teacherId === t.id && Number(l.hours) > 0)
        .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      const req = Number(t.requiredHours) || 20;
      const remaining = req - assigned;
      return { assigned, req, remaining };
    };

    lessons.forEach((les) => {
      const teacher = (this.timetable.teachers || []).find((t) => t.id === les.teacherId);
      let teacherRemainingInfo = '';
      let remClass = '';

      if (teacher) {
        const { assigned, req, remaining } = getTeacherStats(teacher);
        if (remaining > 0) {
          remClass = 'rem-positive';
          teacherRemainingInfo = `${assigned}/${req} ώρ. (απομέν${remaining === 1 ? 'ει 1 ώρα' : `ουν ${remaining} ώρες`})`;
        } else if (remaining === 0) {
          remClass = 'rem-zero';
          teacherRemainingInfo = `${assigned}/${req} ώρ. (πλήρες ωράριο ✓)`;
        } else {
          remClass = 'rem-negative';
          teacherRemainingInfo = `${assigned}/${req} ώρ. (+${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'ώρα υπερωρία' : 'ώρες υπερωρία'} ⚠️)`;
        }
      }

      const cls = (this.timetable.classes || []).find((c) => c.id === les.classId);
      const isMultiGrade = cls && Array.isArray(cls.grades) && cls.grades.length > 1;
      const isZeroHours = Number(les.hours) === 0;

      const distOptions = getAvailableDistributions(les.hours, les);
      const curDist = les.distribution || (getDefaultLessonDistribution(les, les.hours).join('+'));

      const row = document.createElement('tr');
      if (isZeroHours) {
        row.className = 'lesson-row-zero';
      }
      row.innerHTML = `
        <td>
          <strong>${les.className || les.classId}</strong>
          ${isMultiGrade ? `<br><span class="badge warn" style="font-size: 0.72rem; padding: 0.1rem 0.35rem; margin-top: 0.2rem; display: inline-block;">Συνδ/λία (${cls.grades.join('-')})</span>` : ''}
        </td>
        <td>
          <span class="badge" style="border-left: 3px solid ${les.subjectColor || '#3b82f6'}; font-weight: 500;">
            ${les.subjectName}
          </span>
          ${les.isProiniZoni ? `<br><span class="badge info" style="font-size: 0.72rem; margin-top: 0.2rem; display: inline-block;">0η ώρα (07:00-08:00)</span>` : ''}
          ${les.isOloimero ? `<br><span class="badge success" style="font-size: 0.72rem; margin-top: 0.2rem; display: inline-block;">${les.fixedPeriod}η ώρα</span>` : ''}
          ${les.splitGrade ? `<br><span class="badge warn" style="font-size: 0.72rem; margin-top: 0.2rem; display: inline-block;">Μόνο Τάξη ${les.splitGrade}΄</span>` : ''}
        </td>
        <td>
          <div class="lesson-hours-ctrl">
            <input type="number" min="0" max="15" value="${les.hours}" class="input-lesson-hours" title="Ώρες ανά εβδομάδα (0 = ανενεργό μάθημα, δεν θα διδαχθεί)">
            <span class="hours-unit">ώρ.</span>
            ${les.defaultHours && les.defaultHours !== les.hours ? `
              <button type="button" class="btn-reset-hours" title="Επαναφορά στην επίσημη προεπιλογή (${les.defaultHours} ώρες)">↺ ${les.defaultHours}</button>
            ` : (isZeroHours ? `
              <span class="hours-preset-hint" title="Μηδενικές ώρες / ανενεργό μάθημα" style="color: var(--brick); font-weight: 700;">0 ώρες</span>
            ` : `
              <span class="hours-preset-hint" title="Προεπιλογή βάσει νομοθεσίας">προεπ. ${les.defaultHours || les.hours}</span>
            `)}
          </div>
        </td>
        <td>
          ${isZeroHours || Number(les.hours) <= 1 ? `
            <span class="hint" style="font-size: 0.8125rem;">${isZeroHours ? '—' : '1 ώρα (Μονόωρο)'}</span>
          ` : `
            <select class="sel-distribution" title="Επιλέξτε πώς θα κατανεμηθούν οι ώρες του μαθήματος μέσα στην εβδομάδα (Μονόωρα ή Δίωρα)" style="font-size: 0.8125rem; padding: 0.25rem 0.4rem; border-radius: 4px; border: 1px solid var(--rule); width: 100%; max-width: 15rem; background: var(--card); color: var(--ink);">
              ${distOptions.map((opt) => `<option value="${opt.value}" ${opt.value === curDist ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>
          `}
        </td>
        <td><span class="branch-badge">${les.branch || '—'}</span></td>
        <td>
          ${isZeroHours ? `
            <span class="badge muted" style="font-size: 0.8125rem; padding: 0.35rem 0.6rem; display: inline-block;">
              — 0 ώρες (Ανενεργό) —
            </span>
          ` : (teacher ? `
            <button type="button" class="btn-teacher-select assigned" title="Κλικ για αλλαγή ανάθεσης εκπαιδευτικού">
              <div class="assigned-teacher-label">
                <strong style="font-size: 0.9375rem;">${teacher.name}</strong>
                <span class="branch-badge" style="font-size: 0.8125rem; padding: 0.1rem 0.45rem;">${teacher.branch || '—'}</span>
              </div>
              <span class="rem-badge ${remClass}" style="font-size: 0.8125rem;">
                ${teacherRemainingInfo}
              </span>
              <span class="edit-icon">✎</span>
            </button>
          ` : `
            <button type="button" class="btn-teacher-select unassigned" title="Κλικ για επιλογή εκπαιδευτικού από τη λίστα">
              <span style="font-size: 1.125rem; font-weight: bold; color: var(--stamp);">＋</span>
              <span style="font-weight: 600;">Επιλογή Εκπαιδευτικού</span>
              ${les.branch ? `<span class="branch-badge" style="font-size: 0.8125rem; margin-left: auto;">${les.branch}</span>` : ''}
            </button>
          `)}
        </td>
        <td>
          <select class="sel-room">
            ${(this.timetable.rooms || []).map(
              (r) => `<option value="${r.id}" ${r.id === les.roomId ? 'selected' : ''}>${r.name}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${les.isSplit
              ? `<span class="badge danger">${les.splitGrade ? `Σπάσιμο: Τάξη ${les.splitGrade}΄` : `Παράλληλο (${les.splitType || 'Split'})`}</span>`
              : (les.isProiniZoni
                ? '<span class="badge info">Πρωινή Ζώνη</span>'
                : (les.isOloimero
                  ? '<span class="badge success">Ολοήμερο</span>'
                  : '<span class="badge muted">Ολόκληρο</span>'))}
            ${isMultiGrade && !les.isProiniZoni && !les.isOloimero ? `
              <button type="button" class="btn-split-lesson" style="font-size: 0.72rem; padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid var(--rule); background: var(--wash); cursor: pointer; white-space: nowrap; margin-top: 0.15rem;" title="Διαχωρισμός του μαθήματος για συγκεκριμένη τάξη της συνδιδασκαλίας (π.χ. Αγγλικά μόνο στη Δ΄ ενώ η Γ΄ κάνει άλλο μάθημα ταυτόχρονα)">
                ✂️ Σπάσιμο Τάξης
              </button>
            ` : ''}
          </div>
        </td>
      `;

      // 1. Change hours input (επιτρέπει και 0 ώρες)
      const hoursInput = row.querySelector('.input-lesson-hours');
      hoursInput.onchange = (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 25) val = 25;
        les.hours = val;
        hoursInput.value = val;
        // Ενημέρωση κατανομής βάσει των νέων ωρών
        const newDef = getDefaultLessonDistribution(les, les.hours);
        les.distribution = Array.isArray(newDef) ? newDef.join('+') : String(newDef);
        if (val === 0) {
          les.teacherId = '';
          les.teacherName = '— Χωρίς εκπαιδευτικό —';
        } else if (!les.teacherId && this.timetable.teachers && this.timetable.teachers.length > 0) {
          autoAssignTeachers(this.timetable, { overwriteExisting: false });
        }
        this.save();
        this.renderLessonsList(tbody, filterClass);
      };

      // 2. Change distribution (Κατανομή σε δίωρα / μονόωρα)
      const distSelect = row.querySelector('.sel-distribution');
      if (distSelect) {
        distSelect.onchange = (e) => {
          les.distribution = e.target.value;
          this.save();
        };
      }

      // 3. Reset to default hours
      const resetBtn = row.querySelector('.btn-reset-hours');
      if (resetBtn) {
        resetBtn.onclick = () => {
          les.hours = les.defaultHours;
          const newDef = getDefaultLessonDistribution(les, les.hours);
          les.distribution = Array.isArray(newDef) ? newDef.join('+') : String(newDef);
          if (!les.teacherId && les.hours > 0 && this.timetable.teachers && this.timetable.teachers.length > 0) {
            autoAssignTeachers(this.timetable, { overwriteExisting: false });
          }
          this.save();
          this.renderLessonsList(tbody, filterClass);
        };
      }

      // 4. Open Teacher Assignment Pop-up Modal
      const teacherBtn = row.querySelector('.btn-teacher-select');
      if (teacherBtn) {
        teacherBtn.onclick = () => {
          this.openTeacherAssignModal(les, () => {
            this.renderLessonsList(tbody, filterClass);
          });
        };
      }

      // 5. Change room
      row.querySelector('.sel-room').onchange = (e) => {
        les.roomId = e.target.value;
        this.save();
      };

      // 6. Split multigrade lesson button
      const splitBtn = row.querySelector('.btn-split-lesson');
      if (splitBtn) {
        splitBtn.onclick = () => {
          this.openSplitLessonModal(les, () => {
            this.renderLessonsList(tbody, filterClass);
          });
        };
      }

      tbody.append(row);
    });
  }

  // Pop-up modal για σπάσιμο συνδιδασκαλίας (απόσχιση τάξης σε ανεξάρτητο μάθημα)
  openSplitLessonModal(lesson, onSaved = null) {
    const cls = (this.timetable.classes || []).find((c) => c.id === lesson.classId);
    if (!cls || !Array.isArray(cls.grades) || cls.grades.length <= 1) {
      alert('Το σπάσιμο μαθήματος υποστηρίζεται μόνο σε συνδιδασκόμενα τμήματα (με 2 ή περισσότερες τάξεις).');
      return;
    }

    const dialog = document.createElement('dialog');
    dialog.className = 'class-dialog';

    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>✂️ Σπάσιμο Συνδιδασκαλίας — ${lesson.subjectName}</h3>
        <p class="hint">
          Στα ολιγοθέσια σχολεία, ένα συνδιδασκόμενο τμήμα μπορεί να «σπάσει» ώστε ένας εκπαιδευτικός να αναλάβει μία συγκεκριμένη τάξη για ένα μάθημα (π.χ. Αγγλικά στη Δ΄), ενώ ένας άλλος εκπαιδευτικός διδάσκει ταυτόχρονα την άλλη τάξη (π.χ. Μαθηματικά στη Γ΄).
        </p>

        <div style="margin-top: 1.25rem;">
          <label class="field" style="width: 100%;">
            <span class="label" style="font-weight: 600;">Επιλογή Τάξης προς Απόσχιση</span>
            <select id="split-target-grade" style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px; font-family: var(--sans);">
              ${cls.grades.map((g) => `<option value="${g}">Τάξη ${g}΄</option>`).join('')}
            </select>
          </label>
        </div>

        <div style="margin-top: 1rem;">
          <label class="field" style="width: 100%;">
            <span class="label" style="font-weight: 600;">Ώρες ανά Εβδομάδα</span>
            <input type="number" id="split-hours" min="1" max="15" value="${Math.max(1, Math.round(lesson.hours / 2))}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px; font-family: var(--sans);">
            <span class="hint" style="font-size: 0.8125rem; margin-top: 0.25rem;">
              Πόσες ώρες θα διδάσκεται το ανεξάρτητο μάθημα στην αποσχισθείσα τάξη.
            </span>
          </label>
        </div>

        <div class="toolbar" style="margin-top: 1.5rem; justify-content: flex-end;">
          <button type="button" class="btn-cancel">Άκυρο</button>
          <button type="button" class="primary btn-save">✂️ Δημιουργία Σπαστού Μαθήματος</button>
        </div>
      </div>
    `;

    dialog.querySelector('.btn-cancel').onclick = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('.btn-save').onclick = () => {
      const targetGrade = dialog.querySelector('#split-target-grade').value;
      const hours = parseInt(dialog.querySelector('#split-hours').value, 10) || 1;

      splitMultigradeLesson(this.timetable, lesson.id, targetGrade, hours);
      this.save();
      dialog.close();
      dialog.remove();
      if (onSaved) onSaved();
    };

    document.body.append(dialog);
    dialog.showModal();
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
        .filter((l) => l.teacherId === t.id && Number(l.hours) > 0)
        .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      const req = Number(t.requiredHours) || 20;
      const remaining = req - assigned;
      return { assigned, req, remaining };
    };

    const hasTeachers = teachers.length > 0;

    dialog.innerHTML = `
      <div class="dialog-content teacher-picker-content">
        <div class="teacher-picker-header">
          <div>
            <h3>Ανάθεση Εκπαιδευτικού</h3>
            <p class="hint" style="margin: 0.25rem 0 0;">
              <strong>${lesson.subjectName}</strong> &bull; Τμήμα <strong>${lesson.className}</strong>
              &bull; <strong>Διάρκεια: ${lesson.hours} ώρες/εβδομάδα</strong>
              ${lesson.branch ? ` &bull; Ειδικότητα: <span class="badge info">${lesson.branch}</span>` : ''}
            </p>
            ${lesson.teacherName && lesson.teacherId ? `
              <div style="margin-top: 0.4rem; padding: 0.35rem 0.6rem; background: var(--paper-warm, #f8f6f0); border-left: 3px solid var(--stamp); font-size: 0.8125rem; color: var(--ink);">
                Τρέχουσα ανάθεση: <strong>${lesson.teacherName}</strong>. Αν επιλέξετε άλλον εκπαιδευτικό, οι <strong>${lesson.hours} ώρες</strong> θα αφαιρεθούν από τον/την ${lesson.teacherName} και θα προστεθούν στον νέο.
              </div>
            ` : ''}
          </div>
          <button type="button" class="btn-close-picker" aria-label="Κλείσιμο">&times;</button>
        </div>

        ${hasTeachers ? `
          <div class="picker-search-bar">
            <input type="text" class="picker-search-input" placeholder="🔍 Αναζήτηση εκπαιδευτικού με όνομα ή ειδικότητα (π.χ. ΠΕ02, Γεώργιος)..." autofocus>
            <div class="picker-filter-chips">
              <button type="button" class="filter-chip active" data-filter="all">Όλοι (${teachers.length})</button>
              ${lesson.branch ? `<button type="button" class="filter-chip" data-filter="branch">Ειδικότητας (${lesson.branch})</button>` : ''}
              <button type="button" class="filter-chip" data-filter="fits">Χωρίς υπερωρία (χωράνε ${lesson.hours} ώρ.)</button>
              <button type="button" class="filter-chip" data-filter="available">Με διαθέσιμο ωράριο</button>
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
        const { assigned, req, remaining } = getTeacherStats(t);
        const lessonHours = Number(lesson.hours) || 0;
        const isCurrent = lesson.teacherId === t.id;
        const isMatchingBranch = lesson.branch && (
          t.branch === lesson.branch ||
          t.branch.startsWith(lesson.branch) ||
          lesson.branch.startsWith(t.branch)
        );

        // Υπολογισμός κατάστασης μετά την ανάθεση αυτού του μαθήματος
        const afterAssigned = isCurrent ? assigned : (assigned + lessonHours);
        const afterRemaining = req - afterAssigned;

        // Filters
        if (currentFilter === 'branch' && !isMatchingBranch) return;
        if (currentFilter === 'fits' && !isCurrent && afterRemaining < 0) return;
        if (currentFilter === 'available' && remaining <= 0 && !isCurrent) return;

        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesName = t.name.toLowerCase().includes(q);
          const matchesBranch = (t.branch || '').toLowerCase().includes(q);
          if (!matchesName && !matchesBranch) return;
        }

        visibleCount++;

        let curStatusHtml = '';
        if (remaining > 0) {
          curStatusHtml = `<span style="color: var(--accent); font-weight: 600;">απομέν${remaining === 1 ? 'ει 1 ώρα' : `ουν ${remaining} ώρες`}</span>`;
        } else if (remaining === 0) {
          curStatusHtml = `<span style="color: #059669; font-weight: 600;">πλήρες ωράριο</span>`;
        } else {
          curStatusHtml = `<span style="color: #dc2626; font-weight: 600;">+${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'ώρα υπερωρία' : 'ώρες υπερωρία'}</span>`;
        }

        let afterBadgeHtml = '';
        if (isCurrent) {
          afterBadgeHtml = `<span class="rem-badge rem-zero" style="font-size: 0.8125rem;">✓ Ήδη ανατεθειμένο (${assigned}/${req} ώρ.)</span>`;
        } else if (afterRemaining > 0) {
          afterBadgeHtml = `<span class="rem-badge rem-positive" style="font-size: 0.8125rem;">➔ Μετά: <strong>${afterAssigned}/${req} ώρ.</strong> (θα απομέν${afterRemaining === 1 ? 'ει 1 ώρα' : `ουν ${afterRemaining} ώρες`})</span>`;
        } else if (afterRemaining === 0) {
          afterBadgeHtml = `<span class="rem-badge rem-zero" style="font-size: 0.8125rem;">➔ Μετά: <strong>${afterAssigned}/${req} ώρ.</strong> (ακριβώς πλήρες ✓)</span>`;
        } else {
          afterBadgeHtml = `<span class="rem-badge rem-negative" style="font-size: 0.8125rem; font-weight: 600;">➔ Μετά: <strong>${afterAssigned}/${req} ώρ.</strong> (+${Math.abs(afterRemaining)} ${Math.abs(afterRemaining) === 1 ? 'ώρα υπερωρία ⚠️' : 'ώρες υπερωρία ⚠️'})</span>`;
        }

        const item = document.createElement('div');
        item.className = `teacher-pick-item${isCurrent ? ' selected' : ''}${isMatchingBranch ? ' branch-match' : ''}`;
        item.innerHTML = `
          <div class="teacher-pick-info">
            <div class="teacher-pick-title-row">
              <span class="teacher-pick-name">${t.name}</span>
              <span class="branch-badge" style="font-size: 0.8125rem; padding: 0.15rem 0.5rem;">${t.branch || '—'}</span>
              ${isCurrent ? '<span class="badge" style="background: var(--stamp); color: white;">✓ Τρέχουσα Ανάθεση</span>' : ''}
              ${isMatchingBranch && !isCurrent ? '<span class="badge highlight">Συμβατός Κλάδος</span>' : ''}
            </div>
            <span class="teacher-pick-sub">
              Υποχρεωτικό: <strong>${req} ώρ.</strong> &bull; Τρέχουσες ανατεθειμένες: <strong>${assigned} ώρ.</strong> (${curStatusHtml})
            </span>
          </div>

          <div class="teacher-pick-hours" style="text-align: right;">
            ${afterBadgeHtml}
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
