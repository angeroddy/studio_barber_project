import express from 'express'
import {
  getAllSalonsHandler,
  createSalonHandler,
  getSalonByIdHandler,
  getSalonBySlugHandler,
  getSalonsByOwnerHandler,
  getMySalonsHandler,
  updateSalonHandler,
  deleteSalonHandler
} from '../controllers/salon.controller'
import {
  upsertScheduleHandler,
  getSchedulesBySalonHandler,
  getScheduleByDayHandler,
  updateScheduleHandler,
  deleteScheduleHandler,
  createDefaultSchedulesHandler
} from '../controllers/schedule.controller'
import {
  createClosedDayHandler,
  getClosedDaysBySalonHandler,
  getClosedDayByIdHandler,
  updateClosedDayHandler,
  deleteClosedDayHandler,
  deleteOldClosedDaysHandler
} from '../controllers/closedDay.controller'
import {
  createSalonValidation,
  updateSalonValidation,
  validateCreateSalon,
  validateUpdateSalon,
  checkSalonOwnership
} from '../middlewares/salon.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = express.Router()

// ============= Routes protégées (doivent être avant les routes avec :id) =============

/**
 * POST /api/salons
 * Créer un nouveau salon (authentification requise)
 */
router.post(
  '/',
  authMiddleware,
  createSalonValidation,
  validateCreateSalon,
  createSalonHandler
)

/**
 * GET /api/salons/my-salons
 * Récupérer tous les salons du propriétaire connecté
 */
router.get('/my-salons', authMiddleware, getMySalonsHandler)

// ============= Routes publiques =============

/**
 * GET /api/salons
 * Récupérer tous les salons (route publique)
 * IMPORTANT: Cette route doit être avant GET /:id pour éviter les conflits
 */
router.get('/', getAllSalonsHandler)

/**
 * GET /api/salons/slug/:slug
 * Récupérer un salon par son slug
 */
router.get('/slug/:slug', getSalonBySlugHandler)

/**
 * GET /api/salons/owner/:ownerId
 * Récupérer tous les salons d'un propriétaire
 */
router.get('/owner/:ownerId', getSalonsByOwnerHandler)

/**
 * GET /api/salons/:id
 * Récupérer un salon par son ID
 */
router.get('/:id', getSalonByIdHandler)

/**
 * PUT /api/salons/:id
 * Mettre à jour un salon (authentification + ownership requis)
 */
router.put(
  '/:id',
  authMiddleware,
  checkSalonOwnership,
  updateSalonValidation,
  validateUpdateSalon,
  updateSalonHandler
)

/**
 * DELETE /api/salons/:id
 * Supprimer un salon (authentification + ownership requis)
 */
router.delete(
  '/:id',
  authMiddleware,
  checkSalonOwnership,
  deleteSalonHandler
)

// ============= Routes pour les horaires (Schedules) =============

/**
 * POST /api/salons/:salonId/schedules
 * Créer ou mettre à jour un horaire
 */
router.post(
  '/:salonId/schedules',
  authMiddleware,
  upsertScheduleHandler
)

/**
 * GET /api/salons/:salonId/schedules
 * Récupérer tous les horaires d'un salon
 */
router.get('/:salonId/schedules', getSchedulesBySalonHandler)

/**
 * GET /api/salons/:salonId/schedules/:dayOfWeek
 * Récupérer l'horaire d'un jour spécifique
 */
router.get('/:salonId/schedules/:dayOfWeek', getScheduleByDayHandler)

/**
 * PUT /api/salons/:salonId/schedules/:dayOfWeek
 * Mettre à jour un horaire
 */
router.put(
  '/:salonId/schedules/:dayOfWeek',
  authMiddleware,
  updateScheduleHandler
)

/**
 * DELETE /api/salons/:salonId/schedules/:dayOfWeek
 * Supprimer un horaire
 */
router.delete(
  '/:salonId/schedules/:dayOfWeek',
  authMiddleware,
  deleteScheduleHandler
)

/**
 * POST /api/salons/:salonId/schedules/default
 * Créer les horaires par défaut
 */
router.post(
  '/:salonId/schedules/default',
  authMiddleware,
  createDefaultSchedulesHandler
)

// ============= Routes pour les jours de fermeture (ClosedDays) =============

/**
 * POST /api/salons/:salonId/closed-days
 * Créer un jour de fermeture
 */
router.post(
  '/:salonId/closed-days',
  authMiddleware,
  createClosedDayHandler
)

/**
 * GET /api/salons/:salonId/closed-days
 * Récupérer tous les jours de fermeture d'un salon
 */
router.get('/:salonId/closed-days', getClosedDaysBySalonHandler)

/**
 * GET /api/salons/:salonId/closed-days/:id
 * Récupérer un jour de fermeture par ID
 */
router.get('/:salonId/closed-days/:id', getClosedDayByIdHandler)

/**
 * PUT /api/salons/:salonId/closed-days/:id
 * Mettre à jour un jour de fermeture
 */
router.put(
  '/:salonId/closed-days/:id',
  authMiddleware,
  updateClosedDayHandler
)

/**
 * DELETE /api/salons/:salonId/closed-days/:id
 * Supprimer un jour de fermeture
 */
router.delete(
  '/:salonId/closed-days/:id',
  authMiddleware,
  deleteClosedDayHandler
)

/**
 * DELETE /api/salons/:salonId/closed-days/cleanup/old
 * Supprimer les jours de fermeture passés
 */
router.delete(
  '/:salonId/closed-days/cleanup/old',
  authMiddleware,
  deleteOldClosedDaysHandler
)

export default router
