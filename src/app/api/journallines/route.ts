import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const journalEntryId = searchParams.get('journalEntryId');
    const where: any = {};
    if (journalEntryId) where.journalEntryId = Number(journalEntryId);
    const list = await prisma.journalLine.findMany({ where, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/journallines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { journalEntryId, accountId, debit, credit } = await req.json();
    if (!journalEntryId || !accountId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.journalLine.create({ data: { journalEntryId: Number(journalEntryId), accountId: Number(accountId), debit: Number(debit || 0), credit: Number(credit || 0) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/journallines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    ['journalEntryId','accountId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    if (body.debit !== undefined) data.debit = Number(body.debit || 0);
    if (body.credit !== undefined) data.credit = Number(body.credit || 0);
    const updated = await prisma.journalLine.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/journallines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.journalLine.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/journallines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
