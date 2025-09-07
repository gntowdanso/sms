import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');
    const studentId = searchParams.get('studentId');
    const where: any = {};
    if (invoiceId) where.invoiceId = Number(invoiceId);
    if (studentId) where.studentId = Number(studentId);
    const list = await prisma.payment.findMany({ where, orderBy: { id: 'desc' }, include: { invoice: true } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/payments', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { invoiceId, studentId, paymentDate, amountPaid, method, receiptNo } = body || {};
    if (!invoiceId || !studentId || !paymentDate || amountPaid === undefined || amountPaid === null || !method || !receiptNo) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.payment.create({ data: { username: `pay-${Date.now()}`, invoiceId: Number(invoiceId), studentId: Number(studentId), paymentDate: new Date(paymentDate), amountPaid: Number(amountPaid), method: String(method), receiptNo: String(receiptNo) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/payments', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    ['invoiceId','studentId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    if (body.paymentDate !== undefined) data.paymentDate = new Date(body.paymentDate);
    if (body.amountPaid !== undefined) data.amountPaid = Number(body.amountPaid);
    if (body.method !== undefined) data.method = String(body.method);
    if (body.receiptNo !== undefined) data.receiptNo = String(body.receiptNo);
    const updated = await prisma.payment.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/payments', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.payment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/payments', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
