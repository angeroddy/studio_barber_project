import { Request, Response } from 'express'
import {
  createStaff,
  getStaff,
  getStaffBySalon,
  getStaffByRole,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  getStaffSpecialties,
  getAvailableStaff,
  upsertStaffSchedule,
  getStaffSchedules,
  deleteStaffSchedule,
  deleteStaffSchedulesByDay,
  batchUpsertStaffSchedules,
  deleteAndCreateSchedulesForDay
} from '../services/staff.service'

// ============= CREATE =============
export async function createStaffController(req: Request, res: Response) {
  try {
    const data = req.body

    // Validation basique
    if (!data.salonId || !data.firstName || !data.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants : salonId, firstName, lastName'
      })
    }

    const staff = await createStaff(data)
    const hasEmail = typeof data.email === 'string' && data.email.trim().length > 0

    return res.status(201).json({
      success: true,
      message: hasEmail
        ? "Membre du personnel créé avec succès. Un email d'activation a été envoyé."
        : 'Membre du personnel créé avec succès',
      data: staff
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création du membre du personnel'
    })
  }
}

// ============= GET ONE =============
export async function getStaffController(req: Request, res: Response) {
  try {
    const { id } = req.params

    const staff = await getStaff(id)

    return res.status(200).json({
      success: true,
      data: staff
    })
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Membre du personnel introuvable'
    })
  }
}

// ============= GET BY SALON =============
export async function getStaffBySalonController(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const activeOnly = req.query.activeOnly === 'true'
    const page = req.query.page ? parseInt(req.query.page as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

    const result = await getStaffBySalon(salonId, activeOnly, page, limit)

    return res.status(200).json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du personnel'
    })
  }
}

// ============= GET BY ROLE =============
export async function getStaffByRoleController(req: Request, res: Response) {
  try {
    const { salonId, role } = req.params
    const page = req.query.page ? parseInt(req.query.page as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

    if (role !== 'MANAGER' && role !== 'EMPLOYEE') {
      return res.status(400).json({
        success: false,
        message: 'Le rôle doit être MANAGER ou EMPLOYEE'
      })
    }

    const result = await getStaffByRole(salonId, role as 'MANAGER' | 'EMPLOYEE', page, limit)

    return res.status(200).json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du personnel'
    })
  }
}

// ============= GET SPECIALTIES =============
export async function getStaffSpecialtiesController(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const specialties = await getStaffSpecialties(salonId)

    return res.status(200).json({
      success: true,
      data: specialties
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des spécialités'
    })
  }
}

// ============= GET AVAILABLE STAFF =============
export async function getAvailableStaffController(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const { date, specialty } = req.query

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise'
      })
    }

    const dateObj = new Date(date as string)

    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Date invalide'
      })
    }

    const staff = await getAvailableStaff(salonId, dateObj, specialty as string)

    return res.status(200).json({
      success: true,
      data: staff,
      count: staff.length
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du personnel disponible'
    })
  }
}

// ============= UPDATE =============
export async function updateStaffController(req: Request, res: Response) {
  try {
    const { id } = req.params
    const data = req.body

    const updatedStaff = await updateStaff({
      id,
      ...data
    })

    return res.status(200).json({
      success: true,
      message: 'Membre du personnel mis à jour avec succès',
      data: updatedStaff
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du membre du personnel'
    })
  }
}

// ============= DELETE =============
export async function deleteStaffController(req: Request, res: Response) {
  try {
    const { id } = req.params

    const result = await deleteStaff(id)

    return res.status(200).json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du membre du personnel'
    })
  }
}

// ============= TOGGLE STATUS =============
export async function toggleStaffStatusController(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ isActive doit être un booléen'
      })
    }

    const staff = await toggleStaffStatus(id, isActive)

    return res.status(200).json({
      success: true,
      message: `Membre du personnel ${isActive ? 'activé' : 'désactivé'} avec succès`,
      data: staff
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du changement de statut'
    })
  }
}

// ============= STAFF SCHEDULES =============

// Upsert (create or update) a single schedule
export async function upsertStaffScheduleController(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body

    // Validation
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek, startTime et endTime sont requis'
      })
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek doit être entre 0 (dimanche) et 6 (samedi)'
      })
    }

    const schedule = await upsertStaffSchedule(
      staffId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable !== undefined ? isAvailable : true
    )

    return res.status(200).json({
      success: true,
      message: 'Horaire sauvegardé avec succès',
      data: schedule
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde de l\'horaire'
    })
  }
}

// Get all schedules for a staff member
export async function getStaffSchedulesController(req: Request, res: Response) {
  try {
    const { staffId } = req.params

    const schedules = await getStaffSchedules(staffId)

    return res.status(200).json({
      success: true,
      data: schedules,
      count: schedules.length
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des horaires'
    })
  }
}

// Delete a specific schedule by ID
export async function deleteStaffScheduleController(req: Request, res: Response) {
  try {
    const { scheduleId } = req.params

    await deleteStaffSchedule(scheduleId)

    return res.status(200).json({
      success: true,
      message: 'Horaire supprimé avec succès'
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de l\'horaire'
    })
  }
}

// Delete all schedules for a specific day of week
export async function deleteStaffSchedulesByDayController(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { dayOfWeek } = req.body

    if (dayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek est requis'
      })
    }

    await deleteStaffSchedulesByDay(staffId, dayOfWeek)

    return res.status(200).json({
      success: true,
      message: 'Horaires supprimés avec succès'
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression des horaires'
    })
  }
}

// Batch upsert schedules (for all days of week)
export async function batchUpsertStaffSchedulesController(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { schedules } = req.body

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'schedules doit être un tableau non vide'
      })
    }

    // Validate each schedule
    for (const schedule of schedules) {
      if (
        schedule.dayOfWeek === undefined ||
        !schedule.startTime ||
        !schedule.endTime
      ) {
        return res.status(400).json({
          success: false,
          message: 'Chaque horaire doit avoir dayOfWeek, startTime et endTime'
        })
      }
    }

    const result = await batchUpsertStaffSchedules(staffId, schedules)

    return res.status(200).json({
      success: true,
      message: 'Horaires sauvegardés avec succès',
      data: result,
      count: result.length
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde des horaires'
    })
  }
}

// Delete and create schedules for a specific day (supports multiple time slots)
export async function deleteAndCreateSchedulesForDayController(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { dayOfWeek, timeSlots } = req.body

    // Validation
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek doit être un nombre entre 0 et 6'
      })
    }

    if (!Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        message: 'timeSlots doit être un tableau'
      })
    }

    // Validate each time slot
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Chaque plage horaire doit avoir startTime et endTime'
        })
      }
    }

    const result = await deleteAndCreateSchedulesForDay(staffId, dayOfWeek, timeSlots)

    return res.status(200).json({
      success: true,
      message: timeSlots.length === 0
        ? 'Horaires supprimés avec succès'
        : `${result.length} plage(s) horaire(s) sauvegardée(s) avec succès`,
      data: result,
      count: result.length
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde des horaires'
    })
  }
}
