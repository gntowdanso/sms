import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    if (!roleHeader) return null;
    const role = Number(roleHeader);
    if (Number.isNaN(role)) return null;
    return role;
  } catch (e) {
    return null;
  }
}

function requireMutatingRole(req: Request) {
  const role = parseRoleFromHeaders(req);
  if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' };
  if (role > 2) return { ok: false, reason: 'insufficient role privileges' };
  return { ok: true };
}

const includeLite = {
  student: { select: { id: true, studentNo: true, firstName: true, lastName: true } },
  school: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  academicYear: { select: { id: true, yearName: true } },
  term: { select: { id: true, name: true } },
} as const;

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    if (id) {
      const item = await prisma.studentRegistration.findUnique({ where: { id: Number(id) }, include: includeLite });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }

    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    if (academicYearId) where.academicYearId = Number(academicYearId);
    if (termId) where.termId = Number(termId);

    const list = await prisma.studentRegistration.findMany({ where, include: includeLite, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/studentregistrations error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { studentId, schoolId, departmentId, classId, sectionId, academicYearId, termId, status } = body || {};
    if (!studentId || !schoolId || !academicYearId || !termId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const username = `reg-${Date.now()}`;
    const created = await prisma.studentRegistration.create({
      data: {
        username,
        studentId: Number(studentId),
        schoolId: Number(schoolId),
        departmentId: departmentId ? Number(departmentId) : null,
        classId: classId ? Number(classId) : null,
        sectionId: sectionId ? Number(sectionId) : null,
        academicYearId: Number(academicYearId),
        termId: Number(termId),
        status: status || null,
      },
      include: includeLite,
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/studentregistrations error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, studentId, schoolId, departmentId, classId, sectionId, academicYearId, termId, status } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (studentId !== undefined) data.studentId = Number(studentId);
    if (schoolId !== undefined) data.schoolId = Number(schoolId);
    if (departmentId !== undefined) data.departmentId = departmentId ? Number(departmentId) : null;
    if (classId !== undefined) data.classId = classId ? Number(classId) : null;
    if (sectionId !== undefined) data.sectionId = sectionId ? Number(sectionId) : null;
    if (academicYearId !== undefined) data.academicYearId = Number(academicYearId);
    if (termId !== undefined) data.termId = Number(termId);
    if (status !== undefined) data.status = status || null;
    const updated = await prisma.studentRegistration.update({ where: { id: parsedId }, data, include: includeLite });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/studentregistrations error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const id = Number(body?.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.studentRegistration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/studentregistrations error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
