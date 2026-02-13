import { Request, Response } from 'express'
import {
  createClient,
  getClientById,
  getClientByEmail,
  getClientsByPhone,
  getClientsBySalon,
  getAllClients,
  updateClient,
  deleteClient,
  searchClients
} from '../services/client.service'
import { validationResult } from 'express-validator'
import logger from '../config/logger'

/**
 * POST /api/clients
 * Cr�er un nouveau client
 */
export async function createClientHandler(req: Request, res: Response) {
  try {
    // V�rifier les erreurs de validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { salonId, email, password, firstName, lastName, phone, notes, marketing } = req.body

    const client = await createClient({
      salonId,
      email,
      password,
      firstName,
      lastName,
      phone,
      notes,
      marketing
    })

    res.status(201).json({
      success: true,
      message: 'Client cr�� avec succ�s',
      data: client
    })

  } catch (error: any) {
    logger.error('Erreur cr�ation client:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/:id
 * R�cup�rer un client par son ID
 */
export async function getClientByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params

    const client = await getClientById(id)

    res.json({
      success: true,
      data: client
    })

  } catch (error: any) {
    logger.error('Erreur r�cup�ration client:', { error: error.message, stack: error.stack })
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/email/:email
 * R�cup�rer un client par son email
 */
export async function getClientByEmailHandler(req: Request, res: Response) {
  try {
    const { email } = req.params

    const client = await getClientByEmail(email)

    res.json({
      success: true,
      data: client
    })

  } catch (error: any) {
    logger.error('Erreur r�cup�ration client par email:', { error: error.message, stack: error.stack })
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/phone/:phone
 * R�cup�rer les clients par num�ro de t�l�phone
 */
export async function getClientsByPhoneHandler(req: Request, res: Response) {
  try {
    const { phone } = req.params

    const clients = await getClientsByPhone(phone)

    res.json({
      success: true,
      data: clients,
      count: clients.length
    })

  } catch (error: any) {
    logger.error('Erreur r�cup�ration clients par t�l�phone:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/salon/:salonId
 * R�cup�rer tous les clients d'un salon
 */
export async function getClientsBySalonHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const clients = await getClientsBySalon(salonId)

    res.json({
      success: true,
      data: clients,
      count: clients.length
    })

  } catch (error: any) {
    logger.error('Erreur r�cup�ration clients du salon:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients
 * R�cup�rer tous les clients avec pagination
 */
export async function getAllClientsHandler(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await getAllClients(page, limit)

    res.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    logger.error('Erreur r�cup�ration clients:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/search
 * Rechercher des clients
 */
export async function searchClientsHandler(req: Request, res: Response) {
  try {
    const searchTerm = req.query.q as string
    const salonId = req.query.salonId as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le terme de recherche est requis'
      })
    }

    const result = await searchClients(searchTerm, salonId, page, limit)

    res.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    logger.error('Erreur recherche clients:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PUT /api/clients/:id
 * Mettre � jour un client
 */
export async function updateClientHandler(req: Request, res: Response) {
  try {
    // V�rifier les erreurs de validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { id } = req.params
    const { firstName, lastName, phone, notes, marketing, password } = req.body

    const client = await updateClient(id, {
      firstName,
      lastName,
      phone,
      notes,
      marketing,
      password
    })

    res.json({
      success: true,
      message: 'Client mis � jour avec succ�s',
      data: client
    })

  } catch (error: any) {
    logger.error('Erreur mise � jour client:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * DELETE /api/clients/:id
 * Supprimer un client
 */
export async function deleteClientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params

    const result = await deleteClient(id)

    res.json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    logger.error('Erreur suppression client:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
