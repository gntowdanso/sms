import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    if (!roleHeader) return null;
    const role = Number(roleHeader);
    if (Number.isNaN(role)) return null;
    return role;
  } catch {
    return null;
  }
}

function requireMutatingRole(req: Request) {
  const role = parseRoleFromHeaders(req);
  if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' };
  if (role > 2) return { ok: false, reason: 'insufficient role privileges' };
  return { ok: true };
}

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.assessment.findUnique({ where: { id: Number(id) }, include: { assessmentType: true, examPapers: false, results: false } as any });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.assessment.findMany({ orderBy: { id: 'desc' }, include: { assessmentType: true } as any });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/assessments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { title, description, date, classId, subjectId, teacherId, assessmentTypeId, academicYearId, termId } = body || {};
    if (!assessmentTypeId || !academicYearId || !termId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const created = await prisma.assessment.create({
      data: {
        username: `assessment-${Date.now()}`,
        title: title ? String(title) : null,
        description: description ? String(description) : null,
        date: date ? new Date(date) : null,
        classId: classId ? Number(classId) : null,
        subjectId: subjectId ? Number(subjectId) : null,
        teacherId: teacherId ? Number(teacherId) : null,
        assessmentTypeId: Number(assessmentTypeId),
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
      include: { assessmentType: true } as any,
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/assessments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, title, description, date, classId, subjectId, teacherId, assessmentTypeId, academicYearId, termId } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (title !== undefined) data.title = title ? String(title) : null;
    if (description !== undefined) data.description = description ? String(description) : null;
    if (date !== undefined) data.date = date ? new Date(date) : null;
    if (classId !== undefined) data.classId = classId ? Number(classId) : null;
    if (subjectId !== undefined) data.subjectId = subjectId ? Number(subjectId) : null;
    if (teacherId !== undefined) data.teacherId = teacherId ? Number(teacherId) : null;
    if (assessmentTypeId !== undefined) data.assessmentTypeId = Number(assessmentTypeId);
    if (academicYearId !== undefined) data.academicYearId = Number(academicYearId);
    if (termId !== undefined) data.termId = Number(termId);
    const updated = await prisma.assessment.update({ where: { id: parsedId }, data, include: { assessmentType: true } as any });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/assessments error', err);
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
    await prisma.assessment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/assessments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
