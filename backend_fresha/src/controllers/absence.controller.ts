import { Request, Response } from 'express'
import * as absenceService from '../services/absence.service'
import { ABSENCE_TYPES, AbsenceStatus } from '../types/domain.enums'

export async function createAbsence(req: Request, res: Response) {
  try {
    const { staffId, salonId, type, startDate, endDate, reason, notes } = req.body

    // Validation des champs requis
    if (!staffId || !salonId || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'staffId, salonId, type, startDate et endDate sont requis'
      })
    }

    // Validation du type
    if (!ABSENCE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'absence invalide'
      })
    }

    const absence = await absenceService.createAbsence({
      staffId,
      salonId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      notes
    })

    res.status(201).json({
      success: true,
      message: 'Demande d\'absence créée avec succès',
      data: absence
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création de l\'absence'
    })
  }
}

export async function getAbsences(req: Request, res: Response) {
  try {
    const { salonId, staffId, status, startDate, endDate, page, limit } = req.query

    const filters: any = {}
    if (salonId) filters.salonId = salonId as string
    if (staffId) filters.staffId = staffId as string
    if (status) filters.status = status as AbsenceStatus
    if (startDate) filters.startDate = new Date(startDate as string)
    if (endDate) filters.endDate = new Date(endDate as string)
    if (page) filters.page = parseInt(page as string)
    if (limit) filters.limit = parseInt(limit as string)

    const result = await absenceService.getAbsences(filters)

    res.json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des absences'
    })
  }
}

export async function getAbsence(req: Request, res: Response) {
  try {
    const { id } = req.params

    const absence = await absenceService.getAbsence(id)

    res.json({
      success: true,
      data: absence
    })
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Absence introuvable'
    })
  }
}

export async function updateAbsence(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { type, startDate, endDate, reason, notes } = req.body

    const updateData: any = { absenceId: id }
    if (type) updateData.type = type
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (reason !== undefined) updateData.reason = reason
    if (notes !== undefined) updateData.notes = notes

    const absence = await absenceService.updateAbsence(updateData)

    res.json({
      success: true,
      message: 'Absence mise à jour avec succès',
      data: absence
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de l\'absence'
    })
  }
}

export async function approveOrRejectAbsence(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status, notes } = req.body
    const approvedBy = req.user?.userId // ID de l'Owner/Manager qui approuve

    if (!approvedBy) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    if (!status || (status !== 'APPROVED' && status !== 'REJECTED')) {
      return res.status(400).json({
        success: false,
        message: 'Statut requis (APPROVED ou REJECTED)'
      })
    }

    const absence = await absenceService.approveOrRejectAbsence({
      absenceId: id,
      approvedBy,
      status,
      notes
    })

    res.json({
      success: true,
      message: `Absence ${status === 'APPROVED' ? 'approuvée' : 'rejetée'} avec succès`,
      data: absence
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du traitement de l\'absence'
    })
  }
}

export async function deleteAbsence(req: Request, res: Response) {
  try {
    const { id } = req.params
    const canDeleteApproved = req.user?.userType === 'owner'

    const result = await absenceService.deleteAbsence(id, {
      allowApproved: canDeleteApproved
    })

    res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de l\'absence'
    })
  }
}

export async function getStaffAbsenceStats(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { year } = req.query

    const stats = await absenceService.getStaffAbsenceStats(
      staffId,
      year ? parseInt(year as string) : undefined
    )

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des statistiques'
    })
  }
}
