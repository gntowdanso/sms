import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    if (!roleHeader) return null;
    const role = Number(roleHeader);
    if (Number.isNaN(role)) return null;
    return role;
  } catch {
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
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    if (id) {
      const item = await prisma.assignmentSubmission.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (assignmentId) where.assignmentId = Number(assignmentId);
    if (studentId) where.studentId = Number(studentId);
    const list = await prisma.assignmentSubmission.findMany({ where, orderBy: { submittedDate: 'desc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/assignmentsubmissions error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { assignmentId, studentId, submittedDate, fileUrl, marks, feedback, academicYearId, termId } = body || {};
    if (!assignmentId || !studentId || !submittedDate || !academicYearId || !termId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.assignmentSubmission.create({
      data: {
        username: `assign-sub-${Date.now()}`,
        assignmentId: Number(assignmentId),
        studentId: Number(studentId),
        submittedDate: new Date(submittedDate),
        fileUrl: fileUrl ? String(fileUrl) : null,
        marks: marks !== undefined && marks !== null ? Number(marks) : null,
        feedback: feedback ? String(feedback) : null,
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
    });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/assignmentsubmissions error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, submittedDate, fileUrl, marks, feedback } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (submittedDate !== undefined) data.submittedDate = new Date(submittedDate);
    if (fileUrl !== undefined) data.fileUrl = fileUrl ? String(fileUrl) : null;
    if (marks !== undefined) data.marks = marks !== null ? Number(marks) : null;
    if (feedback !== undefined) data.feedback = feedback ? String(feedback) : null;
    const updated = await prisma.assignmentSubmission.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/assignmentsubmissions error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const prisma = await getPrisma();
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const id = Number(body?.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.assignmentSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/assignmentsubmissions error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
