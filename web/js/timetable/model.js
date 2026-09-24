// model.js — Μοντέλο Δεδομένων & Κανόνες Εγκυρότητας Ωρολογίου Προγράμματος
// Υποστηρίζει Τμήματα, Εκπαιδευτικούς, Διαθεσιμότητα (Time-off), Αίθουσες, Μαθήματα/Κάρτες και Διασπάσεις Τμημάτων.

import { CURRICULA, DAYS_OF_WEEK, DEFAULT_BELL_TIMES, DIMOTIKO_ORGANICITIES, isBranchValidForSchoolType, SCHOOL_TYPES, SPECIAL_ROOMS } from './curricula.js';

export function createInitialTimetable(schoolType = 'gymnasio') {
  const typeConfig = SCHOOL_TYPES[schoolType] || SCHOOL_TYPES.gymnasio;
  const bell = schoolType === 'dimotiko' ? DEFAULT_BELL_TIMES.primary : DEFAULT_BELL_TIMES.secondary;

  const defaultClasses = schoolType === 'dimotiko'
    ? [
        { id: 'c_a1', name: 'Α1', grade: 'Α', grades: ['Α'] },
        { id: 'c_b1', name: 'Β1', grade: 'Β', grades: ['Β'] },
        { id: 'c_g1', name: 'Γ1', grade: 'Γ', grades: ['Γ'] },
        { id: 'c_d1', name: 'Δ1', grade: 'Δ', grades: ['Δ'] },
        { id: 'c_e1', name: 'Ε1', grade: 'Ε', grades: ['Ε'] },
        { id: 'c_st1', name: 'ΣΤ1', grade: 'ΣΤ', grades: ['ΣΤ'] },
      ]
    : [
        { id: 'c_1', name: 'Α1', grade: 'Α', grades: ['Α'] },
        { id: 'c_2', name: 'Α2', grade: 'Α', grades: ['Α'] },
        { id: 'c_3', name: 'Β1', grade: 'Β', grades: ['Β'] },
      ];

  return {
    version: 1,
    schoolType,
    dimotikoOrganicity: schoolType === 'dimotiko' ? '6th_plus' : null,
    periodsPerDay: typeConfig.periodsPerDay,
    daysCount: 5,
    bellTimes: JSON.parse(JSON.stringify(bell)),
    classes: defaultClasses,
    rooms: JSON.parse(JSON.stringify(SPECIAL_ROOMS)),
    teachers: [], // Θα τροφοδοτηθεί αυτόματα από το κατάστημα εργαζομένων ή χειροκίνητα
    lessons: [],
    schedule: [], // Τοποθετημένες κάρτες: { id, lessonId, day, period, classId, teacherId, subjectId, roomId, length, syncId }
    unplacedCards: [],
    rules: {
      maxConsecutiveSameSubject: 2,
      maxConsecutiveTeacherHours: 4,
      maxTeacherGapsPerDay: 1,
      preferMorningDifficultSubjects: true,
      maxGymSimultaneousClasses: 2,
    },
  };
}

