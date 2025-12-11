import prisma from '../config/database'
import bcrypt from 'bcrypt'

interface CreateClientData {
  salonId?: string
  email: string
  password?: string
  firstName: string
  lastName: string
  phone: string
  notes?: string
  marketing?: boolean
}

interface UpdateClientData {
  firstName?: string
  lastName?: string
  phone?: string
  notes?: string
  marketing?: boolean
  password?: string
}

export async function createClient(data: CreateClientData) {
  // 1. Vérifier si un client avec le même email existe déjà
  const existingClient = await prisma.client.findUnique({
    where: { email: data.email }
  })

  if (existingClient) {
    throw new Error('Un client avec cet email existe déjà')
  }

  // 2. Si un salonId est fourni, vérifier que le salon existe
  if (data.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }
  }

  // 3. Hasher le mot de passe si fourni
  let hashedPassword = undefined
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10)
  }

  // 4. Créer le client
  const client = await prisma.client.create({
    data: {
      salonId: data.salonId,
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      notes: data.notes,
      marketing: data.marketing || false
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  // Retirer le mot de passe de la réponse
  const { password, ...clientWithoutPassword } = client

  return clientWithoutPassword
}

export async function getClientById(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  // Retirer le mot de passe de la réponse
  const { password, ...clientWithoutPassword } = client

  return clientWithoutPassword
}

export async function getClientByEmail(email: string) {
  const client = await prisma.client.findUnique({
    where: { email },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  // Retirer le mot de passe de la réponse
  const { password, ...clientWithoutPassword } = client

  return clientWithoutPassword
}

export async function getClientsByPhone(phone: string) {
  const clients = await prisma.client.findMany({
    where: { phone },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  // Retirer le mot de passe de la réponse
  return clients.map(client => {
    const { password, ...clientWithoutPassword } = client
    return clientWithoutPassword
  })
}

export async function getClientsBySalon(salonId: string) {
  const clients = await prisma.client.findMany({
    where: { salonId },
    include: {
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Retirer le mot de passe de la réponse
  return clients.map(client => {
    const { password, ...clientWithoutPassword } = client
    return clientWithoutPassword
  })
}

export async function getAllClients(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      skip,
      take: limit,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.client.count()
  ])

  // Retirer le mot de passe de la réponse
  const clientsWithoutPassword = clients.map(client => {
    const { password, ...clientWithoutPassword } = client
    return clientWithoutPassword
  })

  return {
    clients: clientsWithoutPassword,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function updateClient(clientId: string, data: UpdateClientData) {
  // 1. Vérifier que le client existe
  const existingClient = await prisma.client.findUnique({
    where: { id: clientId }
  })

  if (!existingClient) {
    throw new Error('Client introuvable')
  }

  // 2. Hasher le mot de passe si fourni
  let hashedPassword = undefined
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10)
  }

  // 3. Mettre à jour le client
  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      notes: data.notes,
      marketing: data.marketing,
      password: hashedPassword
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  // Retirer le mot de passe de la réponse
  const { password, ...clientWithoutPassword } = client

  return clientWithoutPassword
}

export async function deleteClient(clientId: string) {
  // 1. Vérifier que le client existe
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  // 2. Supprimer le client (les bookings ne seront pas supprimés à cause de la relation)
  await prisma.client.delete({
    where: { id: clientId }
  })

  return { message: 'Client supprimé avec succès' }
}

export async function searchClients(
  searchTerm: string,
  salonId?: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  // Séparer le terme de recherche en mots
  const words = searchTerm.trim().split(/\s+/)

  const orConditions: any[] = [
    { firstName: { contains: searchTerm, mode: 'insensitive' } },
    { lastName: { contains: searchTerm, mode: 'insensitive' } },
    { email: { contains: searchTerm, mode: 'insensitive' } },
    { phone: { contains: searchTerm } }
  ]

  // Si on a 2 mots ou plus, chercher prénom + nom
  if (words.length >= 2) {
    const firstName = words[0]
    const lastName = words.slice(1).join(' ')

    // Chercher "Prénom Nom" ou "Nom Prénom"
    orConditions.push({
      AND: [
        { firstName: { contains: firstName, mode: 'insensitive' } },
        { lastName: { contains: lastName, mode: 'insensitive' } }
      ]
    })
    orConditions.push({
      AND: [
        { lastName: { contains: firstName, mode: 'insensitive' } },
        { firstName: { contains: lastName, mode: 'insensitive' } }
      ]
    })
  }

  const whereClause: any = {
    OR: orConditions
  }

  if (salonId) {
    whereClause.salonId = salonId
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.client.count({ where: whereClause })
  ])

  // Retirer le mot de passe de la réponse
  const clientsWithoutPassword = clients.map(client => {
    const { password, ...clientWithoutPassword } = client
    return clientWithoutPassword
  })

  return {
    clients: clientsWithoutPassword,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}
