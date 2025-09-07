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
      const item = await prisma.assignment.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.assignment.findMany({ orderBy: { dueDate: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/assignments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { title, description, classId, subjectId, teacherId, dueDate, academicYearId, termId } = body || {};
    if (!title || !classId || !subjectId || !teacherId || !dueDate || !academicYearId || !termId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.assignment.create({
      data: {
        username: `assignment-${Date.now()}`,
        title: String(title),
        description: description ? String(description) : null,
        classId: Number(classId),
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        dueDate: new Date(dueDate),
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/assignments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, title, description, classId, subjectId, teacherId, dueDate, academicYearId, termId } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (title !== undefined) data.title = String(title);
    if (description !== undefined) data.description = description ? String(description) : null;
    if (classId !== undefined) data.classId = Number(classId);
    if (subjectId !== undefined) data.subjectId = Number(subjectId);
    if (teacherId !== undefined) data.teacherId = Number(teacherId);
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (academicYearId !== undefined) data.academicYearId = Number(academicYearId);
    if (termId !== undefined) data.termId = Number(termId);
    const updated = await prisma.assignment.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/assignments error', err);
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
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/assignments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
