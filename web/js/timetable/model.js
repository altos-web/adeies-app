// model.js — Μοντέλο Δεδομένων & Κανόνες Εγκυρότητας Ωρολογίου Προγράμματος
// Υποστηρίζει Τμήματα, Εκπαιδευτικούς, Διαθεσιμότητα (Time-off), Αίθουσες, Μαθήματα/Κάρτες και Διασπάσεις Τμημάτων.

import { CURRICULA, DAYS_OF_WEEK, DEFAULT_BELL_TIMES, DIMOTIKO_ORGANICITIES, isBranchValidForSchoolType, SCHOOL_TYPES, SPECIAL_ROOMS, OLOIMERO_CURRICULA } from './curricula.js';

// Κατασκευή του επίσημου ωραρίου κουδουνιού (κουδούνι πρωινού, πρωινής ζώνης και ολοημέρου)
export function buildBellTimes(timetable) {
  const times = [];
  const isDimotiko = timetable.schoolType === 'dimotiko';
  const isOligothesio = isDimotiko && ['1th', '2th', '3th'].includes(timetable.dimotikoOrganicity);

  // 1. Πρωινή Ζώνη (07:00 - 08:00)
  if (isDimotiko && timetable.hasProiniZoni) {
    times.push(JSON.parse(JSON.stringify(DEFAULT_BELL_TIMES.proini_zoni)));
  }

  // 2. Πρωινό Πρόγραμμα (08:15 - 13:15 ή 13:30)
  if (isDimotiko) {
    const basePrimary = isOligothesio ? DEFAULT_BELL_TIMES.primary_oligothesia : DEFAULT_BELL_TIMES.primary;
    times.push(...JSON.parse(JSON.stringify(basePrimary)));
  } else {
    times.push(...JSON.parse(JSON.stringify(DEFAULT_BELL_TIMES.secondary)));
  }

  // 3. Ολοήμερο Πρόγραμμα
  if (isDimotiko && timetable.hasOloimero) {
    const oloSource = isOligothesio ? DEFAULT_BELL_TIMES.oloimero_oligothesia : DEFAULT_BELL_TIMES.oloimero_primary;
    const isExpanded = timetable.oloimeroType === 'expanded';
    const oloTimes = isExpanded ? oloSource : oloSource.slice(0, 3);
    times.push(...JSON.parse(JSON.stringify(oloTimes)));
  }

  return times;
}

// Συγχρονισμός ειδικών τμημάτων (Πρωινή Ζώνη & Ολοήμερο)
export function syncSpecialClasses(timetable) {
  if (timetable.schoolType !== 'dimotiko') return;

  // 1. Πρωινή Ζώνη
  const pzIdx = timetable.classes.findIndex((c) => c.isProiniZoni || c.id === 'c_proini_zoni');
  if (timetable.hasProiniZoni) {
    if (pzIdx === -1) {
      timetable.classes.push({
        id: 'c_proini_zoni',
        name: 'Πρωινή Ζώνη',
        grade: 'ΠΡ_ΖΩΝΗ',
        grades: ['ΠΡ_ΖΩΝΗ'],
        isProiniZoni: true,
      });
    }
  } else {
    if (pzIdx !== -1) {
      timetable.classes.splice(pzIdx, 1);
      timetable.lessons = (timetable.lessons || []).filter((l) => l.classId !== 'c_proini_zoni');
    }
  }

  // 2. Ολοήμερο Πρόγραμμα
  const oloCount = timetable.hasOloimero ? (timetable.oloimeroCount || 1) : 0;
  timetable.classes = timetable.classes.filter((c) => {
    if (!c.isOloimero) return true;
    const num = parseInt(c.id.replace('c_olo_', ''), 10) || 1;
    return num <= oloCount;
  });
  for (let i = 1; i <= oloCount; i++) {
    const oloId = `c_olo_${i}`;
    const exists = timetable.classes.some((c) => c.id === oloId);
    if (!exists) {
      timetable.classes.push({
        id: oloId,
        name: oloCount === 1 ? 'Ολοήμερο' : `Ολοήμερο ${i}`,
        grade: 'ΟΛΟΗΜΕΡΟ',
        grades: ['ΟΛΟΗΜΕΡΟ'],
        isOloimero: true,
      });
    }
  }
  if (!timetable.hasOloimero) {
    timetable.lessons = (timetable.lessons || []).filter((l) => !l.isOloimero);
  }
}

