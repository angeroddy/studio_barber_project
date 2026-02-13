import { Request, Response } from 'express'
import logger from '../config/logger'
import {
  createClosedDay,
  getClosedDaysBySalon,
  getClosedDayById,
  updateClosedDay,
  deleteClosedDay,
  deleteOldClosedDays
} from '../services/closedDay.service'

/**
 * POST /api/salons/:salonId/closed-days
 * Créer un jour de fermeture
 */
export async function createClosedDayHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const { date, reason } = req.body

    const closedDay = await createClosedDay({
      salonId,
      date,
      reason
    })

    res.status(201).json({
      success: true,
      message: 'Jour de fermeture créé avec succès',
      data: closedDay
    })

  } catch (error: any) {
    logger.error('Erreur création jour de fermeture:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/:salonId/closed-days
 * Récupérer tous les jours de fermeture d'un salon
 */
export async function getClosedDaysBySalonHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const { fromDate, page, limit } = req.query

    const fromDateObj = fromDate ? new Date(fromDate as string) : undefined
    const pageNum = page ? parseInt(page as string) : undefined
    const limitNum = limit ? parseInt(limit as string) : undefined

    const result = await getClosedDaysBySalon(salonId, fromDateObj, pageNum, limitNum)

    res.json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })

  } catch (error: any) {
    logger.error('Erreur récupération jours de fermeture:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/:salonId/closed-days/:id
 * Récupérer un jour de fermeture par ID
 */
export async function getClosedDayByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params

    const closedDay = await getClosedDayById(id)

    res.json({
      success: true,
      data: closedDay
    })

  } catch (error: any) {
    logger.error('Erreur récupération jour de fermeture:', { error: error.message, stack: error.stack })
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PUT /api/salons/:salonId/closed-days/:id
 * Mettre à jour un jour de fermeture
 */
export async function updateClosedDayHandler(req: Request, res: Response) {
  try {
    const { salonId, id } = req.params
    const { date, reason } = req.body

    const closedDay = await updateClosedDay(id, salonId, {
      date,
      reason
    })

    res.json({
      success: true,
      message: 'Jour de fermeture mis à jour avec succès',
      data: closedDay
    })

  } catch (error: any) {
    logger.error('Erreur mise à jour jour de fermeture:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * DELETE /api/salons/:salonId/closed-days/:id
 * Supprimer un jour de fermeture
 */
export async function deleteClosedDayHandler(req: Request, res: Response) {
  try {
    const { salonId, id } = req.params

    const result = await deleteClosedDay(id, salonId)

    res.json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    logger.error('Erreur suppression jour de fermeture:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * DELETE /api/salons/:salonId/closed-days/cleanup/old
 * Supprimer les jours de fermeture passés
 */
export async function deleteOldClosedDaysHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const result = await deleteOldClosedDays(salonId)

    res.json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    logger.error('Erreur nettoyage jours de fermeture:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
