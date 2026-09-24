// solver.js — Μηχανή Αυτόματης Επίλυσης & Χρονοπρογραμματισμού (Timetable Engine)
// Εφαρμόζει αλγόριθμο Constraint Satisfaction Problem (CSP) με Backtracking,
// Minimum Remaining Values (MRV) ευρετική, παράλληλο κλείδωμα διασπασμένων τμημάτων και
// Min-Conflicts τοπική αναζήτηση για την ελαχιστοποίηση κενών ωρών.

import { DAYS_OF_WEEK } from './curricula.js';
import { generateCardsFromLessons, validateSlotPlacement } from './model.js';

export class TimetableSolver {
  constructor(timetable, options = {}) {
    this.timetable = timetable;
    this.options = {
      maxIterations: options.maxIterations || 15000,
      timeoutMs: options.timeoutMs || 8000,
      ...options,
    };
    this.stats = {
      iterations: 0,
      placedCount: 0,
      totalCards: 0,
      startTime: 0,
      endTime: 0,
    };
  }

  solve(onProgress = null) {
    this.stats.startTime = performance.now();
    this.stats.iterations = 0;

    // 1. Δημιουργία καρτών προς τοποθέτηση
    const rawCards = generateCardsFromLessons(this.timetable.lessons);
    this.stats.totalCards = rawCards.length;

    if (rawCards.length === 0) {
      return {
        success: true,
        schedule: [],
        unplacedCards: [],
        stats: this.stats,
      };
    }

    // 2. Ομαδοποίηση και ταξινόμηση καρτών κατά δυσκολία τοποθέτησης (MRV Heuristic)
    // Προτεραιότητα:
    // Α. Παράλληλα / Συγχρονισμένα μαθήματα (2η ξένη γλώσσα, Ομάδες προσανατολισμού)
    // Β. Κάρτες με απαιτήσεις ειδικών εργαστηρίων (Πληροφορική, Φυσική, Γυμναστήριο)
    // Γ. Κάρτες εκπαιδευτικών με περιορισμένη διαθεσιμότητα (Time-off)
    // Δ. Δίωρα μαθήματα (length = 2)
    // Ε. Μονόωρα μαθήματα
    const sortedCards = this.sortCardsByDifficulty(rawCards);

    // 3. Εκτέλεση Backtracking Solver
    let schedule = [];
    const unplaced = [];

    const success = this.backtrack(sortedCards, 0, schedule, onProgress);

    if (!success) {
      // 4. Min-conflicts τοπική αναζήτηση για προσπάθεια τοποθέτησης όσων απέμειναν
      this.minConflictsRepair(schedule, sortedCards);
    }

    // Διαχωρισμός τοποθετημένων και μη
    const placedCardIds = new Set(schedule.map((c) => c.id));
    for (const card of sortedCards) {
      if (!placedCardIds.has(card.id)) {
        unplaced.push(card);
      }
    }

    this.stats.endTime = performance.now();
    this.stats.placedCount = schedule.length;

    return {
      success: unplaced.length === 0,
      schedule,
      unplacedCards: unplaced,
      stats: {
        ...this.stats,
        durationMs: Math.round(this.stats.endTime - this.stats.startTime),
      },
    };
  }

  // Ταξινόμηση καρτών κατά σειρά περιοριστικότητας (Most Constrained First)
  sortCardsByDifficulty(cards) {
    const teacherOffCount = {};
    for (const t of this.timetable.teachers) {
      let blockedSlots = 0;
      if (t.timeOff) {
        for (const val of Object.values(t.timeOff)) {
          if (val === 'no') blockedSlots++;
        }
      }
      teacherOffCount[t.id] = blockedSlots;
    }

    return [...cards].sort((a, b) => {
      // 1. Προτεραιότητα σε συγχρονισμένες κάρτες (Sync Groups)
      const aSync = a.syncGroupId ? 100 : 0;
      const bSync = b.syncGroupId ? 100 : 0;
      if (aSync !== bSync) return bSync - aSync;

      // 2. Ειδικές αίθουσες
      const aRoom = a.roomId && a.roomId !== 'room_gen' ? 50 : 0;
      const bRoom = b.roomId && b.roomId !== 'room_gen' ? 50 : 0;
      if (aRoom !== bRoom) return bRoom - aRoom;

      // 3. Περιορισμός διαθεσιμότητας εκπαιδευτικού
      const aOff = teacherOffCount[a.teacherId] || 0;
      const bOff = teacherOffCount[b.teacherId] || 0;
      if (aOff !== bOff) return bOff - aOff;

      // 4. Δίωρα πριν τα μονόωρα
      if (a.length !== b.length) return b.length - a.length;

      // 5. Βαριά μαθήματα (υψηλή δυσκολία)
      return (b.difficulty || 1) - (a.difficulty || 1);
    });
  }

