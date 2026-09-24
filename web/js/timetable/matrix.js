// matrix.js — Διαδραστικός Πίνακας Ωρολογίου Προγράμματος (aSc Timetables Style)
// Υποστηρίζει πολλαπλές προβολές (Ανά Τμήμα, Ανά Εκπαιδευτικό, Ανά Χώρο, Συγκεντρωτικό),
// Drag-and-drop μετακίνηση καρτών, ζωντανό έλεγχο συγκρούσεων και καλάθι ατοποθέτητων καρτών.

import { DAYS_OF_WEEK } from './curricula.js';
import { validateSlotPlacement } from './model.js';

export class TimetableMatrix {
  constructor(container, timetable, onUpdate = null) {
    this.container = container;
    this.timetable = timetable;
    this.onUpdate = onUpdate;
    this.currentView = 'class'; // 'class' | 'teacher' | 'room' | 'master'
    this.selectedTargetId = timetable.classes[0]?.id || '';
    this.draggedCard = null;
  }

  render() {
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'matrix-container';

    // 1. Εργαλειοθήκη Προβολών (Toolbar)
    const toolbar = this.createToolbar();
    wrap.append(toolbar);

    // 2. Κύριος Πίνακας Προγράμματος
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'matrix-grid-wrapper';

    if (this.currentView === 'master') {
      gridWrapper.append(this.renderMasterView());
    } else {
      gridWrapper.append(this.renderSingleView());
    }
    wrap.append(gridWrapper);

    // 3. Καλάθι Μη Τοποθετημένων Καρτών (Unplaced Cards Basket)
    const basket = this.renderUnplacedBasket();
    if (basket) wrap.append(basket);

    this.container.append(wrap);
  }

  createToolbar() {
    const bar = document.createElement('div');
    bar.className = 'matrix-toolbar';

    // Επιλογή Τύπου Προβολής
    const viewSelector = document.createElement('div');
    viewSelector.className = 'segmented';
    const views = [
      { id: 'class', label: 'Ανά Τμήμα' },
      { id: 'teacher', label: 'Ανά Εκπαιδευτικό' },
      { id: 'room', label: 'Ανά Αίθουσα / Εργαστήριο' },
      { id: 'master', label: 'Συνολικό Πανόραμα' },
    ];

    views.forEach(({ id, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      if (this.currentView === id) btn.className = 'active';
      btn.onclick = () => {
        this.currentView = id;
        if (id === 'class') this.selectedTargetId = this.timetable.classes[0]?.id || '';
        else if (id === 'teacher') this.selectedTargetId = this.timetable.teachers[0]?.id || '';
        else if (id === 'room') this.selectedTargetId = this.timetable.rooms[0]?.id || '';
        this.render();
      };
      viewSelector.append(btn);
    });
    bar.append(viewSelector);

    // Dropdown επιλογής συγκεκριμένου Τμήματος / Εκπαιδευτικού / Αίθουσας
    if (this.currentView !== 'master') {
      const targetSelect = document.createElement('select');
      targetSelect.className = 'matrix-target-select';

      let options = [];
      if (this.currentView === 'class') {
        options = this.timetable.classes.map((c) => {
          const grLabel = c.grades && c.grades.length > 1 ? `Συνδιδασκαλία: ${c.grades.join(', ')}` : `${c.grade} Τάξη`;
          return [c.id, `Τμήμα ${c.name} (${grLabel})`];
        });
      } else if (this.currentView === 'teacher') {
        options = this.timetable.teachers.map((t) => [t.id, `${t.name} (${t.branch || 'Εκπαιδευτικός'})`]);
      } else if (this.currentView === 'room') {
        options = this.timetable.rooms.map((r) => [r.id, `${r.name}`]);
      }

      options.forEach(([val, text]) => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        if (val === this.selectedTargetId) opt.selected = true;
        targetSelect.append(opt);
      });

      targetSelect.onchange = (e) => {
        this.selectedTargetId = e.target.value;
        this.render();
      };
      bar.append(targetSelect);
    }

    // Στατιστικά / Μετρητές
    const statsBadge = document.createElement('div');
    statsBadge.className = 'matrix-stats-badge';
    const totalPlacedHours = (this.timetable.schedule || []).reduce((sum, c) => sum + (c.length || 1), 0);
    const totalLessonHours = (this.timetable.lessons || []).reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    const unplacedHours = (this.timetable.unplacedCards || []).reduce((sum, c) => sum + (c.length || 1), 0);
    const placedCardsCount = this.timetable.schedule.length;
    statsBadge.innerHTML = `<strong>${totalPlacedHours}</strong> / ${totalLessonHours} ώρες (${placedCardsCount} κάρτες) ${
      unplacedHours > 0 ? `· <span class="badge danger">${unplacedHours} ώρες ατοποθέτητες</span>` : '· <span class="badge success">100% Πλήρες</span>'
    }`;
    bar.append(statsBadge);

    return bar;
  }

