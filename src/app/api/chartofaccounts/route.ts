import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const accountTypeId = searchParams.get('accountTypeId');
    const where: any = {};
    if (accountTypeId) where.accountTypeId = Number(accountTypeId);
    const list = await prisma.chartOfAccount.findMany({ where, orderBy: { accountCode: 'asc' }, include: { accountType: true } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/chartofaccounts', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { accountCode, accountName, accountTypeId } = await req.json();
    if (!accountCode || !accountName || !accountTypeId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.chartOfAccount.create({ data: { username: `coa-${Date.now()}`, accountCode: String(accountCode), accountName: String(accountName), accountTypeId: Number(accountTypeId) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/chartofaccounts', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (body.accountCode !== undefined) data.accountCode = String(body.accountCode);
    if (body.accountName !== undefined) data.accountName = String(body.accountName);
    if (body.accountTypeId !== undefined) data.accountTypeId = Number(body.accountTypeId);
    const updated = await prisma.chartOfAccount.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/chartofaccounts', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.chartOfAccount.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/chartofaccounts', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
