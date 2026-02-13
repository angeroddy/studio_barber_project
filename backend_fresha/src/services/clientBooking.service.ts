import prisma from '../config/database'

interface CreateClientBookingData {
  clientId: string  // ID du client authentifié
  salonId: string
  staffId?: string  // Optionnel - peut être "any"
  serviceId: string
  startTime: string  // ISO string
  notes?: string
}

interface CreateClientMultiServiceBookingData {
  clientId: string  // ID du client authentifié
  salonId: string
  startTime: string  // ISO string
  services: Array<{
    serviceId: string
    staffId?: string  // Optionnel - peut être "any"
  }>
  notes?: string
}

/**
 * Créer une réservation pour un client authentifié
 */
export async function createClientBooking(data: CreateClientBookingData) {
  // 1. Vérifier que le client existe
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  // 2. Vérifier que le client n'a pas déjà une réservation en cours
  const now = new Date()
  const existingActiveBooking = await prisma.booking.findFirst({
    where: {
      clientId: client.id,
      endTime: { gt: now }, // Réservation non passée
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
      `Vous avez déjà une réservation en cours chez ${existingActiveBooking.salon.name} le ${bookingDate} à ${bookingTime}. Veuillez annuler ou attendre que cette réservation soit passée avant d'en créer une nouvelle.`
    )
  }

  // 3. Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // 4. Vérifier que le service existe
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId }
  })

  if (!service) {
    throw new Error('Service introuvable')
  }

  // 5. Gérer le staffId
  let finalStaffId = data.staffId

  // Si staffId est "any" ou undefined, trouver un staff disponible
  if (!finalStaffId || finalStaffId === 'any') {
    const availableStaff = await prisma.staff.findFirst({
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
    // Vérifier que le staff existe
    const staff = await prisma.staff.findUnique({
      where: { id: finalStaffId }
    })

    if (!staff) {
      throw new Error('Professionnel introuvable')
    }
  }

  // 6. Calculer startTime et endTime en incluant les temps tampons du salon
  // Le client choisit une heure (ex: 10h00) qui correspond au début réel du service
  // Mais on doit bloquer du temps AVANT pour la préparation (bufferBefore)
  const clientSelectedTime = new Date(data.startTime)
  const actualStartTime = new Date(clientSelectedTime.getTime() - salon.bufferBefore * 60000)

  // Calculer la durée totale incluant les buffers
  const totalDuration = salon.bufferBefore + service.duration + salon.processingTime + salon.bufferAfter
  const endTime = new Date(actualStartTime.getTime() + totalDuration * 60000) // Convertir minutes en millisecondes

  // 7. Vérifier si le professionnel est disponible
  const startTime = actualStartTime

  // Vérifier les réservations simples
  const existingStaffBooking = await prisma.booking.findFirst({
    where: {
      staffId: finalStaffId,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
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
            { startTime: { gte: startTime } },
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
    throw new Error('Ce créneau n\'est pas disponible pour ce professionnel')
  }

  // Vérifier aussi les BookingService (pour les réservations multi-services)
  const existingBookingService = await prisma.bookingService.findFirst({
    where: {
      staffId: finalStaffId,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
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
            { startTime: { gte: startTime } },
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
    throw new Error('Ce créneau n\'est pas disponible pour ce professionnel')
  }

  // 8. Vérifier que le client n'a pas déjà un rendez-vous au même moment
  const existingClientBooking = await prisma.booking.findFirst({
    where: {
      clientId: client.id,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
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
            { startTime: { gte: startTime } },
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
    throw new Error('Vous avez déjà un rendez-vous prévu à cette heure')
  }

  // 9. Créer la réservation
  const booking = await prisma.booking.create({
    data: {
      salonId: data.salonId,
      clientId: client.id,
      staffId: finalStaffId,
      serviceId: data.serviceId,
      startTime, // Heure réelle incluant bufferBefore
      endTime, // Heure réelle incluant bufferAfter
      duration: totalDuration, // Durée totale incluant les buffers
      price: service.price,
      status: 'CONFIRMED',
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
}

/**
 * Obtenir les réservations d'un client
 */
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
 * Annuler une réservation (client authentifié seulement)
 */
export async function cancelClientBooking(bookingId: string, clientId: string) {
  // Vérifier que la réservation appartient au client
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      clientId
    }
  })

  if (!booking) {
    throw new Error('Réservation introuvable')
  }

  // Vérifier que la réservation n'est pas déjà annulée
  if (booking.status === 'CANCELED') {
    throw new Error('Cette réservation est déjà annulée')
  }

  // Vérifier que la réservation n'est pas déjà terminée
  if (booking.status === 'COMPLETED') {
    throw new Error('Impossible d\'annuler une réservation déjà terminée')
  }

  // Annuler la réservation
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
 * Créer une réservation multi-services pour un client authentifié
 */
export async function createClientMultiServiceBooking(data: CreateClientMultiServiceBookingData) {
  // 1. Validation de base
  if (!data.services || data.services.length === 0) {
    throw new Error('Au moins un service doit être fourni')
  }

  // Si un seul service, utiliser la fonction simple
  if (data.services.length === 1) {
    return createClientBooking({
      clientId: data.clientId,
      salonId: data.salonId,
      staffId: data.services[0].staffId,
      serviceId: data.services[0].serviceId,
      startTime: data.startTime,
      notes: data.notes
    })
  }

  // 2. Vérifier que le client existe
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  // 3. Vérifier que le client n'a pas déjà une réservation en cours
  const now = new Date()
  const existingActiveBooking = await prisma.booking.findFirst({
    where: {
      clientId: client.id,
      endTime: { gt: now }, // Réservation non passée
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
      `Vous avez déjà une réservation en cours chez ${existingActiveBooking.salon.name} le ${bookingDate} à ${bookingTime}. Veuillez annuler ou attendre que cette réservation soit passée avant d'en créer une nouvelle.`
    )
  }

  // 4. Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // 5. Récupérer tous les services en une seule requête
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

  // 6. Créer une map pour un accès rapide aux services
  const serviceMap = new Map(services.map(s => [s.id, s]))

  // 7. Calculer la durée totale et le prix total, et préparer les données des services
  // Pour les multi-services : appliquer les buffers au DÉBUT et à la FIN de la session complète
  let servicesDurationSum = 0 // Durée totale de tous les services (sans buffers)
  let totalPrice = 0
  const bookingServicesData = []

  // Le client choisit une heure visible (ex: 10h00)
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

    // Gérer le staffId
    let finalStaffId = serviceInput.staffId

    if (!finalStaffId || finalStaffId === 'any') {
      // Trouver un staff disponible
      const availableStaff = await prisma.staff.findFirst({
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
      // Vérifier que le staff existe
      const staff = await prisma.staff.findUnique({
        where: { id: finalStaffId }
      })

      if (!staff) {
        throw new Error(`Professionnel ${finalStaffId} introuvable`)
      }
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

  // 8. Vérifier la disponibilité de chaque staff pour son créneau
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

  // 9. Vérifier que le client n'a pas déjà un rendez-vous qui chevauche
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
    throw new Error('Vous avez déjà un rendez-vous prévu à cette heure')
  }

  // 10. Créer la réservation principale avec les BookingService en transaction
  // Calculer le vrai startTime (incluant bufferBefore)
  const actualStartTime = new Date(data.startTime)
  actualStartTime.setMinutes(actualStartTime.getMinutes() - salon.bufferBefore)

  const booking = await prisma.booking.create({
    data: {
      salonId: data.salonId,
      clientId: client.id,
      startTime: actualStartTime, // Heure réelle incluant bufferBefore
      endTime: finalEndTime, // Heure réelle incluant bufferAfter
      duration: totalDuration, // Durée totale incluant tous les buffers
      price: totalPrice,
      status: 'CONFIRMED',
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
}
