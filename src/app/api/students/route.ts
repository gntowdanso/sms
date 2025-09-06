import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma: any = new PrismaClient();

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
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.student.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.student.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/students error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { firstName, lastName, otherNames, dateOfBirth, gender, address, email, contactNumber, nationality, placeOfBirth, previousSchool } = body || {};
    if (!firstName || !lastName) return NextResponse.json({ error: 'Missing firstName/lastName' }, { status: 400 });

    const baseUsername = `stu-${Date.now()}`;
    let username = baseUsername;
    let attempt = 0;
    while (attempt < 10) {
      const exists = await prisma.student.findUnique({ where: { username } });
      if (!exists) break;
      attempt++;
      username = `${baseUsername}-${attempt}`;
    }

    const baseNo = `STU-${Date.now()}`;
    let studentNo = baseNo;
    attempt = 0;
    while (attempt < 10) {
      const exists = await prisma.student.findUnique({ where: { studentNo } });
      if (!exists) break;
      attempt++;
      studentNo = `${baseNo}-${attempt}`;
    }

    const data: any = {
      username,
      studentNo,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      otherNames: otherNames || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      address: address || null,
      email: email || null,
      contactNumber: contactNumber || null,
      nationality: nationality || null,
      placeOfBirth: placeOfBirth || null,
      previousSchool: previousSchool || null,
    };

    const created = await prisma.student.create({ data });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/students error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, firstName, lastName, otherNames, dateOfBirth, gender, address, email, contactNumber, nationality, placeOfBirth, previousSchool } = body || {};
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
    if (nationality !== undefined) data.nationality = nationality || null;
    if (placeOfBirth !== undefined) data.placeOfBirth = placeOfBirth || null;
    if (previousSchool !== undefined) data.previousSchool = previousSchool || null;

    const updated = await prisma.student.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/students error', err);
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
    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/students error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
