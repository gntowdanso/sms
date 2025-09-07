const { PrismaClient } = require('@prisma/client');

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

    // School (username not unique in schema, so use findFirst)
    const school = await findOrCreate(
      prisma.school,
      { username: 'sch-001' },
      { username: 'sch-001', name: 'Greenfield High', type: 'SECONDARY' }
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

    // Student Guardian for demo student
    await findOrCreate(
      prisma.studentGuardian,
      { studentId: student.id, name: 'Kofi Boateng' },
      { studentId: student.id, name: 'Kofi Boateng', relation: 'Father', contactNumber: '+233201234567', email: 'kofi.boateng@example.com', address: 'Accra' }
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

    // Link registration to curriculums
    await prisma.studentCurriculum.createMany({
      data: [
        { studentRegistrationId: reg.id, curriculumId: curMath.id },
        { studentRegistrationId: reg.id, curriculumId: curEng.id },
      ],
      skipDuplicates: true,
    });

    // Grading scheme (use fixed IDs for simple idempotency)
    const gradeA = await prisma.gradingScheme.upsert({
      where: { id: 1 },
      update: { username: 'grade-A', minMark: 80, maxMark: 100, grade: 'A' },
      create: { username: 'grade-A', minMark: 80, maxMark: 100, grade: 'A' },
    });

    // Assessment types
    const assessTypeExam = await prisma.assessmentType.upsert({
      where: { id: 1 },
      update: { username: 'type-exam', name: 'Exam', percentage: 60 },
      create: { username: 'type-exam', name: 'Exam', percentage: 60 },
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

    // Fees
    const tuition = await findOrCreate(
      prisma.feeItem,
      { username: 'fee-tuition' },
      { username: 'fee-tuition', name: 'Tuition', defaultAmount: 1000 }
    );

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

    // Expense
    await prisma.expense.upsert({
      where: { id: 1 },
      update: { username: 'exp-0001', category: 'SUPPLIES', amount: 150, date: new Date(), approvedBy: 'rekoll' },
      create: { username: 'exp-0001', category: 'SUPPLIES', amount: 150, date: new Date(), approvedBy: 'rekoll' },
    });

    console.log('Seeded sample domain data successfully.');
  } catch (err) {
    console.error('Seed sample error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
