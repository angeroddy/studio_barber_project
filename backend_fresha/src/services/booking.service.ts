import prisma from '../config/database'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.util'
import {
  acquireBookingLocks,
  buildOverlapConditions,
  withSerializableBookingTransaction
} from '../utils/booking-concurrency.util'
import {
  findStaffConflictsForInterval,
  getAvailableSlotTimes,
  resolveAvailableStaffForVisibleStart,
  validateStaffIntervalConstraints
} from './availability.service'

interface CreateBooking {
  salonId: string
  staffId: string
  serviceId: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  startTime: Date | string
  endTime: Date | string
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
  notes?: string
}

interface UpdateBooking {
  id: string
  staffId?: string
  serviceId?: string
  startTime?: Date | string
  endTime?: Date | string
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
  notes?: string
  duration?: number
  price?: number
}

// ============= CREATE =============
export async function createBooking(data: CreateBooking) {
  return withSerializableBookingTransaction(async (tx) => {
    const [salon, service] = await Promise.all([
      tx.salon.findUnique({ where: { id: data.salonId } }),
      tx.service.findUnique({ where: { id: data.serviceId } })
    ])

    if (!salon) {
      throw new Error('Salon introuvable')
    }

    if (!service || service.salonId !== data.salonId || service.isActive === false) {
      throw new Error('Service introuvable')
    }

    const nameParts = data.clientName.trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Inconnu'

    let client = null
    if (data.clientEmail) {
      client = await tx.client.findUnique({
        where: { email: data.clientEmail }
      })
    }

    if (!client) {
      client = await tx.client.create({
        data: {
          salonId: data.salonId,
          firstName,
          lastName,
          email: data.clientEmail || `client-${Date.now()}@temporary.com`,
          phone: data.clientPhone || 'N/A',
          notes: data.notes
        }
      })
    }

    const clientSelectedTime = new Date(data.startTime)
    const resolvedStaffId = await resolveAvailableStaffForVisibleStart({
      salonId: data.salonId,
      staffId: data.staffId,
      serviceId: data.serviceId,
      visibleStartTime: clientSelectedTime,
      db: tx
    })

    const actualStartTime = new Date(clientSelectedTime.getTime() - salon.bufferBefore * 60000)
    const totalDuration = salon.bufferBefore + service.duration + salon.processingTime + salon.bufferAfter
    const endTime = new Date(actualStartTime.getTime() + totalDuration * 60000)

    await validateStaffIntervalConstraints({
      salonId: data.salonId,
      staffId: resolvedStaffId,
      startTime: actualStartTime,
      endTime,
      db: tx
    })

    await acquireBookingLocks(tx, [`staff:${resolvedStaffId}`, `client:${client.id}`])
    const overlapConditions = buildOverlapConditions(actualStartTime, endTime)

    const [existingStaffBooking, existingBookingService, existingClientBooking] = await Promise.all([
      tx.booking.findFirst({
        where: {
          staffId: resolvedStaffId,
          OR: overlapConditions,
          status: {
            notIn: ['CANCELED', 'NO_SHOW']
          }
        }
      }),
      tx.bookingService.findFirst({
        where: {
          staffId: resolvedStaffId,
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
      throw new Error('Ce professionnel a déjà un rendez-vous prévu à cette heure')
    }

    if (existingClientBooking) {
      throw new Error('Ce client a déjà un rendez-vous prévu à cette heure')
    }

    const booking = await tx.booking.create({
      data: {
        salonId: data.salonId,
        clientId: client.id,
        staffId: resolvedStaffId,
        serviceId: service.id,
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
            avatar: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    })

    return booking
  })
}

// ============= READ (un seul) =============
export async function getBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true
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
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
              avatar: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  })

  if (!booking) {
    throw new Error('Réservation introuvable')
  }

  return booking
}

// ============= READ (liste par salon) =============
export async function getBookingsBySalon(
  salonId: string,
  filters?: {
    startDate?: Date | string
    endDate?: Date | string
    staffId?: string
    status?: string
    page?: number
    limit?: number
    lite?: boolean
  }
) {
  const where: any = {
    salonId: salonId
  }

  if (filters?.startDate && filters?.endDate) {
    where.startTime = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  if (filters?.staffId) {
    where.staffId = filters.staffId
  }

  if (filters?.status) {
    where.status = filters.status
  }

  // Pagination
  const { page, limit, skip, take } = getPaginationParams(filters?.page, filters?.limit)

  if (filters?.lite) {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          salonId: true,
          staffId: true,
          serviceId: true,
          clientId: true,
          startTime: true,
          endTime: true,
          duration: true,
          price: true,
          status: true,
          notes: true,
          isMultiService: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take
      }),
      prisma.booking.count({ where })
    ])

    return createPaginatedResponse(bookings, total, page, limit)
  }

  // Requête avec pagination
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
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
            avatar: true
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
                avatar: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      skip,
      take
    }),
    prisma.booking.count({ where })
  ])

  return createPaginatedResponse(bookings, total, page, limit)
}

