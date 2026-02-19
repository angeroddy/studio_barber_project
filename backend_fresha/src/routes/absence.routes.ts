import express from 'express'
import * as absenceController from '../controllers/absence.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireOwner } from '../middlewares/authorization.middleware'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)
router.use(requireOwner)

// Routes CRUD absences
router.post('/', absenceController.createAbsence)
router.get('/', absenceController.getAbsences)
router.get('/:id', absenceController.getAbsence)
router.put('/:id', absenceController.updateAbsence)
router.delete('/:id', absenceController.deleteAbsence)

// Route pour approuver/rejeter une absence (Owner/Manager uniquement)
router.patch('/:id/approve', absenceController.approveOrRejectAbsence)

// Route pour les statistiques d'absence d'un employé
router.get('/staff/:staffId/stats', absenceController.getStaffAbsenceStats)

export default router
