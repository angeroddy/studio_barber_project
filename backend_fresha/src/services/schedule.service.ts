import prisma from '../config/database'

// Interface pour un TimeSlot
export interface TimeSlotData {
  startTime: string // Format "HH:mm"
  endTime: string   // Format "HH:mm"
}

interface CreateScheduleData {
  salonId: string
  dayOfWeek: number // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  timeSlots: TimeSlotData[]
  isClosed: boolean
}

interface UpdateScheduleData {
  timeSlots?: TimeSlotData[]
  isClosed?: boolean
}

/**
 * Valider qu'il n'y a pas de chevauchement entre les plages horaires
 */
function validateTimeSlots(timeSlots: TimeSlotData[]): void {
  if (timeSlots.length === 0) return

  // Convertir les heures en minutes pour faciliter la comparaison
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Trier les plages par heure de début
  const sorted = [...timeSlots].sort((a, b) =>
    toMinutes(a.startTime) - toMinutes(b.startTime)
  )

  // Vérifier qu'il n'y a pas de chevauchement
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    if (toMinutes(current.endTime) > toMinutes(next.startTime)) {
      throw new Error(
        `Chevauchement détecté entre ${current.startTime}-${current.endTime} et ${next.startTime}-${next.endTime}`
      )
    }
  }

  // Vérifier que startTime < endTime pour chaque plage
  for (const slot of timeSlots) {
    if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
      throw new Error(
        `L'heure de début (${slot.startTime}) doit être inférieure à l'heure de fin (${slot.endTime})`
      )
    }
  }
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

  // Valider les plages horaires si le salon n'est pas fermé
  if (!data.isClosed && data.timeSlots && data.timeSlots.length > 0) {
    validateTimeSlots(data.timeSlots)
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
      isClosed: data.isClosed,
      timeSlots: {
        create: (data.timeSlots || []).map((slot, index) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          order: index
        }))
      }
    },
    update: {
      isClosed: data.isClosed,
      // Supprimer tous les anciens timeSlots et recréer les nouveaux
      timeSlots: {
        deleteMany: {},
        create: (data.timeSlots || []).map((slot, index) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          order: index
        }))
      }
    },
    include: {
      timeSlots: {
        orderBy: {
          order: 'asc'
        }
      }
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
    include: {
      timeSlots: {
        orderBy: {
          order: 'asc'
        }
      }
    },
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
    },
    include: {
      timeSlots: {
        orderBy: {
          order: 'asc'
        }
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

  // Valider les plages horaires si fournies
  if (data.timeSlots && data.timeSlots.length > 0) {
    validateTimeSlots(data.timeSlots)
  }

  const updateData: any = {}

  if (data.isClosed !== undefined) {
    updateData.isClosed = data.isClosed
  }

  if (data.timeSlots !== undefined) {
    updateData.timeSlots = {
      deleteMany: {},
      create: data.timeSlots.map((slot, index) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        order: index
      }))
    }
  }

  const schedule = await prisma.schedule.update({
    where: {
      salonId_dayOfWeek: {
        salonId,
        dayOfWeek
      }
    },
    data: updateData,
    include: {
      timeSlots: {
        orderBy: {
          order: 'asc'
        }
      }
    }
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

  // Lundi à Vendredi: 9h-12h et 14h-18h (pause déjeuner)
  for (let day = 1; day <= 5; day++) {
    defaultSchedules.push({
      salonId,
      dayOfWeek: day,
      isClosed: false,
      timeSlots: {
        create: [
          { startTime: '09:00', endTime: '12:00', order: 0 },
          { startTime: '14:00', endTime: '18:00', order: 1 }
        ]
      }
    })
  }

  // Samedi: 9h-17h (sans pause)
  defaultSchedules.push({
    salonId,
    dayOfWeek: 6,
    isClosed: false,
    timeSlots: {
      create: [
        { startTime: '09:00', endTime: '17:00', order: 0 }
      ]
    }
  })

  // Dimanche: Fermé
  defaultSchedules.push({
    salonId,
    dayOfWeek: 0,
    isClosed: true,
    timeSlots: {
      create: []
    }
  })

  // Supprimer les horaires existants et créer les nouveaux
  await prisma.schedule.deleteMany({
    where: { salonId }
  })

  await prisma.schedule.createMany({
    data: defaultSchedules.map(({ timeSlots, ...rest }) => rest)
  })

  // Créer les time slots pour chaque schedule
  for (const defaultSchedule of defaultSchedules) {
    if (defaultSchedule.timeSlots.create.length > 0) {
      const schedule = await prisma.schedule.findUnique({
        where: {
          salonId_dayOfWeek: {
            salonId: defaultSchedule.salonId,
            dayOfWeek: defaultSchedule.dayOfWeek
          }
        }
      })

      if (schedule) {
        await prisma.timeSlot.createMany({
          data: defaultSchedule.timeSlots.create.map(slot => ({
            ...slot,
            scheduleId: schedule.id
          }))
        })
      }
    }
  }

  return { message: 'Horaires par défaut créés avec succès' }
}