// Εξασφάλιση ότι όλα τα πεδία και οι πίνακες του ωρολογίου υπάρχουν και είναι έγκυροι
export function normalizeTimetable(tt) {
  if (!tt || typeof tt !== 'object') return createInitialTimetable('gymnasio');
  if (!tt.schoolType) tt.schoolType = 'gymnasio';
  if (tt.schoolType === 'dimotiko' && !tt.dimotikoOrganicity) tt.dimotikoOrganicity = '6th_plus';
  const typeConfig = SCHOOL_TYPES[tt.schoolType] || SCHOOL_TYPES.gymnasio;
  if (!tt.periodsPerDay) tt.periodsPerDay = typeConfig.periodsPerDay || 7;
  if (!Array.isArray(tt.classes)) tt.classes = [];
  if (tt.schoolType === 'dimotiko' && tt.classes.length === 0) {
    tt.classes = [
      { id: 'c_a1', name: 'Α1', grade: 'Α', grades: ['Α'] },
      { id: 'c_b1', name: 'Β1', grade: 'Β', grades: ['Β'] },
      { id: 'c_g1', name: 'Γ1', grade: 'Γ', grades: ['Γ'] },
      { id: 'c_d1', name: 'Δ1', grade: 'Δ', grades: ['Δ'] },
      { id: 'c_e1', name: 'Ε1', grade: 'Ε', grades: ['Ε'] },
      { id: 'c_st1', name: 'ΣΤ1', grade: 'ΣΤ', grades: ['ΣΤ'] },
    ];
  }
  tt.classes.forEach((c) => {
    if (!Array.isArray(c.grades) || c.grades.length === 0) {
      if (c.grade && typeof c.grade === 'string') {
        if (c.grade === 'Α_ΣΤ' || c.grade === 'Α_Β_Γ_Δ_Ε_ΣΤ') {
          c.grades = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'];
        } else if (c.grade === 'Α_Γ' || c.grade === 'Α_Β_Γ') {
          c.grades = ['Α', 'Β', 'Γ'];
        } else if (c.grade === 'Δ_ΣΤ' || c.grade === 'Δ_Ε_ΣΤ') {
          c.grades = ['Δ', 'Ε', 'ΣΤ'];
        } else if (c.grade === 'Α_Β') {
          c.grades = ['Α', 'Β'];
        } else if (c.grade === 'Γ_Δ') {
          c.grades = ['Γ', 'Δ'];
        } else if (c.grade === 'Ε_ΣΤ') {
          c.grades = ['Ε', 'ΣΤ'];
        } else if (c.grade.includes('_')) {
          c.grades = c.grade.split('_');
        } else {
          c.grades = [c.grade];
        }
      } else {
        c.grades = ['Α'];
        c.grade = 'Α';
      }
    }
    if (!c.grade) {
      c.grade = c.grades.join('_');
    }
  });
  if (!Array.isArray(tt.teachers)) tt.teachers = [];
  if (!Array.isArray(tt.lessons)) tt.lessons = [];
  else {
    tt.lessons.forEach((l) => {
      if (l.hours !== undefined && l.hours !== null && (l.defaultHours === undefined || l.defaultHours === null)) {
        l.defaultHours = l.hours;
      }
    });

    // Αυτόματος υπολογισμός των ανατεθειμένων ωρών ανά εκπαιδευτικό
    const hoursMap = {};
    tt.lessons.forEach((l) => {
      if (l.teacherId && Number(l.hours) > 0) {
        hoursMap[l.teacherId] = (hoursMap[l.teacherId] || 0) + Number(l.hours);
      }
    });
    tt.teachers.forEach((t) => {
      t.assignedHours = hoursMap[t.id] || 0;
    });
  }
  if (!Array.isArray(tt.rooms) || tt.rooms.length === 0) tt.rooms = JSON.parse(JSON.stringify(SPECIAL_ROOMS));
  if (!Array.isArray(tt.schedule)) tt.schedule = [];
  if (!Array.isArray(tt.unplacedCards)) tt.unplacedCards = [];
  if (!Array.isArray(tt.bellTimes)) {
    tt.bellTimes = tt.schoolType === 'dimotiko' ? DEFAULT_BELL_TIMES.primary : DEFAULT_BELL_TIMES.secondary;
  }
  if (!tt.rules) {
    tt.rules = {
      maxConsecutiveSameSubject: 2,
      maxConsecutiveTeacherHours: 4,
      maxTeacherGapsPerDay: 1,
      preferMorningDifficultSubjects: true,
      maxGymSimultaneousClasses: 2,
    };
  }
  return tt;
}

