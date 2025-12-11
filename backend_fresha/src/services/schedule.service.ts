import prisma from '../config/database'

interface CreateScheduleData {
  salonId: string
  dayOfWeek: number // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  openTime: string  // Format "HH:mm"
  closeTime: string // Format "HH:mm"
  isClosed: boolean
}

interface UpdateScheduleData {
  openTime?: string
  closeTime?: string
  isClosed?: boolean
}

/**
 * Créer ou mettre à jour un horaire pour un jour spécifique
 */
export async function upsertSchedule(data: CreateScheduleData) {
  // Vérifier que le salon existe
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  // Valider dayOfWeek (0-6)
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    throw new Error('dayOfWeek doit être entre 0 (Dimanche) et 6 (Samedi)')
  }

  // Créer ou mettre à jour l'horaire
  const schedule = await prisma.schedule.upsert({
    where: {
      salonId_dayOfWeek: {
        salonId: data.salonId,
        dayOfWeek: data.dayOfWeek
      }
    },
    create: {
      salonId: data.salonId,
      dayOfWeek: data.dayOfWeek,
      openTime: data.openTime,
      closeTime: data.closeTime,
      isClosed: data.isClosed
    },
    update: {
      openTime: data.openTime,
      closeTime: data.closeTime,
      isClosed: data.isClosed
    }
  })

  return schedule
}

/**
 * Récupérer tous les horaires d'un salon (7 jours)
 */
export async function getSchedulesBySalon(salonId: string) {
  const schedules = await prisma.schedule.findMany({
    where: { salonId },
    orderBy: { dayOfWeek: 'asc' }
  })

  return schedules
}

/**
 * Récupérer l'horaire d'un jour spécifique
 */
export async function getScheduleByDay(salonId: string, dayOfWeek: number) {
  const schedule = await prisma.schedule.findUnique({
    where: {
      salonId_dayOfWeek: {
        salonId,
        dayOfWeek
      }
    }
  })

  return schedule
}

/**
 * Mettre à jour un horaire
 */
export async function updateSchedule(
  salonId: string,
  dayOfWeek: number,
  data: UpdateScheduleData
) {
  // Vérifier que l'horaire existe
  const existingSchedule = await prisma.schedule.findUnique({
    where: {
      salonId_dayOfWeek: {
        salonId,
        dayOfWeek
      }
    }
  })

  if (!existingSchedule) {
    throw new Error('Horaire introuvable')
  }

  const schedule = await prisma.schedule.update({
    where: {
      salonId_dayOfWeek: {
        salonId,
        dayOfWeek
      }
    },
    data
  })

  return schedule
}

/**
 * Supprimer un horaire
 */
export async function deleteSchedule(salonId: string, dayOfWeek: number) {
  const schedule = await prisma.schedule.findUnique({
    where: {
      salonId_dayOfWeek: {
        salonId,
        dayOfWeek
      }
    }
  })

  if (!schedule) {
    throw new Error('Horaire introuvable')
  }

  await prisma.schedule.delete({
    where: {
      salonId_dayOfWeek: {
        salonId,
        dayOfWeek
      }
    }
  })

  return { message: 'Horaire supprimé avec succès' }
}

/**
 * Créer les horaires par défaut pour un salon (7 jours)
 */
export async function createDefaultSchedules(salonId: string) {
  const defaultSchedules = []

  // Lundi à Vendredi: 9h-18h
  for (let day = 1; day <= 5; day++) {
    defaultSchedules.push({
      salonId,
      dayOfWeek: day,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: false
    })
  }

  // Samedi: 9h-17h
  defaultSchedules.push({
    salonId,
    dayOfWeek: 6,
    openTime: '09:00',
    closeTime: '17:00',
    isClosed: false
  })

  // Dimanche: Fermé
  defaultSchedules.push({
    salonId,
    dayOfWeek: 0,
    openTime: '00:00',
    closeTime: '00:00',
    isClosed: true
  })

  const schedules = await prisma.schedule.createMany({
    data: defaultSchedules,
    skipDuplicates: true
  })

  return schedules
}
