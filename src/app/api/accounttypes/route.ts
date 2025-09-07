import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) { try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; } }
function requireMutatingRole(req: Request) { const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET() {
  const prisma = await getPrisma();
  try {
    const list = await prisma.accountType.findMany({ orderBy: { id: 'asc' }, include: { accounts: true } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/accounttypes', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { name, code } = await req.json();
    if (!name || !code) return NextResponse.json({ error: 'Missing name/code' }, { status: 400 });
    const created = await prisma.accountType.create({ data: { name: String(name).trim(), code: String(code).trim() } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/accounttypes', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.code !== undefined) data.code = String(body.code).trim();
    const updated = await prisma.accountType.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/accounttypes', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.accountType.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/accounttypes', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