// Δημιουργία των καρτών (Cards) από τις δηλωμένες αναθέσεις μαθημάτων (Lessons)
// Στο στυλ του aSc Timetables: Ένα μάθημα 4 ωρών μπορεί να σπάσει σε 1 δίωρο + 2 μονόωρα (2+1+1)
// Αν οι ώρες ενός μαθήματος έχουν οριστεί σε 0, δεν παράγονται κάρτες (ανενεργό μάθημα)
export function generateCardsFromLessons(lessons) {
  const cards = [];
  if (!Array.isArray(lessons)) return cards;
  for (const lesson of lessons) {
    const totalHours = Number(lesson.hours);
    if (!totalHours || totalHours <= 0) continue; // 0 ώρες: παράλειψη
    let distribution = lesson.distribution; // π.χ. '2+2', '2+1+1', '1+1+1+1'

    if (!distribution) {
      if (totalHours === 1) distribution = [1];
      else if (totalHours === 2) distribution = [2];
      else if (totalHours === 3) distribution = [2, 1];
      else if (totalHours === 4) distribution = [2, 1, 1];
      else if (totalHours === 5) distribution = [2, 1, 1, 1];
      else if (totalHours === 6) distribution = [2, 2, 2];
      else if (totalHours >= 7) distribution = Array(totalHours).fill(1);
    } else if (typeof distribution === 'string') {
      distribution = distribution.split('+').map(Number);
    }

    distribution.forEach((cardLength, idx) => {
      cards.push({
        id: `card_${lesson.id}_${idx + 1}`,
        lessonId: lesson.id,
        classId: lesson.classId,
        subjectId: lesson.subjectId,
        subjectName: lesson.subjectName,
        subjectShort: lesson.subjectShort,
        subjectColor: lesson.subjectColor,
        teacherId: lesson.teacherId,
        teacherName: lesson.teacherName,
        roomId: lesson.roomId || 'room_gen',
        length: cardLength, // 1 ή 2
        difficulty: lesson.difficulty || 2,
        isSplit: Boolean(lesson.isSplit),
        splitType: lesson.splitType || null,
        syncGroupId: lesson.syncGroupId || null, // Αν ανήκει σε κοινή ζώνη 2ης ξένης γλώσσας ή προσανατολισμού
      });
    });
  }
  return cards;
}

// Αυτόματη φόρτωση του νομοθετημένου αναλυτικού προγράμματος στα τμήματα
export function populateCurriculumForClasses(timetable) {
  const { schoolType, classes } = timetable;
  const curriculaForSchool = CURRICULA[schoolType] || {};
  const lessons = [];

  for (const cls of classes) {
    let template = curriculaForSchool[cls.grade];

    if (!template || template.length === 0) {
      if (Array.isArray(cls.grades) && cls.grades.length > 0) {
        if (cls.grades.length === 6) {
          template = curriculaForSchool['Α_ΣΤ'];
        } else if (cls.grades.length === 3) {
          const gStr = cls.grades.join('');
          if (gStr === 'ΑΒΓ') template = curriculaForSchool['Α_Γ'];
          else if (gStr === 'ΔΕΣΤ') template = curriculaForSchool['Δ_ΣΤ'];
        } else if (cls.grades.length === 2) {
          const gStr = cls.grades.join('');
          if (gStr === 'ΑΒ') template = curriculaForSchool['Α_Β'];
          else if (gStr === 'ΓΔ') template = curriculaForSchool['Γ_Δ'];
          else if (gStr === 'ΕΣΤ') template = curriculaForSchool['Ε_ΣΤ'];
        } else if (cls.grades.length === 1) {
          template = curriculaForSchool[cls.grades[0]];
        }
      }
    }

    if (!template || template.length === 0) {
      if (Array.isArray(cls.grades) && cls.grades.length > 0) {
        template = curriculaForSchool[cls.grades[cls.grades.length - 1]] || curriculaForSchool['Α'] || [];
      } else {
        template = curriculaForSchool['Α'] || [];
      }
    }

    for (const item of template) {
      const lessonId = `les_${cls.id}_${item.id}`;
      // Αν είναι παράλληλο μάθημα (π.χ. 2η ξένη γλώσσα), συγχρονίζεται με τα υπόλοιπα τμήματα της ίδιας τάξης
      const syncGroupId = item.isSplit ? `sync_${cls.grade}_${item.id}` : null;

      lessons.push({
        id: lessonId,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        grades: Array.isArray(cls.grades) ? [...cls.grades] : [cls.grade],
        subjectId: item.id,
        subjectName: item.name,
        subjectShort: item.short,
        subjectColor: item.color,
        hours: item.hours,
        defaultHours: item.hours, // Επίσημη προεπιλογή βάσει νομοθεσίας
        branch: item.branch,
        teacherId: '', // Θα ανατεθεί από τον Διευθυντή
        teacherName: '— Χωρίς εκπαιδευτικό —',
        roomId: item.room || 'room_gen',
        difficulty: item.difficulty,
        isSplit: item.isSplit || false,
        splitType: item.splitType || null,
        syncGroupId,
      });
    }
  }

  timetable.lessons = lessons;

  // Αν υπάρχουν ήδη καταχωρισμένοι εκπαιδευτικοί, ανάθεσέ τους αυτόματα βάσει ειδικότητας
  if (timetable.teachers && timetable.teachers.length > 0) {
    autoAssignTeachers(timetable, { overwriteExisting: false });
  }

  return lessons;
}

