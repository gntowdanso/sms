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

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');

    if (id) {
      const item = await prisma.studentGuardian.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }

    const where: any = {};
    if (studentId) where.studentId = Number(studentId);

    const list = await prisma.studentGuardian.findMany({ where, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/studentguardians error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
    const { studentId, name, relation, contactNumber, email, address } = body || {};
    if (!studentId || !name) return NextResponse.json({ error: 'Missing studentId/name' }, { status: 400 });

    const created = await prisma.studentGuardian.create({ data: {
      studentId: Number(studentId),
      name: String(name).trim(),
      relation: relation || null,
      contactNumber: contactNumber || null,
      email: email || null,
      address: address || null,
    }});
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/studentguardians error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
    const { id, name, relation, contactNumber, email, address } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (relation !== undefined) data.relation = relation || null;
    if (contactNumber !== undefined) data.contactNumber = contactNumber || null;
    if (email !== undefined) data.email = email || null;
    if (address !== undefined) data.address = address || null;

    const updated = await prisma.studentGuardian.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/studentguardians error', err);
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
    await prisma.studentGuardian.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/studentguardians error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
