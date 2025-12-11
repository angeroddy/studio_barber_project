import prisma from '../config/database'

interface CreateService {
  salonId: string
  name: string
  description?: string
  duration: number // en minutes
  price: number // ou Decimal si vous utilisez une bibliothèque comme decimal.js
  category: string
  isActive?: boolean
  color?: string // Pour calendrier (#FF5733)
}

interface UpdateService {
  id: string // Nécessaire pour identifier le service à modifier
  salonId?: string
  name?: string
  description?: string
  duration?: number
  price?: number
  category?: string
  isActive?: boolean
  color?: string
}

interface DeleteService {
  id: string
  salonId?: string // Optionnel, pour vérification de propriété
}


// ============= CREATE =============
export async function createService(data: CreateService) {
  // 1. Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })
  
  if (!salon) {
    throw new Error('Salon introuvable')
  }
  
  // 2. Créer le service
  const service = await prisma.service.create({
    data: {
      salonId: data.salonId,
      name: data.name,
      description: data.description,
      duration: data.duration,
      price: data.price,
      category: data.category,
      isActive: data.isActive ?? true,
      color: data.color
    },
    select: {
      id: true,
      salonId: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      category: true,
      isActive: true,
      color: true,
      createdAt: true,
      updatedAt: true
    }
  })
  
  return service
}

// ============= READ (un seul) =============
export async function getService(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
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
  
  if (!service) {
    throw new Error('Service introuvable')
  }
  
  return service
}

// ============= READ (liste par salon) =============
export async function getServicesBySalon(salonId: string, activeOnly: boolean = false) {
  const services = await prisma.service.findMany({
    where: {
      salonId: salonId,
      ...(activeOnly && { isActive: true })
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
  
  return services
}

// ============= READ (liste par catégorie) =============
export async function getServicesByCategory(salonId: string, category: string) {
  const services = await prisma.service.findMany({
    where: {
      salonId: salonId,
      category: category,
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  return services
}

// ============= UPDATE =============
export async function updateService(data: UpdateService) {
  // 1. Vérifier que le service existe
  const existingService = await prisma.service.findUnique({
    where: { id: data.id }
  })
  
  if (!existingService) {
    throw new Error('Service introuvable')
  }
  
  // 2. Si on change le salonId, vérifier que le nouveau salon existe
  if (data.salonId && data.salonId !== existingService.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId }
    })
    
    if (!salon) {
      throw new Error('Salon introuvable')
    }
  }
  
  // 3. Mettre à jour le service
  const { id, ...updateData } = data
  
  const updatedService = await prisma.service.update({
    where: { id: id },
    data: updateData,
    select: {
      id: true,
      salonId: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      category: true,
      isActive: true,
      color: true,
      createdAt: true,
      updatedAt: true
    }
  })
  
  return updatedService
}

// ============= DELETE =============
export async function deleteService(serviceId: string, salonId?: string) {
  // 1. Vérifier que le service existe
  const existingService = await prisma.service.findUnique({
    where: { id: serviceId }
  })
  
  if (!existingService) {
    throw new Error('Service introuvable')
  }
  
  // 2. Vérifier que le service appartient au salon (sécurité)
  if (salonId && existingService.salonId !== salonId) {
    throw new Error('Vous n\'avez pas la permission de supprimer ce service')
  }
  
  // 3. Vérifier s'il y a des réservations liées
  const bookingsCount = await prisma.booking.count({
    where: { serviceId: serviceId }
  })
  
  if (bookingsCount > 0) {
    // Option 1 : Empêcher la suppression
    throw new Error(`Impossible de supprimer ce service, ${bookingsCount} réservation(s) sont liées`)
    
    // Option 2 : Désactiver au lieu de supprimer
    // return await prisma.service.update({
    //   where: { id: serviceId },
    //   data: { isActive: false }
    // })
  }
  
  // 4. Supprimer le service
  await prisma.service.delete({
    where: { id: serviceId }
  })
  
  return { message: 'Service supprimé avec succès' }
}

// ============= SOFT DELETE (désactiver) =============
export async function toggleServiceStatus(serviceId: string, isActive: boolean) {
  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: isActive },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  })
  
  return service
}

// ============= GET CATEGORIES (pour dropdown) =============
export async function getServiceCategories(salonId: string) {
  const categories = await prisma.service.findMany({
    where: { salonId: salonId },
    select: { category: true },
    distinct: ['category']
  })
  
  return categories.map((c: { category: string }) => c.category)
}