// Έλεγχος συμβατότητας κλάδου/ειδικότητας εκπαιδευτικού με το μάθημα
export function isBranchMatch(teacherBranch, lessonBranch) {
  if (!teacherBranch || !lessonBranch) return false;
  const strip = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const tb = strip(teacherBranch);
  const lb = strip(lessonBranch);

  if (tb === lb) return true;

  // Υποστήριξη σύνθετων κλάδων με κάθετο (π.χ. 'ΠΕ05/ΠΕ07' ή 'ΠΕ81-89/ΤΕ01/ΔΕ01')
  if (lb.includes('/')) {
    const parts = lb.split('/').map((s) => s.trim());
    if (parts.some((p) => isBranchMatch(tb, p))) return true;
  }
  if (tb.includes('/')) {
    const parts = tb.split('/').map((s) => s.trim());
    if (parts.some((p) => isBranchMatch(p, lb))) return true;
  }

  // Ταύτιση βασικού κλάδου (π.χ. ΠΕ04.01 -> ΠΕ04, ΠΕ79.01 -> ΠΕ79, ΠΕ91.01 -> ΠΕ91)
  const tbBase = tb.split('.')[0];
  const lbBase = lb.split('.')[0];
  if (tb === lbBase || tbBase === lb || tbBase === lbBase) return true;

  // Έλεγχος εύρους κλάδων (π.χ. 'ΠΕ81-84' ή 'ΠΕ81-89')
  const rangeMatch = lb.match(/^ΠΕ(\d{2})-(\d{2})$/);
  if (rangeMatch) {
    const from = parseInt(rangeMatch[1], 10);
    const to = parseInt(rangeMatch[2], 10);
    const tbNumMatch = tb.match(/^ΠΕ(\d{2})/);
    if (tbNumMatch) {
      const tbNum = parseInt(tbNumMatch[1], 10);
      if (tbNum === 86 && to <= 85) return false; // Η Πληροφορική (ΠΕ86) δεν εμπίπτει στην Τεχνολογία (ΠΕ81-84)
      if (tbNum >= from && tbNum <= to) return true;
    }
    return false;
  }

  // Ειδικές περιπτώσεις τεχνικών/επαγγελματικών κλάδων
  if (lb.startsWith('ΤΕ') && tb.startsWith('ΤΕ')) return true;
  if (lb.startsWith('ΔΕ') && tb.startsWith('ΔΕ')) return true;
  if (lb === 'ΟΛΟΙ' || lb === 'ALL') return true;

  return false;
}

