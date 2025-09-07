import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
let prisma: any;

function parseRoleFromHeaders(req: Request) {
  try { const roleHeader = req.headers.get('x-user-role'); if (!roleHeader) return null; const role = Number(roleHeader); if (Number.isNaN(role)) return null; return role; } catch (e) { return null; }
}
function requireMutatingRole(req: Request) { const role = parseRoleFromHeaders(req); if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (role > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  try {
  if (!prisma) prisma = await getPrisma();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.class.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.class.findMany({ include: { classTeacher: true } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/classes error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
  if (!prisma) prisma = await getPrisma();
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { name, section, capacity, classTeacherId } = body || {};
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const data: any = { name: name.trim(), section: section || null, capacity: capacity ? Number(capacity) : null };
    if (classTeacherId !== undefined && classTeacherId !== null && classTeacherId !== '') data.classTeacherId = Number(classTeacherId);
    // ensure username
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || `class-${Date.now()}`;
    let username = base; let attempt = 0;
    while (attempt < 10) { // eslint-disable-next-line no-await-in-loop
      const exists = await prisma.class.findUnique({ where: { username } }); if (!exists) break; attempt++; username = `${base}-${attempt}`; }
    data.username = username;
    const created = await prisma.class.create({ data });
    return NextResponse.json(created);
  } catch (err) { console.error('POST /api/classes error', err); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
  if (!prisma) prisma = await getPrisma();
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const { id, name, section, capacity, classTeacherId } = body || {};
    const parsedId = Number(id); if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (section !== undefined) data.section = section;
    if (capacity !== undefined) data.capacity = capacity === '' || capacity === null ? null : Number(capacity);
    if (classTeacherId !== undefined) data.classTeacherId = classTeacherId === '' || classTeacherId === null ? null : Number(classTeacherId);
    const updated = await prisma.class.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) { console.error('PUT /api/classes error', err); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try { if (!prisma) prisma = await getPrisma(); const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 }); const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 }); await prisma.class.delete({ where: { id } }); return NextResponse.json({ success: true }); } catch (err) { console.error('DELETE /api/classes error', err); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