  // Backtracking CSP Search
  backtrack(cards, cardIndex, currentSchedule, onProgress) {
    this.stats.iterations++;

    if (this.stats.iterations > this.options.maxIterations) return false;
    if (performance.now() - this.stats.startTime > this.options.timeoutMs) return false;

    if (cardIndex >= cards.length) {
      return true; // Όλες οι κάρτες τοποθετήθηκαν επιτυχώς!
    }

    const card = cards[cardIndex];

    // Αν η κάρτα τοποθετήθηκε ήδη (π.χ. ως μέρος συγχρονισμένου γκρουπ), προχωράμε στην επόμενη
    if (currentSchedule.some((c) => c.id === card.id)) {
      return this.backtrack(cards, cardIndex + 1, currentSchedule, onProgress);
    }

    // Παράγουμε όλα τα υποψήφια slots και τα αξιολογούμε παιδαγωγικά
    const candidateSlots = this.generateOrderedSlots(card, currentSchedule);

    for (const { day, period } of candidateSlots) {
      // Αν η κάρτα έχει syncGroupId (π.χ. 2η ξένη γλώσσα), πρέπει να ελέγξουμε αν ΟΛΕΣ
      // οι συνδεδεμένες κάρτες του ίδιου syncGroupId μπορούν να τοποθετηθούν στο ίδιο slot!
      if (card.syncGroupId) {
        const siblingCards = cards.filter(
          (c) => c.syncGroupId === card.syncGroupId && !currentSchedule.some((p) => p.id === c.id)
        );

        let allValid = true;
        const tempPlaced = [];

        for (const sib of siblingCards) {
          const val = validateSlotPlacement(currentSchedule, sib, day, period, this.timetable);
          if (!val.valid) {
            allValid = false;
            break;
          }
          tempPlaced.push({
            ...sib,
            day,
            period,
          });
        }

        if (allValid) {
          currentSchedule.push(...tempPlaced);
          if (this.backtrack(cards, cardIndex + 1, currentSchedule, onProgress)) {
            return true;
          }
          // Backtrack: αφαίρεση των τοποθετημένων
          for (const tp of tempPlaced) {
            const idx = currentSchedule.findIndex((c) => c.id === tp.id);
            if (idx >= 0) currentSchedule.splice(idx, 1);
          }
        }
      } else {
        // Κανονική κάρτα
        const validation = validateSlotPlacement(currentSchedule, card, day, period, this.timetable);
        if (validation.valid) {
          const placedCard = { ...card, day, period };
          currentSchedule.push(placedCard);

          if (this.backtrack(cards, cardIndex + 1, currentSchedule, onProgress)) {
            return true;
          }

          // Backtrack
          currentSchedule.pop();
        }
      }
    }

    return false;
  }

