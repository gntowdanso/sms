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
      const item = await prisma.gradingScheme.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.gradingScheme.findMany({ orderBy: { minMark: 'asc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/gradingschemes error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { minMark, maxMark, grade, remarks } = body || {};
    if (minMark === undefined || maxMark === undefined || !grade) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const created = await prisma.gradingScheme.create({
      data: {
        username: `grading-${Date.now()}`,
        minMark: Number(minMark),
        maxMark: Number(maxMark),
        grade: String(grade).trim(),
        remarks: remarks ? String(remarks) : null,
      },
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/gradingschemes error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, minMark, maxMark, grade, remarks } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (minMark !== undefined) data.minMark = Number(minMark);
    if (maxMark !== undefined) data.maxMark = Number(maxMark);
    if (grade !== undefined) data.grade = String(grade).trim();
    if (remarks !== undefined) data.remarks = remarks ? String(remarks) : null;
    const updated = await prisma.gradingScheme.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/gradingschemes error', err);
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
    await prisma.gradingScheme.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/gradingschemes error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
