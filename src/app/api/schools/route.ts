import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// obtain prisma lazily to avoid init errors during build/deploy
let prisma: any;

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
  if (!prisma) prisma = await getPrisma();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const school = await prisma.school.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(school);
  }
  const schools = await prisma.school.findMany();
  return NextResponse.json(schools);
}

export async function POST(req: Request) {
  try {
  if (!prisma) prisma = await getPrisma();
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
    // build data only from allowed fields and map userName -> createdBy
    const data: any = {
      username: body.username,
      name: body.name,
      address: body.address ?? null,
      contactInfo: body.contactInfo ?? null,
      type: body.type,
      accreditationNo: body.accreditationNo ?? null,
      establishedDate: body.establishedDate ? new Date(body.establishedDate) : null,
    };
    if (body.userName) data.createdBy = body.userName;
  // defensive: remove unexpected properties that could be present on the incoming body
  if ((data as any).userName !== undefined) delete (data as any).userName;
  if ((data as any).userRole !== undefined) delete (data as any).userRole;
  const school = await prisma.school.create({ data });
    return NextResponse.json(school);
  } catch (err) {
    console.error('POST /api/schools error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
  if (!prisma) prisma = await getPrisma();
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
    const { id } = body;
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });

    // build data only from allowed fields to avoid unknown-argument errors
    const data: any = {
      username: body.username,
      name: body.name,
      address: body.address ?? null,
      contactInfo: body.contactInfo ?? null,
      type: body.type,
      accreditationNo: body.accreditationNo ?? null,
      establishedDate: body.establishedDate ? new Date(body.establishedDate) : null,
    };
    if (body.userName) data.updatedBy = body.userName;
  if ((data as any).userName !== undefined) delete (data as any).userName;
  if ((data as any).userRole !== undefined) delete (data as any).userRole;
  const updated = await prisma.school.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/schools error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) 
{
  try {
  if (!prisma) prisma = await getPrisma();
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
    const { id } = body;
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });

    await prisma.school.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/schools error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
