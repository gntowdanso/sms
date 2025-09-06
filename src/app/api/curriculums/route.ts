import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma: any = new PrismaClient();
function parseRoleFromHeaders(req: Request) { try { const roleHeader = req.headers.get('x-user-role'); if (!roleHeader) return null; const role = Number(roleHeader); if (Number.isNaN(role)) return null; return role; } catch (e) { return null; } }
function requireMutatingRole(req: Request) { const role = parseRoleFromHeaders(req); if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' }; if (role > 2) return { ok: false, reason: 'insufficient role privileges' }; return { ok: true }; }

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		if (id) {
			const item = await prisma.curriculum.findUnique({ where: { id: Number(id) }, include: { academicYear: true, class: true, subject: true, term: true } });
			if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			return NextResponse.json(item);
		}

		const list = await prisma.curriculum.findMany({ include: { academicYear: true, class: true, subject: true, term: true } });
		return NextResponse.json(list);
	} catch (err) {
		console.error('GET /api/curriculums error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const { academicYearId, classId, subjectId, termId } = body || {};
		if (!academicYearId || !classId || !subjectId || !termId) return NextResponse.json({ error: 'Missing academicYearId/classId/subjectId/termId' }, { status: 400 });
		const data: any = {};
		data.academicYear = { connect: { id: Number(academicYearId) } };
		data.class = { connect: { id: Number(classId) } };
		data.subject = { connect: { id: Number(subjectId) } };
		data.term = { connect: { id: Number(termId) } };
		const base = `curriculum-${Date.now()}`;
		let username = base;
		let attempt = 0;
		while (attempt < 10) {
			const exists = await prisma.curriculum.findUnique({ where: { username } });
			if (!exists) break;
			attempt++;
			username = `${base}-${attempt}`;
		}
		data.username = username;
		const created = await prisma.curriculum.create({ data });
		return NextResponse.json(created);
	} catch (err) {
		console.error('POST /api/curriculums error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	try {
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const { id, academicYearId, classId, subjectId, termId } = body || {};
		const parsedId = Number(id);
		if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		const data: any = {};
		if (academicYearId !== undefined) data.academicYearId = academicYearId === '' || academicYearId === null ? null : Number(academicYearId);
		if (classId !== undefined) data.classId = classId === '' || classId === null ? null : Number(classId);
		if (subjectId !== undefined) data.subjectId = subjectId === '' || subjectId === null ? null : Number(subjectId);
		if (termId !== undefined) data.termId = termId === '' || termId === null ? null : Number(termId);
		const updated = await prisma.curriculum.update({ where: { id: parsedId }, data });
		return NextResponse.json(updated);
	} catch (err) {
		console.error('PUT /api/curriculums error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request) { try { const check = requireMutatingRole(req); if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 }); const body = await req.json(); const id = Number(body?.id); if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 }); await prisma.curriculum.delete({ where: { id } }); return NextResponse.json({ success: true }); } catch (err) { console.error('DELETE /api/curriculums error', err); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); } }
