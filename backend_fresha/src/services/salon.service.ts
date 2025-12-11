import prisma from '../config/database'

interface CreateSalonData {
  name: string
  address: string
  city: string
  zipCode: string
  phone: string
  email: string
  ownerId: string
}

interface UpdateSalonData {
  name?: string
  address?: string
  city?: string
  zipCode?: string
  phone?: string
  email?: string
}

// Fonction pour générer un slug unique à partir du nom du salon
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
}

// Fonction pour générer un slug unique en ajoutant un suffixe si nécessaire
async function generateUniqueSlug(name: string): Promise<string> {
  let slug = generateSlug(name)
  let counter = 1
  let uniqueSlug = slug

  // Vérifier si le slug existe déjà
  while (await prisma.salon.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`
    counter++
  }

  return uniqueSlug
}

export async function createSalon(data: CreateSalonData) {
  // 1. Vérifier si le propriétaire existe
  const owner = await prisma.owner.findUnique({
    where: { id: data.ownerId }
  })

  if (!owner) {
    throw new Error('Propriétaire introuvable')
  }

  // 2. Vérifier si un salon avec le même email existe déjà
  const existingSalon = await prisma.salon.findFirst({
    where: { email: data.email }
  })

  if (existingSalon) {
    throw new Error('Un salon avec cet email existe déjà')
  }

  // 3. Générer un slug unique
  const slug = await generateUniqueSlug(data.name)

  // 4. Créer le salon
  const salon = await prisma.salon.create({
    data: {
      name: data.name,
      slug,
      address: data.address,
      city: data.city,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email,
      ownerId: data.ownerId
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  return salon
}

export async function getSalonById(salonId: string) {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      _count: {
        select: {
          services: true,
          staff: true,
          clients: true,
          bookings: true
        }
      }
    }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  return salon
}

export async function getSalonsByOwner(ownerId: string) {
  const salons = await prisma.salon.findMany({
    where: { ownerId },
    include: {
      _count: {
        select: {
          services: true,
          staff: true,
          clients: true,
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return salons
}

export async function getSalonBySlug(slug: string) {
  const salon = await prisma.salon.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      _count: {
        select: {
          services: true,
          staff: true,
          clients: true,
          bookings: true
        }
      }
    }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  return salon
}

export async function updateSalon(salonId: string, ownerId: string, data: UpdateSalonData) {
  // 1. Vérifier que le salon existe et appartient au propriétaire
  const existingSalon = await prisma.salon.findUnique({
    where: { id: salonId }
  })

  if (!existingSalon) {
    throw new Error('Salon introuvable')
  }

  if (existingSalon.ownerId !== ownerId) {
    throw new Error('Vous n\'êtes pas autorisé à modifier ce salon')
  }

  // 2. Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
  if (data.email && data.email !== existingSalon.email) {
    const salonWithEmail = await prisma.salon.findFirst({
      where: {
        email: data.email,
        id: { not: salonId }
      }
    })

    if (salonWithEmail) {
      throw new Error('Un salon avec cet email existe déjà')
    }
  }

  // 3. Si le nom est modifié, générer un nouveau slug
  let slug = existingSalon.slug
  if (data.name && data.name !== existingSalon.name) {
    slug = await generateUniqueSlug(data.name)
  }

  // 4. Mettre à jour le salon
  const salon = await prisma.salon.update({
    where: { id: salonId },
    data: {
      ...data,
      slug: data.name ? slug : existingSalon.slug
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  return salon
}

export async function deleteSalon(salonId: string, ownerId: string) {
  // 1. Vérifier que le salon existe et appartient au propriétaire
  const salon = await prisma.salon.findUnique({
    where: { id: salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  if (salon.ownerId !== ownerId) {
    throw new Error('Vous n\'êtes pas autorisé à supprimer ce salon')
  }

  // 2. Supprimer le salon (les relations en cascade seront gérées par Prisma)
  await prisma.salon.delete({
    where: { id: salonId }
  })

  return { message: 'Salon supprimé avec succès' }
}
