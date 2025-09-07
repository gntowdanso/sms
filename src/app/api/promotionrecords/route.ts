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
    const studentId = searchParams.get('studentId');
    if (id) {
      const item = await prisma.promotionRecord.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    const list = await prisma.promotionRecord.findMany({ where, orderBy: { promotionDate: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/promotionrecords error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { studentId, fromClassId, toClassId, promotionDate, academicYearId, termId } = body || {};
    if (!studentId || !fromClassId || !toClassId || !promotionDate || !academicYearId || !termId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.promotionRecord.create({
      data: {
        username: `promote-${Date.now()}`,
        studentId: Number(studentId),
        fromClassId: Number(fromClassId),
        toClassId: Number(toClassId),
        promotionDate: new Date(promotionDate),
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/promotionrecords error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, fromClassId, toClassId, promotionDate } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (fromClassId !== undefined) data.fromClassId = Number(fromClassId);
    if (toClassId !== undefined) data.toClassId = Number(toClassId);
    if (promotionDate !== undefined) data.promotionDate = new Date(promotionDate);
    const updated = await prisma.promotionRecord.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/promotionrecords error', err);
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
    await prisma.promotionRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/promotionrecords error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
