import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Nettoyage des données de test...\n')

  try {
    // Supprimer tous les bookings
    console.log('📅 Suppression des réservations...')
    const deletedBookings = await prisma.booking.deleteMany({})
    console.log(`✅ ${deletedBookings.count} réservation(s) supprimée(s)`)

    // Supprimer tous les clients
    console.log('\n👥 Suppression des clients...')
    const deletedClients = await prisma.client.deleteMany({})
    console.log(`✅ ${deletedClients.count} client(s) supprimé(s)`)

    console.log('\n✨ Nettoyage terminé avec succès!')
    console.log('💡 Vous pouvez maintenant lancer le seeding avec: npm run seed')
  } catch (error) {
    console.error('\n❌ Erreur pendant le nettoyage:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
