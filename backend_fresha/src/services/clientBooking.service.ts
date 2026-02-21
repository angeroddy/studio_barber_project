import prisma from '../config/database'
import {
  acquireBookingLocks,
  buildOverlapConditions,
  withSerializableBookingTransaction
} from '../utils/booking-concurrency.util'

interface CreateClientBookingData {
  clientId: string  // ID du client authentifiÃ©
  salonId: string
  staffId?: string  // Optionnel - peut Ãªtre "any"
  serviceId: string
  startTime: string  // ISO string
  notes?: string
  status?: 'PENDING' | 'CONFIRMED'
}

interface CreateClientMultiServiceBookingData {
  clientId: string  // ID du client authentifiÃ©
  salonId: string
  startTime: string  // ISO string
  services: Array<{
    serviceId: string
    staffId?: string  // Optionnel - peut Ãªtre "any"
  }>
  notes?: string
  status?: 'PENDING' | 'CONFIRMED'
}

interface ServiceForMultiBooking {
  id: string
  duration: number
  price: unknown
}

interface PreparedBookingServiceData {
  serviceId: string
  staffId: string
  duration: number
  price: number
  order: number
  startTime: Date
  endTime: Date
}

/**
 * CrÃ©er une rÃ©servation pour un client authentifiÃ©
 */
export async function createClientBooking(data: CreateClientBookingData) {
  return withSerializableBookingTransaction(async (tx) => {
    const client = await tx.client.findUnique({
      where: { id: data.clientId }
    })

    if (!client) {
      throw new Error('Client introuvable')
    }

    const salon = await tx.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }

    const service = await tx.service.findUnique({
      where: { id: data.serviceId }
    })

    if (!service || service.salonId !== data.salonId || service.isActive === false) {
      throw new Error('Service introuvable')
    }

    let finalStaffId = data.staffId
    if (!finalStaffId || finalStaffId === 'any') {
      const availableStaff = await tx.staff.findFirst({
        where: {
          salonId: data.salonId,
          isActive: true
        }
      })

      if (!availableStaff) {
        throw new Error('Aucun professionnel disponible')
      }

      finalStaffId = availableStaff.id
    } else {
      const staff = await tx.staff.findUnique({
        where: { id: finalStaffId }
      })

      if (!staff || staff.salonId !== data.salonId || staff.isActive === false) {
        throw new Error('Professionnel introuvable')
      }
    }

    const clientSelectedTime = new Date(data.startTime)
    const actualStartTime = new Date(clientSelectedTime.getTime() - salon.bufferBefore * 60000)
    const totalDuration = salon.bufferBefore + service.duration + salon.processingTime + salon.bufferAfter
    const endTime = new Date(actualStartTime.getTime() + totalDuration * 60000)

    await acquireBookingLocks(tx, [`client:${client.id}`, `staff:${finalStaffId}`])

    const now = new Date()
    const existingActiveBooking = await tx.booking.findFirst({
      where: {
        clientId: client.id,
        endTime: { gt: now },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      include: {
        salon: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingActiveBooking) {
      const bookingDate = new Date(existingActiveBooking.startTime).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      const bookingTime = new Date(existingActiveBooking.startTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      throw new Error(
        `Vous avez dÃ©jÃ  une rÃ©servation en cours chez ${existingActiveBooking.salon.name} le ${bookingDate} Ã  ${bookingTime}. Veuillez annuler ou attendre que cette rÃ©servation soit passÃ©e avant d'en crÃ©er une nouvelle.`
      )
    }

    const overlapConditions = buildOverlapConditions(actualStartTime, endTime)

    const [existingStaffBooking, existingBookingService, existingClientBooking] = await Promise.all([
      tx.booking.findFirst({
        where: {
          staffId: finalStaffId,
          OR: overlapConditions,
          status: {
            notIn: ['CANCELED', 'NO_SHOW']
          }
        }
      }),
      tx.bookingService.findFirst({
        where: {
          staffId: finalStaffId,
          OR: overlapConditions,
          booking: {
            status: {
              notIn: ['CANCELED', 'NO_SHOW']
            }
          }
        }
      }),
      tx.booking.findFirst({
        where: {
          clientId: client.id,
          OR: overlapConditions,
          status: {
            notIn: ['CANCELED', 'NO_SHOW']
          }
        }
      })
    ])

    if (existingStaffBooking || existingBookingService) {
      throw new Error("Ce crÃ©neau n'est pas disponible pour ce professionnel")
    }

    if (existingClientBooking) {
      throw new Error('Vous avez dÃ©jÃ  un rendez-vous prÃ©vu Ã  cette heure')
    }

    const booking = await tx.booking.create({
      data: {
        salonId: data.salonId,
        clientId: client.id,
        staffId: finalStaffId,
        serviceId: data.serviceId,
        startTime: actualStartTime,
        endTime,
        duration: totalDuration,
        price: service.price,
        status: data.status || 'CONFIRMED',
        notes: data.notes
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialties: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: true
          }
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true
          }
        }
      }
    })

    return booking
  })
}

