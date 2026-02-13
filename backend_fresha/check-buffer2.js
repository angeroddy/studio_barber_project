const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // 1. Trouver le coiffeur ANGE RODDY
    console.log('=== RECHERCHE DU COIFFEUR ===');
    const staff = await prisma.staff.findMany({
      where: {
        OR: [
          { firstName: { contains: 'ANGE', mode: 'insensitive' } },
          { lastName: { contains: 'RODDY', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        salonId: true
      }
    });
    console.log(JSON.stringify(staff, null, 2));

    if (staff.length === 0) {
      console.log('Aucun coiffeur trouvé');
      return;
    }

    const staffId = staff[0].id;
    console.log(`\nUtilisation du staff ID: ${staffId}`);

    // 2. Trouver toutes ses réservations récentes
    console.log('\n=== TOUTES LES RÉSERVATIONS RÉCENTES ===');
    const bookings = await prisma.booking.findMany({
      where: {
        staffId: staffId,
        startTime: {
          gte: new Date('2025-02-01T00:00:00Z')
        }
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 10
    });
    console.log('Nombre de bookings simples:', bookings.length);
    bookings.forEach(b => {
      console.log(`- ${b.startTime} → ${b.endTime} (${b.service?.name})`);
    });

    // 3. BookingServices
    console.log('\n=== BOOKINGSERVICES RÉCENTS ===');
    const bookingServices = await prisma.bookingService.findMany({
      where: {
        staffId: staffId,
        startTime: {
          gte: new Date('2025-02-01T00:00:00Z')
        }
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    console.log('Nombre de bookingServices:', bookingServices.length);
    bookingServices.forEach(b => {
      console.log(`- ${b.startTime} → ${b.endTime} (${b.service?.name})`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
