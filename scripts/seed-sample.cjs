const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Simple helper to find by filter or create
async function findOrCreate(model, where, createData) {
  const found = await model.findFirst({ where });
  if (found) return found;
  return model.create({ data: createData });
}

(async () => {
  const prisma = new PrismaClient();
  try {
    // Roles (roleName is unique)
    const adminRole = await prisma.role.upsert({
      where: { roleName: 'ADMIN' },
      update: {},
      create: { roleName: 'ADMIN', description: 'Administrator' },
    });
    await prisma.role.upsert({
      where: { roleName: 'STAFF' },
      update: {},
      create: { roleName: 'STAFF', description: 'Staff user' },
    });
    await prisma.role.upsert({
      where: { roleName: 'TEACHER' },
      update: {},
      create: { roleName: 'TEACHER', description: 'Teacher user' },
    });
    const financeRole = await prisma.role.upsert({
      where: { roleName: 'FINANCE' },
      update: {},
      create: { roleName: 'FINANCE', description: 'Finance user' },
    });

    // User accounts
    const adminHash = bcrypt.hashSync('admin123', 10);
    await prisma.userAccount.upsert({
      where: { username: 'admin' },
      update: { passwordHash: adminHash, roleId: adminRole.id, isActive: true },
      create: { username: 'admin', passwordHash: adminHash, roleId: adminRole.id, isActive: true },
    });
    const finHash = bcrypt.hashSync('finance123', 10);
    await prisma.userAccount.upsert({
      where: { username: 'finance' },
      update: { passwordHash: finHash, roleId: financeRole.id, isActive: true },
      create: { username: 'finance', passwordHash: finHash, roleId: financeRole.id, isActive: true },
    });

    // School (username not unique in schema, so use findFirst)
    const school = await findOrCreate(
      prisma.school,
      { username: 'sch-001' },
      { username: 'sch-001', name: 'Greenfield High', type: 'SECONDARY' }
    );
    await findOrCreate(
      prisma.school,
      { username: 'sch-002' },
      { username: 'sch-002', name: 'Blue Valley Basic', type: 'BASIC' }
    );

    // Departments
    const depSci = await findOrCreate(
      prisma.department,
      { username: 'dep-sci' },
      { username: 'dep-sci', name: 'Science' }
    );
    const depArts = await findOrCreate(
      prisma.department,
      { username: 'dep-arts' },
      { username: 'dep-arts', name: 'Arts' }
    );
    const depBus = await findOrCreate(
      prisma.department,
      { username: 'dep-bus' },
      { username: 'dep-bus', name: 'Business' }
    );
    const depICT = await findOrCreate(
      prisma.department,
      { username: 'dep-ict' },
      { username: 'dep-ict', name: 'ICT' }
    );

    // Staff (teacher + bursar) — staffNo is unique
    const teacher = await prisma.staff.upsert({
      where: { staffNo: 'T-0001' },
      update: {},
      create: {
        username: 'tch-0001',
        staffNo: 'T-0001',
        firstName: 'Ama',
        lastName: 'Mensah',
        role: 'TEACHER_LEAD',
        staffType: 'TEACHER',
        departmentId: depSci.id,
        email: 'ama.mensah@example.com',
      },
    });
    const bursar = await prisma.staff.upsert({
      where: { staffNo: 'B-0001' },
      update: {},
      create: {
        username: 'fin-0001',
        staffNo: 'B-0001',
        firstName: 'Kojo',
        lastName: 'Asare',
        role: 'FINANCE',
        staffType: 'NON_TEACHER',
        departmentId: depArts.id,
        email: 'kojo.asare@example.com',
      },
    });
    const teacher2 = await prisma.staff.upsert({
      where: { staffNo: 'T-0002' },
      update: {},
      create: {
        username: 'tch-0002',
        staffNo: 'T-0002',
        firstName: 'Esi',
        lastName: 'Owusu',
        role: 'TEACHER_LEAD',
        staffType: 'TEACHER',
        departmentId: depArts.id,
        email: 'esi.owusu@example.com',
      },
    });
    await prisma.staff.upsert({
      where: { staffNo: 'L-0001' },
      update: {},
      create: {
        username: 'lib-0001',
        staffNo: 'L-0001',
        firstName: 'Akua',
        lastName: 'Baah',
        role: 'LIBRARIAN',
        staffType: 'NON_TEACHER',
        departmentId: depArts.id,
      },
    });
    await prisma.staff.upsert({
      where: { staffNo: 'S-0001' },
      update: {},
      create: {
        username: 'sec-0001',
        staffNo: 'S-0001',
        firstName: 'Yaw',
        lastName: 'Kusi',
        role: 'SECURITY',
        staffType: 'NON_TEACHER',
        departmentId: depBus.id,
      },
    });

    // Class and Section (usernames not unique)
    const cls = await findOrCreate(
      prisma.class,
      { username: 'cls-jhs1' },
      { username: 'cls-jhs1', name: 'JHS 1', section: 'Lower', classTeacherId: teacher.id }
    );
    const secA = await findOrCreate(
      prisma.section,
      { username: 'sec-jhs1-a' },
      { username: 'sec-jhs1-a', name: 'A', classId: cls.id }
    );
    const cls2 = await findOrCreate(
      prisma.class,
      { username: 'cls-jhs2' },
      { username: 'cls-jhs2', name: 'JHS 2', section: 'Middle', classTeacherId: teacher2.id }
    );
    const cls3 = await findOrCreate(
      prisma.class,
      { username: 'cls-jhs3' },
      { username: 'cls-jhs3', name: 'JHS 3', section: 'Upper' }
    );
    await findOrCreate(
      prisma.section,
      { username: 'sec-jhs1-b' },
      { username: 'sec-jhs1-b', name: 'B', classId: cls.id }
    );
    const sec2A = await findOrCreate(
      prisma.section,
      { username: 'sec-jhs2-a' },
      { username: 'sec-jhs2-a', name: 'A', classId: cls2.id }
    );
    const sec3A = await findOrCreate(
      prisma.section,
      { username: 'sec-jhs3-a' },
      { username: 'sec-jhs3-a', name: 'A', classId: cls3.id }
    );

    // Subjects
    const subjMath = await findOrCreate(
      prisma.subject,
      { username: 'subj-math' },
      { username: 'subj-math', name: 'Mathematics', category: 'CORE', departmentId: depSci.id }
    );
    const subjEng = await findOrCreate(
      prisma.subject,
      { username: 'subj-eng' },
      { username: 'subj-eng', name: 'English', category: 'CORE', departmentId: depArts.id }
    );
    const subjSci = await findOrCreate(
      prisma.subject,
      { username: 'subj-sci' },
      { username: 'subj-sci', name: 'Integrated Science', category: 'CORE', departmentId: depSci.id }
    );
    const subjSoc = await findOrCreate(
      prisma.subject,
      { username: 'subj-soc' },
      { username: 'subj-soc', name: 'Social Studies', category: 'CORE', departmentId: depArts.id }
    );
    const subjICT = await findOrCreate(
      prisma.subject,
      { username: 'subj-ict' },
      { username: 'subj-ict', name: 'ICT', category: 'ELECTIVE', departmentId: depICT.id }
    );
    const subjFrench = await findOrCreate(
      prisma.subject,
      { username: 'subj-french' },
      { username: 'subj-french', name: 'French', category: 'ELECTIVE', departmentId: depArts.id }
    );

    // Academic year and term
    const ay = await findOrCreate(
      prisma.academicYear,
      { username: 'ay-2025-2026' },
      { username: 'ay-2025-2026', yearName: '2025/2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-07-31') }
    );
    const term1 = await findOrCreate(
      prisma.term,
      { username: 'term1-2025' },
      { username: 'term1-2025', name: 'Term 1', academicYearId: ay.id, startDate: new Date('2025-09-01'), endDate: new Date('2025-12-15') }
    );
    const term2 = await findOrCreate(
      prisma.term,
      { username: 'term2-2026' },
      { username: 'term2-2026', name: 'Term 2', academicYearId: ay.id, startDate: new Date('2026-01-10'), endDate: new Date('2026-04-10') }
    );
    const term3 = await findOrCreate(
      prisma.term,
      { username: 'term3-2026' },
      { username: 'term3-2026', name: 'Term 3', academicYearId: ay.id, startDate: new Date('2026-04-25'), endDate: new Date('2026-07-31') }
    );

    // Previous academic year
    const ayPrev = await findOrCreate(
      prisma.academicYear,
      { username: 'ay-2024-2025' },
      { username: 'ay-2024-2025', yearName: '2024/2025', startDate: new Date('2024-09-01'), endDate: new Date('2025-07-31'), status: 'INACTIVE' }
    );
    await findOrCreate(
      prisma.term,
      { username: 'term1-2024' },
      { username: 'term1-2024', name: 'Term 1', academicYearId: ayPrev.id, startDate: new Date('2024-09-01'), endDate: new Date('2024-12-15'), status: 'INACTIVE' }
    );

    // Curriculums (subject-class-term)
    const curMath = await findOrCreate(
      prisma.curriculum,
      { username: 'cur-jhs1-math-t1' },
      { username: 'cur-jhs1-math-t1', academicYearId: ay.id, termId: term1.id, subjectId: subjMath.id, classId: cls.id }
    );
    const curEng = await findOrCreate(
      prisma.curriculum,
      { username: 'cur-jhs1-eng-t1' },
      { username: 'cur-jhs1-eng-t1', academicYearId: ay.id, termId: term1.id, subjectId: subjEng.id, classId: cls.id }
    );
    // More curriculum combos
    const curSci = await findOrCreate(
      prisma.curriculum,
      { username: 'cur-jhs1-sci-t1' },
      { username: 'cur-jhs1-sci-t1', academicYearId: ay.id, termId: term1.id, subjectId: subjSci.id, classId: cls.id }
    );
    const curSoc = await findOrCreate(
      prisma.curriculum,
      { username: 'cur-jhs2-soc-t1' },
      { username: 'cur-jhs2-soc-t1', academicYearId: ay.id, termId: term1.id, subjectId: subjSoc.id, classId: cls2.id }
    );
    const curICT2 = await findOrCreate(
      prisma.curriculum,
      { username: 'cur-jhs2-ict-t2' },
      { username: 'cur-jhs2-ict-t2', academicYearId: ay.id, termId: term2.id, subjectId: subjICT.id, classId: cls2.id }
    );
    const curFr3 = await findOrCreate(
      prisma.curriculum,
      { username: 'cur-jhs3-french-t1' },
      { username: 'cur-jhs3-french-t1', academicYearId: ay.id, termId: term1.id, subjectId: subjFrench.id, classId: cls3.id }
    );

    // Student (studentNo is unique)
    const student = await prisma.student.upsert({
      where: { studentNo: 'S0001' },
      update: {},
      create: {
        username: 'stu-0001',
        studentNo: 'S0001',
        firstName: 'Yaw',
        lastName: 'Boateng',
        gender: 'M',
      },
    });
    const student2 = await prisma.student.upsert({
      where: { studentNo: 'S0002' },
      update: {},
      create: { username: 'stu-0002', studentNo: 'S0002', firstName: 'Abena', lastName: 'Sarpong', gender: 'F' },
    });
    const student3 = await prisma.student.upsert({
      where: { studentNo: 'S0003' },
      update: {},
      create: { username: 'stu-0003', studentNo: 'S0003', firstName: 'Kwame', lastName: 'Osei', gender: 'M' },
    });
    const student4 = await prisma.student.upsert({
      where: { studentNo: 'S0004' },
      update: {},
      create: { username: 'stu-0004', studentNo: 'S0004', firstName: 'Akosua', lastName: 'Nyarko', gender: 'F' },
    });
    const student5 = await prisma.student.upsert({
      where: { studentNo: 'S0005' },
      update: {},
      create: { username: 'stu-0005', studentNo: 'S0005', firstName: 'Nana', lastName: 'Adjei', gender: 'M' },
    });

    // Student Guardian for demo student
    await findOrCreate(
      prisma.studentGuardian,
      { studentId: student.id, name: 'Kofi Boateng' },
      { studentId: student.id, name: 'Kofi Boateng', relation: 'Father', contactNumber: '+233201234567', email: 'kofi.boateng@example.com', address: 'Accra' }
    );
    await findOrCreate(
      prisma.studentGuardian,
      { studentId: student2.id, name: 'Akua Sarpong' },
      { studentId: student2.id, name: 'Akua Sarpong', relation: 'Mother', contactNumber: '+233204444444' }
    );
    await findOrCreate(
      prisma.studentGuardian,
      { studentId: student3.id, name: 'Yaw Osei' },
      { studentId: student3.id, name: 'Yaw Osei', relation: 'Father', contactNumber: '+233209999999' }
    );

    // Registration (no unique on username, so find or create)
    const reg = await findOrCreate(
      prisma.studentRegistration,
      { username: 'reg-0001' },
      {
        username: 'reg-0001',
        studentId: student.id,
        schoolId: school.id,
        departmentId: depSci.id,
        classId: cls.id,
        sectionId: secA.id,
        academicYearId: ay.id,
        termId: term1.id,
        status: 'PROMOTED',
      }
    );
    const reg2 = await findOrCreate(
      prisma.studentRegistration,
      { username: 'reg-0002' },
      { username: 'reg-0002', studentId: student2.id, schoolId: school.id, departmentId: depArts.id, classId: cls2.id, sectionId: sec2A.id, academicYearId: ay.id, termId: term1.id, status: 'PROMOTED' }
    );
    const reg3 = await findOrCreate(
      prisma.studentRegistration,
      { username: 'reg-0003' },
      { username: 'reg-0003', studentId: student3.id, schoolId: school.id, departmentId: depSci.id, classId: cls2.id, sectionId: sec2A.id, academicYearId: ay.id, termId: term1.id, status: 'PROMOTED' }
    );
    const reg4 = await findOrCreate(
      prisma.studentRegistration,
      { username: 'reg-0004' },
      { username: 'reg-0004', studentId: student4.id, schoolId: school.id, departmentId: depArts.id, classId: cls.id, sectionId: secA.id, academicYearId: ay.id, termId: term1.id, status: 'PROMOTED' }
    );
    const reg5 = await findOrCreate(
      prisma.studentRegistration,
      { username: 'reg-0005' },
      { username: 'reg-0005', studentId: student5.id, schoolId: school.id, departmentId: depICT.id, classId: cls3.id, sectionId: sec3A.id, academicYearId: ay.id, termId: term1.id, status: 'PROMOTED' }
    );

    // Link registration to curriculums
    await prisma.studentCurriculum.createMany({
      data: [
        { studentRegistrationId: reg.id, curriculumId: curMath.id },
        { studentRegistrationId: reg.id, curriculumId: curEng.id },
  { studentRegistrationId: reg.id, curriculumId: curSci.id },
  { studentRegistrationId: reg2.id, curriculumId: curEng.id },
  { studentRegistrationId: reg2.id, curriculumId: curSoc.id },
  { studentRegistrationId: reg3.id, curriculumId: curSoc.id },
  { studentRegistrationId: reg4.id, curriculumId: curMath.id },
  { studentRegistrationId: reg4.id, curriculumId: curEng.id },
  { studentRegistrationId: reg5.id, curriculumId: curFr3.id },
      ],
      skipDuplicates: true,
    });

    // Grading scheme (use fixed IDs for simple idempotency)
    const gradeA = await prisma.gradingScheme.upsert({
      where: { id: 1 },
      update: { username: 'grade-A', minMark: 80, maxMark: 100, grade: 'A' },
      create: { username: 'grade-A', minMark: 80, maxMark: 100, grade: 'A' },
    });
    const gradeB = await prisma.gradingScheme.upsert({
      where: { id: 2 },
      update: { username: 'grade-B', minMark: 70, maxMark: 79, grade: 'B' },
      create: { username: 'grade-B', minMark: 70, maxMark: 79, grade: 'B' },
    });
    const gradeC = await prisma.gradingScheme.upsert({
      where: { id: 3 },
      update: { username: 'grade-C', minMark: 60, maxMark: 69, grade: 'C' },
      create: { username: 'grade-C', minMark: 60, maxMark: 69, grade: 'C' },
    });
    await prisma.gradingScheme.upsert({
      where: { id: 4 },
      update: { username: 'grade-D', minMark: 50, maxMark: 59, grade: 'D' },
      create: { username: 'grade-D', minMark: 50, maxMark: 59, grade: 'D' },
    });
    await prisma.gradingScheme.upsert({
      where: { id: 5 },
      update: { username: 'grade-E', minMark: 0, maxMark: 49, grade: 'E' },
      create: { username: 'grade-E', minMark: 0, maxMark: 49, grade: 'E' },
    });

    // Assessment types
    const assessTypeExam = await prisma.assessmentType.upsert({
      where: { id: 1 },
      update: { username: 'type-exam', name: 'Exam', percentage: 60 },
      create: { username: 'type-exam', name: 'Exam', percentage: 60 },
    });
    const assessTypeQuiz = await prisma.assessmentType.upsert({
      where: { id: 2 },
      update: { username: 'type-quiz', name: 'Quiz', percentage: 10 },
      create: { username: 'type-quiz', name: 'Quiz', percentage: 10 },
    });
    const assessTypeAssign = await prisma.assessmentType.upsert({
      where: { id: 3 },
      update: { username: 'type-assignment', name: 'Assignment', percentage: 20 },
      create: { username: 'type-assignment', name: 'Assignment', percentage: 20 },
    });

    // Assessment (fixed ID for simplicity)
    const assess = await prisma.assessment.upsert({
      where: { id: 1 },
      update: {
        username: 'asm-midterm-math',
        title: 'Midterm Exam',
        subjectId: subjMath.id,
        teacherId: teacher.id,
        assessmentTypeId: assessTypeExam.id,
        academicYearId: ay.id,
        termId: term1.id,
      },
      create: {
        username: 'asm-midterm-math',
        title: 'Midterm Exam',
        subjectId: subjMath.id,
        teacherId: teacher.id,
        assessmentTypeId: assessTypeExam.id,
        academicYearId: ay.id,
        termId: term1.id,
      },
    });
    const assessEngQuiz = await prisma.assessment.upsert({
      where: { id: 2 },
      update: { username: 'asm-quiz-eng', title: 'English Quiz 1', subjectId: subjEng.id, teacherId: teacher2.id, assessmentTypeId: assessTypeQuiz.id, academicYearId: ay.id, termId: term1.id },
      create: { username: 'asm-quiz-eng', title: 'English Quiz 1', subjectId: subjEng.id, teacherId: teacher2.id, assessmentTypeId: assessTypeQuiz.id, academicYearId: ay.id, termId: term1.id },
    });
    const assessSciAssign = await prisma.assessment.upsert({
      where: { id: 3 },
      update: { username: 'asm-assign-sci', title: 'Science Assignment', subjectId: subjSci.id, teacherId: teacher.id, assessmentTypeId: assessTypeAssign.id, academicYearId: ay.id, termId: term2.id },
      create: { username: 'asm-assign-sci', title: 'Science Assignment', subjectId: subjSci.id, teacherId: teacher.id, assessmentTypeId: assessTypeAssign.id, academicYearId: ay.id, termId: term2.id },
    });

    // Exam paper
    const paper = await prisma.examPaper.upsert({
      where: { id: 1 },
      update: {
        username: 'paper-midterm-math',
        assessmentId: assess.id,
        subjectId: subjMath.id,
        teacherId: teacher.id,
        maxMarks: 100,
        academicYearId: ay.id,
        termId: term1.id,
      },
      create: {
        username: 'paper-midterm-math',
        assessmentId: assess.id,
        subjectId: subjMath.id,
        teacherId: teacher.id,
        maxMarks: 100,
        academicYearId: ay.id,
        termId: term1.id,
      },
    });
    const paperEng = await prisma.examPaper.upsert({
      where: { id: 2 },
      update: { username: 'paper-quiz-eng1', assessmentId: assessEngQuiz.id, subjectId: subjEng.id, teacherId: teacher2.id, maxMarks: 20, academicYearId: ay.id, termId: term1.id },
      create: { username: 'paper-quiz-eng1', assessmentId: assessEngQuiz.id, subjectId: subjEng.id, teacherId: teacher2.id, maxMarks: 20, academicYearId: ay.id, termId: term1.id },
    });

    // Assessment result
    await prisma.assessmentResult.upsert({
      where: { id: 1 },
      update: {
        username: 'res-midterm-math-0001',
        assessmentId: assess.id,
        examPaperId: paper.id,
        studentId: student.id,
        marksObtained: 85,
        gradeId: gradeA.id,
        academicYearId: ay.id,
        termId: term1.id,
      },
      create: {
        username: 'res-midterm-math-0001',
        assessmentId: assess.id,
        examPaperId: paper.id,
        studentId: student.id,
        marksObtained: 85,
        gradeId: gradeA.id,
        academicYearId: ay.id,
        termId: term1.id,
      },
    });
    // More results
    const resultsData = [
      { username: 'res-midterm-math-0002', assessmentId: assess.id, examPaperId: paper.id, studentId: student2.id, marksObtained: 74, gradeId: gradeB.id },
      { username: 'res-midterm-math-0003', assessmentId: assess.id, examPaperId: paper.id, studentId: student3.id, marksObtained: 62, gradeId: gradeC.id },
      { username: 'res-eng-quiz-0001', assessmentId: assessEngQuiz.id, examPaperId: paperEng.id, studentId: student.id, marksObtained: 18, gradeId: gradeA.id },
      { username: 'res-eng-quiz-0002', assessmentId: assessEngQuiz.id, examPaperId: paperEng.id, studentId: student2.id, marksObtained: 14, gradeId: gradeB.id },
    ];
    for (const r of resultsData) {
      const found = await prisma.assessmentResult.findFirst({ where: { username: r.username } });
      if (!found) {
        await prisma.assessmentResult.create({ data: { ...r, academicYearId: ay.id, termId: term1.id } });
      }
    }

    // Attendance
    await prisma.attendance.upsert({
      where: { id: 1 },
      update: {
        username: 'att-0001',
        studentId: student.id,
        classId: cls.id,
        date: new Date(),
        status: 'PRESENT',
        teacherId: teacher.id,
        academicYearId: ay.id,
        termId: term1.id,
      },
      create: {
        username: 'att-0001',
        studentId: student.id,
        classId: cls.id,
        date: new Date(),
        status: 'PRESENT',
        teacherId: teacher.id,
        academicYearId: ay.id,
        termId: term1.id,
      },
    });
    const attendanceBulk = [
      { username: 'att-0002', studentId: student2.id, classId: cls2.id, date: new Date(), status: 'PRESENT', teacherId: teacher2.id },
      { username: 'att-0003', studentId: student3.id, classId: cls2.id, date: new Date(), status: 'ABSENT', teacherId: teacher2.id },
      { username: 'att-0004', studentId: student4.id, classId: cls.id, date: new Date(), status: 'LATE', teacherId: teacher.id },
    ];
    for (const a of attendanceBulk) {
      const found = await prisma.attendance.findFirst({ where: { username: a.username } });
      if (!found) {
        await prisma.attendance.create({ data: { ...a, academicYearId: ay.id, termId: term1.id } });
      }
    }

    // Assignments and Submissions
    const assign1 = await prisma.assignment.upsert({
      where: { id: 1 },
      update: { username: 'asg-math-hw1', title: 'Math Homework 1', classId: cls.id, subjectId: subjMath.id, teacherId: teacher.id, dueDate: new Date(Date.now() + 3*86400000), academicYearId: ay.id, termId: term1.id },
      create: { username: 'asg-math-hw1', title: 'Math Homework 1', classId: cls.id, subjectId: subjMath.id, teacherId: teacher.id, dueDate: new Date(Date.now() + 3*86400000), academicYearId: ay.id, termId: term1.id },
    });
    const submissions = [
      { username: 'sub-0001', assignmentId: assign1.id, studentId: student.id, submittedDate: new Date(), marks: 18 },
      { username: 'sub-0002', assignmentId: assign1.id, studentId: student2.id, submittedDate: new Date(), marks: 15 },
    ];
    for (const s of submissions) {
      const found = await prisma.assignmentSubmission.findFirst({ where: { username: s.username } });
      if (!found) await prisma.assignmentSubmission.create({ data: { ...s, academicYearId: ay.id, termId: term1.id } });
    }

    // Report Cards and Details
    const reportCardFor = async (stu, totals) => {
      const existing = await prisma.reportCard.findFirst({ where: { studentId: stu.id, termId: term1.id } });
      const rc = existing || await prisma.reportCard.create({ data: {
        username: `rc-${stu.studentNo}-t1`,
        studentId: stu.id,
        overallGrade: totals.overall,
        totalMarks: totals.total,
        averageMarks: totals.avg,
        academicYearId: ay.id,
        termId: term1.id,
      } });
      const ensureDetail = async (subjectId, marks, grade) => {
        const exists = await prisma.reportCardDetail.findFirst({ where: { reportCardId: rc.id, subjectId } });
        if (!exists) {
          await prisma.reportCardDetail.create({ data: { reportCardId: rc.id, subjectId, marksObtained: marks, grade } });
        }
      };
      await ensureDetail(subjMath.id, 85, 'A');
      await ensureDetail(subjEng.id, 78, 'B');
      return rc;
    };
    await reportCardFor(student, { total: 163, avg: 81.5, overall: 'A' });
    await reportCardFor(student2, { total: 150, avg: 75.0, overall: 'B' });

    // Promotions
    const promoExists = await prisma.promotionRecord.findFirst({ where: { username: 'promo-0001' } });
    if (!promoExists) {
      await prisma.promotionRecord.create({ data: { username: 'promo-0001', studentId: student.id, fromClassId: cls.id, toClassId: cls2.id, promotionDate: new Date('2026-08-10'), academicYearId: ay.id, termId: term3.id } });
    }

    // Fees
  const tuition = await findOrCreate(
      prisma.feeItem,
      { username: 'fee-tuition' },
      { username: 'fee-tuition', name: 'Tuition', defaultAmount: 1000 }
    );
  const pta = await findOrCreate(prisma.feeItem, { username: 'fee-pta' }, { username: 'fee-pta', name: 'PTA Levy', defaultAmount: 50 });
  const sports = await findOrCreate(prisma.feeItem, { username: 'fee-sports' }, { username: 'fee-sports', name: 'Sports Fee', defaultAmount: 30 });

    // Fee structure (no unique composite, so check roughly by username)
  await findOrCreate(
      prisma.feeStructure,
      { username: 'fs-jhs1-t1' },
      {
        username: 'fs-jhs1-t1',
        classId: cls.id,
        academicYearId: ay.id,
        termId: term1.id,
        feeItemId: tuition.id,
        amount: 1000,
      }
    );
  await findOrCreate(prisma.feeStructure, { username: 'fs-jhs1-pta-t1' }, { username: 'fs-jhs1-pta-t1', classId: cls.id, academicYearId: ay.id, termId: term1.id, feeItemId: pta.id, amount: 50 });
  await findOrCreate(prisma.feeStructure, { username: 'fs-jhs2-sports-t1' }, { username: 'fs-jhs2-sports-t1', classId: cls2.id, academicYearId: ay.id, termId: term1.id, feeItemId: sports.id, amount: 30 });

    // Invoice + line + payment
  const inv = await findOrCreate(
      prisma.invoice,
      { username: 'inv-0001' },
      {
        username: 'inv-0001',
        studentId: student.id,
        termId: term1.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        totalAmount: 1000,
        status: 'UNPAID',
        academicYearId: ay.id,
      }
    );

    const existingLine = await prisma.invoiceLine.findFirst({ where: { invoiceId: inv.id, feeItemId: tuition.id } });
    if (!existingLine) {
      await prisma.invoiceLine.create({ data: { invoiceId: inv.id, feeItemId: tuition.id, amount: 1000 } });
    }

    await findOrCreate(
      prisma.payment,
      { username: 'pay-0001' },
      {
        username: 'pay-0001',
        invoiceId: inv.id,
        studentId: student.id,
        paymentDate: new Date(),
        amountPaid: 200,
        method: 'CASH',
        receiptNo: 'RCPT-0001',
      }
    );
    // Add more invoices for other students
    const ensureInvoiceWithLines = async (invUsername, stuId, lines) => {
      const invX = await findOrCreate(prisma.invoice, { username: invUsername }, { username: invUsername, studentId: stuId, termId: term1.id, issueDate: new Date(), dueDate: new Date(Date.now() + 7*86400000), totalAmount: lines.reduce((s,l)=>s+l.amount,0), status: 'UNPAID', academicYearId: ay.id });
      for (const l of lines) {
        const exists = await prisma.invoiceLine.findFirst({ where: { invoiceId: invX.id, feeItemId: l.feeItemId } });
        if (!exists) await prisma.invoiceLine.create({ data: { invoiceId: invX.id, feeItemId: l.feeItemId, amount: l.amount } });
      }
      return invX;
    };
    const inv2 = await ensureInvoiceWithLines('inv-0002', student2.id, [ { feeItemId: tuition.id, amount: 1000 }, { feeItemId: pta.id, amount: 50 } ]);
    await findOrCreate(prisma.payment, { receiptNo: 'RCPT-0002' }, { username: 'pay-0002', invoiceId: inv2.id, studentId: student2.id, paymentDate: new Date(), amountPaid: 500, method: 'MOBILEMONEY', receiptNo: 'RCPT-0002' });
    const inv3 = await ensureInvoiceWithLines('inv-0003', student3.id, [ { feeItemId: tuition.id, amount: 1000 }, { feeItemId: sports.id, amount: 30 } ]);

    // Scholarships and fines
    const schol = await prisma.scholarship.findFirst({ where: { username: 'sch-0001' } });
    if (!schol) {
      await prisma.scholarship.create({ data: { username: 'sch-0001', studentId: student4.id, type: 'SCHOLARSHIP', amount: 300, academicYearId: ay.id, termId: term1.id } });
    }
    const fine1 = await prisma.fine.findFirst({ where: { username: 'fine-0001' } });
    if (!fine1) {
      await prisma.fine.create({ data: { username: 'fine-0001', studentId: student5.id, reason: 'Late library book', amount: 10, date: new Date(), academicYearId: ay.id, termId: term1.id } });
    }

    // Budgets and Financial Reports
    const budgetOps = await prisma.budget.findFirst({ where: { username: 'bdg-ops-t1' } });
    if (!budgetOps) {
      await prisma.budget.create({ data: { username: 'bdg-ops-t1', academicYearId: ay.id, termId: term1.id, category: 'Operations', plannedAmount: 5000, actualAmount: 1200 } });
    }
    const finRep = await prisma.financialReport.findFirst({ where: { username: 'finrep-t1' } });
    if (!finRep) {
      await prisma.financialReport.create({ data: { username: 'finrep-t1', academicYearId: ay.id, termId: term1.id, reportTitle: 'Term 1 Summary', generatedDate: new Date(), fileUrl: '/reports/term1.pdf' } });
    }

    // Accounting: account types and COA
    const acctAsset = await prisma.accountType.upsert({
      where: { id: 1 },
      update: { name: 'ASSET', code: '1000' },
      create: { name: 'ASSET', code: '1000' },
    });
    const acctRevenue = await prisma.accountType.upsert({
      where: { id: 2 },
      update: { name: 'REVENUE', code: '4000' },
      create: { name: 'REVENUE', code: '4000' },
    });
    const acctExpense = await prisma.accountType.upsert({
      where: { id: 3 },
      update: { name: 'EXPENSE', code: '5000' },
      create: { name: 'EXPENSE', code: '5000' },
    });
    const acctLiability = await prisma.accountType.upsert({
      where: { id: 4 },
      update: { name: 'LIABILITY', code: '2000' },
      create: { name: 'LIABILITY', code: '2000' },
    });

    const coaAR = await findOrCreate(
      prisma.chartOfAccount,
      { accountCode: '1100' },
      { username: 'coa-ar', accountCode: '1100', accountName: 'Accounts Receivable', accountTypeId: acctAsset.id }
    );

    const coaTuitionRev = await findOrCreate(
      prisma.chartOfAccount,
      { accountCode: '4001' },
      { username: 'coa-rev-tuition', accountCode: '4001', accountName: 'Tuition Revenue', accountTypeId: acctRevenue.id }
    );
    const coaCash = await findOrCreate(
      prisma.chartOfAccount,
      { accountCode: '1001' },
      { username: 'coa-cash', accountCode: '1001', accountName: 'Cash on Hand', accountTypeId: acctAsset.id }
    );
    const coaBank = await findOrCreate(
      prisma.chartOfAccount,
      { accountCode: '1002' },
      { username: 'coa-bank', accountCode: '1002', accountName: 'Bank', accountTypeId: acctAsset.id }
    );
    const coaSuppliesExp = await findOrCreate(
      prisma.chartOfAccount,
      { accountCode: '5001' },
      { username: 'coa-exp-supplies', accountCode: '5001', accountName: 'Supplies Expense', accountTypeId: acctExpense.id }
    );
    await findOrCreate(
      prisma.chartOfAccount,
      { accountCode: '2100' },
      { username: 'coa-ap', accountCode: '2100', accountName: 'Accounts Payable', accountTypeId: acctLiability.id }
    );

    const je = await prisma.journalEntry.upsert({
      where: { id: 1 },
      update: {
        date: new Date(),
        description: 'Invoice posted',
        postedBy: 'rekoll',
        academicYearId: ay.id,
        termId: term1.id,
      },
      create: {
        date: new Date(),
        description: 'Invoice posted',
        postedBy: 'rekoll',
        academicYearId: ay.id,
        termId: term1.id,
      },
    });

    // Create journal lines once
    const jlExisting = await prisma.journalLine.findFirst({ where: { journalEntryId: je.id, accountId: coaAR.id } });
    if (!jlExisting) {
      await prisma.journalLine.createMany({
        data: [
          { journalEntryId: je.id, accountId: coaAR.id, debit: 1000, credit: 0 },
          { journalEntryId: je.id, accountId: coaTuitionRev.id, debit: 0, credit: 1000 },
        ],
      });
    }

    // Journal for payment received: Dr Cash 200 Cr AR 200
    const je2 = await prisma.journalEntry.upsert({
      where: { id: 2 },
      update: { date: new Date(), description: 'Payment received', postedBy: 'finance', academicYearId: ay.id, termId: term1.id },
      create: { date: new Date(), description: 'Payment received', postedBy: 'finance', academicYearId: ay.id, termId: term1.id },
    });
    const jl2 = await prisma.journalLine.findFirst({ where: { journalEntryId: je2.id, accountId: coaCash.id } });
    if (!jl2) {
      await prisma.journalLine.createMany({ data: [ { journalEntryId: je2.id, accountId: coaCash.id, debit: 200, credit: 0 }, { journalEntryId: je2.id, accountId: coaAR.id, debit: 0, credit: 200 } ] });
    }

    // Ledger sample updates
    const ensureLedger = async (accountId, debit, credit, balance) => {
      const ld = await prisma.ledger.findFirst({ where: { accountId, termId: term1.id, academicYearId: ay.id, date: { gte: new Date('2025-01-01') } } });
      if (!ld) await prisma.ledger.create({ data: { accountId, date: new Date(), debit, credit, balance, academicYearId: ay.id, termId: term1.id } });
    };
    await ensureLedger(coaAR.id, 1000, 0, 1000);
    await ensureLedger(coaTuitionRev.id, 0, 1000, 1000);
    await ensureLedger(coaCash.id, 200, 0, 200);

    // Expense
    await prisma.expense.upsert({
      where: { id: 1 },
      update: { username: 'exp-0001', category: 'SUPPLIES', amount: 150, date: new Date(), approvedBy: 'rekoll' },
      create: { username: 'exp-0001', category: 'SUPPLIES', amount: 150, date: new Date(), approvedBy: 'rekoll' },
    });
    await prisma.expense.upsert({
      where: { id: 2 },
      update: { username: 'exp-0002', category: 'UTILITIES', amount: 300, date: new Date(), approvedBy: 'rekoll' },
      create: { username: 'exp-0002', category: 'UTILITIES', amount: 300, date: new Date(), approvedBy: 'rekoll' },
    });

    // Student applications (admissions)
    const apps = [
      { username: 'app-0001', firstName: 'Kwaku', lastName: 'Appiah', gender: 'M', intendedClass: 'JHS 1', status: 'PENDING' },
      { username: 'app-0002', firstName: 'Adwoa', lastName: 'Mensima', gender: 'F', intendedClass: 'JHS 1', status: 'ACCEPTED' },
      { username: 'app-0003', firstName: 'Yaw', lastName: 'Ampofo', gender: 'M', intendedClass: 'JHS 2', status: 'REJECTED' },
    ];
    for (const app of apps) {
      const found = await prisma.studentApplication.findFirst({ where: { username: app.username } });
      if (!found) await prisma.studentApplication.create({ data: { ...app } });
    }

    console.log('Seeded sample domain data successfully.');
  } catch (err) {
    console.error('Seed sample error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