// ============= READ (liste par staff) =============
export async function getBookingsByStaff(
  staffId: string,
  filters?: {
    startDate?: Date | string
    endDate?: Date | string
    status?: string
    page?: number
    limit?: number
    lite?: boolean
  }
) {
  const where: any = {
    OR: [
      // Réservations simples où le staff est directement assigné
      { staffId: staffId },
      // Réservations multi-services où le staff est dans un des services
      {
        bookingServices: {
          some: {
            staffId: staffId
          }
        }
      }
    ]
  }

  if (filters?.startDate && filters?.endDate) {
    where.startTime = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  if (filters?.status) {
    where.status = filters.status
  }

  // Pagination
  const { page, limit, skip, take } = getPaginationParams(filters?.page, filters?.limit)

  if (filters?.lite) {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          salonId: true,
          staffId: true,
          serviceId: true,
          clientId: true,
          startTime: true,
          endTime: true,
          duration: true,
          price: true,
          status: true,
          notes: true,
          isMultiService: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take
      }),
      prisma.booking.count({ where })
    ])

    return createPaginatedResponse(bookings, total, page, limit)
  }

  // Requête avec pagination
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
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
            name: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
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
                avatar: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      skip,
      take
    }),
    prisma.booking.count({ where })
  ])

  return createPaginatedResponse(bookings, total, page, limit)
}

