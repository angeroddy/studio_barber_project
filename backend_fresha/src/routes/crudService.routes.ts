import { Router } from 'express'
import {
  createServiceController,
  getServiceController,
  getServicesBySalonController,
  getServicesByCategoryController,
  getServiceCategoriesController,
  updateServiceController,
  deleteServiceController,
  toggleServiceStatusController
} from '../controllers/crudServices.controller'
import {
  checkServiceExists,
  checkServiceOwnership,
  checkSalonOwnership,
  validateCreateService,
  validateUpdateService
} from '../middlewares/crudServices.middleware'
import { authMiddleware } from '../middlewares/auth.middleware' // Ton middleware d'authentification

const router = Router()

// ============= Routes publiques (sans auth) =============
router.get('/salon/:salonId', getServicesBySalonController)
router.get('/salon/:salonId/category/:category', getServicesByCategoryController)
router.get('/salon/:salonId/categories', getServiceCategoriesController)
router.get('/:id', getServiceController)

// ============= Routes protégées (avec auth) =============
router.post(
  '/',
  authMiddleware,
  validateCreateService,
  checkSalonOwnership,
  createServiceController
)

router.put(
  '/:id',
  authMiddleware,
  validateUpdateService,
  checkServiceOwnership,
  updateServiceController
)

router.patch(
  '/:id/toggle',
  authMiddleware,
  checkServiceOwnership,
  toggleServiceStatusController
)

router.delete(
  '/:id',
  authMiddleware,
  checkServiceOwnership,
  deleteServiceController
)

export default router