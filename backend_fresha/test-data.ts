import prisma from './src/config/database'

async function main() {
  console.log('\n📊 === DONNÉES DE LA BASE ===\n')

  // Salons
  const salons = await prisma.salon.findMany({
    select: { id: true, name: true }
  })
  console.log('🏢 Salons:')
  salons.forEach(s => console.log(`  - ${s.id}: ${s.name}`))

  // Services
  const services = await prisma.service.findMany({
    select: { id: true, name: true, duration: true, price: true, salonId: true }
  })
  console.log('\n💈 Services:')
  services.forEach(s => console.log(`  - ${s.id}: ${s.name} (${s.duration}min, ${s.price}€) [Salon: ${s.salonId}]`))

  // Staff
  const staff = await prisma.staff.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      salonId: true,
      isActive: true,
      schedules: true
    }
  })
  console.log('\n👨‍💼 Staff:')
  staff.forEach(s => {
    console.log(`  - ${s.id}: ${s.firstName} ${s.lastName} (${s.isActive ? 'Actif' : 'Inactif'}) [Salon: ${s.salonId}]`)
    if (s.schedules.length > 0) {
      console.log(`    Horaires:`)
      s.schedules.forEach((sch: any) => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        console.log(`      ${days[sch.dayOfWeek]}: ${sch.startTime} - ${sch.endTime}`)
      })
    } else {
      console.log(`    ⚠️ Pas d'horaires définis`)
    }
  })

  // Schedules du salon
  const schedules = await prisma.schedule.findMany({
    select: {
      salonId: true,
      dayOfWeek: true,
      openTime: true,
      closeTime: true,
      isClosed: true
    }
  })
  console.log('\n📅 Horaires des salons:')
  schedules.forEach(s => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    console.log(`  Salon ${s.salonId} - ${days[s.dayOfWeek]}: ${!s.isClosed ? `${s.openTime} - ${s.closeTime}` : 'FERMÉ'}`)
  })

  console.log('\n✅ Terminé!\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