// ============= UPDATE =============
export async function updateBooking(data: UpdateBooking) {
  // 1. Vérifier que la réservation existe
  const existingBooking = await prisma.booking.findUnique({
    where: { id: data.id }
  })

  if (!existingBooking) {
    throw new Error('Réservation introuvable')
  }

  // 2. Si on change le staffId, vérifier qu'il existe
  if (data.staffId && data.staffId !== existingBooking.staffId) {
    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId }
    })

    if (!staff) {
      throw new Error('Membre du personnel introuvable')
    }
  }

  // 3. Si on change le serviceId, vérifier qu'il existe
  if (data.serviceId && data.serviceId !== existingBooking.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId }
    })

    if (!service) {
      throw new Error('Service introuvable')
    }
  }

  const salon = await prisma.salon.findUnique({
    where: { id: existingBooking.salonId },
    select: {
      bufferBefore: true,
      bufferAfter: true,
      processingTime: true
    }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // 4. Préparer les données de mise à jour
  const { id, ...updateData } = data

  // Convertir les dates si nécessaire
  const finalUpdateData: any = { ...updateData }
  if (updateData.startTime) {
    finalUpdateData.startTime = new Date(updateData.startTime)
  }
  if (updateData.endTime) {
    finalUpdateData.endTime = new Date(updateData.endTime)
  }

  const targetServiceId = updateData.serviceId || existingBooking.serviceId
  if (targetServiceId) {
    const targetService = await prisma.service.findUnique({
      where: { id: targetServiceId },
      select: {
        id: true,
        salonId: true,
        duration: true,
        price: true,
        isActive: true
      }
    })

    if (!targetService || targetService.salonId !== existingBooking.salonId || targetService.isActive === false) {
      throw new Error('Service introuvable')
    }

    const recomputedDuration =
      salon.bufferBefore + targetService.duration + salon.processingTime + salon.bufferAfter
    finalUpdateData.duration = recomputedDuration
    finalUpdateData.price = targetService.price

    if (finalUpdateData.startTime && !finalUpdateData.endTime) {
      finalUpdateData.endTime = new Date(finalUpdateData.startTime.getTime() + recomputedDuration * 60000)
    }
  }

  // 5. Vérifier les conflits si on modifie le staff, la date ou l'heure
  const isTimeChanged = updateData.startTime || updateData.endTime
  const isStaffChanged = updateData.staffId && updateData.staffId !== existingBooking.staffId
  const isServiceChanged = updateData.serviceId && updateData.serviceId !== existingBooking.serviceId

  if (isTimeChanged || isStaffChanged || isServiceChanged) {
    const checkStartTime = finalUpdateData.startTime || existingBooking.startTime
    const checkEndTime = finalUpdateData.endTime || existingBooking.endTime
    const checkStaffId = finalUpdateData.staffId || existingBooking.staffId

    await validateStaffIntervalConstraints({
      salonId: existingBooking.salonId,
      staffId: checkStaffId,
      startTime: new Date(checkStartTime),
      endTime: new Date(checkEndTime)
    })

    // Vérifier la disponibilité du professionnel (réservations simples)
    const existingStaffBooking = await prisma.booking.findFirst({
      where: {
        id: { not: id }, // Exclure le booking actuel
        staffId: checkStaffId,
        OR: [
          {
            AND: [
              { startTime: { lte: checkStartTime } },
              { endTime: { gt: checkStartTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: checkEndTime } },
              { endTime: { gte: checkEndTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: checkStartTime } },
              { endTime: { lte: checkEndTime } }
            ]
          }
        ],
        status: {
          notIn: ['CANCELED', 'NO_SHOW']
        }
      }
    })

    if (existingStaffBooking) {
      throw new Error('Ce professionnel a déjà un rendez-vous prévu à cette heure')
    }

    // Vérifier aussi les BookingService (pour les réservations multi-services)
    const existingBookingService = await prisma.bookingService.findFirst({
      where: {
        bookingId: { not: id }, // Exclure le booking actuel
        staffId: checkStaffId,
        OR: [
          {
            AND: [
              { startTime: { lte: checkStartTime } },
              { endTime: { gt: checkStartTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: checkEndTime } },
              { endTime: { gte: checkEndTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: checkStartTime } },
              { endTime: { lte: checkEndTime } }
            ]
          }
        ],
        booking: {
          status: {
            notIn: ['CANCELED', 'NO_SHOW']
          }
        }
      }
    })

    if (existingBookingService) {
      throw new Error('Ce professionnel a déjà un rendez-vous prévu à cette heure')
    }

    // Vérifier que le client n'a pas déjà un rendez-vous au même moment
    const existingClientBooking = await prisma.booking.findFirst({
      where: {
        id: { not: id }, // Exclure le booking actuel
        clientId: existingBooking.clientId,
        OR: [
          {
            AND: [
              { startTime: { lte: checkStartTime } },
              { endTime: { gt: checkStartTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: checkEndTime } },
              { endTime: { gte: checkEndTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: checkStartTime } },
              { endTime: { lte: checkEndTime } }
            ]
          }
        ],
        status: {
          notIn: ['CANCELED', 'NO_SHOW']
        }
      }
    })

    if (existingClientBooking) {
      throw new Error('Ce client a déjà un rendez-vous prévu à cette heure')
    }
  }

  // 6. Mettre à jour la réservation
  const updatedBooking = await prisma.booking.update({
    where: { id: id },
    data: finalUpdateData,
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      service: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true
        }
      }
    }
  })

  return updatedBooking
}

// ============= DELETE =============
export async function deleteBooking(bookingId: string) {
  // 1. Vérifier que la réservation existe
  const existingBooking = await prisma.booking.findUnique({
    where: { id: bookingId }
  })

  if (!existingBooking) {
    throw new Error('Réservation introuvable')
  }

  // 2. Supprimer la réservation
  await prisma.booking.delete({
    where: { id: bookingId }
  })

  return { message: 'Réservation supprimée avec succès' }
}

