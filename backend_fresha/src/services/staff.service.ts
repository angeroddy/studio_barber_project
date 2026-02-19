import { createHash, randomBytes } from 'crypto'
import prisma from '../config/database'
import logger from '../config/logger'
import { hashPassword } from '../utils/hash.util'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.util'
import { sendStaffInvitationEmail } from './email.service'

interface CreateStaff {
  salonId: string
  email?: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role?: 'MANAGER' | 'EMPLOYEE'
  specialties?: string[]
  bio?: string
  isActive?: boolean
}

interface UpdateStaff {
  id: string
  salonId?: string
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  role?: 'MANAGER' | 'EMPLOYEE'
  specialties?: string[]
  bio?: string
  isActive?: boolean
}

function normalizeOptionalEmail(email?: string | null): string | undefined {
  if (!email) {
    return undefined
  }

  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail || undefined
}

function getStaffInvitationTtlHours(): number {
  const parsed = Number(process.env.STAFF_INVITATION_TTL_HOURS)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }
  return 72
}

function createPasswordSetupToken(): string {
  return randomBytes(32).toString('hex')
}

function hashPasswordSetupToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

// ============= CREATE =============
export async function createStaff(data: CreateStaff) {
  const normalizedEmail = normalizeOptionalEmail(data.email)
  const rawPassword = (data as any).password

  if (typeof rawPassword === 'string' && rawPassword.trim().length > 0) {
    throw new Error("Le mot de passe ne peut pas etre defini a la creation. L'employe doit l'activer via email.")
  }

  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId }
  })

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  if (normalizedEmail) {
    const existingStaff = await prisma.staff.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingStaff) {
      throw new Error('Cet email est deja utilise')
    }
  }

  const invitationTtlHours = getStaffInvitationTtlHours()
  const invitationTokenRaw = normalizedEmail ? createPasswordSetupToken() : null
  const invitationTokenHash = invitationTokenRaw ? hashPasswordSetupToken(invitationTokenRaw) : null
  const invitationExpiresAt = invitationTokenRaw ? new Date(Date.now() + invitationTtlHours * 60 * 60 * 1000) : null

  let createdStaffId: string | null = null
  try {
    const staff = await prisma.staff.create({
      data: {
        salonId: data.salonId,
        email: normalizedEmail || null,
        password: null,
        passwordSetupRequired: Boolean(invitationTokenHash),
        passwordSetupTokenHash: invitationTokenHash,
        passwordSetupTokenExpiresAt: invitationExpiresAt,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar,
        role: data.role || 'EMPLOYEE',
        specialties: data.specialties || [],
        bio: data.bio,
        isActive: data.isActive ?? true
      },
      select: {
        id: true,
        salonId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        specialties: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    createdStaffId = staff.id

    if (normalizedEmail && invitationTokenRaw && invitationExpiresAt) {
      await sendStaffInvitationEmail({
        to: normalizedEmail,
        firstName: staff.firstName,
        token: invitationTokenRaw,
        expiresAt: invitationExpiresAt
      })
    }

    return staff
  } catch (error) {
    if (createdStaffId) {
      try {
        await prisma.staff.delete({ where: { id: createdStaffId } })
      } catch (rollbackError: any) {
        logger.error('Failed to rollback staff creation after invitation failure', {
          staffId: createdStaffId,
          error: rollbackError?.message
        })
      }
    }

    throw error
  }
}

// ============= READ (un seul) =============
export async function getStaff(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      schedules: true,
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  if (!staff) {
    throw new Error('Membre du personnel introuvable')
  }

  // Retirer le mot de passe de la réponse
  const { password, ...staffWithoutPassword } = staff

  return staffWithoutPassword
}

// ============= READ (liste par salon) =============
export async function getStaffBySalon(salonId: string, activeOnly: boolean = false, page?: number, limit?: number) {
  const pagination = getPaginationParams(page, limit)

  const where = {
    salonId: salonId,
    ...(activeOnly && { isActive: true })
  }

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      select: {
        id: true,
        salonId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        specialties: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        schedules: {
          select: {
            id: true,
            staffId: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isAvailable: true
          },
          orderBy: {
            dayOfWeek: 'asc'
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // MANAGER avant EMPLOYEE
        { firstName: 'asc' }
      ],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.staff.count({ where })
  ])

  return createPaginatedResponse(staff, total, pagination.page, pagination.limit)
}

// ============= READ (liste par rôle) =============
export async function getStaffByRole(salonId: string, role: 'MANAGER' | 'EMPLOYEE', page?: number, limit?: number) {
  const pagination = getPaginationParams(page, limit)

  const where = {
    salonId: salonId,
    role: role,
    isActive: true
  }

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        specialties: true,
        bio: true
      },
      orderBy: {
        firstName: 'asc'
      },
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.staff.count({ where })
  ])

  return createPaginatedResponse(staff, total, pagination.page, pagination.limit)
}

// ============= UPDATE =============
export async function updateStaff(data: UpdateStaff) {
  const normalizedEmail = normalizeOptionalEmail(data.email)
  // 1. Vérifier que le membre du personnel existe
  const existingStaff = await prisma.staff.findUnique({
    where: { id: data.id }
  })

  if (!existingStaff) {
    throw new Error('Membre du personnel introuvable')
  }

  // 2. Si on change l'email, vérifier qu'il n'est pas déjà utilisé
  if (normalizedEmail && normalizedEmail !== existingStaff.email) {
    const emailExists = await prisma.staff.findUnique({
      where: { email: normalizedEmail }
    })

    if (emailExists) {
      throw new Error('Cet email est déjà utilisé')
    }
  }

  // 3. Si on change le salonId, vérifier que le nouveau salon existe
  if (data.salonId && data.salonId !== existingStaff.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }
  }

  // 4. Préparer les données de mise à jour
  const { id, password, email, ...updateData } = data

  // Si le mot de passe est fourni, le hasher
  let hashedPassword: string | undefined
  if (password) {
    hashedPassword = await hashPassword(password)
  }

  // 5. Mettre à jour le membre du personnel
  const updatedStaff = await prisma.staff.update({
    where: { id: id },
    data: {
      ...updateData,
      ...(email !== undefined && { email: normalizedEmail ?? null }),
      ...(hashedPassword && { password: hashedPassword })
    },
    select: {
      id: true,
      salonId: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      specialties: true,
      bio: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return updatedStaff
}

// ============= DELETE =============
export async function deleteStaff(staffId: string, salonId?: string) {
  // 1. Vérifier que le membre du personnel existe
  const existingStaff = await prisma.staff.findUnique({
    where: { id: staffId }
  })

  if (!existingStaff) {
    throw new Error('Membre du personnel introuvable')
  }

  // 2. Vérifier que le membre appartient au salon (sécurité)
  if (salonId && existingStaff.salonId !== salonId) {
    throw new Error('Vous n\'avez pas la permission de supprimer ce membre du personnel')
  }

  // 3. Vérifier s'il y a des réservations liées
  const bookingsCount = await prisma.booking.count({
    where: {
      staffId: staffId,
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    }
  })

  if (bookingsCount > 0) {
    throw new Error(`Impossible de supprimer ce membre, ${bookingsCount} réservation(s) actives sont liées. Veuillez d'abord les réaffecter ou les annuler.`)
  }

  // 4. Supprimer le membre du personnel (les schedules seront supprimés en cascade)
  await prisma.staff.delete({
    where: { id: staffId }
  })

  return { message: 'Membre du personnel supprimé avec succès' }
}

// ============= SOFT DELETE (désactiver) =============
export async function toggleStaffStatus(staffId: string, isActive: boolean) {
  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: { isActive: isActive },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isActive: true
    }
  })

  return staff
}

// ============= GET SPECIALTIES (pour dropdown) =============
export async function getStaffSpecialties(salonId: string) {
  const staff = await prisma.staff.findMany({
    where: { salonId: salonId },
    select: { specialties: true }
  })

  // Extraire toutes les spécialités uniques
  const allSpecialties = staff.flatMap(s => s.specialties)
  const uniqueSpecialties = [...new Set(allSpecialties)]

  return uniqueSpecialties
}

