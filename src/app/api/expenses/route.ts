import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET() {
  const prisma = await getPrisma();
  try {
    const list = await prisma.expense.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/expenses', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { category, amount, date, approvedBy } = await req.json();
    if (!category || amount === undefined || amount === null || !date || !approvedBy) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.expense.create({ data: { username: `exp-${Date.now()}`, category: String(category), amount: Number(amount), date: new Date(date), approvedBy: String(approvedBy) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/expenses', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (body.category !== undefined) data.category = String(body.category);
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.approvedBy !== undefined) data.approvedBy = String(body.approvedBy);
    const updated = await prisma.expense.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/expenses', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.expense.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/expenses', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