// ============= UPDATE STATUS =============
export async function updateBookingStatus(
  bookingId: string,
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: status },
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
          name: true
        }
      }
    }
  })

  return booking
}

// ============= CHECK AVAILABILITY =============
export async function checkAvailability(
  staffId: string,
  startTime: Date | string,
  endTime: Date | string,
  excludeBookingId?: string
) {
  const conflicts = await findStaffConflictsForInterval({
    staffId,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    excludeBookingId
  })
  const isAvailable =
    conflicts.bookings.length === 0 &&
    conflicts.bookingServices.length === 0 &&
    !conflicts.absence

  return {
    available: isAvailable,
    conflictingBookings: conflicts.bookings.length > 0 ? conflicts.bookings : undefined,
    conflictingBookingServices:
      conflicts.bookingServices.length > 0 ? conflicts.bookingServices : undefined,
    absence: conflicts.absence
  }
}

// ============= GET AVAILABLE SLOTS =============
export async function getAvailableSlots(
  salonId: string,
  staffId: string,
  serviceId: string,
  date: Date | string,
  customDuration?: number // Durée personnalisée en minutes (pour multi-services)
) {
  return getAvailableSlotTimes({
    salonId,
    staffId,
    serviceId,
    date,
    customDuration
  })
}

// Fonction helper pour générer les créneaux pour une plage horaire
// Génère les créneaux disponibles dans l'intersection entre les horaires du staff et du salon
function generateSlotsForSchedule(
  staffStart: string,
  staffEnd: string,
  serviceDuration: number, // Durée totale incluant les temps tampons
  existingBookings: any[],
  salonTimeSlotStart: string,
  salonTimeSlotEnd: string,
  bufferBefore: number = 0 // Temps tampon avant le service
): string[] {
  const slots: string[] = []
  const slotInterval = 20 // Creneaux toutes les 20 minutes

  // Convertir les heures en minutes depuis minuit
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Calculer l'intersection entre les horaires du staff et la plage horaire du salon
  const startMinutes = Math.max(toMinutes(staffStart), toMinutes(salonTimeSlotStart))
  const endMinutes = Math.min(toMinutes(staffEnd), toMinutes(salonTimeSlotEnd))

  // Générer tous les créneaux possibles
  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotInterval) {
    // currentMinutes = début du bloc (incluant bufferBefore)
    // currentMinutes + bufferBefore = début du service (ce que le client voit)
    // currentMinutes + serviceDuration = fin du bloc (incluant bufferAfter)
    const slotEndMinutes = currentMinutes + serviceDuration

    // Vérifier que le service se termine avant la fin du shift
    if (slotEndMinutes > endMinutes) {
      break
    }

    // L'heure affichée au client est le début réel du service (après bufferBefore)
    const clientVisibleStartTime = minutesToTime(currentMinutes + bufferBefore)

    // Pour la vérification des conflits, on utilise le bloc complet
    const slotStartTime = minutesToTime(currentMinutes)
    const slotEndTime = minutesToTime(slotEndMinutes)

    // Vérifier si ce créneau chevauche une réservation existante
    const isOccupied = existingBookings.some(booking => {
      const bookingStart = toMinutes(
        new Date(booking.startTime).toTimeString().slice(0, 5)
      )
      const bookingEnd = toMinutes(
        new Date(booking.endTime).toTimeString().slice(0, 5)
      )

      // Vérifier le chevauchement
      return (
        (currentMinutes >= bookingStart && currentMinutes < bookingEnd) ||
        (slotEndMinutes > bookingStart && slotEndMinutes <= bookingEnd) ||
        (currentMinutes <= bookingStart && slotEndMinutes >= bookingEnd)
      )
    })

    if (!isOccupied) {
      // Retourner l'heure visible pour le client (après le bufferBefore)
      slots.push(clientVisibleStartTime)
    }
  }

  return slots
}

// Fonction helper pour convertir les minutes en HH:MM
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// ============= MULTI-SERVICES BOOKING =============

