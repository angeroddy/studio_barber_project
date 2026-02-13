/**
 * Script simple pour migrer les données de Schedule vers TimeSlot
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateData() {
  console.log('🔄 Début de la migration des horaires...')

  try {
    // Migrer les données
    const result = await prisma.$executeRaw`
      INSERT INTO "TimeSlot" ("id", "scheduleId", "startTime", "endTime", "order")
      SELECT
        gen_random_uuid() as "id",
        "id" as "scheduleId",
        "openTime" as "startTime",
        "closeTime" as "endTime",
        0 as "order"
      FROM "Schedule"
      WHERE "isClosed" = false
        AND "openTime" IS NOT NULL
        AND "closeTime" IS NOT NULL
        AND "openTime" != ''
        AND "closeTime" != ''
    `

    console.log(`✅ ${result} horaires migrés vers TimeSlot`)

    // Vérifier les données
    const verification = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "TimeSlot"
    `

    console.log(`📊 Total de TimeSlots dans la base: ${verification[0].count}`)

    console.log('\n✅ Migration terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
