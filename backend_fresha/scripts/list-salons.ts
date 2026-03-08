import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listSalons() {
  try {
    const salons = await prisma.salon.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    console.log(`📋 Liste des salons (${salons.length} trouvés):\n`);

    salons.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.name}`);
      console.log(`   ID: ${salon.id}`);
      console.log(`   Nombre de réservations: ${salon._count.bookings}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listSalons();
