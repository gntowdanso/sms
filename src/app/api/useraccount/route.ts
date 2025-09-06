import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to check access
function hasAccess(roleId: number) {
  return roleId <= 2;
}

export async function GET(req: NextRequest) {
  // For demo, get roleId from query param (replace with real auth in production)
  const { searchParams } = new URL(req.url);
  const roleId = Number(searchParams.get('roleId'));
  if (!hasAccess(roleId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const users = await prisma.userAccount.findMany();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { username, passwordHash, roleId, isActive } = await req.json();
  if (!hasAccess(roleId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const user = await prisma.userAccount.create({
    data: { username, passwordHash, roleId, isActive }
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const { id, username, passwordHash, roleId, isActive } = await req.json();
  if (!hasAccess(roleId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const user = await prisma.userAccount.update({
    where: { id },
    data: { username, passwordHash, roleId, isActive }
  });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const { id, roleId } = await req.json();
  if (!hasAccess(roleId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await prisma.userAccount.delete({ where: { id } });
  return NextResponse.json({ message: 'Deleted' });
}
