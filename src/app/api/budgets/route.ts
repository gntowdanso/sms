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
    const list = await prisma.budget.findMany({ where, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/budgets', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { academicYearId, termId, category, plannedAmount, actualAmount } = await req.json();
    if (!academicYearId || !termId || !category || plannedAmount === undefined || plannedAmount === null || actualAmount === undefined || actualAmount === null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.budget.create({ data: { username: `bud-${Date.now()}`, academicYearId: Number(academicYearId), termId: Number(termId), category: String(category), plannedAmount: Number(plannedAmount), actualAmount: Number(actualAmount) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/budgets', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    ['academicYearId','termId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    if (body.category !== undefined) data.category = String(body.category);
    if (body.plannedAmount !== undefined) data.plannedAmount = Number(body.plannedAmount);
    if (body.actualAmount !== undefined) data.actualAmount = Number(body.actualAmount);
    const updated = await prisma.budget.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/budgets', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.budget.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/budgets', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
