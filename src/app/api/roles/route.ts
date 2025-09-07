import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
let prisma: any;

export async function GET() {
  try {
  if (!prisma) prisma = await getPrisma();
    const roles = await prisma.role.findMany({ select: { id: true, roleName: true } });
    return NextResponse.json(roles);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load roles' }, { status: 500 });
  }
}
