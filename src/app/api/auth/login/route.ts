import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// prisma is obtained lazily per request to avoid initialization issues during build

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

  const user = await prisma.userAccount.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

  await prisma.userAccount.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.roleId } }, { status: 200 });
  } catch (error) {
    console.error('Login API error:', error);
  const errMessage = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ message: 'Server error', error: errMessage }, { status: 500 });
  }
}