  // Δημιουργία και ταξινόμηση slots βάσει παιδαγωγικών κανόνων & ελαχιστοποίησης κενών
  generateOrderedSlots(card, currentSchedule) {
    const slots = [];
    const maxPeriod = this.timetable.periodsPerDay - (card.length - 1);

    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= maxPeriod; period++) {
        const score = this.calculateSlotScore(card, day, period, currentSchedule);
        slots.push({ day, period, score });
      }
    }

    // Ταξινόμηση κατά φθίνουσα σειρά καταλληλότητας (υψηλότερο score πρώτα)
    slots.sort((a, b) => b.score - a.score);
    return slots;
  }

  // Αξιολόγηση ενός υποψήφιου slot για μια κάρτα (Soft Constraints Scoring)
  calculateSlotScore(card, day, period, currentSchedule) {
    let score = 100;

    // 1. Παιδαγωγική ώρα ανάλογα με τη δυσκολία
    // Δύσκολα μαθήματα (Math, Ancient Greek, Physics): ιδανικά ώρες 2, 3, 4
    if (card.difficulty >= 3) {
      if (period >= 2 && period <= 4) score += 30;
      else if (period === 1) score += 20; // 1η ώρα είναι απολύτως κατάλληλη για πρωινά μαθήματα
      else if (period >= 6) score -= 40; // Όχι 6η ή 7η ώρα!
    } else if (card.difficulty === 1) {
      // Ελαφριά μαθήματα (Γυμναστική, Μουσική, Εικαστικά): προτιμώνται ώρες 4-7
      if (period >= 4) score += 20;
      else if (period === 1) score -= 5;
    }

    // 2. Ελαχιστοποίηση κενών εκπαιδευτικού (Teacher Gaps / Windows)
    if (card.teacherId) {
      const teacherCardsToday = currentSchedule.filter(
        (c) => c.teacherId === card.teacherId && c.day === day && c.id !== card.id
      );
      if (teacherCardsToday.length > 0) {
        // Αν είναι συνεχόμενο με άλλο μάθημα του ίδιου καθηγητή (δίπλα δίπλα), επιβραβεύεται έντονα!
        const isAdjacent = teacherCardsToday.some(
          (c) => c.period + (c.length || 1) === period || period + (card.length || 1) === c.period
        );
        if (isAdjacent) score += 40;
        else score -= 15; // Δημιουργεί πιθανό κενό
      }
    }

    // 3. Διασπορά μαθημάτων μέσα στην εβδομάδα (Day Spread)
    // Αν το τμήμα έχει ήδη αυτό το μάθημα σήμερα, αποθαρρύνεται αυστηρά (ειδικά για 1+1 όπως Πληροφορική, Θρησκευτικά, Φυσική Αγωγή)
    const classSameSubjectToday = currentSchedule.filter(
      (c) => c.classId === card.classId && c.subjectId === card.subjectId && c.day === day && c.id !== card.id
    );
    if (classSameSubjectToday.length > 0) {
      score -= 160; // Αυστηρή αποφυγή επανάληψης του ίδιου μαθήματος την ίδια ημέρα
    }

    // 4. Συνέχεια ωραρίου τμήματος (ΑΠΟΛΥΤΟΣ ΚΑΝΟΝΑΣ: Όχι κενά στους μαθητές, έναρξη πάντα 1η ώρα)
    const classCardsToday = currentSchedule.filter(
      (c) => c.classId === card.classId && c.day === day && c.id !== card.id
    );

    const occupiedPeriods = new Set();
    for (const c of classCardsToday) {
      const len = c.length || 1;
      for (let o = 0; o < len; o++) {
        occupiedPeriods.add(c.period + o);
      }
    }

    const cardLen = card.length || 1;
    const cardEnd = period + cardLen - 1;

    if (occupiedPeriods.size === 0) {
      // Πρώτο μάθημα της ημέρας για το τμήμα: Πρέπει οπωσδήποτε να ξεκινάει 1η ώρα!
      if (period === 1) {
        score += 80;
      } else {
        score -= period * 25; // Έντονη ποινή αν ξεκινάει 2η, 3η ή αργότερα
      }
    } else {
      // Υπάρχουν ήδη μαθήματα στο τμήμα σήμερα:
      // Επιβράβευση αν είναι ακριβώς συνεχόμενο (χωρίς κανένα κενό)
      if (occupiedPeriods.has(period - 1) || occupiedPeriods.has(cardEnd + 1)) {
        score += 50;
      } else {
        score -= 70; // Δημιουργεί κενό/τρύπα στο πρόγραμμα των μαθητών
      }

      // Αν η 1η ώρα δεν έχει καλυφθεί ακόμα και αυτό το μάθημα δεν ξεκινά την 1η ώρα:
      if (!occupiedPeriods.has(1) && period !== 1) {
        score -= 90;
      }
    }

    // 5. Ισόρροπη κατανομή ωραρίου τμήματος ανά ημέρα (στόχος: ~6-7 ώρες/ημέρα)
    const hoursToday = occupiedPeriods.size + cardLen;
    if (hoursToday > 7) score -= 60;
    else if (hoursToday >= 6) score -= 15;

    return score;
  }

  // Τοπική επισκευή για περιπτώσεις που έχουν μείνει ελάχιστες ατοποθέτητες κάρτες
  minConflictsRepair(schedule, allCards) {
    const placedIds = new Set(schedule.map((c) => c.id));
    const unplaced = allCards.filter((c) => !placedIds.has(c.id));

    for (const card of unplaced) {
      // Δοκιμή εύρεσης ενός slot με 1 μόνο σύγκρουση και ανταλλαγή
      for (let day = 1; day <= 5; day++) {
        for (let period = 1; period <= this.timetable.periodsPerDay - (card.length - 1); period++) {
          const val = validateSlotPlacement(schedule, card, day, period, this.timetable);
          if (val.valid) {
            schedule.push({ ...card, day, period });
            placedIds.add(card.id);
            break;
          }
        }
        if (placedIds.has(card.id)) break;
      }
    }
  }
}
