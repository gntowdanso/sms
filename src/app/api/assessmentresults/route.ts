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

const includeLite = {
  assessment: { select: { id: true, title: true } },
  examPaper: { select: { id: true, maxMarks: true } },
  grade: { select: { id: true, grade: true } },
} as const;

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');
    if (id) {
      const item = await prisma.assessmentResult.findUnique({ where: { id: Number(id) }, include: includeLite });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (assessmentId) where.assessmentId = Number(assessmentId);
    if (studentId) where.studentId = Number(studentId);
    const list = await prisma.assessmentResult.findMany({ where, orderBy: { id: 'desc' }, include: includeLite });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/assessmentresults error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { assessmentId, examPaperId, studentId, marksObtained, gradeId, remarks, academicYearId, termId } = body || {};
    if (!assessmentId || !studentId || !academicYearId || !termId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.assessmentResult.create({
      data: {
        username: `assess-result-${Date.now()}`,
        assessmentId: Number(assessmentId),
        examPaperId: examPaperId ? Number(examPaperId) : null,
        studentId: Number(studentId),
        marksObtained: marksObtained !== undefined && marksObtained !== null ? Number(marksObtained) : null,
        gradeId: gradeId ? Number(gradeId) : null,
        remarks: remarks ? String(remarks) : null,
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
      include: includeLite,
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/assessmentresults error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, assessmentId, examPaperId, studentId, marksObtained, gradeId, remarks, academicYearId, termId } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (assessmentId !== undefined) data.assessmentId = Number(assessmentId);
    if (examPaperId !== undefined) data.examPaperId = examPaperId ? Number(examPaperId) : null;
    if (studentId !== undefined) data.studentId = Number(studentId);
    if (marksObtained !== undefined) data.marksObtained = marksObtained !== null ? Number(marksObtained) : null;
    if (gradeId !== undefined) data.gradeId = gradeId ? Number(gradeId) : null;
    if (remarks !== undefined) data.remarks = remarks ? String(remarks) : null;
    if (academicYearId !== undefined) data.academicYearId = Number(academicYearId);
    if (termId !== undefined) data.termId = Number(termId);
    const updated = await prisma.assessmentResult.update({ where: { id: parsedId }, data, include: includeLite });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/assessmentresults error', err);
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
    await prisma.assessmentResult.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/assessmentresults error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
