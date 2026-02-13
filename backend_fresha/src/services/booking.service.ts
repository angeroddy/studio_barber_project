import prisma from '../config/database'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.util'

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
  // 1-3. Vérifier en parallèle que salon, staff et service existent (optimisation)
  const [salon, staff, service] = await Promise.all([
    prisma.salon.findUnique({ where: { id: data.salonId } }),
    prisma.staff.findUnique({ where: { id: data.staffId } }),
    prisma.service.findUnique({ where: { id: data.serviceId } })
  ])

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  if (!staff) {
    throw new Error('Membre du personnel introuvable')
  }

  if (!service) {
    throw new Error('Service introuvable')
  }

  // 4. Créer ou trouver le client
  // Extraire le prénom et nom du clientName (format: "Prénom Nom")
  const nameParts = data.clientName.trim().split(' ')
  const firstName = nameParts[0] || 'Client'
  const lastName = nameParts.slice(1).join(' ') || 'Inconnu'

  // Chercher si un client existe déjà avec cet email ou téléphone
  let client = null
  if (data.clientEmail) {
    client = await prisma.client.findUnique({
      where: { email: data.clientEmail }
    })
  }

  // Si pas trouvé, créer un nouveau client
  if (!client) {
    client = await prisma.client.create({
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

  // 5. Calculer startTime et endTime en incluant les temps tampons du salon
  // Le client choisit une heure APRÈS bufferBefore (ex: 10h05)
  // On doit créer un booking qui commence AVANT (ex: 10h00) pour inclure le buffer
  const clientSelectedTime = new Date(data.startTime)
  const actualStartTime = new Date(clientSelectedTime.getTime() - salon.bufferBefore * 60000)

  // Calculer la durée totale incluant les buffers
  const totalDuration = salon.bufferBefore + service.duration + salon.processingTime + salon.bufferAfter
  const endTime = new Date(actualStartTime.getTime() + totalDuration * 60000) // Convertir minutes en millisecondes

  // 6. Vérifier les réservations simples
  const existingStaffBooking = await prisma.booking.findFirst({
    where: {
      staffId: data.staffId,
      OR: [
        {
          AND: [
            { startTime: { lte: actualStartTime } },
            { endTime: { gt: actualStartTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: actualStartTime } },
            { endTime: { lte: endTime } }
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
      staffId: data.staffId,
      OR: [
        {
          AND: [
            { startTime: { lte: actualStartTime } },
            { endTime: { gt: actualStartTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: actualStartTime } },
            { endTime: { lte: endTime } }
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
      clientId: client.id,
      OR: [
        {
          AND: [
            { startTime: { lte: actualStartTime } },
            { endTime: { gt: actualStartTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: actualStartTime } },
            { endTime: { lte: endTime } }
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

  // 7. Créer la réservation
  const booking = await prisma.booking.create({
    data: {
      salonId: data.salonId,
      clientId: client.id,
      staffId: data.staffId,
      serviceId: data.serviceId,
      startTime: actualStartTime, // Heure réelle incluant bufferBefore
      endTime: endTime, // endTime calculé avec les buffers
      duration: totalDuration, // Durée totale incluant les buffers
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

  // 5. Vérifier les conflits si on modifie le staff, la date ou l'heure
  const isTimeChanged = updateData.startTime || updateData.endTime
  const isStaffChanged = updateData.staffId && updateData.staffId !== existingBooking.staffId

  if (isTimeChanged || isStaffChanged) {
    const checkStartTime = finalUpdateData.startTime || existingBooking.startTime
    const checkEndTime = finalUpdateData.endTime || existingBooking.endTime
    const checkStaffId = finalUpdateData.staffId || existingBooking.staffId

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
  const where: any = {
    staffId: staffId,
    status: {
      in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
    },
    OR: [
      {
        // Nouveau créneau commence pendant une réservation existante
        AND: [
          { startTime: { lte: new Date(startTime) } },
          { endTime: { gt: new Date(startTime) } }
        ]
      },
      {
        // Nouveau créneau se termine pendant une réservation existante
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gte: new Date(endTime) } }
        ]
      },
      {
        // Nouveau créneau englobe complètement une réservation existante
        AND: [
          { startTime: { gte: new Date(startTime) } },
          { endTime: { lte: new Date(endTime) } }
        ]
      }
    ]
  }

  if (excludeBookingId) {
    where.id = { not: excludeBookingId }
  }

  const conflictingBookings = await prisma.booking.findMany({
    where,
    include: {
      service: {
        select: {
          name: true
        }
      }
    }
  })

  // Vérifier aussi les absences approuvées
  const approvedAbsence = await prisma.absence.findFirst({
    where: {
      staffId: staffId,
      status: 'APPROVED',
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(endTime) } },
            { endDate: { gte: new Date(startTime) } }
          ]
        }
      ]
    }
  })

  const isAvailable = conflictingBookings.length === 0 && !approvedAbsence

  return {
    available: isAvailable,
    conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined,
    absence: approvedAbsence ? {
      type: approvedAbsence.type,
      startDate: approvedAbsence.startDate,
      endDate: approvedAbsence.endDate,
      reason: approvedAbsence.reason
    } : undefined
  }
}

// ============= GET AVAILABLE SLOTS =============
export async function getAvailableSlots(
  salonId: string,
  staffId: string,
  serviceId: string,
  date: Date,
  customDuration?: number // Durée personnalisée en minutes (pour multi-services)
) {
  // 1. Récupérer le service pour connaître sa durée
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      duration: true,
      salonId: true
    }
  })

  if (!service) {
    throw new Error('Service introuvable')
  }

  // 2. Récupérer les temps tampons du SALON (configuration globale)
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: {
      bufferBefore: true,
      bufferAfter: true,
      processingTime: true
    }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // Utiliser la durée personnalisée si fournie, sinon la durée du service
  const baseDuration = customDuration || service.duration // en minutes

  // Calculer la durée TOTALE incluant les temps tampons du SALON
  // bufferBefore : temps bloqué AVANT le service (configuration salon)
  // baseDuration : durée principale du service
  // processingTime : temps de traitement supplémentaire (configuration salon)
  // bufferAfter : temps bloqué APRÈS le service (configuration salon)
  const totalBlockedDuration = salon.bufferBefore + baseDuration + salon.processingTime + salon.bufferAfter

  // Pour la génération des créneaux, on utilise la durée totale bloquée
  const serviceDuration = baseDuration // Ce que le client voit
  const effectiveDuration = totalBlockedDuration // Ce qui est réellement bloqué

  // 2. Récupérer le jour de la semaine (0=Dimanche, 1=Lundi, ...)
  // Utiliser getUTCDay() car la date reçue est interprétée en UTC
  const dayOfWeek = date.getUTCDay()

  // 3. Vérifier si c'est un jour de fermeture exceptionnel
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
  const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))

  const closedDay = await prisma.closedDay.findFirst({
    where: {
      salonId: salonId,
      date: {
        gte: startOfDay,
        lt: endOfDay
      }
    }
  })

  if (closedDay) {
    return [] // Salon fermé ce jour-là
  }

  // 4. Récupérer les horaires du salon pour ce jour avec les plages horaires
  const salonSchedule = await prisma.schedule.findFirst({
    where: {
      salonId: salonId,
      dayOfWeek: dayOfWeek
    },
    include: {
      timeSlots: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  })

  if (!salonSchedule || salonSchedule.isClosed) {
    return [] // Salon fermé ce jour de la semaine
  }

  // Vérifier qu'il y a au moins une plage horaire
  if (!salonSchedule.timeSlots || salonSchedule.timeSlots.length === 0) {
    return [] // Pas d'horaires définis pour ce jour
  }

  // 5. Gérer le cas "N'importe quel professionnel"
  let staffMembers: any[] = []

  if (staffId === 'any') {
    // Récupérer tous les staff actifs du salon
    staffMembers = await prisma.staff.findMany({
      where: {
        salonId: salonId,
        isActive: true
      },
      include: {
        schedules: {
          where: {
            dayOfWeek: dayOfWeek
          }
        }
      }
    })
  } else {
    // Récupérer le staff spécifique
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        schedules: {
          where: {
            dayOfWeek: dayOfWeek
          }
        }
      }
    })

    if (!staff || !staff.isActive) {
      return []
    }

    staffMembers = [staff]
  }

  // 5.1. Filtrer les coiffeurs en absence approuvée ce jour-là
  const approvedAbsences = await prisma.absence.findMany({
    where: {
      staffId: {
        in: staffMembers.map(s => s.id)
      },
      status: 'APPROVED',
      OR: [
        {
          AND: [
            { startDate: { lte: endOfDay } },
            { endDate: { gte: startOfDay } }
          ]
        }
      ]
    }
  })

  // Créer un Set des IDs des coiffeurs en absence
  const staffIdsOnAbsence = new Set(approvedAbsences.map(a => a.staffId))

  // Filtrer les coiffeurs disponibles (pas en absence)
  staffMembers = staffMembers.filter(staff => !staffIdsOnAbsence.has(staff.id))

  // 6. Récupérer TOUTES les réservations pour TOUS les staff members en UNE SEULE requête (fix N+1)
  // Inclure à la fois les bookings simples ET les bookingServices pour les multi-services
  const [simpleBookings, bookingServices] = await Promise.all([
    // Réservations simples (où staffId est défini)
    prisma.booking.findMany({
      where: {
        staffId: {
          in: staffMembers.map(s => s.id)
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        },
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    }),
    // BookingServices pour les réservations multi-services
    prisma.bookingService.findMany({
      where: {
        staffId: {
          in: staffMembers.map(s => s.id)
        },
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        },
        booking: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        }
      },
      include: {
        booking: true
      }
    })
  ])

  // Grouper les bookings par staffId en mémoire pour accès rapide
  const bookingsByStaffId = new Map<string, any[]>()

  // Ajouter les réservations simples
  for (const booking of simpleBookings) {
    if (!bookingsByStaffId.has(booking.staffId!)) {
      bookingsByStaffId.set(booking.staffId!, [])
    }
    bookingsByStaffId.get(booking.staffId!)!.push(booking)
  }

  // Ajouter les services des réservations multi-services
  for (const bookingService of bookingServices) {
    if (!bookingsByStaffId.has(bookingService.staffId)) {
      bookingsByStaffId.set(bookingService.staffId, [])
    }
    // Transformer BookingService en format compatible avec Booking pour la vérification
    bookingsByStaffId.get(bookingService.staffId)!.push({
      id: bookingService.id,
      staffId: bookingService.staffId,
      startTime: bookingService.startTime,
      endTime: bookingService.endTime,
      status: bookingService.booking.status
    })
  }

  // 7. Calculer tous les créneaux disponibles
  const allSlots = new Set<string>()

  for (const staff of staffMembers) {
    // Si le staff n'a pas d'horaires ce jour-là, passer au suivant
    if (!staff.schedules || staff.schedules.length === 0) {
      continue
    }

    // Récupérer les réservations de ce staff depuis le Map (pas de requête DB)
    const existingBookings = bookingsByStaffId.get(staff.id) || []

    // Pour chaque plage horaire du salon (ex: 10h-12h, 14h-18h)
    for (const salonTimeSlot of salonSchedule.timeSlots) {
      // Pour chaque plage horaire du staff
      for (const staffSchedule of staff.schedules) {
        // Générer les créneaux pour l'intersection entre les horaires du salon et du staff
        // On passe effectiveDuration pour bloquer le temps tampon complet
        const slots = generateSlotsForSchedule(
          staffSchedule.startTime,
          staffSchedule.endTime,
          effectiveDuration, // Durée totale incluant les temps tampons
          existingBookings,
          salonTimeSlot.startTime,
          salonTimeSlot.endTime,
          salon.bufferBefore // Pour calculer l'heure affichée au client (config salon)
        )

        // Ajouter les créneaux au Set (évite les doublons)
        slots.forEach(slot => allSlots.add(slot))
      }
    }
  }

  // 7. Convertir le Set en tableau et trier
  return Array.from(allSlots).sort()
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
  const slotInterval = 15 // Créneaux toutes les 15 minutes

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

/**
 * Créer une réservation avec plusieurs services
 * Les services sont exécutés séquentiellement dans l'ordre fourni
 */
export async function createMultiServiceBooking(data: CreateMultiServiceBooking) {
  // 1. Validation de base
  if (!data.services || data.services.length === 0) {
    throw new Error('Au moins un service doit être fourni')
  }

  if (data.services.length === 1) {
    // Si un seul service, utiliser la fonction classique
    return createBooking({
      salonId: data.salonId,
      staffId: data.services[0].staffId || '',
      serviceId: data.services[0].serviceId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      startTime: data.startTime,
      endTime: data.startTime, // Sera calculé dans createBooking
      notes: data.notes,
      status: data.status
    })
  }

  // 2. Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // 3. Récupérer tous les services en une seule requête
  const serviceIds = data.services.map(s => s.serviceId)
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      salonId: data.salonId,
      isActive: true
    }
  })

  if (services.length !== data.services.length) {
    throw new Error('Un ou plusieurs services sont introuvables ou inactifs')
  }

  // 4. Créer une map pour un accès rapide aux services
  const serviceMap = new Map(services.map(s => [s.id, s]))

  // 5. Calculer la durée totale et le prix total
  // Pour les multi-services : appliquer les buffers au DÉBUT et à la FIN de la session complète
  let servicesDurationSum = 0 // Durée totale de tous les services (sans buffers)
  let totalPrice = 0

  const bookingServicesData = []
  // Le client choisit une heure visible (ex: 10h15)
  // Mais le système doit bloquer du temps AVANT pour la préparation (bufferBefore)
  // Donc le vrai début du bloc est : heure choisie - bufferBefore
  let currentStartTime = new Date(data.startTime)

  // Pour le PREMIER service seulement, soustraire bufferBefore pour bloquer le temps de préparation
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

    // Calculer les heures de début et fin pour ce service
    // Pour le premier service : startTime inclut déjà bufferBefore (soustrait au-dessus)
    // Pour les services suivants : on commence là où le précédent s'est terminé
    const serviceStartTime = new Date(currentStartTime)
    const serviceEndTime = new Date(currentStartTime.getTime() + serviceDuration * 60000)

    // Assigner un staff si non fourni
    let staffId = serviceInput.staffId

    if (!staffId || staffId === 'any') {
      // Trouver un staff disponible pour ce service
      const availableStaff = await prisma.staff.findFirst({
        where: {
          salonId: data.salonId,
          isActive: true
        }
      })

      if (!availableStaff) {
        throw new Error('Aucun professionnel disponible pour ce service')
      }

      staffId = availableStaff.id
    }

    // Vérifier que le staff existe
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    })

    if (!staff) {
      throw new Error(`Professionnel ${staffId} introuvable`)
    }

    bookingServicesData.push({
      serviceId: service.id,
      staffId: staff.id,
      duration: serviceDuration,
      price: servicePrice,
      order: i + 1,
      startTime: serviceStartTime,
      endTime: serviceEndTime
    })

    // Préparer le début du prochain service
    currentStartTime = serviceEndTime
  }

  // Ajouter le buffer APRÈS à la fin du dernier service
  if (bookingServicesData.length > 0) {
    const lastService = bookingServicesData[bookingServicesData.length - 1]
    const endTimeWithBuffer = new Date(lastService.endTime.getTime() + salon.bufferAfter * 60000)
    lastService.endTime = endTimeWithBuffer
  }

  const finalEndTime = new Date(currentStartTime)
  finalEndTime.setMinutes(finalEndTime.getMinutes() + salon.bufferAfter)

  // Calculer la durée totale incluant tous les buffers
  const totalDuration = salon.bufferBefore + servicesDurationSum + (salon.processingTime * data.services.length) + salon.bufferAfter

  // 6. Vérifier la disponibilité de chaque staff pour son créneau
  for (const serviceData of bookingServicesData) {
    // Vérifier les réservations simples
    const existingBooking = await prisma.booking.findFirst({
      where: {
        staffId: serviceData.staffId,
        OR: [
          {
            AND: [
              { startTime: { lte: serviceData.startTime } },
              { endTime: { gt: serviceData.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: serviceData.endTime } },
              { endTime: { gte: serviceData.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: serviceData.startTime } },
              { endTime: { lte: serviceData.endTime } }
            ]
          }
        ],
        status: {
          notIn: ['CANCELED', 'NO_SHOW']
        }
      }
    })

    if (existingBooking) {
      const staff = await prisma.staff.findUnique({ where: { id: serviceData.staffId } })
      throw new Error(
        `${staff?.firstName} ${staff?.lastName} a déjà un rendez-vous entre ${serviceData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${serviceData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      )
    }

    // Vérifier aussi les BookingService (pour les réservations multi-services)
    const existingBookingService = await prisma.bookingService.findFirst({
      where: {
        staffId: serviceData.staffId,
        OR: [
          {
            AND: [
              { startTime: { lte: serviceData.startTime } },
              { endTime: { gt: serviceData.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: serviceData.endTime } },
              { endTime: { gte: serviceData.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: serviceData.startTime } },
              { endTime: { lte: serviceData.endTime } }
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
      const staff = await prisma.staff.findUnique({ where: { id: serviceData.staffId } })
      throw new Error(
        `${staff?.firstName} ${staff?.lastName} a déjà un rendez-vous entre ${serviceData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${serviceData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      )
    }
  }

  // 7. Créer ou trouver le client
  const nameParts = data.clientName.trim().split(' ')
  const firstName = nameParts[0] || 'Client'
  const lastName = nameParts.slice(1).join(' ') || 'Inconnu'

  let client = null
  if (data.clientEmail) {
    client = await prisma.client.findUnique({
      where: { email: data.clientEmail }
    })
  }

  if (!client) {
    client = await prisma.client.create({
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

  // 8. Vérifier que le client n'a pas déjà un rendez-vous qui chevauche
  const existingClientBooking = await prisma.booking.findFirst({
    where: {
      clientId: client.id,
      OR: [
        {
          AND: [
            { startTime: { lte: new Date(data.startTime) } },
            { endTime: { gt: new Date(data.startTime) } }
          ]
        },
        {
          AND: [
            { startTime: { lt: finalEndTime } },
            { endTime: { gte: finalEndTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: new Date(data.startTime) } },
            { endTime: { lte: finalEndTime } }
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

  // 9. Créer la réservation principale avec les BookingService en transaction
  // Calculer le vrai startTime (incluant bufferBefore)
  const actualStartTime = new Date(data.startTime)
  actualStartTime.setMinutes(actualStartTime.getMinutes() - salon.bufferBefore)

  const booking = await prisma.booking.create({
    data: {
      salonId: data.salonId,
      clientId: client.id,
      startTime: actualStartTime, // Heure réelle incluant bufferBefore
      endTime: finalEndTime,
      duration: totalDuration,
      price: totalPrice,
      status: data.status || 'CONFIRMED',
      notes: data.notes,
      isMultiService: true,
      bookingServices: {
        create: bookingServicesData.map(bs => ({
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
}