  // Προβολή Μονού Πίνακα (Τμήμα, Εκπαιδευτικός ή Αίθουσα)
  renderSingleView() {
    const table = document.createElement('table');
    table.className = 'timetable-matrix-table';

    // Κεφαλίδα: Ημέρες
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="col-time">Ώρα</th>';
    DAYS_OF_WEEK.forEach((day) => {
      const th = document.createElement('th');
      th.textContent = day.name;
      headerRow.append(th);
    });
    thead.append(headerRow);
    table.append(thead);

    // Σώμα: Ώρες (1η έως 6η ή 7η)
    const tbody = document.createElement('tbody');
    const periodsCount = this.timetable.periodsPerDay || 7;
    const bellTimes = this.timetable.bellTimes || [];

    for (let period = 1; period <= periodsCount; period++) {
      const row = document.createElement('tr');
      const timeInfo = bellTimes[period - 1];
      const timeLabel = timeInfo ? `${timeInfo.start} - ${timeInfo.end}` : '';

      const timeTd = document.createElement('td');
      timeTd.className = 'cell-period-label';
      timeTd.innerHTML = `<strong>${period}η</strong><small>${timeLabel}</small>`;
      row.append(timeTd);

      // Στήλες για κάθε μέρα (1 έως 5)
      for (let day = 1; day <= 5; day++) {
        const cell = document.createElement('td');
        cell.className = 'matrix-slot';
        cell.dataset.day = day;
        cell.dataset.period = period;

        // Έλεγχος αν ο εκπαιδευτικός έχει δηλωθεί μη διαθέσιμος (Time-off)
        if (this.currentView === 'teacher' && this.selectedTargetId) {
          const teacher = this.timetable.teachers.find((t) => t.id === this.selectedTargetId);
          if (teacher?.timeOff && teacher.timeOff[`${day}-${period}`] === 'no') {
            cell.classList.add('slot-time-off');
            cell.innerHTML = '<div class="time-off-mark">✕ ΜΗ ΔΙΑΘΕΣΙΜΟΣ</div>';
          }
        }

        // Αναζήτηση τοποθετημένων καρτών σε αυτό το slot (συμπεριλαμβανομένων δίωρων/πολύωρων)
        const cardsInSlot = this.getCardsForSlot(day, period);
        cardsInSlot.forEach((card) => {
          cell.append(this.createCardElement(card, period));
        });

        // Drag & Drop event listeners στο κελί
        this.setupDropZone(cell, day, period);

        row.append(cell);
      }
      tbody.append(row);
    }
    table.append(tbody);
    return table;
  }

  // Συγκεντρωτικό Πανόραμα (Όλα τα τμήματα σε έναν μεγάλο πίνακα)
  renderMasterView() {
    const table = document.createElement('table');
    table.className = 'timetable-matrix-table master-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Τμήμα</th>';
    DAYS_OF_WEEK.forEach((day) => {
      const th = document.createElement('th');
      th.colSpan = this.timetable.periodsPerDay;
      th.textContent = day.name;
      headerRow.append(th);
    });
    thead.append(headerRow);

    // Υπο-κεφαλίδα με τους αριθμούς ωρών (1-7) για κάθε μέρα
    const subHeader = document.createElement('tr');
    subHeader.innerHTML = '<th></th>';
    DAYS_OF_WEEK.forEach(() => {
      for (let p = 1; p <= this.timetable.periodsPerDay; p++) {
        const th = document.createElement('th');
        th.className = 'sub-period-th';
        th.textContent = `${p}`;
        subHeader.append(th);
      }
    });
    thead.append(subHeader);
    table.append(thead);

    const tbody = document.createElement('tbody');
    for (const cls of this.timetable.classes) {
      const row = document.createElement('tr');
      const clsTd = document.createElement('td');
      clsTd.className = 'master-class-name';
      clsTd.textContent = cls.name;
      row.append(clsTd);

      for (let day = 1; day <= 5; day++) {
        for (let period = 1; period <= this.timetable.periodsPerDay; period++) {
          const cell = document.createElement('td');
          cell.className = 'matrix-slot master-slot';
          cell.dataset.day = day;
          cell.dataset.period = period;
          cell.dataset.classId = cls.id;

          const cards = this.timetable.schedule.filter((c) => {
            if (c.classId !== cls.id || c.day !== day) return false;
            const len = c.length || 1;
            return period >= c.period && period < c.period + len;
          });
          cards.forEach((card) => {
            const isMulti = (card.length || 1) > 1;
            const part = period - card.period + 1;
            const miniCard = document.createElement('div');
            miniCard.className = `mini-card ${isMulti ? (part === 1 ? 'mini-card-multi-start' : 'mini-card-multi-cont') : ''}`;
            miniCard.style.backgroundColor = card.subjectColor || '#3b82f6';
            miniCard.title = `${card.subjectName} · ${card.teacherName || ''} (${isMulti ? `Δίωρο: Ώρα ${part}/${card.length}` : '1 ώρα'})`;
            const partBadge = isMulti ? `<small class="mini-part">(${part}/${card.length})</small>` : '';
            miniCard.innerHTML = `<strong>${card.subjectShort || card.subjectId} ${partBadge}</strong><small>${card.teacherName ? card.teacherName.split(' ')[0] : ''}</small>`;
            cell.append(miniCard);
          });

          this.setupDropZone(cell, day, period, cls.id);
          row.append(cell);
        }
      }
      tbody.append(row);
    }
    table.append(tbody);
    return table;
  }