export async function getClientBookings(clientId: string) {
  const bookings = await prisma.booking.findMany({
    where: { clientId },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      service: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true
        }
      },
      salon: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true
        }
      },
      bookingServices: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              category: true
            }
          },
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    orderBy: {
      startTime: 'desc'
    }
  })

  return bookings
}

/**
 * Annuler une rÃ©servation (client authentifiÃ© seulement)
 */
export async function cancelClientBooking(bookingId: string, clientId: string) {
  // VÃ©rifier que la rÃ©servation appartient au client
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      clientId
    }
  })

  if (!booking) {
    throw new Error('RÃ©servation introuvable')
  }

  // VÃ©rifier que la rÃ©servation n'est pas dÃ©jÃ  annulÃ©e
  if (booking.status === 'CANCELED') {
    throw new Error('Cette rÃ©servation est dÃ©jÃ  annulÃ©e')
  }

  // VÃ©rifier que la rÃ©servation n'est pas dÃ©jÃ  terminÃ©e
  if (booking.status === 'COMPLETED') {
    throw new Error('Impossible d\'annuler une rÃ©servation dÃ©jÃ  terminÃ©e')
  }

  // Annuler la rÃ©servation
  const canceledBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date()
    },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      service: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true
        }
      },
      salon: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true
        }
      }
    }
  })

  return canceledBooking
}

/**
 * CrÃ©er une rÃ©servation multi-services pour un client authentifiÃ©
 */
