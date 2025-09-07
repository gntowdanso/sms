import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const where: any = {};
    if (accountId) where.accountId = Number(accountId);
    const list = await prisma.ledger.findMany({ where, orderBy: { date: 'desc' }, include: { account: true } });
    return NextResponse.json(list);
  } catch (e) { console.error('GET /api/ledgers', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
