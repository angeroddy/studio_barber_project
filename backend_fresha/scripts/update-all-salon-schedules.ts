import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHEDULES = [
  {
    dayOfWeek: 0, // Dimanche
    isClosed: true,
    timeSlots: [],
  },
  {
    dayOfWeek: 1, // Lundi
    isClosed: true,
    timeSlots: [],
  },
  {
    dayOfWeek: 2, // Mardi
    isClosed: false,
    timeSlots: [
      { startTime: '10:00', endTime: '12:00', order: 0 },
      { startTime: '13:00', endTime: '19:00', order: 1 },
    ],
  },
  {
    dayOfWeek: 3, // Mercredi
    isClosed: false,
    timeSlots: [
      { startTime: '10:00', endTime: '12:00', order: 0 },
      { startTime: '13:00', endTime: '19:00', order: 1 },
    ],
  },
  {
    dayOfWeek: 4, // Jeudi
    isClosed: false,
    timeSlots: [
      { startTime: '10:00', endTime: '12:00', order: 0 },
      { startTime: '13:00', endTime: '19:00', order: 1 },
    ],
  },
  {
    dayOfWeek: 5, // Vendredi
    isClosed: false,
    timeSlots: [
      { startTime: '10:00', endTime: '12:00', order: 0 },
      { startTime: '13:00', endTime: '19:00', order: 1 },
    ],
  },
  {
    dayOfWeek: 6, // Samedi
    isClosed: false,
    timeSlots: [
      { startTime: '10:00', endTime: '12:00', order: 0 },
      { startTime: '13:00', endTime: '17:00', order: 1 },
    ],
  },
];

async function updateAllSalonSchedules() {
  try {
    console.log('🚀 Début de la mise à jour des horaires pour tous les salons...\n');

    // Récupérer tous les salons
    const salons = await prisma.salon.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 Nombre de salons trouvés : ${salons.length}\n`);

    if (salons.length === 0) {
      console.log('⚠️  Aucun salon trouvé en base de données.');
      return;
    }

    let updatedCount = 0;

    for (const salon of salons) {
      console.log(`🏢 Mise à jour du salon : ${salon.name} (${salon.id})`);

      // Supprimer tous les anciens horaires du salon
      await prisma.schedule.deleteMany({
        where: { salonId: salon.id },
      });

      console.log(`  ✅ Anciens horaires supprimés`);

      // Créer les nouveaux horaires
      for (const schedule of SCHEDULES) {
        const createdSchedule = await prisma.schedule.create({
          data: {
            salonId: salon.id,
            dayOfWeek: schedule.dayOfWeek,
            isClosed: schedule.isClosed,
            timeSlots: {
              create: schedule.timeSlots,
            },
          },
        });

        const dayName = [
          'Dimanche',
          'Lundi',
          'Mardi',
          'Mercredi',
          'Jeudi',
          'Vendredi',
          'Samedi',
        ][schedule.dayOfWeek];

        if (schedule.isClosed) {
          console.log(`  📅 ${dayName} : Fermé`);
        } else {
          const slots = schedule.timeSlots
            .map((slot) => `${slot.startTime} - ${slot.endTime}`)
            .join(', ');
          console.log(`  📅 ${dayName} : ${slots}`);
        }
      }

      updatedCount++;
      console.log(`  ✅ Horaires mis à jour pour ${salon.name}\n`);
    }

    console.log('═'.repeat(60));
    console.log(`✅ Mise à jour terminée avec succès !`);
    console.log(`📊 Nombre de salons mis à jour : ${updatedCount}/${salons.length}`);
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des horaires :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateAllSalonSchedules()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error);
    process.exit(1);
  });
