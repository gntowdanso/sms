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
  studentRegistration: {
    select: {
      id: true,
      student: { select: { id: true, studentNo: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      academicYear: { select: { id: true, yearName: true } },
      term: { select: { id: true, name: true } },
    },
  },
  curriculum: {
    select: {
      id: true,
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      academicYear: { select: { id: true, yearName: true } },
      term: { select: { id: true, name: true } },
    },
  },
} as const;

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const studentRegistrationId = searchParams.get('studentRegistrationId');
    const curriculumId = searchParams.get('curriculumId');

    if (id) {
      const item = await prisma.studentCurriculum.findUnique({ where: { id: Number(id) }, include: includeLite });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }

    const where: any = {};
    if (studentRegistrationId) where.studentRegistrationId = Number(studentRegistrationId);
    if (curriculumId) where.curriculumId = Number(curriculumId);

    const list = await prisma.studentCurriculum.findMany({ where, include: includeLite, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/studentcurriculums error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { studentRegistrationId, curriculumId, isActive } = body || {};
    if (!studentRegistrationId || !curriculumId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const created = await prisma.studentCurriculum.create({
      data: {
        studentRegistrationId: Number(studentRegistrationId),
        curriculumId: Number(curriculumId),
        isActive: isActive === undefined ? true : !!isActive,
      },
      include: includeLite,
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/studentcurriculums error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, isActive, curriculumId } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (isActive !== undefined) data.isActive = !!isActive;
    if (curriculumId !== undefined) data.curriculumId = Number(curriculumId);
    const updated = await prisma.studentCurriculum.update({ where: { id: parsedId }, data, include: includeLite });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/studentcurriculums error', err);
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
    await prisma.studentCurriculum.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/studentcurriculums error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
