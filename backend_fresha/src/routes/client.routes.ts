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
  validateUpdateClient,
  checkClientExists
} from '../middlewares/client.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = express.Router()

// ============= Routes protégées (doivent être avant les routes avec :id) =============

/**
 * POST /api/clients
 * Créer un nouveau client (peut être avec ou sans authentification)
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

// ============= Routes publiques =============

/**
 * GET /api/clients
 * Récupérer tous les clients avec pagination
 */
router.get('/', getAllClientsHandler)

/**
 * GET /api/clients/email/:email
 * Récupérer un client par son email
 */
router.get('/email/:email', getClientByEmailHandler)

/**
 * GET /api/clients/phone/:phone
 * Récupérer les clients par numéro de téléphone
 */
router.get('/phone/:phone', getClientsByPhoneHandler)

/**
 * GET /api/clients/salon/:salonId
 * Récupérer tous les clients d'un salon
 */
router.get('/salon/:salonId', getClientsBySalonHandler)

/**
 * GET /api/clients/:id
 * Récupérer un client par son ID
 */
router.get('/:id', getClientByIdHandler)

/**
 * PUT /api/clients/:id
 * Mettre à jour un client
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