export async function createClientMultiServiceBooking(data: CreateClientMultiServiceBookingData) {
  if (!data.services || data.services.length === 0) {
    throw new Error('Au moins un service doit Ãªtre fourni')
  }

  if (data.services.length === 1) {
    return createClientBooking({
      clientId: data.clientId,
      salonId: data.salonId,
      staffId: data.services[0].staffId,
      serviceId: data.services[0].serviceId,
      startTime: data.startTime,
      notes: data.notes,
      status: data.status
    })
  }

  return withSerializableBookingTransaction(async (tx) => {
    const client = await tx.client.findUnique({
      where: { id: data.clientId }
    })

    if (!client) {
      throw new Error('Client introuvable')
    }

    const salon = await tx.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }

    const serviceIds = data.services.map((s) => s.serviceId)
    const services = await tx.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId: data.salonId,
        isActive: true
      }
    })

    if (services.length !== data.services.length) {
      throw new Error('Un ou plusieurs services sont introuvables ou inactifs')
    }

    const serviceMap = new Map<string, ServiceForMultiBooking>(
      services.map((s: ServiceForMultiBooking) => [s.id, s])
    )

    let servicesDurationSum = 0
    let totalPrice = 0
    const bookingServicesData: PreparedBookingServiceData[] = []

    let currentStartTime = new Date(data.startTime)
    if (salon.bufferBefore > 0) {
      currentStartTime = new Date(currentStartTime.getTime() - salon.bufferBefore * 60000)
    }

    for (let i = 0; i < data.services.length; i++) {
      const serviceInput = data.services[i]
      const service = serviceMap.get(serviceInput.serviceId)

      if (!service) {
        throw new Error(`Service ${serviceInput.serviceId} introuvable`)
      }

      const serviceDuration = service.duration + salon.processingTime
      const servicePrice = Number(service.price)

      servicesDurationSum += service.duration
      totalPrice += servicePrice

      const serviceStartTime = new Date(currentStartTime)
      const serviceEndTime = new Date(currentStartTime.getTime() + serviceDuration * 60000)

      let finalStaffId = serviceInput.staffId
      if (!finalStaffId || finalStaffId === 'any') {
        const availableStaff = await tx.staff.findFirst({
          where: {
            salonId: data.salonId,
            isActive: true
          }
        })

        if (!availableStaff) {
          throw new Error('Aucun professionnel disponible')
        }

        finalStaffId = availableStaff.id
      } else {
        const staff = await tx.staff.findUnique({
          where: { id: finalStaffId }
        })

        if (!staff || staff.salonId !== data.salonId || staff.isActive === false) {
          throw new Error(`Professionnel ${finalStaffId} introuvable`)
        }
      }
      if (!finalStaffId || finalStaffId === 'any') {
        throw new Error('Aucun professionnel disponible')
      }

      bookingServicesData.push({
        serviceId: service.id,
        staffId: finalStaffId,
        duration: serviceDuration,
        price: servicePrice,
        order: i + 1,
        startTime: serviceStartTime,
        endTime: serviceEndTime
      })

      currentStartTime = serviceEndTime
    }

    if (bookingServicesData.length > 0) {
      const lastService = bookingServicesData[bookingServicesData.length - 1]
      const endTimeWithBuffer = new Date(lastService.endTime.getTime() + salon.bufferAfter * 60000)
      lastService.endTime = endTimeWithBuffer
    }

    const finalEndTime = new Date(currentStartTime)
    finalEndTime.setMinutes(finalEndTime.getMinutes() + salon.bufferAfter)
    const totalDuration =
      salon.bufferBefore + servicesDurationSum + salon.processingTime * data.services.length + salon.bufferAfter

    const actualStartTime = new Date(data.startTime)
    actualStartTime.setMinutes(actualStartTime.getMinutes() - salon.bufferBefore)

    const lockKeys = [`client:${client.id}`, ...bookingServicesData.map((bs) => `staff:${bs.staffId}`)]
    await acquireBookingLocks(tx, lockKeys)

    const now = new Date()
    const existingActiveBooking = await tx.booking.findFirst({
      where: {
        clientId: client.id,
        endTime: { gt: now },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      include: {
        salon: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingActiveBooking) {
      const bookingDate = new Date(existingActiveBooking.startTime).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      const bookingTime = new Date(existingActiveBooking.startTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      throw new Error(
        `Vous avez dÃ©jÃ  une rÃ©servation en cours chez ${existingActiveBooking.salon.name} le ${bookingDate} Ã  ${bookingTime}. Veuillez annuler ou attendre que cette rÃ©servation soit passÃ©e avant d'en crÃ©er une nouvelle.`
      )
    }

    for (const serviceData of bookingServicesData) {
      const overlapConditions = buildOverlapConditions(serviceData.startTime, serviceData.endTime)

      const existingBooking = await tx.booking.findFirst({
        where: {
          staffId: serviceData.staffId,
          OR: overlapConditions,
          status: {
            notIn: ['CANCELED', 'NO_SHOW']
          }
        }
      })

      if (existingBooking) {
        const staff = await tx.staff.findUnique({ where: { id: serviceData.staffId } })
        throw new Error(
          `${staff?.firstName} ${staff?.lastName} a dÃ©jÃ  un rendez-vous entre ${serviceData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${serviceData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        )
      }

      const existingBookingService = await tx.bookingService.findFirst({
        where: {
          staffId: serviceData.staffId,
          OR: overlapConditions,
          booking: {
            status: {
              notIn: ['CANCELED', 'NO_SHOW']
            }
          }
        }
      })

      if (existingBookingService) {
        const staff = await tx.staff.findUnique({ where: { id: serviceData.staffId } })
        throw new Error(
          `${staff?.firstName} ${staff?.lastName} a dÃ©jÃ  un rendez-vous entre ${serviceData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${serviceData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        )
      }
    }

    const sessionOverlapConditions = buildOverlapConditions(actualStartTime, finalEndTime)
    const existingClientBooking = await tx.booking.findFirst({
      where: {
        clientId: client.id,
        OR: sessionOverlapConditions,
        status: {
          notIn: ['CANCELED', 'NO_SHOW']
        }
      }
    })

    if (existingClientBooking) {
      throw new Error('Vous avez dÃ©jÃ  un rendez-vous prÃ©vu Ã  cette heure')
    }

    const booking = await tx.booking.create({
      data: {
        salonId: data.salonId,
        clientId: client.id,
        startTime: actualStartTime,
        endTime: finalEndTime,
        duration: totalDuration,
        price: totalPrice,
        status: data.status || 'CONFIRMED',
        notes: data.notes,
        isMultiService: true,
        bookingServices: {
          create: bookingServicesData.map((bs) => ({
            serviceId: bs.serviceId,
            staffId: bs.staffId,
            duration: bs.duration,
            price: bs.price,
            order: bs.order,
            startTime: bs.startTime,
            endTime: bs.endTime
          }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true
          }
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                category: true
              }
            },
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialties: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return booking
  })
}
