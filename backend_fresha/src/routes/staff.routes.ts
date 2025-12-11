import { Router } from 'express'
import {
  createStaffController,
  getStaffController,
  getStaffBySalonController,
  getStaffByRoleController,
  getStaffSpecialtiesController,
  getAvailableStaffController,
  updateStaffController,
  deleteStaffController,
  toggleStaffStatusController,
  upsertStaffScheduleController,
  getStaffSchedulesController,
  deleteStaffScheduleController,
  deleteStaffSchedulesByDayController,
  batchUpsertStaffSchedulesController,
  deleteAndCreateSchedulesForDayController
} from '../controllers/staff.controller'
import {
  checkStaffExists,
  checkStaffOwnership,
  checkSalonOwnership,
  validateCreateStaff,
  validateUpdateStaff
} from '../middlewares/staff.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// ============= Routes publiques (sans auth) =============
// Récupérer le personnel d'un salon (pour les clients qui réservent)
router.get('/salon/:salonId', getStaffBySalonController)

// Récupérer le personnel par rôle
router.get('/salon/:salonId/role/:role', getStaffByRoleController)

// Récupérer les spécialités disponibles
router.get('/salon/:salonId/specialties', getStaffSpecialtiesController)

// Récupérer le personnel disponible pour une date donnée
router.get('/salon/:salonId/available', getAvailableStaffController)

// Récupérer un membre du personnel spécifique
router.get('/:id', getStaffController)

// ============= Routes protégées (avec auth) =============
// Créer un nouveau membre du personnel
router.post(
  '/',
  authMiddleware,
  validateCreateStaff,
  checkSalonOwnership,
  createStaffController
)

// Mettre à jour un membre du personnel
router.put(
  '/:id',
  authMiddleware,
  validateUpdateStaff,
  checkStaffOwnership,
  updateStaffController
)

// Activer/désactiver un membre du personnel
router.patch(
  '/:id/toggle',
  authMiddleware,
  checkStaffOwnership,
  toggleStaffStatusController
)

// Supprimer un membre du personnel
router.delete(
  '/:id',
  authMiddleware,
  checkStaffOwnership,
  deleteStaffController
)

// ============= Routes pour les horaires (schedules) =============
// Récupérer tous les horaires d'un membre du staff (public pour affichage)
router.get('/:staffId/schedules', getStaffSchedulesController)

// Créer/Mettre à jour un horaire (une plage pour un jour spécifique)
router.post(
  '/:staffId/schedules',
  authMiddleware,
  upsertStaffScheduleController
)

// Créer/Mettre à jour tous les horaires (batch - tous les jours)
router.post(
  '/:staffId/schedules/batch',
  authMiddleware,
  batchUpsertStaffSchedulesController
)

// Créer/Mettre à jour plusieurs plages horaires pour un jour spécifique
router.post(
  '/:staffId/schedules/day',
  authMiddleware,
  deleteAndCreateSchedulesForDayController
)

// Supprimer tous les horaires d'un jour spécifique
router.delete(
  '/:staffId/schedules/day',
  authMiddleware,
  deleteStaffSchedulesByDayController
)

// Supprimer un horaire spécifique par son ID
router.delete(
  '/:staffId/schedules/:scheduleId',
  authMiddleware,
  deleteStaffScheduleController
)

export default router
