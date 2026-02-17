import express from 'express'
import {
  createClientHandler,
  getClientByIdHandler,
  getClientByEmailHandler,
  getClientsByPhoneHandler,
  getClientsBySalonHandler,
  getAllClientsHandler,
  searchClientsHandler,
  updateClientHandler,
  deleteClientHandler
} from '../controllers/client.controller'
import {
  createClientValidation,
  updateClientValidation,
  validateCreateClient,
  validateUpdateClient
} from '../middlewares/client.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireOwnerOrStaff } from '../middlewares/authorization.middleware'

const router = express.Router()

// All client routes are protected and restricted to owner/staff accounts.
router.use(authMiddleware, requireOwnerOrStaff)

/**
 * POST /api/clients
 * Creer un nouveau client
 */
router.post(
  '/',
  createClientValidation,
  validateCreateClient,
  createClientHandler
)

/**
 * GET /api/clients/search
 * Rechercher des clients
 */
router.get('/search', searchClientsHandler)

/**
 * GET /api/clients
 * Recuperer tous les clients avec pagination
 */
router.get('/', getAllClientsHandler)

/**
 * GET /api/clients/email/:email
 * Recuperer un client par son email
 */
router.get('/email/:email', getClientByEmailHandler)

/**
 * GET /api/clients/phone/:phone
 * Recuperer les clients par numero de telephone
 */
router.get('/phone/:phone', getClientsByPhoneHandler)

/**
 * GET /api/clients/salon/:salonId
 * Recuperer tous les clients d'un salon
 */
router.get('/salon/:salonId', getClientsBySalonHandler)

/**
 * GET /api/clients/:id
 * Recuperer un client par son ID
 */
router.get('/:id', getClientByIdHandler)

/**
 * PUT /api/clients/:id
 * Mettre a jour un client
 */
router.put(
  '/:id',
  updateClientValidation,
  validateUpdateClient,
  updateClientHandler
)

/**
 * DELETE /api/clients/:id
 * Supprimer un client
 */
router.delete(
  '/:id',
  deleteClientHandler
)

export default router
