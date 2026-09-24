// model.js — Μοντέλο Δεδομένων & Κανόνες Εγκυρότητας Ωρολογίου Προγράμματος
// Υποστηρίζει Τμήματα, Εκπαιδευτικούς, Διαθεσιμότητα (Time-off), Αίθουσες, Μαθήματα/Κάρτες και Διασπάσεις Τμημάτων.

import { CURRICULA, DAYS_OF_WEEK, DEFAULT_BELL_TIMES, SCHOOL_TYPES, SPECIAL_ROOMS } from './curricula.js';

export function createInitialTimetable(schoolType = 'gymnasio') {
  const typeConfig = SCHOOL_TYPES[schoolType] || SCHOOL_TYPES.gymnasio;
  const bell = schoolType === 'dimotiko' ? DEFAULT_BELL_TIMES.primary : DEFAULT_BELL_TIMES.secondary;

  return {
    version: 1,
    schoolType,
    periodsPerDay: typeConfig.periodsPerDay,
    daysCount: 5,
    bellTimes: JSON.parse(JSON.stringify(bell)),
    classes: [
      { id: 'c_1', name: 'Α1', grade: 'Α' },
      { id: 'c_2', name: 'Α2', grade: 'Α' },
      { id: 'c_3', name: 'Β1', grade: 'Β' },
    ],
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

// Δημιουργία των καρτών (Cards) από τις δηλωμένες αναθέσεις μαθημάτων (Lessons)
// Στο στυλ του aSc Timetables: Ένα μάθημα 4 ωρών μπορεί να σπάσει σε 1 δίωρο + 2 μονόωρα (2+1+1)
export function generateCardsFromLessons(lessons) {
  const cards = [];
  for (const lesson of lessons) {
    const totalHours = Number(lesson.hours) || 1;
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
    const template = curriculaForSchool[cls.grade] || [];
    for (const item of template) {
      const lessonId = `les_${cls.id}_${item.id}`;
      // Αν είναι παράλληλο μάθημα (π.χ. 2η ξένη γλώσσα), συγχρονίζεται με τα υπόλοιπα τμήματα της ίδιας τάξης
      const syncGroupId = item.isSplit ? `sync_${cls.grade}_${item.id}` : null;

      lessons.push({
        id: lessonId,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        subjectId: item.id,
        subjectName: item.name,
        subjectShort: item.short,
        subjectColor: item.color,
        hours: item.hours,
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
  return lessons;
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
