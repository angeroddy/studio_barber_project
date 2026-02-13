const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // 1. Vérifier les paramètres du salon
    console.log('=== PARAMÈTRES DU SALON ===');
    const salons = await prisma.salon.findMany({
      select: {
        id: true,
        name: true,
        bufferBefore: true,
        bufferAfter: true,
        processingTime: true
      }
    });
    console.log(JSON.stringify(salons, null, 2));

    // 2. Vérifier la dernière réservation du 3 février
    console.log('\n=== DERNIÈRE RÉSERVATION DU 3 FÉVRIER ===');
    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: new Date('2025-02-03T00:00:00Z'),
          lt: new Date('2025-02-04T00:00:00Z')
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        service: {
          select: {
            name: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    console.log(JSON.stringify(bookings, null, 2));

    // 3. Vérifier les BookingService (multi-services)
    console.log('\n=== BOOKINGSERVICES DU 3 FÉVRIER ===');
    const bookingServices = await prisma.bookingService.findMany({
      where: {
        startTime: {
          gte: new Date('2025-02-03T00:00:00Z'),
          lt: new Date('2025-02-04T00:00:00Z')
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        service: {
          select: {
            name: true,
            duration: true
          }
        },
        booking: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    console.log(JSON.stringify(bookingServices, null, 2));

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
