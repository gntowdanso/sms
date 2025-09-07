import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');
    const where: any = {};
    if (invoiceId) where.invoiceId = Number(invoiceId);
    const list = await prisma.invoiceLine.findMany({ where, include: { feeItem: true }, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/invoicelines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { invoiceId, feeItemId, amount } = body || {};
    if (!invoiceId || !feeItemId || amount === undefined || amount === null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.invoiceLine.create({ data: { invoiceId: Number(invoiceId), feeItemId: Number(feeItemId), amount: Number(amount) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/invoicelines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (body.invoiceId !== undefined) data.invoiceId = Number(body.invoiceId);
    if (body.feeItemId !== undefined) data.feeItemId = Number(body.feeItemId);
    if (body.amount !== undefined) data.amount = Number(body.amount);
    const updated = await prisma.invoiceLine.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/invoicelines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.invoiceLine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/invoicelines', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