  // Επιστρέφει τις κάρτες που αντιστοιχούν στο τρέχον επιλεγμένο φίλτρο για το slot
  getCardsForSlot(day, period) {
    return this.timetable.schedule.filter((card) => {
      const len = card.length || 1;
      if (card.day !== day || period < card.period || period >= card.period + len) return false;
      if (this.currentView === 'class') {
        return card.classId === this.selectedTargetId;
      }
      if (this.currentView === 'teacher') {
        return card.teacherId === this.selectedTargetId;
      }
      if (this.currentView === 'room') {
        return card.roomId === this.selectedTargetId;
      }
      return true;
    });
  }

  // Δημιουργία οπτικής κάρτας μαθήματος (aSc Timetables design)
  createCardElement(card, currentPeriod = null) {
    const cardEl = document.createElement('div');
    cardEl.className = 'timetable-card';
    cardEl.draggable = true;
    cardEl.dataset.cardId = card.id;

    const isMulti = (card.length || 1) > 1;
    const part = (currentPeriod && card.period) ? (currentPeriod - card.period + 1) : 1;
    const totalParts = card.length || 1;

    if (isMulti && currentPeriod) {
      cardEl.classList.add('card-multi');
      if (part === 1) {
        cardEl.classList.add('card-multi-first');
      } else if (part === totalParts) {
        cardEl.classList.add('card-multi-last');
      } else {
        cardEl.classList.add('card-multi-middle');
      }
    }

    // Χρώμα θέματος κάρτας
    const baseColor = card.subjectColor || '#2563eb';
    cardEl.style.borderLeftColor = baseColor;
    cardEl.style.backgroundColor = `${baseColor}15`; // 15% opacity tint

    const cls = this.timetable.classes.find((c) => c.id === card.classId);
    const teacher = this.timetable.teachers.find((t) => t.id === card.teacherId);
    const room = this.timetable.rooms.find((r) => r.id === card.roomId);

    let lengthBadgeText = '';
    if (isMulti) {
      const lenName = totalParts === 2 ? 'Δίωρο' : totalParts === 3 ? 'Τρίωρο' : `${totalParts}ωρο`;
      lengthBadgeText = currentPeriod ? `${lenName} (${part}/${totalParts})` : `${lenName} (${totalParts} ώρ.)`;
    }

    cardEl.innerHTML = `
      <div class="card-header">
        <span class="card-subject" title="${card.subjectName}">${card.subjectShort || card.subjectName}</span>
        ${lengthBadgeText ? `<span class="card-badge length ${part > 1 ? 'is-cont' : ''}">${lengthBadgeText}</span>` : ''}
        ${card.isSplit ? `<span class="card-badge badge-split">Σπαστό</span>` : ''}
        ${currentPeriod ? `<button type="button" class="card-unplace-btn" title="Αφαίρεση από το πρόγραμμα (στο καλάθι)">✕</button>` : ''}
      </div>
      <div class="card-body">
        <span class="card-teacher">${teacher ? teacher.name : (card.teacherName || '—')}</span>
        <span class="card-meta">
          <span class="card-class">${cls ? cls.name : (card.className || '')}</span>
          ${room && room.id !== 'room_gen' ? `<span class="card-room">${room.short || room.name}</span>` : ''}
        </span>
        ${isMulti && part > 1 ? `<span class="card-continuation-hint">↳ συνέχεια από ${currentPeriod - 1}η ώρα</span>` : ''}
      </div>
    `;

    // Unplace button click handler
    const unplaceBtn = cardEl.querySelector('.card-unplace-btn');
    if (unplaceBtn) {
      unplaceBtn.onclick = (e) => {
        e.stopPropagation();
        const scheduleIndex = this.timetable.schedule.findIndex((c) => c.id === card.id);
        if (scheduleIndex >= 0) {
          const [removed] = this.timetable.schedule.splice(scheduleIndex, 1);
          delete removed.day;
          delete removed.period;
          this.timetable.unplacedCards = this.timetable.unplacedCards || [];
          this.timetable.unplacedCards.push(removed);
          if (this.onUpdate) this.onUpdate(this.timetable);
          this.render();
        }
      };
    }

    // Drag handlers
    cardEl.addEventListener('dragstart', (e) => {
      this.draggedCard = card;
      cardEl.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
      this.highlightValidSlots(card);
    });

    cardEl.addEventListener('dragend', () => {
      this.draggedCard = null;
      cardEl.classList.remove('is-dragging');
      this.clearSlotHighlights();
    });

    return cardEl;
  }

