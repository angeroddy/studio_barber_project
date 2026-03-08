/**
 * Script de migration des horaires Schedule vers TimeSlots
 * Ce script doit être exécuté AVANT d'appliquer les changements de schéma
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSchedulesToTimeSlots() {
  console.log('🔄 Début de la migration des horaires vers TimeSlots...')

  try {
    // Récupérer tous les schedules existants avec openTime et closeTime
    const schedules = await prisma.$queryRaw<any[]>`
      SELECT id, "salonId", "dayOfWeek", "openTime", "closeTime", "isClosed"
      FROM "Schedule"
      WHERE "isClosed" = false
        AND "openTime" IS NOT NULL
        AND "closeTime" IS NOT NULL
        AND "openTime" != ''
        AND "closeTime" != ''
    `

    console.log(`📊 Trouvé ${schedules.length} horaires à migrer`)

    let migrated = 0

    // Pour chaque schedule, créer un TimeSlot
    for (const schedule of schedules) {
      // Vérifier si la table TimeSlot existe déjà
      const tableExists = await prisma.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'TimeSlot'
        )
      `

      if (!tableExists[0].exists) {
        console.log('⚠️  La table TimeSlot n\'existe pas encore.')
        console.log('   Veuillez d\'abord créer la table avec: npx prisma db push --skip-generate')
        return
      }

      // Créer le TimeSlot correspondant
      await prisma.$executeRaw`
        INSERT INTO "TimeSlot" ("id", "scheduleId", "startTime", "endTime", "order")
        VALUES (gen_random_uuid(), ${schedule.id}, ${schedule.openTime}, ${schedule.closeTime}, 0)
        ON CONFLICT DO NOTHING
      `

      migrated++
      console.log(`  ✓ Migré: ${schedule.dayOfWeek} - ${schedule.openTime} à ${schedule.closeTime}`)
    }

    console.log(`\n✅ Migration terminée: ${migrated}/${schedules.length} horaires migrés`)
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Vérifiez les données migrées dans la table TimeSlot')
    console.log('   2. Une fois validé, vous pouvez supprimer les colonnes openTime et closeTime manuellement')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
migrateSchedulesToTimeSlots()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })
