import prisma from '../config/database'
import { AbsenceType, AbsenceStatus } from '../types/domain.enums'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.util'

interface CreateAbsenceData {
  staffId: string
  salonId: string
  type: AbsenceType
  startDate: Date
  endDate: Date
  reason?: string
  notes?: string
}

interface UpdateAbsenceData {
  absenceId: string
  type?: AbsenceType
  startDate?: Date
  endDate?: Date
  reason?: string
  notes?: string
}

interface ApproveAbsenceData {
  absenceId: string
  approvedBy: string // ID du Owner ou Manager qui approuve
  status: AbsenceStatus // APPROVED ou REJECTED
  notes?: string
}

export async function createAbsence(data: CreateAbsenceData) {
  const { staffId, salonId, type, startDate, endDate, reason, notes } = data

  // 1. Vérifier que le staff existe et appartient au salon
  const staff = await prisma.staff.findUnique({
    where: { id: staffId }
  })

  if (!staff) {
    throw new Error('Employé introuvable')
  }

  if (staff.salonId !== salonId) {
    throw new Error('Employé n\'appartient pas à ce salon')
  }

  // 2. Vérifier que la date de fin est après la date de début
  if (endDate < startDate) {
    throw new Error('La date de fin doit être après la date de début')
  }

  // 3. Vérifier les chevauchements d'absences existantes (PENDING ou APPROVED)
  const overlappingAbsences = await prisma.absence.findFirst({
    where: {
      staffId,
      status: {
        in: ['PENDING', 'APPROVED']
      },
      OR: [
        {
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } }
          ]
        }
      ]
    }
  })

  if (overlappingAbsences) {
    throw new Error('Il existe déjà une absence sur cette période')
  }

  // 4. Créer l'absence
  const absence = await prisma.absence.create({
    data: {
      staffId,
      salonId,
      type,
      startDate,
      endDate,
      reason,
      notes,
      status: 'PENDING'
    },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return absence
}

export async function getAbsences(filters: {
  salonId?: string
  staffId?: string
  status?: AbsenceStatus
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const { salonId, staffId, status, startDate, endDate, page, limit } = filters

  const pagination = getPaginationParams(page, limit)

  const where: any = {}

  if (salonId) where.salonId = salonId
  if (staffId) where.staffId = staffId
  if (status) where.status = status

  // Filtrage par période
  if (startDate || endDate) {
    where.OR = []
    if (startDate && endDate) {
      // Absences qui chevauchent la période
      where.OR.push({
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } }
        ]
      })
    } else if (startDate) {
      // Absences qui se terminent après startDate
      where.endDate = { gte: startDate }
    } else if (endDate) {
      // Absences qui commencent avant endDate
      where.startDate = { lte: endDate }
    }
  }

  const [absences, total] = await Promise.all([
    prisma.absence.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.absence.count({ where })
  ])

  return createPaginatedResponse(absences, total, pagination.page, pagination.limit)
}

export async function getAbsence(absenceId: string) {
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true
        }
      },
      salon: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  if (!absence) {
    throw new Error('Absence introuvable')
  }

  return absence
}

export async function updateAbsence(data: UpdateAbsenceData) {
  const { absenceId, ...updateData } = data

  // 1. Vérifier que l'absence existe
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId }
  })

  if (!absence) {
    throw new Error('Absence introuvable')
  }

  // 2. Vérifier que l'absence est en PENDING (on ne peut modifier qu'une absence en attente)
  if (absence.status !== 'PENDING') {
    throw new Error('Impossible de modifier une absence déjà traitée')
  }

  // 3. Vérifier les dates si modifiées
  const newStartDate = updateData.startDate || absence.startDate
  const newEndDate = updateData.endDate || absence.endDate

  if (newEndDate < newStartDate) {
    throw new Error('La date de fin doit être après la date de début')
  }

  // 4. Vérifier les chevauchements si les dates sont modifiées
  if (updateData.startDate || updateData.endDate) {
    const overlappingAbsences = await prisma.absence.findFirst({
      where: {
        id: { not: absenceId }, // Exclure l'absence actuelle
        staffId: absence.staffId,
        status: {
          in: ['PENDING', 'APPROVED']
        },
        OR: [
          {
            AND: [
              { startDate: { lte: newEndDate } },
              { endDate: { gte: newStartDate } }
            ]
          }
        ]
      }
    })

    if (overlappingAbsences) {
      throw new Error('Il existe déjà une absence sur cette période')
    }
  }

  // 5. Mettre à jour l'absence
  const updatedAbsence = await prisma.absence.update({
    where: { id: absenceId },
    data: updateData,
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return updatedAbsence
}

export async function approveOrRejectAbsence(data: ApproveAbsenceData) {
  const { absenceId, approvedBy, status, notes } = data

  // 1. Vérifier que l'absence existe
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId }
  })

  if (!absence) {
    throw new Error('Absence introuvable')
  }

  // 2. Vérifier que l'absence est en PENDING
  if (absence.status !== 'PENDING') {
    throw new Error('Cette absence a déjà été traitée')
  }

  // 3. Vérifier que le statut est valide
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    throw new Error('Statut invalide. Utilisez APPROVED ou REJECTED')
  }

  // 4. Mettre à jour l'absence
  const updatedAbsence = await prisma.absence.update({
    where: { id: absenceId },
    data: {
      status,
      approvedBy,
      notes: notes || absence.notes
    },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return updatedAbsence
}

export async function deleteAbsence(
  absenceId: string,
  options?: { allowApproved?: boolean }
) {
  // 1. Vérifier que l'absence existe
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId }
  })

  if (!absence) {
    throw new Error('Absence introuvable')
  }

  // 2. Seules les absences PENDING ou REJECTED peuvent être supprimées
  if (absence.status === 'APPROVED' && !options?.allowApproved) {
    throw new Error('Impossible de supprimer une absence approuvée. Veuillez la rejeter d\'abord.')
  }

  // 3. Supprimer l'absence
  await prisma.absence.delete({
    where: { id: absenceId }
  })

  return { message: 'Absence supprimée avec succès' }
}

export async function getStaffAbsenceStats(staffId: string, year?: number) {
  const currentYear = year || new Date().getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)
  const endOfYear = new Date(currentYear, 11, 31)

  const absences = await prisma.absence.findMany({
    where: {
      staffId,
      status: 'APPROVED',
      startDate: { gte: startOfYear },
      endDate: { lte: endOfYear }
    }
  })

  // Calculer le nombre total de jours d'absence
  let totalDays = 0
  const statsByType: Record<string, number> = {
    VACATION: 0,
    SICK_LEAVE: 0,
    PERSONAL: 0,
    OTHER: 0
  }

  absences.forEach((absence: { endDate: Date; startDate: Date; type: keyof typeof statsByType }) => {
    const days = Math.ceil(
      (absence.endDate.getTime() - absence.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    totalDays += days
    statsByType[absence.type] += days
  })

  return {
    year: currentYear,
    totalDays,
    totalAbsences: absences.length,
    byType: statsByType,
    absences
  }
}
