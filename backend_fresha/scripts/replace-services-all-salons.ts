import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type ServiceTemplate = {
  name: string
  duration: number
  price: number
  category: string
  description?: string
}

const TARGET_SERVICES: ServiceTemplate[] = [
  {
    name: 'Coupe + Barbe',
    duration: 30,
    price: 20,
    category: 'La formule'
  },
  {
    name: 'Coupe seule cheveux courts',
    duration: 20,
    price: 20,
    category: 'Coupes'
  },
  {
    name: 'Coupe seule cheveux long',
    duration: 30,
    price: 20,
    category: 'Coupes'
  },
  {
    name: 'Coupe enfant (-12ans)',
    duration: 20,
    price: 15,
    category: 'Coupes'
  },
  {
    name: 'Contour de tete',
    duration: 15,
    price: 10,
    category: 'Coupes',
    description: 'Les contours de tete sont seulement les contour du front, des pattes et de la nuque.'
  },
  {
    name: 'Barbe',
    duration: 15,
    price: 10,
    category: 'Barbe'
  }
]

async function replaceServicesForAllSalons() {
  const salons = await prisma.salon.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  if (salons.length === 0) {
    console.log('Aucun salon trouve, aucune prestation remplacee.')
    return
  }

  console.log(`Salons trouves: ${salons.length}`)

  for (const salon of salons) {
    await prisma.$transaction(async (tx) => {
      await tx.service.updateMany({
        where: {
          salonId: salon.id,
          isActive: true
        },
        data: {
          isActive: false
        }
      })

      for (const target of TARGET_SERVICES) {
        const candidates = await tx.service.findMany({
          where: {
            salonId: salon.id,
            name: target.name
          },
          orderBy: {
            updatedAt: 'desc'
          }
        })

        if (candidates.length > 0) {
          const selected = candidates[0]
          const duplicateIds = candidates.slice(1).map((item) => item.id)

          await tx.service.update({
            where: { id: selected.id },
            data: {
              name: target.name,
              duration: target.duration,
              price: target.price,
              category: target.category,
              description: target.description ?? null,
              isActive: true
            }
          })

          if (duplicateIds.length > 0) {
            await tx.service.updateMany({
              where: {
                id: {
                  in: duplicateIds
                }
              },
              data: {
                isActive: false
              }
            })
          }
        } else {
          await tx.service.create({
            data: {
              salonId: salon.id,
              name: target.name,
              duration: target.duration,
              price: target.price,
              category: target.category,
              description: target.description ?? null,
              isActive: true
            }
          })
        }
      }
    })

    const activeCount = await prisma.service.count({
      where: {
        salonId: salon.id,
        isActive: true
      }
    })

    console.log(`- ${salon.name}: ${activeCount} prestation(s) active(s)`)
  }
}

replaceServicesForAllSalons()
  .catch((error) => {
    console.error('Erreur remplacement prestations:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
