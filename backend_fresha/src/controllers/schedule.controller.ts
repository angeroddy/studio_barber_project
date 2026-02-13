import { Request, Response } from 'express'
import logger from '../config/logger'
import {
  upsertSchedule,
  getSchedulesBySalon,
  getScheduleByDay,
  updateSchedule,
  deleteSchedule,
  createDefaultSchedules,
  TimeSlotData
} from '../services/schedule.service'

/**
 * POST /api/salons/:salonId/schedules
 * Créer ou mettre à jour un horaire avec plusieurs plages horaires
 */
export async function upsertScheduleHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const { dayOfWeek, timeSlots, isClosed } = req.body

    // Validation
    if (dayOfWeek === undefined || dayOfWeek === null) {
      return res.status(400).json({
        success: false,
        error: 'Le champ dayOfWeek est requis'
      })
    }

    if (isClosed === undefined || isClosed === null) {
      return res.status(400).json({
        success: false,
        error: 'Le champ isClosed est requis'
      })
    }

    // Si non fermé, vérifier que timeSlots est fourni
    if (!isClosed && (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Au moins une plage horaire est requise lorsque le salon est ouvert'
      })
    }

    // Valider chaque timeSlot
    if (!isClosed) {
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            error: 'Chaque plage horaire doit avoir un startTime et un endTime'
          })
        }
      }
    }

    const schedule = await upsertSchedule({
      salonId,
      dayOfWeek: Number(dayOfWeek),
      timeSlots: isClosed ? [] : (timeSlots as TimeSlotData[]),
      isClosed: Boolean(isClosed)
    })

    res.status(200).json({
      success: true,
      message: 'Horaire enregistré avec succès',
      data: schedule
    })

  } catch (error: any) {
    logger.error('Erreur upsert schedule:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de l\'enregistrement de l\'horaire'
    })
  }
}

/**
 * GET /api/salons/:salonId/schedules
 * Récupérer tous les horaires d'un salon avec leurs plages horaires
 */
export async function getSchedulesBySalonHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const schedules = await getSchedulesBySalon(salonId)

    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    })

  } catch (error: any) {
    logger.error('Erreur récupération schedules:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des horaires'
    })
  }
}

/**
 * GET /api/salons/:salonId/schedules/:dayOfWeek
 * Récupérer l'horaire d'un jour spécifique avec ses plages horaires
 */
export async function getScheduleByDayHandler(req: Request, res: Response) {
  try {
    const { salonId, dayOfWeek } = req.params

    const schedule = await getScheduleByDay(salonId, Number(dayOfWeek))

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Horaire introuvable pour ce jour'
      })
    }

    res.json({
      success: true,
      data: schedule
    })

  } catch (error: any) {
    logger.error('Erreur récupération schedule:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération de l\'horaire'
    })
  }
}

/**
 * PUT /api/salons/:salonId/schedules/:dayOfWeek
 * Mettre à jour un horaire avec ses plages horaires
 */
export async function updateScheduleHandler(req: Request, res: Response) {
  try {
    const { salonId, dayOfWeek } = req.params
    const { timeSlots, isClosed } = req.body

    const updateData: any = {}

    if (isClosed !== undefined) {
      updateData.isClosed = Boolean(isClosed)
    }

    if (timeSlots !== undefined) {
      if (!Array.isArray(timeSlots)) {
        return res.status(400).json({
          success: false,
          error: 'timeSlots doit être un tableau'
        })
      }

      // Valider chaque timeSlot
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            error: 'Chaque plage horaire doit avoir un startTime et un endTime'
          })
        }
      }

      updateData.timeSlots = timeSlots as TimeSlotData[]
    }

    const schedule = await updateSchedule(salonId, Number(dayOfWeek), updateData)

    res.json({
      success: true,
      message: 'Horaire mis à jour avec succès',
      data: schedule
    })

  } catch (error: any) {
    logger.error('Erreur mise à jour schedule:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de l\'horaire'
    })
  }
}

/**
 * DELETE /api/salons/:salonId/schedules/:dayOfWeek
 * Supprimer un horaire
 */
export async function deleteScheduleHandler(req: Request, res: Response) {
  try {
    const { salonId, dayOfWeek } = req.params

    const result = await deleteSchedule(salonId, Number(dayOfWeek))

    res.json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    logger.error('Erreur suppression schedule:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression de l\'horaire'
    })
  }
}

/**
 * POST /api/salons/:salonId/schedules/default
 * Créer les horaires par défaut avec plages horaires
 * Lundi-Vendredi: 9h-12h et 14h-18h (avec pause déjeuner)
 * Samedi: 9h-17h
 * Dimanche: Fermé
 */
export async function createDefaultSchedulesHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const result = await createDefaultSchedules(salonId)

    res.status(201).json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    logger.error('Erreur création horaires par défaut:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création des horaires par défaut'
    })
  }
}
