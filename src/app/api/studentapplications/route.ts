import { NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma'
let prisma: any = null

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
  try {
  const { searchParams } = new URL(req.url);
  if (!prisma) prisma = await getPrisma()
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.studentApplication.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
  const list = await prisma.studentApplication.findMany();
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/studentapplications error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { firstName, lastName, otherNames, dateOfBirth, gender, address, email, contactNumber, previousSchool, intendedClass, guardianName, guardianContact } = body || {};
    if (!firstName || !lastName) return NextResponse.json({ error: 'Missing firstName/lastName' }, { status: 400 });
    const base = `app-${Date.now()}`;
    let username = base;
    let attempt = 0;
    while (attempt < 10) {
      const exists = await prisma.studentApplication.findUnique({ where: { username } });
      if (!exists) break;
      attempt++;
      username = `${base}-${attempt}`;
    }
    const data: any = { username, firstName: String(firstName).trim(), lastName: String(lastName).trim(), otherNames: otherNames || null, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, gender: gender || null, address: address || null, email: email || null, contactNumber: contactNumber || null, previousSchool: previousSchool || null, intendedClass: intendedClass || null, guardianName: guardianName || null, guardianContact: guardianContact || null };
  const created = await prisma.studentApplication.create({ data });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/studentapplications error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, firstName, lastName, otherNames, dateOfBirth, gender, address, email, contactNumber, previousSchool, intendedClass, guardianName, guardianContact } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (firstName !== undefined) data.firstName = String(firstName).trim();
    if (lastName !== undefined) data.lastName = String(lastName).trim();
    if (otherNames !== undefined) data.otherNames = otherNames || null;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) data.gender = gender || null;
    if (address !== undefined) data.address = address || null;
    if (email !== undefined) data.email = email || null;
    if (contactNumber !== undefined) data.contactNumber = contactNumber || null;
    if (previousSchool !== undefined) data.previousSchool = previousSchool || null;
    if (intendedClass !== undefined) data.intendedClass = intendedClass || null;
    if (guardianName !== undefined) data.guardianName = guardianName || null;
    if (guardianContact !== undefined) data.guardianContact = guardianContact || null;
  const updated = await prisma.studentApplication.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/studentapplications error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const id = Number(body?.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.studentApplication.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/studentapplications error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