// Αυτόματη ανάθεση εκπαιδευτικών σε μαθήματα βάσει συμβατής ειδικότητας και υπολειπόμενου ωραρίου
export function autoAssignTeachers(timetable, { overwriteExisting = false } = {}) {
  const teachers = timetable.teachers || [];
  const lessons = timetable.lessons || [];
  if (!teachers.length || !lessons.length) return 0;

  // Υπολογισμός ανατεθειμένων ωρών ανά εκπαιδευτικό
  const assignedHours = {};
  teachers.forEach((t) => {
    assignedHours[t.id] = 0;
  });

  lessons.forEach((l) => {
    if (!overwriteExisting && l.teacherId && assignedHours[l.teacherId] !== undefined) {
      assignedHours[l.teacherId] += Number(l.hours) || 0;
    }
  });

  // Μνήμη ανάθεσης δασκάλου (ΠΕ70) ανά τμήμα στο Δημοτικό, ώστε ο ίδιος δάσκαλος να έχει τα βασικά μαθήματα της τάξης του
  const classPrimaryTeacher = {};
  lessons.forEach((l) => {
    if (l.teacherId && isBranchMatch('ΠΕ70', l.branch)) {
      classPrimaryTeacher[l.classId] = l.teacherId;
    }
  });

  let assignedCount = 0;

  // Φιλτράρισμα μαθημάτων που χρήζουν ανάθεσης (με ώρες > 0)
  const pendingLessons = lessons.filter((l) => {
    const hrs = Number(l.hours) || 0;
    if (hrs <= 0) {
      l.teacherId = '';
      l.teacherName = '— Χωρίς εκπαιδευτικό —';
      return false;
    }
    return overwriteExisting || !l.teacherId;
  });

  // Ταξινόμηση προτεραιότητας ανάθεσης:
  // 1. ΠΕ70 δάσκαλοι ανά τμήμα (ώστε να κλειδώσει ο δάσκαλος στο τμήμα του)
  // 2. Ειδικότητες με πολλές ώρες
  pendingLessons.sort((a, b) => {
    const isPE70A = isBranchMatch('ΠΕ70', a.branch);
    const isPE70B = isBranchMatch('ΠΕ70', b.branch);
    if (isPE70A && !isPE70B) return -1;
    if (!isPE70A && isPE70B) return 1;

    if (a.classId !== b.classId) {
      return a.classId.localeCompare(b.classId);
    }
    return (Number(b.hours) || 0) - (Number(a.hours) || 0);
  });

  for (const les of pendingLessons) {
    const lesHours = Number(les.hours) || 0;
    if (lesHours <= 0) continue;

    // Εύρεση εκπαιδευτικών με συμβατή ειδικότητα που ανήκουν στη βαθμίδα του σχολείου
    const matchingTeachers = teachers.filter((t) => {
      if (!isBranchValidForSchoolType(t.branch, timetable.schoolType)) return false;
      return isBranchMatch(t.branch, les.branch);
    });
    if (!matchingTeachers.length) continue;

    let chosenTeacher = null;

    // Περίπτωση Α: Δημοτικό ΠΕ70 - Αν το τμήμα έχει ήδη υπεύθυνο δάσκαλο
    if (isBranchMatch('ΠΕ70', les.branch) && classPrimaryTeacher[les.classId]) {
      const preferred = matchingTeachers.find((t) => t.id === classPrimaryTeacher[les.classId]);
      if (preferred) {
        const cur = assignedHours[preferred.id] || 0;
        const req = preferred.requiredHours || 24;
        // Επιτρέπουμε στον υπεύθυνο δάσκαλο να αναλάβει τα μαθήματα του τμήματός του
        if (cur < req + 3) {
          chosenTeacher = preferred;
        }
      }
    }

    // Περίπτωση Β: Γενική επιλογή εκπαιδευτικού
    if (!chosenTeacher) {
      // Βαθμολόγηση υποψηφίων
      const scored = matchingTeachers.map((t) => {
        const cur = assignedHours[t.id] || 0;
        const req = t.requiredHours || 20;
        const rem = req - cur;
        const exactBranch = String(t.branch).trim().toUpperCase() === String(les.branch).trim().toUpperCase();
        const teachesInClass = lessons.some((l) => l.classId === les.classId && l.teacherId === t.id);
        const fitsCapacity = rem >= lesHours;

        return {
          teacher: t,
          cur,
          req,
          rem,
          exactBranch,
          teachesInClass,
          fitsCapacity,
        };
      });

      scored.sort((a, b) => {
        // Πρώτα όσοι χωράνε πλήρως το μάθημα
        if (a.fitsCapacity && !b.fitsCapacity) return -1;
        if (!a.fitsCapacity && b.fitsCapacity) return 1;

        // Ακριβής κλάδος
        if (a.exactBranch && !b.exactBranch) return -1;
        if (!a.exactBranch && b.exactBranch) return 1;

        // Ήδη διδάσκει στο ίδιο τμήμα
        if (a.teachesInClass && !b.teachesInClass) return -1;
        if (!a.teachesInClass && b.teachesInClass) return 1;

        // Περισσότερες εναπομείνασες ώρες
        return b.rem - a.rem;
      });

      // Επιλογή καλύτερου υποψηφίου:
      // Αν ο κορυφαίος έχει remaining > 0, ή αν είναι ο μόνος διαθέσιμος της ειδικότητας
      if (scored[0].rem > 0 || matchingTeachers.length === 1) {
        chosenTeacher = scored[0].teacher;
      }
    }

    if (chosenTeacher) {
      les.teacherId = chosenTeacher.id;
      les.teacherName = chosenTeacher.name;
      assignedHours[chosenTeacher.id] = (assignedHours[chosenTeacher.id] || 0) + lesHours;
      if (isBranchMatch('ΠΕ70', les.branch) && !classPrimaryTeacher[les.classId]) {
        classPrimaryTeacher[les.classId] = chosenTeacher.id;
      }
      assignedCount++;
    }
  }

  return assignedCount;
}

