import { PrismaClient, BookingStatus } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { hashPassword } from '../src/utils/hash.util'

const prisma = new PrismaClient()

// Configuration
const NUMBER_OF_CLIENTS = 20
const BOOKINGS_PER_DAY = 8 // Nombre de rendez-vous par jour de la semaine

async function main() {
  console.log('🌱 Début du seeding...\n')

  try {
    // 1. Vérifier qu'il existe au moins un salon
    console.log('📍 Vérification des salons...')
    const salons = await prisma.salon.findMany({
      include: {
        services: true,
        staff: true,
      },
    })

    if (salons.length === 0) {
      throw new Error(
        '❌ Aucun salon trouvé. Veuillez d\'abord créer un salon avec des services et du staff.'
      )
    }

    const salon = salons[0]
    console.log(`✅ Salon trouvé: ${salon.name} (${salon.id})`)

    // Vérifier les services
    if (salon.services.length === 0) {
      throw new Error(
        `❌ Le salon "${salon.name}" n'a pas de services. Veuillez d'abord créer des services.`
      )
    }
    console.log(`✅ ${salon.services.length} service(s) disponible(s)`)

    // Vérifier le staff
    if (salon.staff.length === 0) {
      throw new Error(
        `❌ Le salon "${salon.name}" n'a pas de staff. Veuillez d'abord créer du staff.`
      )
    }
    console.log(`✅ ${salon.staff.length} membre(s) du staff disponible(s)\n`)

    // 2. Créer des clients
    console.log(`👥 Création de ${NUMBER_OF_CLIENTS} clients...`)
    const clients = []

    for (let i = 0; i < NUMBER_OF_CLIENTS; i++) {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const email = faker.internet.email({ firstName, lastName }).toLowerCase()
      const password = await hashPassword('password123')

      try {
        const client = await prisma.client.create({
          data: {
            salonId: salon.id,
            email,
            password,
            firstName,
            lastName,
            phone: faker.phone.number('+33 # ## ## ## ##'),
            notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
            marketing: Math.random() > 0.5,
          },
        })

        clients.push(client)
        console.log(
          `  ✓ Client créé: ${client.firstName} ${client.lastName} (${client.email})`
        )
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠ Email déjà existant: ${email}, skip...`)
        } else {
          throw error
        }
      }
    }

    console.log(`\n✅ ${clients.length} clients créés avec succès!\n`)

    if (clients.length === 0) {
      console.log('⚠ Aucun client créé, arrêt du seeding des réservations.')
      return
    }

    // 3. Créer des réservations pour cette semaine uniquement
    console.log(`📅 Création de réservations pour cette semaine...`)
    const bookings = []
    const statuses: BookingStatus[] = [
      'PENDING',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELED',
      'NO_SHOW',
    ]

    // Calculer le début et la fin de la semaine courante
    const today = new Date()
    const currentDay = today.getDay() // 0 = Dimanche, 1 = Lundi, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay // Aller au lundi

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() + mondayOffset)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Dimanche
    endOfWeek.setHours(23, 59, 59, 999)

    console.log(`📆 Semaine: ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`)

    // Filtrer uniquement le staff et les services actifs
    const activeStaff = salon.staff.filter(s => s.isActive)
    const activeServices = salon.services.filter(s => s.isActive)

    if (activeStaff.length === 0) {
      console.log('⚠ Aucun staff actif, impossible de créer des réservations')
      return
    }

    if (activeServices.length === 0) {
      console.log('⚠ Aucun service actif, impossible de créer des réservations')
      return
    }

    console.log(`✅ ${activeStaff.length} coiffeur(s) actif(s)`)
    console.log(`✅ ${activeServices.length} service(s) actif(s)\n`)

    // Créer un tracking des horaires occupés par staff
    const staffSchedule: Map<string, Set<string>> = new Map()
    activeStaff.forEach(s => staffSchedule.set(s.id, new Set()))

    // Générer des rendez-vous pour chaque jour de la semaine (Lundi à Samedi)
    for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + dayOffset)

      const dayName = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' })
      console.log(`\n📅 ${dayName} ${currentDate.toLocaleDateString()}`)

      // Créer BOOKINGS_PER_DAY rendez-vous pour ce jour
      for (let i = 0; i < BOOKINGS_PER_DAY; i++) {
        // Sélectionner aléatoirement un client, service et staff
        const client = clients[Math.floor(Math.random() * clients.length)]
        const service = activeServices[Math.floor(Math.random() * activeServices.length)]
        let staff = activeStaff[Math.floor(Math.random() * activeStaff.length)]

        // Trouver un créneau horaire disponible pour ce staff
        let attempts = 0
        let startTime: Date
        let endTime: Date
        let isAvailable = false

        while (!isAvailable && attempts < 50) {
          // Définir une heure entre 8h et 18h
          const hour = Math.floor(Math.random() * 10) + 8
          const minute = Math.random() > 0.5 ? 0 : 30

          startTime = new Date(currentDate)
          startTime.setHours(hour, minute, 0, 0)

          // Calculer endTime en fonction de la durée du service
          endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + service.duration)

          // Vérifier si le créneau est disponible pour ce staff
          const timeSlotKey = `${startTime.getTime()}`
          const staffBookings = staffSchedule.get(staff.id)!

          // Vérifier les conflits
          let hasConflict = false
          for (const bookedSlot of staffBookings) {
            const [bookedStart, bookedEnd] = bookedSlot.split('-').map(Number)
            const currentStart = startTime.getTime()
            const currentEnd = endTime.getTime()

            // Vérifier chevauchement
            if (
              (currentStart >= bookedStart && currentStart < bookedEnd) ||
              (currentEnd > bookedStart && currentEnd <= bookedEnd) ||
              (currentStart <= bookedStart && currentEnd >= bookedEnd)
            ) {
              hasConflict = true
              break
            }
          }

          if (!hasConflict) {
            isAvailable = true
            // Marquer ce créneau comme occupé
            staffBookings.add(`${startTime.getTime()}-${endTime.getTime()}`)
          } else {
            // Essayer un autre staff
            staff = activeStaff[Math.floor(Math.random() * activeStaff.length)]
          }

          attempts++
        }

        if (!isAvailable) {
          console.log(`  ⚠ Impossible de trouver un créneau disponible, skip...`)
          continue
        }

        // Déterminer le statut en fonction de la date
        let status: BookingStatus
        const now = new Date()

        if (startTime! < now) {
          // Rendez-vous passé
          const rand = Math.random()
          if (rand < 0.7) status = 'COMPLETED'
          else if (rand < 0.9) status = 'CANCELED'
          else status = 'NO_SHOW'
        } else {
          // Rendez-vous futur
          const rand = Math.random()
          if (rand < 0.8) status = 'CONFIRMED'
          else status = 'PENDING'
        }

        try {
          const booking = await prisma.booking.create({
            data: {
              salonId: salon.id,
              clientId: client.id,
              staffId: staff.id,
              serviceId: service.id,
              startTime: startTime!,
              endTime: endTime!,
              duration: service.duration,
              status,
              price: service.price,
              paid: status === 'COMPLETED' ? Math.random() > 0.2 : false,
              notes: Math.random() > 0.8 ? faker.lorem.sentence() : null,
              internalNotes: Math.random() > 0.9 ? faker.lorem.sentence() : null,
              reminderSent: Math.random() > 0.7,
              reminderSentAt: Math.random() > 0.7 ? new Date() : null,
              canceledAt: status === 'CANCELED' ? new Date() : null,
            },
          })

          bookings.push(booking)
          console.log(
            `  ✓ ${startTime!.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${client.firstName} ${client.lastName} - ${service.name} - ${staff.firstName} ${staff.lastName} - ${status}`
          )
        } catch (error) {
          console.log(`  ⚠ Erreur lors de la création d'une réservation:`, error)
        }
      }
    }

    console.log(`\n✅ ${bookings.length} réservations créées avec succès!\n`)

    // 4. Afficher un résumé
    console.log('📊 RÉSUMÉ DU SEEDING')
    console.log('═══════════════════════════════════════')
    console.log(`Salon: ${salon.name}`)
    console.log(`Clients créés: ${clients.length}`)
    console.log(`Réservations créées: ${bookings.length}`)
    console.log('\nRépartition des statuts:')

    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })

    console.log('\n✨ Seeding terminé avec succès!')
  } catch (error) {
    console.error('\n❌ Erreur pendant le seeding:', error)
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
