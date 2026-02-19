import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBookingPrices() {
  try {
    // Trouver le salon Clemenceau
    const salon = await prisma.salon.findFirst({
      where: {
        name: {
          contains: 'clémenceau',
          mode: 'insensitive',
        },
      },
    });

    if (!salon) {
      console.log('❌ Salon Clemenceau non trouvé');
      return;
    }

    console.log(`✅ Salon trouvé: ${salon.name} (ID: ${salon.id})`);
    console.log('\n--- Analyse des prix des réservations ---\n');

    // Récupérer toutes les réservations du mois en cours
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const bookings = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        price: 'desc',
      },
    });

    console.log(`📊 Total de réservations ce mois: ${bookings.length}`);

    // Afficher les statistiques
    const validBookings = bookings.filter(
      b => b.status !== 'CANCELED' && b.status !== 'NO_SHOW'
    );
    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const avgBasket = validBookings.length > 0 ? totalRevenue / validBookings.length : 0;

    console.log(`\n📈 Statistiques:`);
    console.log(`   - Réservations valides: ${validBookings.length}`);
    console.log(`   - Revenu total: ${totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    console.log(`   - Panier moyen: ${avgBasket.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);

    // Afficher les 10 réservations les plus chères
    console.log(`\n💰 Top 10 des réservations les plus chères:\n`);
    bookings.slice(0, 10).forEach((booking, index) => {
      const clientName = `${booking.client.firstName} ${booking.client.lastName}`;
      const serviceName = booking.service?.name || 'Service inconnu';
      const servicePrice = booking.service?.price || 0;

      console.log(`${index + 1}. ${clientName}`);
      console.log(`   Service: ${serviceName}`);
      console.log(`   Prix du service: ${servicePrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      console.log(`   Prix de la réservation: ${(booking.price || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      console.log(`   Statut: ${booking.status}`);
      console.log(`   Date: ${booking.startTime.toLocaleDateString('fr-FR')}`);
      console.log('');
    });

    // Identifier les prix anormaux (> 1000€)
    const abnormalPrices = bookings.filter(b => (b.price || 0) > 1000);
    if (abnormalPrices.length > 0) {
      console.log(`\n⚠️  ${abnormalPrices.length} réservation(s) avec des prix anormaux (> 1000€):\n`);
      abnormalPrices.forEach((booking) => {
        console.log(`   ID: ${booking.id}`);
        console.log(`   Prix: ${(booking.price || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
        console.log(`   Service: ${booking.service?.name || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingPrices();
