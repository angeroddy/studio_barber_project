import prisma from '../config/database'

interface CreateClosedDayData {
  salonId: string
  date: string | Date // Format "YYYY-MM-DD" ou Date object
  reason?: string
}

interface UpdateClosedDayData {
  date?: string | Date
  reason?: string
}

/**
 * Créer un jour de fermeture exceptionnel
 */
export async function createClosedDay(data: CreateClosedDayData) {
  // Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // Convertir la date en objet Date
  const date = typeof data.date === 'string' ? new Date(data.date) : data.date

  // Vérifier que la date n'est pas dans le passé
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date < today) {
    throw new Error('La date ne peut pas être dans le passé')
  }

  // Vérifier si un jour de fermeture existe déjà pour cette date
  const existingClosedDay = await prisma.closedDay.findUnique({
    where: {
      salonId_date: {
        salonId: data.salonId,
        date
      }
    }
  })

  if (existingClosedDay) {
    throw new Error('Un jour de fermeture existe déjà pour cette date')
  }

  // Créer le jour de fermeture
  const closedDay = await prisma.closedDay.create({
    data: {
      salonId: data.salonId,
      date,
      reason: data.reason
    }
  })

  return closedDay
}

/**
 * Récupérer tous les jours de fermeture d'un salon
 */
export async function getClosedDaysBySalon(salonId: string, fromDate?: Date) {
  const whereClause: any = { salonId }

  // Filtrer uniquement les jours futurs si fromDate est fourni
  if (fromDate) {
    whereClause.date = {
      gte: fromDate
    }
  }

  const closedDays = await prisma.closedDay.findMany({
    where: whereClause,
    orderBy: { date: 'asc' }
  })

  return closedDays
}

/**
 * Récupérer un jour de fermeture par ID
 */
export async function getClosedDayById(id: string) {
  const closedDay = await prisma.closedDay.findUnique({
    where: { id }
  })

  if (!closedDay) {
    throw new Error('Jour de fermeture introuvable')
  }

  return closedDay
}

/**
 * Mettre à jour un jour de fermeture
 */
export async function updateClosedDay(
  id: string,
  salonId: string,
  data: UpdateClosedDayData
) {
  // Vérifier que le jour de fermeture existe et appartient au salon
  const existingClosedDay = await prisma.closedDay.findUnique({
    where: { id }
  })

  if (!existingClosedDay) {
    throw new Error('Jour de fermeture introuvable')
  }

  if (existingClosedDay.salonId !== salonId) {
    throw new Error('Vous n\'êtes pas autorisé à modifier ce jour de fermeture')
  }

  // Si la date est modifiée, vérifier qu'elle n'est pas dans le passé
  if (data.date) {
    const newDate = typeof data.date === 'string' ? new Date(data.date) : data.date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (newDate < today) {
      throw new Error('La date ne peut pas être dans le passé')
    }

    // Vérifier qu'il n'existe pas déjà un jour de fermeture pour cette nouvelle date
    if (newDate.getTime() !== existingClosedDay.date.getTime()) {
      const duplicateClosedDay = await prisma.closedDay.findUnique({
        where: {
          salonId_date: {
            salonId,
            date: newDate
          }
        }
      })

      if (duplicateClosedDay) {
        throw new Error('Un jour de fermeture existe déjà pour cette date')
      }
    }
  }

  // Convertir la date si nécessaire
  const updateData: any = {}
  if (data.date) {
    updateData.date = typeof data.date === 'string' ? new Date(data.date) : data.date
  }
  if (data.reason !== undefined) {
    updateData.reason = data.reason
  }

  const closedDay = await prisma.closedDay.update({
    where: { id },
    data: updateData
  })

  return closedDay
}

/**
 * Supprimer un jour de fermeture
 */
export async function deleteClosedDay(id: string, salonId: string) {
  // Vérifier que le jour de fermeture existe et appartient au salon
  const closedDay = await prisma.closedDay.findUnique({
    where: { id }
  })

  if (!closedDay) {
    throw new Error('Jour de fermeture introuvable')
  }

  if (closedDay.salonId !== salonId) {
    throw new Error('Vous n\'êtes pas autorisé à supprimer ce jour de fermeture')
  }

  await prisma.closedDay.delete({
    where: { id }
  })

  return { message: 'Jour de fermeture supprimé avec succès' }
}

/**
 * Supprimer les jours de fermeture passés
 */
export async function deleteOldClosedDays(salonId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await prisma.closedDay.deleteMany({
    where: {
      salonId,
      date: {
        lt: today
      }
    }
  })

  return { message: `${result.count} jour(s) de fermeture passé(s) supprimé(s)` }
}
