import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
let prisma: any;

function parseRoleFromHeaders(req: Request) {
	try {
		const roleHeader = req.headers.get('x-user-role');
		if (!roleHeader) return null;
		const role = Number(roleHeader);
		if (Number.isNaN(role)) return null;
		return role;
	} catch (e) {
		return null;
	}
}

function requireMutatingRole(req: Request) {
	const role = parseRoleFromHeaders(req);
	if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' };
	if (role > 2) return { ok: false, reason: 'insufficient role privileges' };
	return { ok: true };
}

export async function GET(req: Request) {
	try {
		if (!prisma) prisma = await getPrisma();
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		if (id) {
			const item = await prisma.academicYear.findUnique({ where: { id: Number(id) } });
			if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			return NextResponse.json(item);
		}

		const list = await prisma.academicYear.findMany();
		return NextResponse.json(list);
	} catch (err) {
		console.error('GET /api/academicyears error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		if (!prisma) prisma = await getPrisma();
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const { yearName, startDate, endDate, status } = body || {};
		if (!yearName) return NextResponse.json({ error: 'Missing yearName' }, { status: 400 });

		const data: any = {
			yearName: String(yearName).trim(),
			startDate: startDate ? new Date(startDate) : null,
			endDate: endDate ? new Date(endDate) : null,
			status: status || 'ACTIVE',
		};

		// generate a unique username from yearName
		const base = String(yearName).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `ay-${Date.now()}`;
		let username = base;
		let attempt = 0;
		while (attempt < 10) {
			const exists = await prisma.academicYear.findUnique({ where: { username } });
			if (!exists) break;
			attempt++;
			username = `${base}-${attempt}`;
		}
		data.username = username;

		const created = await prisma.academicYear.create({ data });
		return NextResponse.json(created);
	} catch (err) {
		console.error('POST /api/academicyears error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	try {
		if (!prisma) prisma = await getPrisma();
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const { id, yearName, startDate, endDate, status } = body || {};
		const parsedId = Number(id);
		if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		const data: any = {};
		if (yearName !== undefined) data.yearName = String(yearName).trim();
		if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
		if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
		if (status !== undefined) data.status = status;
		const updated = await prisma.academicYear.update({ where: { id: parsedId }, data });
		return NextResponse.json(updated);
	} catch (err) {
		console.error('PUT /api/academicyears error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request) {
	try {
		if (!prisma) prisma = await getPrisma();
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const id = Number(body?.id);
		if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		await prisma.academicYear.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('DELETE /api/academicyears error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
