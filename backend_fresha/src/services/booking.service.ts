import prisma from '../config/database'

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
  // 1. Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // 2. Vérifier que le staff existe
  const staff = await prisma.staff.findUnique({
    where: { id: data.staffId }
  })

  if (!staff) {
    throw new Error('Membre du personnel introuvable')
  }

  // 3. Vérifier que le service existe
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId }
  })

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

  // 5. Créer la réservation
  const booking = await prisma.booking.create({
    data: {
      salonId: data.salonId,
      clientId: client.id,
      staffId: data.staffId,
      serviceId: data.serviceId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      duration: service.duration,
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

  const bookings = await prisma.booking.findMany({
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
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  })

  return bookings
}

// ============= READ (liste par staff) =============
export async function getBookingsByStaff(
  staffId: string,
  filters?: {
    startDate?: Date | string
    endDate?: Date | string
    status?: string
  }
) {
  const where: any = {
    staffId: staffId
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

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      salon: {
        select: {
          id: true,
          name: true
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
    },
    orderBy: {
      startTime: 'asc'
    }
  })

  return bookings
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

  // 5. Mettre à jour la réservation
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

  return {
    available: conflictingBookings.length === 0,
    conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined
  }
}
