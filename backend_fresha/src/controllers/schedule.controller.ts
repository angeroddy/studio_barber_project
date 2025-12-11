import { Request, Response } from 'express'
import {
  upsertSchedule,
  getSchedulesBySalon,
  getScheduleByDay,
  updateSchedule,
  deleteSchedule,
  createDefaultSchedules
} from '../services/schedule.service'

/**
 * POST /api/salons/:salonId/schedules
 * Créer ou mettre à jour un horaire
 */
export async function upsertScheduleHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const { dayOfWeek, openTime, closeTime, isClosed } = req.body

    const schedule = await upsertSchedule({
      salonId,
      dayOfWeek: Number(dayOfWeek),
      openTime,
      closeTime,
      isClosed: Boolean(isClosed)
    })

    res.status(200).json({
      success: true,
      message: 'Horaire enregistré avec succès',
      data: schedule
    })

  } catch (error: any) {
    console.error('Erreur upsert schedule:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/:salonId/schedules
 * Récupérer tous les horaires d'un salon
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
    console.error('Erreur récupération schedules:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/:salonId/schedules/:dayOfWeek
 * Récupérer l'horaire d'un jour spécifique
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
    console.error('Erreur récupération schedule:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PUT /api/salons/:salonId/schedules/:dayOfWeek
 * Mettre à jour un horaire
 */
export async function updateScheduleHandler(req: Request, res: Response) {
  try {
    const { salonId, dayOfWeek } = req.params
    const { openTime, closeTime, isClosed } = req.body

    const schedule = await updateSchedule(salonId, Number(dayOfWeek), {
      openTime,
      closeTime,
      isClosed
    })

    res.json({
      success: true,
      message: 'Horaire mis à jour avec succès',
      data: schedule
    })

  } catch (error: any) {
    console.error('Erreur mise à jour schedule:', error)
    res.status(400).json({
      success: false,
      error: error.message
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
    console.error('Erreur suppression schedule:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/salons/:salonId/schedules/default
 * Créer les horaires par défaut
 */
export async function createDefaultSchedulesHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const result = await createDefaultSchedules(salonId)

    res.status(201).json({
      success: true,
      message: 'Horaires par défaut créés avec succès',
      data: result
    })

  } catch (error: any) {
    console.error('Erreur création horaires par défaut:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