  // Ρύθμιση της ζώνης υποδοχής (Drop zone)
  setupDropZone(cell, day, period, classId = null) {
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.draggedCard) return;
      e.dataTransfer.dropEffect = 'move';
      cell.classList.add('drag-over');
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });

    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      if (!this.draggedCard) return;

      const card = this.draggedCard;
      // Αν είμαστε σε master view, η κάρτα μπορεί να αναφέρεται σε συγκεκριμένο classId
      if (classId && card.classId !== classId) {
        alert('Δεν μπορείτε να μετακινήσετε μάθημα σε διαφορετικό τμήμα.');
        return;
      }

      // Έλεγχος εγκυρότητας μετακίνησης
      const validation = validateSlotPlacement(this.timetable.schedule, card, day, period, this.timetable);
      if (!validation.valid) {
        alert(`Αδύνατη τοποθέτηση:\n\n${validation.conflicts.join('\n')}`);
        return;
      }

      // Εφαρμογή μετακίνησης
      const scheduleIndex = this.timetable.schedule.findIndex((c) => c.id === card.id);
      if (scheduleIndex >= 0) {
        this.timetable.schedule[scheduleIndex].day = day;
        this.timetable.schedule[scheduleIndex].period = period;
      } else {
        // Ήταν στο καλάθι των ατοποθέτητων
        this.timetable.schedule.push({ ...card, day, period });
        this.timetable.unplacedCards = (this.timetable.unplacedCards || []).filter((c) => c.id !== card.id);
      }

      if (this.onUpdate) this.onUpdate(this.timetable);
      this.render();
    });
  }

  // Φωτισμός έγκυρων / απαγορευμένων κελιών κατά το drag
  highlightValidSlots(card) {
    const slots = this.container.querySelectorAll('.matrix-slot');
    slots.forEach((cell) => {
      const day = Number(cell.dataset.day);
      const period = Number(cell.dataset.period);
      const val = validateSlotPlacement(this.timetable.schedule, card, day, period, this.timetable);

      if (val.valid) {
        cell.classList.add('slot-highlight-valid');
      } else {
        cell.classList.add('slot-highlight-conflict');
        cell.title = val.conflicts[0] || 'Σύγκρουση';
      }
    });
  }

  clearSlotHighlights() {
    const slots = this.container.querySelectorAll('.matrix-slot');
    slots.forEach((cell) => {
      cell.classList.remove('slot-highlight-valid', 'slot-highlight-conflict', 'drag-over');
      cell.removeAttribute('title');
    });
  }

  // Καλάθι Μη Τοποθετημένων Καρτών
  renderUnplacedBasket() {
    const unplaced = this.timetable.unplacedCards || [];
    if (unplaced.length === 0) return null;

    const basket = document.createElement('div');
    basket.className = 'unplaced-basket';
    basket.innerHTML = `
      <div class="basket-header">
        <h4>Καλάθι Μη Τοποθετημένων Καρτών (${unplaced.length})</h4>
        <small>Σύρετε τις κάρτες στον πίνακα για τοποθέτηση ή σύρετε κάρτες εδώ για αφαίρεση.</small>
      </div>
      <div class="basket-cards"></div>
    `;

    // Drop handler for basket
    basket.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.draggedCard) return;
      e.dataTransfer.dropEffect = 'move';
      basket.classList.add('basket-drag-over');
    });

    basket.addEventListener('dragleave', () => {
      basket.classList.remove('basket-drag-over');
    });

    basket.addEventListener('drop', (e) => {
      e.preventDefault();
      basket.classList.remove('basket-drag-over');
      if (!this.draggedCard) return;

      const card = this.draggedCard;
      const scheduleIndex = this.timetable.schedule.findIndex((c) => c.id === card.id);
      if (scheduleIndex >= 0) {
        const [removed] = this.timetable.schedule.splice(scheduleIndex, 1);
        delete removed.day;
        delete removed.period;
        this.timetable.unplacedCards = this.timetable.unplacedCards || [];
        this.timetable.unplacedCards.push(removed);
        if (this.onUpdate) this.onUpdate(this.timetable);
        this.render();
      }
    });

    const cardsContainer = basket.querySelector('.basket-cards');
    unplaced.forEach((card) => {
      cardsContainer.append(this.createCardElement(card));
    });

    return basket;
  }
}