interface BookingServiceInput {
  serviceId: string
  staffId?: string // Optionnel - si non fourni, assignation automatique
}

interface CreateMultiServiceBooking {
  salonId: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  startTime: Date | string
  services: BookingServiceInput[] // Liste des services à réserver
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
 * Créer une réservation avec plusieurs services
 * Les services sont exécutés séquentiellement dans l'ordre fourni
 */
export async function createMultiServiceBooking(data: CreateMultiServiceBooking) {
  if (!data.services || data.services.length === 0) {
    throw new Error('Au moins un service doit être fourni')
  }

  if (data.services.length === 1) {
    return createBooking({
      salonId: data.salonId,
      staffId: data.services[0].staffId || '',
      serviceId: data.services[0].serviceId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      startTime: data.startTime,
      endTime: data.startTime,
      notes: data.notes,
      status: data.status
    })
  }

  return withSerializableBookingTransaction(async (tx) => {
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

      let staffId = serviceInput.staffId
      if (!staffId || staffId === 'any') {
        const candidateStaff = await tx.staff.findMany({
          where: {
            salonId: data.salonId,
            isActive: true
          },
          select: {
            id: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        })

        for (const candidate of candidateStaff) {
          try {
            await validateStaffIntervalConstraints({
              salonId: data.salonId,
              staffId: candidate.id,
              startTime: serviceStartTime,
              endTime: serviceEndTime,
              db: tx
            })

            const conflicts = await findStaffConflictsForInterval({
              staffId: candidate.id,
              startTime: serviceStartTime,
              endTime: serviceEndTime,
              db: tx
            })

            if (conflicts.bookings.length === 0 && conflicts.bookingServices.length === 0 && !conflicts.absence) {
              staffId = candidate.id
              break
            }
          } catch {
            continue
          }
        }

        if (!staffId || staffId === 'any') {
          throw new Error('Aucun professionnel disponible pour ce service')
        }
      }

      const staff = await tx.staff.findUnique({
        where: { id: staffId }
      })

      if (!staff || staff.salonId !== data.salonId || staff.isActive === false) {
        throw new Error(`Professionnel ${staffId} introuvable`)
      }

      await validateStaffIntervalConstraints({
        salonId: data.salonId,
        staffId: staff.id,
        startTime: serviceStartTime,
        endTime: serviceEndTime,
        db: tx
      })

      bookingServicesData.push({
        serviceId: service.id,
        staffId: staff.id,
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

      await validateStaffIntervalConstraints({
        salonId: data.salonId,
        staffId: lastService.staffId,
        startTime: lastService.startTime,
        endTime: lastService.endTime,
        db: tx
      })
    }

    const finalEndTime = new Date(currentStartTime)
    finalEndTime.setMinutes(finalEndTime.getMinutes() + salon.bufferAfter)
    const totalDuration =
      salon.bufferBefore + servicesDurationSum + salon.processingTime * data.services.length + salon.bufferAfter

    const actualStartTime = new Date(data.startTime)
    actualStartTime.setMinutes(actualStartTime.getMinutes() - salon.bufferBefore)

    const nameParts = data.clientName.trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Inconnu'

    let client = null
    if (data.clientEmail) {
      client = await tx.client.findUnique({
        where: { email: data.clientEmail }
      })
    }

    if (!client) {
      client = await tx.client.create({
        data: {
          salonId: data.salonId,
          firstName,
          lastName,
          email: data.clientEmail || `client-${Date.now()}@temporary.com`,
          phone: data.clientPhone || 'N/A',
          notes: data.notes
        }
      })
    }

    const lockKeys = [`client:${client.id}`, ...bookingServicesData.map((bs) => `staff:${bs.staffId}`)]
    await acquireBookingLocks(tx, lockKeys)

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
          `${staff?.firstName} ${staff?.lastName} a déjà un rendez-vous entre ${serviceData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${serviceData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
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
          `${staff?.firstName} ${staff?.lastName} a déjà un rendez-vous entre ${serviceData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${serviceData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
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
      throw new Error('Ce client a déjà un rendez-vous prévu à cette heure')
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
                avatar: true
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
