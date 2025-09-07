import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) {
  try { const v = Number(req.headers.get('x-user-role')); return Number.isNaN(v) ? null : v; } catch { return null; }
}
function requireMutatingRole(req: Request) {
  const r = parseRoleFromHeaders(req); if (r === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (r > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true };
}

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.feeItem.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.feeItem.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/feeitems', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { name, description, defaultAmount, isOptional } = body || {};
    if (!name || defaultAmount === undefined || defaultAmount === null) return NextResponse.json({ error: 'Missing name/defaultAmount' }, { status: 400 });
    const created = await prisma.feeItem.create({ data: { username: `feeitem-${Date.now()}`, name: String(name).trim(), description: description ? String(description) : null, defaultAmount: Number(defaultAmount), isOptional: !!isOptional } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/feeitems', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.defaultAmount !== undefined) data.defaultAmount = Number(body.defaultAmount);
    if (body.isOptional !== undefined) data.isOptional = !!body.isOptional;
    const updated = await prisma.feeItem.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/feeitems', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.feeItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/feeitems', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
