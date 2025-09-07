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
  results: true,
} as const;

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    if (id) {
      const item = await prisma.reportCard.findUnique({ where: { id: Number(id) }, include: includeLite });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    const list = await prisma.reportCard.findMany({ where, orderBy: { id: 'desc' }, include: includeLite });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/reportcards error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { studentId, overallGrade, totalMarks, averageMarks, position, remarks, teacherRemark, principalRemark, academicYearId, termId } = body || {};
    if (!studentId || overallGrade === undefined || totalMarks === undefined || averageMarks === undefined || !academicYearId || !termId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.reportCard.create({
      data: {
        username: `reportcard-${Date.now()}`,
        studentId: Number(studentId),
        overallGrade: String(overallGrade),
        totalMarks: Number(totalMarks),
        averageMarks: Number(averageMarks),
        position: position !== undefined && position !== null ? Number(position) : null,
        remarks: remarks ? String(remarks) : null,
        teacherRemark: teacherRemark ? String(teacherRemark) : null,
        principalRemark: principalRemark ? String(principalRemark) : null,
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
      include: includeLite,
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/reportcards error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, overallGrade, totalMarks, averageMarks, position, remarks, teacherRemark, principalRemark } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (overallGrade !== undefined) data.overallGrade = String(overallGrade);
    if (totalMarks !== undefined) data.totalMarks = Number(totalMarks);
    if (averageMarks !== undefined) data.averageMarks = Number(averageMarks);
    if (position !== undefined) data.position = position !== null ? Number(position) : null;
    if (remarks !== undefined) data.remarks = remarks ? String(remarks) : null;
    if (teacherRemark !== undefined) data.teacherRemark = teacherRemark ? String(teacherRemark) : null;
    if (principalRemark !== undefined) data.principalRemark = principalRemark ? String(principalRemark) : null;
    const updated = await prisma.reportCard.update({ where: { id: parsedId }, data, include: includeLite });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/reportcards error', err);
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
    await prisma.reportCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/reportcards error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