// Ελεγκτής συγκρούσεων και περιορισμών (Constraint & Conflict Checker)
export function validateSlotPlacement(schedule, card, day, period, timetable) {
  const conflicts = [];
  const warnings = [];
  const cardLength = card.length || 1;

  for (let offset = 0; offset < cardLength; offset++) {
    const targetPeriod = period + offset;
    if (targetPeriod > timetable.periodsPerDay) {
      conflicts.push(`Η διδασκαλία υπερβαίνει το ημερήσιο ωράριο (${targetPeriod}η ώρα).`);
      continue;
    }

    // 1. Έλεγχος διαθεσιμότητας εκπαιδευτικού (Time-off matrix)
    if (card.teacherId) {
      const teacher = timetable.teachers.find((t) => t.id === card.teacherId);
      if (teacher && teacher.timeOff) {
        const status = teacher.timeOff[`${day}-${targetPeriod}`];
        if (status === 'no') {
          conflicts.push(`Ο/Η ${teacher.name} έχει δηλωθεί μη διαθέσιμος/η τη ${DAYS_OF_WEEK[day - 1]?.name} την ${targetPeriod}η ώρα (διάθεση σε άλλο σχολείο / ρεπό).`);
        } else if (status === 'warn') {
          warnings.push(`Ο/Η ${teacher.name} προτιμά να μην διδάσκει την ${targetPeriod}η ώρα.`);
        }
      }
    }

    // 2. Έλεγχος σύγκρουσης στο τρέχον πρόγραμμα
    for (const placed of schedule) {
      if (placed.id === card.id) continue;
      // Καλύπτει αυτό το τοποθετημένο μάθημα το targetPeriod;
      const placedLength = placed.length || 1;
      const placedEnd = placed.period + placedLength - 1;
      if (placed.day !== day) continue;
      if (targetPeriod < placed.period || targetPeriod > placedEnd) continue;

      // Α. Σύγκρουση Τμήματος
      if (placed.classId === card.classId) {
        // Εξαίρεση: αν είναι μέρος του ίδιου split (π.χ. Γαλλικά & Γερμανικά στο ίδιο τμήμα με διαφορετικό εκπαιδευτικό)
        if (card.isSplit && placed.isSplit && card.syncGroupId === placed.syncGroupId && card.subjectId !== placed.subjectId) {
          // Επιτρεπτό παράλληλο split
        } else {
          conflicts.push(`Το τμήμα ${card.className || ''} έχει ήδη μάθημα (${placed.subjectName}) την ${targetPeriod}η ώρα.`);
        }
      }

      // Β. Σύγκρουση Εκπαιδευτικού (δεν μπορεί να είναι σε 2 τμήματα ταυτόχρονα)
      if (card.teacherId && placed.teacherId && placed.teacherId === card.teacherId) {
        conflicts.push(`Ο/Η ${card.teacherName} διδάσκει ήδη στο τμήμα ${placed.className || placed.classId} την ${targetPeriod}η ώρα.`);
      }

      // Γ. Σύγκρουση Ειδικής Αίθουσας / Εργαστηρίου
      if (card.roomId && card.roomId !== 'room_gen' && placed.roomId === card.roomId) {
        const roomName = timetable.rooms.find((r) => r.id === card.roomId)?.name || card.roomId;
        conflicts.push(`Ο ειδικός χώρος «${roomName}» είναι κατειλημμένος από το ${placed.className || placed.classId} την ${targetPeriod}η ώρα.`);
      }
    }
  }

  // 3. Έλεγχος συνεχόμενων ωρών του ίδιου μαθήματος (αποφυγή τριώρων)
  const sameSubjectSameDay = schedule.filter(
    (p) => p.classId === card.classId && p.subjectId === card.subjectId && p.day === day && p.id !== card.id
  );
  if (sameSubjectSameDay.length > 0) {
    const totalHoursToday = sameSubjectSameDay.reduce((sum, p) => sum + (p.length || 1), 0) + cardLength;
    if (totalHoursToday > timetable.rules.maxConsecutiveSameSubject) {
      warnings.push(`Υπερβαίνει τις συνιστώμενες ώρες (${timetable.rules.maxConsecutiveSameSubject}) για το ίδιο μάθημα την ίδια μέρα στο τμήμα.`);
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings,
  };
}