// ============= GET AVAILABLE STAFF (pour réservation) =============
export async function getAvailableStaff(salonId: string, date: Date, specialty?: string) {
  // Utiliser getUTCDay() car la date reçue est interprétée en UTC
  const dayOfWeek = date.getUTCDay()

  // Créer les bornes de la journée en UTC pour éviter les décalages de timezone
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
  const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))

  const staff = await prisma.staff.findMany({
    where: {
      salonId: salonId,
      isActive: true,
      ...(specialty && {
        specialties: {
          has: specialty
        }
      })
    },
    include: {
      schedules: {
        where: {
          dayOfWeek: dayOfWeek,
          isAvailable: true
        }
      },
      _count: {
        select: {
          bookings: {
            where: {
              startTime: {
                gte: startOfDay,
                lt: endOfDay
              },
              status: {
                in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
              }
            }
          }
        }
      }
    },
    orderBy: {
      firstName: 'asc'
    }
  })

  return staff
}

// ============= STAFF SCHEDULE MANAGEMENT =============

/**
 * Create or update staff schedule for a specific day of week
 */
export async function upsertStaffSchedule(
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isAvailable: boolean = true
) {
  // Check if schedule already exists
  const existingSchedule = await prisma.staffSchedule.findFirst({
    where: {
      staffId: staffId,
      dayOfWeek: dayOfWeek
    }
  })

  if (existingSchedule) {
    // Update existing schedule
    return await prisma.staffSchedule.update({
      where: { id: existingSchedule.id },
      data: {
        startTime,
        endTime,
        isAvailable
      }
    })
  } else {
    // Create new schedule
    return await prisma.staffSchedule.create({
      data: {
        staffId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable
      }
    })
  }
}

/**
 * Get all schedules for a staff member
 */
export async function getStaffSchedules(staffId: string) {
  return await prisma.staffSchedule.findMany({
    where: { staffId },
    orderBy: { dayOfWeek: 'asc' }
  })
}

/**
 * Delete a specific schedule
 */
export async function deleteStaffSchedule(scheduleId: string) {
  return await prisma.staffSchedule.delete({
    where: { id: scheduleId }
  })
}

/**
 * Delete all schedules for a staff member on a specific day
 */
export async function deleteStaffSchedulesByDay(staffId: string, dayOfWeek: number) {
  return await prisma.staffSchedule.deleteMany({
    where: {
      staffId,
      dayOfWeek
    }
  })
}

/**
 * Batch update/create schedules for a staff member (all days of week)
 */
export async function batchUpsertStaffSchedules(
  staffId: string,
  schedules: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    isAvailable: boolean
  }>
) {
  // Delete all existing schedules for this staff
  await prisma.staffSchedule.deleteMany({
    where: { staffId }
  })

  // Create new schedules
  const createPromises = schedules.map((schedule) =>
    prisma.staffSchedule.create({
      data: {
        staffId,
        ...schedule
      }
    })
  )

  return await Promise.all(createPromises)
}

/**
 * Delete and create schedules for a staff member on a specific day
 * This allows multiple time slots per day
 */
export async function deleteAndCreateSchedulesForDay(
  staffId: string,
  dayOfWeek: number,
  timeSlots: Array<{
    startTime: string
    endTime: string
    isAvailable?: boolean
  }>
) {
  // Delete all existing schedules for this staff on this specific day
  await prisma.staffSchedule.deleteMany({
    where: {
      staffId,
      dayOfWeek
    }
  })

  // If no time slots provided, just delete and return
  if (!timeSlots || timeSlots.length === 0) {
    return []
  }

  // Create new schedules for each time slot
  const createPromises = timeSlots.map((slot) =>
    prisma.staffSchedule.create({
      data: {
        staffId,
        dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true
      }
    })
  )

  return await Promise.all(createPromises)
}

