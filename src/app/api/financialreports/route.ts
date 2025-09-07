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
    const list = await prisma.financialReport.findMany({ where, orderBy: { id: 'desc' } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/financialreports', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { academicYearId, termId, reportTitle, generatedDate, fileUrl } = await req.json();
    if (!academicYearId || !termId || !reportTitle || !generatedDate || !fileUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await prisma.financialReport.create({ data: { username: `finrep-${Date.now()}`, academicYearId: Number(academicYearId), termId: Number(termId), reportTitle: String(reportTitle), generatedDate: new Date(generatedDate), fileUrl: String(fileUrl) } });
    return NextResponse.json(created);
  } catch (e) { console.error('POST /api/financialreports', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    ['academicYearId','termId'].forEach(k => { if (body[k] !== undefined) data[k] = Number(body[k]); });
    if (body.reportTitle !== undefined) data.reportTitle = String(body.reportTitle);
    if (body.generatedDate !== undefined) data.generatedDate = new Date(body.generatedDate);
    if (body.fileUrl !== undefined) data.fileUrl = String(body.fileUrl);
    const updated = await prisma.financialReport.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) { console.error('PUT /api/financialreports', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const { id } = await req.json(); const parsed = Number(id); if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.financialReport.delete({ where: { id: parsed } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/financialreports', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