export function createInitialTimetable(schoolType = 'gymnasio') {
  const typeConfig = SCHOOL_TYPES[schoolType] || SCHOOL_TYPES.gymnasio;

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

  const tt = {
    version: 1,
    schoolType,
    dimotikoOrganicity: schoolType === 'dimotiko' ? '6th_plus' : null,
    hasProiniZoni: false,
    hasOloimero: false,
    oloimeroType: 'basic', // 'basic' | 'expanded'
    oloimeroCount: 1,
    periodsPerDay: typeConfig.periodsPerDay,
    daysCount: 5,
    bellTimes: [],
    classes: defaultClasses,
    rooms: JSON.parse(JSON.stringify(SPECIAL_ROOMS)),
    teachers: [],
    lessons: [],
    schedule: [],
    unplacedCards: [],
    rules: {
      maxConsecutiveSameSubject: 2,
      maxConsecutiveTeacherHours: 4,
      maxTeacherGapsPerDay: 1,
      preferMorningDifficultSubjects: true,
      maxGymSimultaneousClasses: 2,
    },
  };
  tt.bellTimes = buildBellTimes(tt);
  return tt;
}

// Εξασφάλιση ότι όλα τα πεδία και οι πίνακες του ωρολογίου υπάρχουν και είναι έγκυροι
export function normalizeTimetable(tt) {
  if (!tt || typeof tt !== 'object') return createInitialTimetable('gymnasio');
  if (!tt.schoolType) tt.schoolType = 'gymnasio';
  if (tt.schoolType === 'dimotiko') {
    if (!tt.dimotikoOrganicity) tt.dimotikoOrganicity = '6th_plus';
    if (tt.hasProiniZoni === undefined) tt.hasProiniZoni = false;
    if (tt.hasOloimero === undefined) tt.hasOloimero = false;
    if (!tt.oloimeroType) tt.oloimeroType = 'basic';
    if (!tt.oloimeroCount) tt.oloimeroCount = 1;
  }
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
    if (c.isProiniZoni || c.isOloimero) return;
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
      if (!l.distribution && Number(l.hours) > 0) {
        const def = getDefaultLessonDistribution(l, l.hours);
        l.distribution = Array.isArray(def) ? def.join('+') : String(def);
        if (!l.defaultDistribution) l.defaultDistribution = l.distribution;
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
  
  // Ανακατασκευή των bell times βάσει ενεργών ρυθμίσεων (Ολιγοθέσιο / Πρωινή Ζώνη / Ολοήμερο)
  tt.bellTimes = buildBellTimes(tt);
  if (tt.schoolType === 'dimotiko') {
    if (tt.hasOloimero) {
      tt.periodsPerDay = tt.oloimeroType === 'expanded' ? 11 : 9;
    } else {
      tt.periodsPerDay = 6;
    }
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

// Επιστρέφει την προεπιλεγμένη παιδαγωγική κατανομή ωρών (Μονόωρα / Δίωρα)
// ΣΗΜΑΝΤΙΚΟ: Τα δευτερεύοντα μαθήματα (Πληροφορική, Θρησκευτικά, Φυσική Αγωγή, Ιστορία κτλ.)
// ΔΕΝ γίνονται συνεχόμενο δίωρο αλλά σπάνε σε 1+1 (μονόωρα σε διαφορετικές ημέρες)!
export function getDefaultLessonDistribution(lesson, totalHours = null) {
  const hrs = totalHours !== null ? Number(totalHours) : Number(lesson?.hours || 0);
  if (!hrs || hrs <= 0) return [];
  if (hrs === 1) return [1];

  // Αν έχει οριστεί ρητά defaultDistribution στο αντικείμενο μαθήματος:
  if (lesson?.defaultDistribution) {
    return typeof lesson.defaultDistribution === 'string'
      ? lesson.defaultDistribution.split('+').map(Number)
      : lesson.defaultDistribution;
  }

  const sid = (lesson?.subjectId || '').toLowerCase();

  // Δευτερεύοντα / μη βασικά μαθήματα: ΠΟΤΕ συνεχόμενο δίωρο! Πάντα 1+1 (ή 1+1+1)
  const isSecondary = [
    'pliroforiki', 'tpe',
    'thriskeutika',
    'gymnastiki',
    'istoria',
    'agglika',
    'geografia', 'geografia_kpa',
    'fysiki',
    'kpa',
    'ergastiria_dex',
    'mousiki', 'eikastika', 'theatriki', 'texnologia', 'oikiaki', 'viologia', 'ximeia'
  ].includes(sid);

  if (hrs === 2) {
    // Στα δευτερεύοντα μαθήματα (Πληροφορική, Θρησκευτικά, Γυμναστική, Ιστορία κτλ.): ΠΑΝΤΑ 1+1 (μονόωρα)!
    // Μόνο αν είναι ρητά σπαστό (π.χ. 2η Ξένη Γλώσσα με κοινή ζώνη) ή allowDouble μπορεί να είναι [2].
    if (isSecondary || !lesson?.isSplit) {
      return [1, 1];
    }
    return [2];
  }

  if (hrs === 3) {
    if (isSecondary || sid === 'arxaia') {
      return [1, 1, 1];
    }
    return [2, 1];
  }

  if (hrs === 4) {
    if (sid === 'math') return [1, 1, 1, 1]; // Μαθηματικά 4 μονόωρα
    return [2, 1, 1]; // π.χ. Γλώσσα: 1 δίωρο έκθεσης + 2 μονόωρα
  }

  if (hrs === 5) {
    if (sid === 'math') return [1, 1, 1, 1, 1]; // Μαθηματικά 5 μονόωρα (1 ανά ημέρα)
    return [2, 1, 1, 1]; // Γλώσσα: 1 δίωρο + 3 μονόωρα
  }

  if (hrs === 6) return [2, 2, 2];
  if (hrs === 7) return [2, 2, 1, 1, 1];
  if (hrs === 8) return [2, 2, 2, 1, 1];
  if (hrs === 9) return [2, 2, 2, 1, 1, 1];

  return Array(hrs).fill(1);
}

// Επιστρέφει τις διαθέσιμες επιλογές κατανομής ωρών για dropdown επιλογής
export function getAvailableDistributions(totalHours, lesson = null) {
  const hrs = Number(totalHours);
  if (!hrs || hrs <= 1) return [{ value: '1', label: '1 ώρα (Μονόωρο)' }];

  const res = [];
  if (hrs === 2) {
    res.push({ value: '1+1', label: '1 + 1 (Μονόωρα σε διαφορετικές ημέρες — Συνιστάται)' });
    res.push({ value: '2', label: '2 (Συνεχόμενο δίωρο)' });
  } else if (hrs === 3) {
    res.push({ value: '1+1+1', label: '1 + 1 + 1 (3 μονόωρα σε διαφορετικές ημέρες — Συνιστάται)' });
    res.push({ value: '2+1', label: '2 + 1 (1 δίωρο + 1 μονόωρο)' });
  } else if (hrs === 4) {
    res.push({ value: '1+1+1+1', label: '1 + 1 + 1 + 1 (4 μονόωρα — 1 ανά ημέρα)' });
    res.push({ value: '2+1+1', label: '2 + 1 + 1 (1 δίωρο + 2 μονόωρα)' });
    res.push({ value: '2+2', label: '2 + 2 (2 δίωρα)' });
  } else if (hrs === 5) {
    res.push({ value: '1+1+1+1+1', label: '1 + 1 + 1 + 1 + 1 (5 μονόωρα — 1 ανά ημέρα)' });
    res.push({ value: '2+1+1+1', label: '2 + 1 + 1 + 1 (1 δίωρο + 3 μονόωρα)' });
    res.push({ value: '2+2+1', label: '2 + 2 + 1 (2 δίωρα + 1 μονόωρο)' });
  } else if (hrs === 6) {
    res.push({ value: '2+2+2', label: '2 + 2 + 2 (3 δίωρα)' });
    res.push({ value: '2+1+1+1+1', label: '2 + 1 + 1 + 1 + 1 (1 δίωρο + 4 μονόωρα)' });
    res.push({ value: '1+1+1+1+1+1', label: '6 μονόωρα' });
  } else if (hrs >= 7) {
    const defaultDist = Array(hrs).fill(1).join('+');
    res.push({ value: defaultDist, label: `${hrs} μονόωρα` });
    if (hrs >= 8) {
      res.push({ value: `2+2+${Array(hrs - 4).fill(1).join('+')}`, label: `2 δίωρα + ${hrs - 4} μονόωρα` });
    }
  }

  return res;
}

// Δημιουργία των καρτών (Cards) από τις δηλωμένες αναθέσεις μαθημάτων (Lessons)
// Στο στυλ του aSc Timetables: Ένα μάθημα 2 ωρών σπάει σε 1+1 για δευτερεύοντα ή μένει 2 για ειδικές περιπτώσεις
// Αν οι ώρες ενός μαθήματος έχουν οριστεί σε 0, δεν παράγονται κάρτες (ανενεργό μάθημα)
export function generateCardsFromLessons(lessons) {
  const cards = [];
  if (!Array.isArray(lessons)) return cards;
  for (const lesson of lessons) {
    const totalHours = Number(lesson.hours);
    if (!totalHours || totalHours <= 0) continue; // 0 ώρες: παράλειψη
    let distribution = lesson.distribution; // π.χ. '1+1', '2', '2+1+1'

    if (!distribution) {
      distribution = getDefaultLessonDistribution(lesson, totalHours);
    } else if (typeof distribution === 'string') {
      distribution = distribution.split('+').map(Number);
    }

    distribution.forEach((cardLength, idx) => {
      cards.push({
        id: `card_${lesson.id}_${idx + 1}`,
        lessonId: lesson.id,
        classId: lesson.classId,
        className: lesson.className,
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
        splitGrade: lesson.splitGrade || null,
        targetGrades: lesson.targetGrades || (lesson.splitGrade ? [lesson.splitGrade] : null),
        fixedPeriod: lesson.fixedPeriod !== undefined ? lesson.fixedPeriod : null,
        isProiniZoni: Boolean(lesson.isProiniZoni),
        isOloimero: Boolean(lesson.isOloimero),
        syncGroupId: lesson.syncGroupId || null, // Αν ανήκει σε κοινή ζώνη 2ης ξένης γλώσσας ή προσανατολισμού
      });
    });
  }
  return cards;
}

// Δημιουργία ή απόσχιση μαθήματος για συγκεκριμένη τάξη σε συνδιδασκόμενο τμήμα (Multigrade Split)
export function splitMultigradeLesson(timetable, baseLessonId, targetGrade, hours = null) {
  const lesson = (timetable.lessons || []).find((l) => l.id === baseLessonId);
  if (!lesson) return null;

  const splitHours = hours !== null ? Number(hours) : Math.max(1, Math.round(lesson.hours / 2));
  const newLessonId = `les_${lesson.classId}_${lesson.subjectId}_split_${Date.now()}`;
  const defDist = getDefaultLessonDistribution(lesson, splitHours);
  const distStr = Array.isArray(defDist) ? defDist.join('+') : String(defDist);

  const newLesson = {
    ...JSON.parse(JSON.stringify(lesson)),
    id: newLessonId,
    subjectName: `${lesson.subjectName.replace(/\s*\([^)]*\)$/, '')} (Τάξη ${targetGrade}΄)`,
    hours: splitHours,
    defaultHours: splitHours,
    distribution: distStr,
    defaultDistribution: distStr,
    isSplit: true,
    splitType: 'multigrade_split',
    splitGrade: targetGrade,
    targetGrades: [targetGrade],
    teacherId: '',
    teacherName: '— Χωρίς εκπαιδευτικό —',
  };

  // Ενημέρωση και του αρχικού μαθήματος αν δεν έχει ήδη οριστεί splitGrade
  if (!lesson.splitGrade) {
    const cls = (timetable.classes || []).find((c) => c.id === lesson.classId);
    const remainingGrades = (cls?.grades || []).filter((g) => g !== targetGrade);
    if (remainingGrades.length > 0) {
      lesson.splitGrade = remainingGrades.join('-');
      lesson.targetGrades = [...remainingGrades];
      lesson.subjectName = `${lesson.subjectName.replace(/\s*\([^)]*\)$/, '')} (Τάξη ${lesson.splitGrade}΄)`;
      lesson.isSplit = true;
      lesson.splitType = 'multigrade_split';
    }
  }

  timetable.lessons.push(newLesson);
  return newLesson;
}

// Αυτόματη φόρτωση του νομοθετημένου αναλυτικού προγράμματος στα τμήματα
export function populateCurriculumForClasses(timetable) {
  // Συγχρονισμός ειδικών τμημάτων (Πρωινή Ζώνη, Ολοήμερο) πριν τη φόρτωση
  if (timetable.schoolType === 'dimotiko') {
    syncSpecialClasses(timetable);
  }

  const { schoolType, classes } = timetable;
  const curriculaForSchool = CURRICULA[schoolType] || {};
  const lessons = [];

  for (const cls of classes) {
    // Ειδική περίπτωση 1: Πρωινή Ζώνη
    if (cls.isProiniZoni || cls.id === 'c_proini_zoni') {
      const template = OLOIMERO_CURRICULA.proini_zoni;
      for (const item of template) {
        lessons.push({
          id: `les_${cls.id}_${item.id}`,
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          grades: ['ΠΡ_ΖΩΝΗ'],
          subjectId: item.id,
          subjectName: item.name,
          subjectShort: item.short,
          subjectColor: item.color,
          hours: item.hours,
          defaultHours: item.hours,
          distribution: '1+1+1+1+1',
          defaultDistribution: '1+1+1+1+1',
          branch: item.branch,
          teacherId: '',
          teacherName: '— Χωρίς εκπαιδευτικό —',
          roomId: 'room_gen',
          difficulty: item.difficulty || 1,
          isSplit: false,
          splitType: null,
          fixedPeriod: item.fixedPeriod,
          isProiniZoni: true,
          isOloimero: false,
          syncGroupId: null,
        });
      }
      continue;
    }

    // Ειδική περίπτωση 2: Ολοήμερο Τμήμα
    if (cls.isOloimero || cls.id.startsWith('c_olo_')) {
      const oloType = timetable.oloimeroType || 'basic';
      const template = OLOIMERO_CURRICULA[oloType] || OLOIMERO_CURRICULA.basic;
      for (const item of template) {
        lessons.push({
          id: `les_${cls.id}_${item.id}`,
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          grades: ['ΟΛΟΗΜΕΡΟ'],
          subjectId: item.id,
          subjectName: item.name,
          subjectShort: item.short,
          subjectColor: item.color,
          hours: item.hours,
          defaultHours: item.hours,
          distribution: '1+1+1+1+1',
          defaultDistribution: '1+1+1+1+1',
          branch: item.branch,
          teacherId: '',
          teacherName: '— Χωρίς εκπαιδευτικό —',
          roomId: 'room_gen',
          difficulty: item.difficulty || 1,
          isSplit: false,
          splitType: null,
          fixedPeriod: item.fixedPeriod,
          isProiniZoni: false,
          isOloimero: true,
          syncGroupId: null,
        });
      }
      continue;
    }

    // Κανονικό Πρωινό Πρόγραμμα
    const is30hOligothesio = schoolType === 'dimotiko' && (timetable.periodsPerDay === 6 || timetable.dimotikoOrganicity === '4th' || timetable.dimotikoOrganicity === '5th');
    const isMultiGradeClass = Array.isArray(cls.grades) && cls.grades.length > 1;
    if (isMultiGradeClass && !cls.cycle) {
      cls.cycle = 'A'; // Προεπιλεγμένος εκπαιδευτικός κύκλος: Κύκλος Α'
    }

    let template = null;
    if (schoolType === 'dimotiko') {
      const gStr = (cls.grades && cls.grades.length > 0) ? cls.grades.join('') : cls.grade;
      if (is30hOligothesio) {
        if (gStr === 'ΓΔ' || cls.grade === 'Γ_Δ') {
          template = curriculaForSchool['Γ_Δ_30h'];
        } else if (gStr === 'ΕΣΤ' || cls.grade === 'Ε_ΣΤ') {
          template = curriculaForSchool['Ε_ΣΤ_30h'];
        }
      }
    }

    if (!template) {
      template = curriculaForSchool[cls.grade];
    }

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
          else if (gStr === 'ΓΔ') template = is30hOligothesio ? curriculaForSchool['Γ_Δ_30h'] : curriculaForSchool['Γ_Δ'];
          else if (gStr === 'ΕΣΤ') template = is30hOligothesio ? curriculaForSchool['Ε_ΣΤ_30h'] : curriculaForSchool['Ε_ΣΤ'];
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
      const defaultDistArr = item.defaultDistribution
        ? (typeof item.defaultDistribution === 'string' ? item.defaultDistribution.split('+').map(Number) : item.defaultDistribution)
        : getDefaultLessonDistribution(item, item.hours);
      const distStr = Array.isArray(defaultDistArr) ? defaultDistArr.join('+') : String(defaultDistArr);

      // Επεξεργασία ονόματος μαθήματος βάσει του επιλεγμένου κύκλου συνδιδασκαλίας (Κύκλος Α / Κύκλος Β)
      let subjectDisplayName = item.name;
      if (item.isCycleSubject && isMultiGradeClass) {
        const cycle = cls.cycle || 'A';
        const cycleInfo = cycle === 'B' ? item.cycleB : item.cycleA;
        if (cycleInfo) {
          subjectDisplayName = `${item.name} (${cycleInfo})`;
        }
      }

      lessons.push({
        id: lessonId,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        grades: Array.isArray(cls.grades) ? [...cls.grades] : [cls.grade],
        cycle: cls.cycle || null,
        subjectId: item.id,
        subjectName: subjectDisplayName,
        subjectShort: item.short,
        subjectColor: item.color,
        hours: item.hours,
        defaultHours: item.hours, // Επίσημη προεπιλογή βάσει νομοθεσίας
        distribution: distStr,
        defaultDistribution: distStr,
        branch: item.branch,
        teacherId: '', // Θα ανατεθεί από τον Διευθυντή
        teacherName: '— Χωρίς εκπαιδευτικό —',
        roomId: item.room || 'room_gen',
        difficulty: item.difficulty,
        isSplit: item.isSplit || false,
        splitType: item.splitType || null,
        splitGrade: null,
        targetGrades: null,
        fixedPeriod: item.fixedPeriod !== undefined ? item.fixedPeriod : null,
        isProiniZoni: false,
        isOloimero: false,
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

    // A. Έλεγχος σταθερής ώρας (fixedPeriod: Πρωινή Ζώνη = 0, Ολοήμερο = 7, 8, 9, 10, 11)
    if (card.fixedPeriod !== null && card.fixedPeriod !== undefined) {
      if (targetPeriod !== card.fixedPeriod) {
        conflicts.push(`Το μάθημα «${card.subjectName}» διδάσκεται αποκλειστικά την ${card.fixedPeriod}η ώρα.`);
        continue;
      }
    } else {
      // Τα κανονικά μαθήματα δεν μπορούν να μπούνε στην Πρωινή Ζώνη (ώρα 0)
      if (targetPeriod === 0) {
        conflicts.push(`Τα μαθήματα του κανονικού προγράμματος δεν επιτρέπεται να τοποθετηθούν στην Πρωινή Ζώνη (07:00 - 08:00).`);
        continue;
      }
      // Στο Δημοτικό τα κανονικά μαθήματα ολοκληρώνονται στην 6η ώρα (έως 13:30)
      if (timetable.schoolType === 'dimotiko' && targetPeriod > 6) {
        conflicts.push(`Τα μαθήματα του κανονικού πρωινού προγράμματος ολοκληρώνονται στην 6η ώρα (έως 13:30).`);
        continue;
      }
    }

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
        // Εξαίρεση 1: Παράλληλο split 2ης ξένης γλώσσας
        if (card.isSplit && placed.isSplit && card.syncGroupId && card.syncGroupId === placed.syncGroupId && card.subjectId !== placed.subjectId) {
          // Επιτρεπτό παράλληλο split
        }
        // Εξαίρεση 2: Σπάσιμο συνδιδασκαλίας σε ολιγοθέσιο σχολείο (Multigrade Split)
        // π.χ. ένας εκπαιδευτικός κάνει Αγγλικά στη Δ΄ και άλλος Μαθηματικά στη Γ΄
        else if (card.splitGrade && placed.splitGrade && card.splitGrade !== placed.splitGrade) {
          // Επιτρεπτό: διαφορετικές τάξεις του ίδιου συνδιδασκόμενου τμήματος
        } else if (
          Array.isArray(card.targetGrades) && Array.isArray(placed.targetGrades) &&
          card.targetGrades.length > 0 && placed.targetGrades.length > 0 &&
          !card.targetGrades.some((g) => placed.targetGrades.includes(g))
        ) {
          // Επιτρεπτό: ξένα σύνολα τάξεων
        } else {
          const splitInfo = placed.splitGrade ? ` [Τάξη ${placed.splitGrade}΄]` : '';
          conflicts.push(`Το τμήμα ${card.className || ''} έχει ήδη μάθημα (${placed.subjectName}${splitInfo}) την ${targetPeriod}η ώρα.`);
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
