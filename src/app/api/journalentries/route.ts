import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');
    const where: any = {};
    if (academicYearId) where.academicYearId = Number(academicYearId);
    if (termId) where.termId = Number(termId);
    const list = await prisma.journalEntry.findMany({ where, orderBy: { date: 'desc' }, include: { lines: true } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/journalentries', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { date, description, postedBy, academicYearId, termId, lines } = await req.json();
    if (!date || !description || !postedBy || !academicYearId || !termId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.journalEntry.create({ data: { date: new Date(date), description: String(description), postedBy: String(postedBy), academicYearId: Number(academicYearId), termId: Number(termId), lines: lines && Array.isArray(lines) ? { create: lines.map((l: any) => ({ accountId: Number(l.accountId), debit: Number(l.debit || 0), credit: Number(l.credit || 0) })) } : undefined } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/journalentries', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.postedBy !== undefined) data.postedBy = String(body.postedBy);
    ['academicYearId','termId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    const updated = await prisma.journalEntry.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/journalentries', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.journalEntry.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/journalentries', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
