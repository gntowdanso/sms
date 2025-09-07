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
    const list = await prisma.invoice.findMany({ where, orderBy: { id: 'desc' }, include: { lines: true, payments: true } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/invoices', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { studentId, termId, issueDate, dueDate, totalAmount, status, academicYearId } = body || {};
    if (!studentId || !termId || !issueDate || !dueDate || totalAmount === undefined || totalAmount === null || !status || !academicYearId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.invoice.create({ data: { username: `inv-${Date.now()}`, studentId: Number(studentId), termId: Number(termId), issueDate: new Date(issueDate), dueDate: new Date(dueDate), totalAmount: Number(totalAmount), status: String(status), academicYearId: Number(academicYearId) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/invoices', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    ['studentId','termId','academicYearId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    if (body.issueDate !== undefined) data.issueDate = new Date(body.issueDate);
    if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
    if (body.totalAmount !== undefined) data.totalAmount = Number(body.totalAmount);
    if (body.status !== undefined) data.status = String(body.status);
    const updated = await prisma.invoice.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/invoices', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/invoices', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
