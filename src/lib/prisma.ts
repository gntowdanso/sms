let prismaClient: any = null

export async function getPrisma() {
  if (prismaClient) return prismaClient
  // dynamic import to avoid build-time errors if client not yet generated
  const { PrismaClient } = await import('@prisma/client')
  prismaClient = new PrismaClient()
  return prismaClient
}
