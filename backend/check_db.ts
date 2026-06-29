import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.ticket.findMany({
    orderBy: { created_at: 'desc' },
    take: 3,
    include: { event: true, user: true }
  });
  console.log(JSON.stringify(t, null, 2));
}
main().finally(() => prisma.$disconnect());
