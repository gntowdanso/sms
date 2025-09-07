import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    const list = await prisma.fine.findMany({ where, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/fines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { studentId, reason, amount, date, academicYearId, termId } = body || {};
    if (!studentId || !reason || amount === undefined || amount === null || !date || !academicYearId || !termId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.fine.create({ data: { username: `fine-${Date.now()}`, studentId: Number(studentId), reason: String(reason), amount: Number(amount), date: new Date(date), academicYearId: Number(academicYearId), termId: Number(termId) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/fines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    ['studentId','academicYearId','termId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    if (body.reason !== undefined) data.reason = String(body.reason);
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.date !== undefined) data.date = new Date(body.date);
    const updated = await prisma.fine.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/fines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.fine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/fines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
