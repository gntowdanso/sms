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
    const reportCardId = searchParams.get('reportCardId');
    if (id) {
      const item = await prisma.reportCardDetail.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (reportCardId) where.reportCardId = Number(reportCardId);
    const list = await prisma.reportCardDetail.findMany({ where, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/reportcarddetails error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { reportCardId, subjectId, assessmentId, marksObtained, grade } = body || {};
    if (!reportCardId || !subjectId || marksObtained === undefined || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.reportCardDetail.create({
      data: {
        reportCardId: Number(reportCardId),
        subjectId: Number(subjectId),
        assessmentId: assessmentId ? Number(assessmentId) : null,
        marksObtained: Number(marksObtained),
        grade: String(grade),
      },
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/reportcarddetails error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, subjectId, assessmentId, marksObtained, grade } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (subjectId !== undefined) data.subjectId = Number(subjectId);
    if (assessmentId !== undefined) data.assessmentId = assessmentId ? Number(assessmentId) : null;
    if (marksObtained !== undefined) data.marksObtained = Number(marksObtained);
    if (grade !== undefined) data.grade = String(grade);
    const updated = await prisma.reportCardDetail.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/reportcarddetails error', err);
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
    await prisma.reportCardDetail.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/reportcarddetails error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
